import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, Download, Lightbulb, Plus, Trash2, X } from "lucide-react";
import {
  computeDraftTotals,
  createEmptyDraft,
  draftInvoiceType,
  normalizeSaudiVatNumber,
  shouldSuggestStandardInvoice,
  supplyDateHint,
  validateInstantInvoiceDraft,
  type InstantInvoiceDraft,
  type SaudiInvoiceType,
} from "@zatca/shared";
import { authClient } from "#/lib/auth-client";
import { useTRPC } from "#/integrations/trpc/react";
import {
  clearDraft,
  clearPendingSave,
  consumePendingSave,
  getNextExportSeqNumber,
  loadDraft,
  markPendingSave,
  peekExportSeqNumber,
  saveDraft,
  saveInvoiceTypePreference,
} from "#/lib/instant-invoice/draft-storage";
import {
  downloadInvoicePdf,
  draftToPdfInvoice,
  openWhatsAppShare,
} from "#/lib/instant-invoice/invoice-pdf";
import { formatMoney, getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import {
  isDraftReady,
  mapValidationErrors,
  scrollToFirstValidationError,
} from "#/lib/instant-invoice/validation";
import type { MarketingLang } from "#/lib/marketing/lang";
import { langDir } from "#/lib/marketing/lang";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { cn } from "#/lib/utils";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { AuthGateDialog } from "./AuthGateDialog";
import { track } from "#/lib/analytics/track";
import type { InvoiceToolName } from "#/lib/analytics/track";
import { ExportValidationChecklist } from "./ExportValidationChecklist";
import { InvoiceHtmlPreview } from "./InvoiceHtmlPreview";
import { InvoiceTypePicker } from "./InvoiceTypePicker";
import { MobileInvoiceActionBar } from "./MobileInvoiceActionBar";

function newLineId() {
  return crypto.randomUUID();
}

type InstantInvoiceToolProps = {
  lang?: MarketingLang;
  variant?: "marketing" | "workspace";
  /** Section heading + notes. Tool pages that already have an H1 hide it. */
  showIntro?: boolean;
};

export function InstantInvoiceTool({
  lang = "ar",
  variant = "marketing",
  showIntro = true,
}: InstantInvoiceToolProps) {
  const copy = getInstantInvoiceCopy(lang);
  const dir = langDir(lang);
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  const [draft, setDraft] = useState<InstantInvoiceDraft>(() => createEmptyDraft());
  const [hasHydrated, setHasHydrated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showExportChecks, setShowExportChecks] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState(() => new Date());
  const [previewSeq, setPreviewSeq] = useState(1);
  const [downloaded, setDownloaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => computeDraftTotals(draft), [draft]);
  const draftReady = useMemo(() => isDraftReady(draft), [draft]);
  const invoiceType = draftInvoiceType(draft);
  const isStandard = invoiceType === "standard";
  const suggestStandard = shouldSuggestStandardInvoice(draft);

  useEffect(() => {
    setDraft(loadDraft());
    setPreviewSeq(peekExportSeqNumber());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    saveDraft(draft);
  }, [draft, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    setPreviewSeq(peekExportSeqNumber());
  }, [draft, hasHydrated]);

  const saveMutation = useMutation(trpc.instantInvoice.save.mutationOptions());

  const applyValidation = useCallback(() => {
    const validation = validateInstantInvoiceDraft(draft);
    if (validation.ok) {
      setFieldErrors({});
      setShowExportChecks(false);
      return true;
    }
    setFieldErrors(mapValidationErrors(lang, validation.errors));
    setShowExportChecks(true);
    scrollToFirstValidationError(validation.errors);
    return false;
  }, [draft, lang]);

  const persistInvoice = useCallback(async () => {
    if (!applyValidation()) return false;
    setBusy(copy.auth.saving);

    try {
      const exportDate = new Date();
      setIssueDate(exportDate);

      const result = await saveMutation.mutateAsync({
        sellerName: draft.sellerName.trim(),
        sellerVat: normalizeSaudiVatNumber(draft.sellerVat),
        sellerAddress: draft.sellerAddress.trim() || undefined,
        // The save contract needs a buyer name; a simplified (B2C) invoice
        // without one is saved as a cash sale. Type and buyer address are not
        // stored (no DB columns): they live in the browser draft only.
        clientName: draft.clientName.trim() || copy.cashCustomer,
        clientVat: normalizeSaudiVatNumber(draft.clientVat) || undefined,
        notes: draft.notes.trim() || undefined,
        lineItems: totals.lineItems.map((item, index) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          sortOrder: index,
        })),
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        issueDate: exportDate.toISOString(),
      });

      clearDraft();
      void navigate({
        to: variant === "workspace" ? "/workspace/invoices/$id" : "/invoices/$id",
        params: { id: result.id },
        search: lang === "en" ? { lang: "en" } : {},
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error && copy.errors[err.message as keyof typeof copy.errors]
          ? copy.errors[err.message as keyof typeof copy.errors]
          : copy.errors.INTERNAL_ERROR;
      setFieldErrors({ form: message });
      return false;
    } finally {
      setBusy(null);
    }
  }, [applyValidation, copy.auth.saving, copy.cashCustomer, copy.errors, draft, lang, navigate, saveMutation, totals, variant]);

  useEffect(() => {
    if (!session?.user) return;
    if (!consumePendingSave()) return;
    void persistInvoice();
  }, [session?.user, persistInvoice]);

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateDraft(patch: Partial<InstantInvoiceDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setDownloaded(false);
    for (const key of [
      "sellerName",
      "sellerVat",
      "sellerAddress",
      "clientName",
      "clientAddress",
      "clientVat",
      "supplyDate",
    ] as const) {
      if (key in patch) clearFieldError(key);
    }
  }

  // After «التحويل إلى فاتورة ضريبية» the button unmounts; keep keyboard focus
  // in the form on the first required buyer field still empty.
  const focusBuyerAfterSwitch = useRef(false);
  useEffect(() => {
    if (!focusBuyerAfterSwitch.current || invoiceType !== "standard") return;
    focusBuyerAfterSwitch.current = false;
    const fields = ["client-name", "client-address", "client-vat"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement);
    const target =
      fields.find((el) => !el.value.trim()) ??
      document.querySelector<HTMLElement>('[role="radio"][data-invoice-type="standard"]');
    target?.focus();
  }, [invoiceType]);

  function changeInvoiceType(next: SaudiInvoiceType) {
    if (next === invoiceType) return;
    updateDraft({ invoiceType: next });
    saveInvoiceTypePreference(next);
    // Requirements changed: drop errors raised under the other type's rules.
    setFieldErrors((prev): Record<string, string> => (prev.form ? { form: prev.form } : {}));
    setShowExportChecks(false);
  }

  function updateLineItem(id: string, patch: Partial<InstantInvoiceDraft["lineItems"][0]>) {
    setDraft((prev) => {
      const index = prev.lineItems.findIndex((item) => item.id === id);
      if (index >= 0) {
        clearFieldError(`lineItems.${index}.description`);
        clearFieldError(`lineItems.${index}.unitPrice`);
        clearFieldError(`lineItems.${index}.qty`);
        clearFieldError("lineItems");
      }
      return {
        ...prev,
        lineItems: prev.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      };
    });
  }

  function addLineItem() {
    setDraft((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { id: newLineId(), description: "", qty: "1", unitPrice: "" }],
    }));
  }

  function removeLineItem(id: string) {
    setDraft((prev) => ({
      ...prev,
      lineItems:
        prev.lineItems.length > 1 ? prev.lineItems.filter((item) => item.id !== id) : prev.lineItems,
    }));
  }

  function analyticsTool(): InvoiceToolName {
    if (variant === "workspace") return "workspace";
    return typeof window !== "undefined" && window.location.pathname === "/" ? "home_instant" : "fatora";
  }

  async function handleDownloadPdf() {
    if (!applyValidation()) return;
    setBusy(copy.downloadPdf);
    try {
      const exportDate = new Date();
      const seqNumber = getNextExportSeqNumber();
      setIssueDate(exportDate);
      setPreviewSeq(seqNumber);
      const invoice = draftToPdfInvoice(draft, totals, seqNumber, exportDate);
      await downloadInvoicePdf(invoice, lang);
      setDownloaded(true);
      track("invoice_pdf_download", {
        tool: analyticsTool(),
        invoice_type: isStandard ? "full" : "simplified",
        line_count: draft.lineItems.length,
        currency: "SAR",
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "PDF_EXPORT_FAILED";
      const message = copy.errors[code as keyof typeof copy.errors] ?? copy.errors.PDF_EXPORT_FAILED;
      setFieldErrors({ form: message });
    } finally {
      setBusy(null);
    }
  }

  function handleWhatsApp() {
    if (!applyValidation()) return;
    const exportDate = new Date();
    setIssueDate(exportDate);
    const invoice = draftToPdfInvoice(draft, totals, previewSeq, exportDate);
    openWhatsAppShare(invoice, lang);
  }

  async function handleSave() {
    if (!applyValidation()) return;
    track("invoice_save_click", { tool: analyticsTool(), signed_in: Boolean(session?.user) });

    if (!session?.user) {
      markPendingSave();
      setAuthOpen(true);
      return;
    }

    await persistInvoice();
  }

  function handleResultCta() {
    track("cta_click", { cta: "sign_up_after_download", cta_location: "invoice_result" });
    void handleSave();
  }

  const isDownloading = busy === copy.downloadPdf;
  const isSaving = busy === copy.auth.saving;

  const cardClass = "gap-4 border-border/80 bg-card py-5 shadow-none";
  const cardTitleClass = "text-sm font-semibold text-primary";
  const exportBlocked = showExportChecks && !draftReady;

  return (
    <>
      <section
        id="invoice-tool"
        ref={sectionRef}
        dir={dir}
        lang={lang}
        aria-label={showIntro ? undefined : copy.previewTitle}
        className={
          variant === "workspace"
            ? "bg-card"
            : cn(
                "scroll-mt-24 pb-28 lg:pb-16",
                showIntro ? "border-y border-border bg-muted/40 pt-14" : "pt-2",
              )
        }
      >
        <div className={variant === "workspace" ? "px-5 py-5" : "mx-auto max-w-6xl px-5 md:px-8"}>
          {variant === "marketing" && showIntro ? (
            <header className="mb-8 max-w-2xl">
              <Badge variant="outline" className="mb-3 border-primary/20 bg-accent/50 text-primary">
                {copy.freeBadge}
              </Badge>
              <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground md:text-3xl">
                {copy.sectionTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">{copy.sectionSubtitle}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {copy.privacyNote} {copy.disclaimer}
              </p>
            </header>
          ) : null}

          {fieldErrors.form ? (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{fieldErrors.form}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
            <div className="flex min-w-0 flex-col gap-5">
              <InvoiceTypePicker lang={lang} value={invoiceType} onChange={changeInvoiceType} />

              <Card className={cardClass}>
                <CardHeader className="px-5 pb-0">
                  <CardTitle className={cardTitleClass}>{copy.sellerTitle}</CardTitle>
                </CardHeader>
                <CardContent className="px-5">
                  <FieldGroup className="gap-4">
                    <Field data-invalid={!!fieldErrors.sellerName}>
                      <FieldLabel htmlFor="seller-name">{copy.sellerName}</FieldLabel>
                      <Input
                        id="seller-name"
                        value={draft.sellerName}
                        onChange={(e) => updateDraft({ sellerName: e.target.value })}
                        placeholder={copy.sellerNamePh}
                        autoComplete="organization"
                        aria-invalid={!!fieldErrors.sellerName}
                        aria-required
                      />
                      {fieldErrors.sellerName ? (
                        <FieldError>{fieldErrors.sellerName}</FieldError>
                      ) : null}
                    </Field>
                    <Field data-invalid={!!fieldErrors.sellerVat}>
                      <FieldLabel htmlFor="seller-vat">{copy.sellerVat}</FieldLabel>
                      <Input
                        id="seller-vat"
                        value={draft.sellerVat}
                        onChange={(e) => updateDraft({ sellerVat: e.target.value })}
                        placeholder={copy.sellerVatPh}
                        dir="ltr"
                        inputMode="numeric"
                        maxLength={20}
                        aria-invalid={!!fieldErrors.sellerVat}
                        aria-required
                      />
                      {fieldErrors.sellerVat ? (
                        <FieldError>{fieldErrors.sellerVat}</FieldError>
                      ) : null}
                    </Field>
                    <Field data-invalid={!!fieldErrors.sellerAddress}>
                      <FieldLabel htmlFor="seller-address">
                        {copy.sellerAddress}
                      </FieldLabel>
                      <Input
                        id="seller-address"
                        value={draft.sellerAddress}
                        onChange={(e) => updateDraft({ sellerAddress: e.target.value })}
                        placeholder={copy.sellerAddressPh}
                        autoComplete="street-address"
                        aria-invalid={!!fieldErrors.sellerAddress}
                        aria-required={isStandard}
                      />
                      {fieldErrors.sellerAddress ? (
                        <FieldError>{fieldErrors.sellerAddress}</FieldError>
                      ) : null}
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardHeader className="px-5 pb-0">
                  <CardTitle className={cardTitleClass}>{copy.clientTitle}</CardTitle>
                </CardHeader>
                <CardContent className="px-5">
                  <FieldGroup className="gap-4">
                    <Field data-invalid={!!fieldErrors.clientName}>
                      <FieldLabel htmlFor="client-name">
                        {isStandard ? copy.clientName : copy.clientNameOptional}
                      </FieldLabel>
                      <Input
                        id="client-name"
                        value={draft.clientName}
                        onChange={(e) => updateDraft({ clientName: e.target.value })}
                        placeholder={copy.clientNamePh}
                        aria-invalid={!!fieldErrors.clientName}
                        aria-required={isStandard}
                      />
                      {fieldErrors.clientName ? (
                        <FieldError>{fieldErrors.clientName}</FieldError>
                      ) : null}
                    </Field>
                    {isStandard ? (
                      <Field data-invalid={!!fieldErrors.clientAddress}>
                        <FieldLabel htmlFor="client-address">{copy.clientAddress}</FieldLabel>
                        <Input
                          id="client-address"
                          value={draft.clientAddress ?? ""}
                          onChange={(e) => updateDraft({ clientAddress: e.target.value })}
                          placeholder={copy.clientAddressPh}
                          aria-invalid={!!fieldErrors.clientAddress}
                          aria-required
                        />
                        {fieldErrors.clientAddress ? (
                          <FieldError>{fieldErrors.clientAddress}</FieldError>
                        ) : null}
                      </Field>
                    ) : null}
                    <Field data-invalid={!!fieldErrors.clientVat}>
                      <FieldLabel htmlFor="client-vat">
                        {isStandard ? copy.clientVatRequired : copy.clientVat}
                      </FieldLabel>
                      <Input
                        id="client-vat"
                        value={draft.clientVat}
                        onChange={(e) => updateDraft({ clientVat: e.target.value })}
                        dir="ltr"
                        inputMode="numeric"
                        maxLength={20}
                        aria-invalid={!!fieldErrors.clientVat}
                        aria-required={isStandard}
                      />
                      {fieldErrors.clientVat ? (
                        <FieldError>{fieldErrors.clientVat}</FieldError>
                      ) : null}
                    </Field>
                    {suggestStandard ? (
                      <div
                        role="status"
                        className="flex flex-col gap-3 rounded-xl border border-secondary/40 bg-accent/60 p-3 text-sm sm:flex-row sm:items-center"
                      >
                        <Lightbulb aria-hidden className="size-4 shrink-0 text-primary" />
                        <p className="flex-1 text-foreground">{copy.suggestStandard.body}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => {
                            focusBuyerAfterSwitch.current = true;
                            changeInvoiceType("standard");
                          }}
                        >
                          {copy.suggestStandard.action}
                        </Button>
                      </div>
                    ) : null}
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card id="invoice-line-items" className={cardClass}>
                <CardHeader className="px-5 pb-0">
                  <CardTitle className={cardTitleClass}>{copy.itemsTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-5">
                  {draft.lineItems.map((item, index) => {
                    const descriptionError = fieldErrors[`lineItems.${index}.description`];
                    const priceError = fieldErrors[`lineItems.${index}.unitPrice`];
                    const qtyError = fieldErrors[`lineItems.${index}.qty`];
                    return (
                      <Card key={item.id} className="gap-3 py-4 shadow-none">
                        <CardHeader className="flex-row items-center justify-between px-4 pb-0">
                          <CardTitle className="text-xs font-semibold text-muted-foreground">
                            {copy.itemN(index + 1)}
                          </CardTitle>
                          {draft.lineItems.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeLineItem(item.id)}
                            >
                              <Trash2 data-icon="inline-start" />
                              {copy.removeItem}
                            </Button>
                          ) : null}
                        </CardHeader>
                        <CardContent className="px-4">
                          <FieldGroup className="gap-3">
                            <Field data-invalid={!!descriptionError}>
                              <Input
                                value={item.description}
                                onChange={(e) =>
                                  updateLineItem(item.id, { description: e.target.value })
                                }
                                placeholder={copy.itemDescription}
                                aria-label={`${copy.itemN(index + 1)}: ${copy.itemDescription}`}
                                aria-invalid={!!descriptionError}
                              />
                              {descriptionError ? <FieldError>{descriptionError}</FieldError> : null}
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                              <Field data-invalid={!!qtyError}>
                                <Input
                                  value={item.qty}
                                  onChange={(e) => updateLineItem(item.id, { qty: e.target.value })}
                                  placeholder={copy.itemQty}
                                  aria-label={`${copy.itemN(index + 1)}: ${copy.itemQty}`}
                                  dir="ltr"
                                  inputMode="decimal"
                                  aria-invalid={!!qtyError}
                                />
                                {qtyError ? <FieldError>{qtyError}</FieldError> : null}
                              </Field>
                              <Field data-invalid={!!priceError}>
                                <Input
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateLineItem(item.id, { unitPrice: e.target.value })
                                  }
                                  placeholder={copy.itemPrice}
                                  aria-label={`${copy.itemN(index + 1)}: ${copy.itemPrice}`}
                                  dir="ltr"
                                  inputMode="decimal"
                                  aria-invalid={!!priceError}
                                />
                                {priceError ? <FieldError>{priceError}</FieldError> : null}
                              </Field>
                            </div>
                          </FieldGroup>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {fieldErrors.lineItems ? (
                    <FieldError>{fieldErrors.lineItems}</FieldError>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={addLineItem}
                  >
                    <Plus data-icon="inline-start" />
                    {copy.addItem}
                  </Button>
                </CardContent>
              </Card>

              <Field data-invalid={!!fieldErrors.supplyDate}>
                <FieldLabel htmlFor="supply-date">{copy.supplyDate}</FieldLabel>
                <Input
                  id="supply-date"
                  type="date"
                  className="w-full bg-card sm:max-w-56"
                  value={draft.supplyDate ?? ""}
                  onChange={(e) => updateDraft({ supplyDate: e.target.value })}
                  aria-invalid={!!fieldErrors.supplyDate}
                  aria-describedby="supply-date-help"
                />
                {fieldErrors.supplyDate ? <FieldError>{fieldErrors.supplyDate}</FieldError> : null}
                {supplyDateHint(draft.supplyDate, new Date()) ? (
                  <p
                    id="supply-date-help"
                    role="status"
                    className="text-sm text-amber-800 dark:text-amber-300"
                  >
                    {copy.supplyAfterIssue}
                  </p>
                ) : (
                  <FieldDescription id="supply-date-help">{copy.supplyDateHelp}</FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="invoice-notes">{copy.notes}</FieldLabel>
                <Textarea
                  id="invoice-notes"
                  className="min-h-20 resize-y bg-card"
                  value={draft.notes}
                  onChange={(e) => updateDraft({ notes: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
              <Card ref={actionsRef} className="gap-4 py-5 shadow-sm">
                <CardContent className="flex flex-col gap-4 px-5">
                  <dl className="flex flex-col gap-1.5 text-sm">
                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                      <dt>{copy.subtotal}</dt>
                      <dd className="tabular-nums">{formatMoney(totals.subtotal, lang)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                      <dt>{copy.vat}</dt>
                      <dd className="tabular-nums">{formatMoney(totals.vatAmount, lang)}</dd>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-2 text-base font-bold text-primary">
                      <dt>{copy.total}</dt>
                      <dd className="text-lg tabular-nums">{formatMoney(totals.total, lang)}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void handleDownloadPdf()}
                      className="flex-1"
                      size="lg"
                    >
                      {isDownloading ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <Download data-icon="inline-start" aria-hidden />
                      )}
                      {copy.downloadPdf}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleWhatsApp}
                      className="flex-1"
                      size="lg"
                    >
                      {copy.whatsapp}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={!!busy}
                      onClick={() => void handleSave()}
                      className="w-full text-primary sm:w-auto"
                      size="lg"
                    >
                      {isSaving ? <Spinner data-icon="inline-start" /> : null}
                      {isSaving ? copy.auth.saving : copy.save}
                    </Button>
                  </div>
                  <ExportValidationChecklist
                    draft={draft}
                    lang={lang}
                    visible={!draftReady || showExportChecks}
                    emphasis={exportBlocked}
                  />
                </CardContent>
              </Card>

              {downloaded && variant === "marketing" ? (
                <section
                  aria-labelledby="invoice-result-title"
                  aria-live="polite"
                  className="relative rounded-2xl border border-primary/25 bg-primary p-5 text-primary-foreground shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setDownloaded(false)}
                    className="absolute end-3 top-3 rounded-md p-1 text-primary-foreground/70 hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                    aria-label={copy.result.dismiss}
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                  <h3
                    id="invoice-result-title"
                    className="flex items-center gap-2 pe-6 text-base font-bold"
                  >
                    <CircleCheck aria-hidden className="size-5 text-secondary" />
                    {copy.result.title}
                  </h3>
                  <p className="mt-2 text-sm text-primary-foreground/85">{copy.result.body}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-primary"
                      onClick={handleResultCta}
                    >
                      {copy.result.cta}
                    </Button>
                    <span className="text-xs text-primary-foreground/80">{copy.result.noCard}</span>
                  </div>
                </section>
              ) : null}

              <InvoiceHtmlPreview
                draft={draft}
                lang={lang}
                issueDate={issueDate}
                seqNumber={previewSeq}
              />
            </div>
          </div>
        </div>
      </section>

      {variant === "marketing" ? (
        <MobileInvoiceActionBar
          lang={lang}
          label={copy.actionsBarLabel}
          totalLabel={copy.totalShort}
          totalText={formatMoney(totals.total, lang)}
          downloadLabel={copy.downloadPdf}
          busy={!!busy}
          downloading={isDownloading}
          sectionRef={sectionRef}
          actionsRef={actionsRef}
          onDownload={() => void handleDownloadPdf()}
        />
      ) : null}

      <AuthGateDialog
        lang={lang}
        open={authOpen}
        onClose={() => {
          clearPendingSave();
          setAuthOpen(false);
        }}
        onSuccess={async () => {
          setAuthOpen(false);
          await authClient.getSession();
          markPendingSave();
        }}
      />
    </>
  );
}
