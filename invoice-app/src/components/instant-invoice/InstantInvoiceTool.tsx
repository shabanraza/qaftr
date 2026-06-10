import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import {
  computeDraftTotals,
  createEmptyDraft,
  validateInstantInvoiceDraft,
  type InstantInvoiceDraft,
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
} from "#/lib/instant-invoice/draft-storage";
import {
  downloadInvoicePdf,
  draftToPdfInvoice,
  openWhatsAppShare,
} from "#/lib/instant-invoice/invoice-pdf";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import {
  isDraftReady,
  mapValidationErrors,
  scrollToFirstValidationError,
} from "#/lib/instant-invoice/validation";
import type { MarketingLang } from "#/lib/marketing/lang";
import { langDir } from "#/lib/marketing/lang";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { AuthGateDialog } from "./AuthGateDialog";
import { ExportValidationChecklist } from "./ExportValidationChecklist";
import { InvoiceHtmlPreview } from "./InvoiceHtmlPreview";

function newLineId() {
  return crypto.randomUUID();
}

type InstantInvoiceToolProps = {
  lang?: MarketingLang;
  variant?: "marketing" | "workspace";
};

export function InstantInvoiceTool({ lang = "ar", variant = "marketing" }: InstantInvoiceToolProps) {
  const copy = getInstantInvoiceCopy(lang);
  const dir = langDir(lang);
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  const [draft, setDraft] = useState<InstantInvoiceDraft>(() =>
    typeof window !== "undefined" ? loadDraft() : createEmptyDraft(),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showExportChecks, setShowExportChecks] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState(() => new Date());
  const [previewSeq, setPreviewSeq] = useState(() =>
    typeof window !== "undefined" ? peekExportSeqNumber() : 1,
  );

  const totals = useMemo(() => computeDraftTotals(draft), [draft]);
  const draftReady = useMemo(() => isDraftReady(draft), [draft]);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    setPreviewSeq(peekExportSeqNumber());
  }, [draft]);

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
        sellerVat: draft.sellerVat.replace(/\D/g, ""),
        sellerAddress: draft.sellerAddress.trim() || undefined,
        clientName: draft.clientName.trim(),
        clientVat: draft.clientVat.trim() || undefined,
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
  }, [applyValidation, copy.auth.saving, copy.errors, draft, navigate, saveMutation, totals, variant]);

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
    if ("sellerName" in patch) clearFieldError("sellerName");
    if ("sellerVat" in patch) clearFieldError("sellerVat");
    if ("clientName" in patch) clearFieldError("clientName");
    if ("clientVat" in patch) clearFieldError("clientVat");
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

    if (!session?.user) {
      markPendingSave();
      setAuthOpen(true);
      return;
    }

    await persistInvoice();
  }

  const isDownloading = busy === copy.downloadPdf;
  const isSaving = busy === copy.auth.saving;

  return (
    <>
      <section
        id="invoice-tool"
        dir={dir}
        lang={lang}
        className={
          variant === "workspace"
            ? "bg-card"
            : "scroll-mt-24 border-y border-border bg-card/70 py-16"
        }
      >
        <div className={variant === "workspace" ? "px-5 py-5" : "mx-auto max-w-6xl px-5 md:px-8"}>
          {variant === "marketing" ? (
            <header className="mb-10 max-w-2xl">
              <Badge variant="outline" className="mb-4 border-primary/20 bg-accent/50 text-primary">
                {copy.freeBadge}
              </Badge>
              <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground md:text-3xl">
                {copy.sectionTitle}
              </h2>
              <p className="mt-3 text-muted-foreground">{copy.sectionSubtitle}</p>
              <p className="mt-2 text-xs text-muted-foreground/80">{copy.privacyNote}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{copy.disclaimer}</p>
            </header>
          ) : null}

          {fieldErrors.form ? (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{fieldErrors.form}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="flex flex-col gap-6">
              <Card className="gap-4 border-border/80 bg-muted/30 py-5 shadow-none">
                <CardHeader className="px-5 pb-0">
                  <CardTitle className="text-sm text-primary">{copy.sellerTitle}</CardTitle>
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
                        aria-invalid={!!fieldErrors.sellerName}
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
                        aria-invalid={!!fieldErrors.sellerVat}
                      />
                      {fieldErrors.sellerVat ? (
                        <FieldError>{fieldErrors.sellerVat}</FieldError>
                      ) : null}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="seller-address">{copy.sellerAddress}</FieldLabel>
                      <Input
                        id="seller-address"
                        value={draft.sellerAddress}
                        onChange={(e) => updateDraft({ sellerAddress: e.target.value })}
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card className="gap-4 border-border/80 bg-muted/30 py-5 shadow-none">
                <CardHeader className="px-5 pb-0">
                  <CardTitle className="text-sm text-primary">{copy.clientTitle}</CardTitle>
                </CardHeader>
                <CardContent className="px-5">
                  <FieldGroup className="gap-4">
                    <Field data-invalid={!!fieldErrors.clientName}>
                      <FieldLabel htmlFor="client-name">{copy.clientName}</FieldLabel>
                      <Input
                        id="client-name"
                        value={draft.clientName}
                        onChange={(e) => updateDraft({ clientName: e.target.value })}
                        placeholder={copy.clientNamePh}
                        aria-invalid={!!fieldErrors.clientName}
                      />
                      {fieldErrors.clientName ? (
                        <FieldError>{fieldErrors.clientName}</FieldError>
                      ) : null}
                    </Field>
                    <Field data-invalid={!!fieldErrors.clientVat}>
                      <FieldLabel htmlFor="client-vat">{copy.clientVat}</FieldLabel>
                      <Input
                        id="client-vat"
                        value={draft.clientVat}
                        onChange={(e) => updateDraft({ clientVat: e.target.value })}
                        dir="ltr"
                        inputMode="numeric"
                        aria-invalid={!!fieldErrors.clientVat}
                      />
                      {fieldErrors.clientVat ? (
                        <FieldError>{fieldErrors.clientVat}</FieldError>
                      ) : null}
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card id="invoice-line-items" className="gap-4 border-border/80 bg-muted/30 py-5 shadow-none">
                <CardHeader className="px-5 pb-0">
                  <CardTitle className="text-sm text-primary">{copy.itemsTitle}</CardTitle>
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

              <Field>
                <FieldLabel htmlFor="invoice-notes">{copy.notes}</FieldLabel>
                <Textarea
                  id="invoice-notes"
                  className="min-h-20 resize-y"
                  value={draft.notes}
                  onChange={(e) => updateDraft({ notes: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
              <InvoiceHtmlPreview
                draft={draft}
                lang={lang}
                issueDate={issueDate}
                seqNumber={previewSeq}
              />

              <Card className="gap-4 py-5">
                <CardFooter className="flex-col gap-3 px-5 pt-5 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    disabled={!!busy}
                    onClick={() => void handleDownloadPdf()}
                    className="flex-1"
                    size="lg"
                  >
                    {isDownloading ? <Spinner data-icon="inline-start" /> : null}
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
                    variant="secondary"
                    disabled={!!busy}
                    onClick={() => void handleSave()}
                    className="w-full sm:w-auto"
                    size="lg"
                  >
                    {isSaving ? <Spinner data-icon="inline-start" /> : null}
                    {isSaving ? copy.auth.saving : copy.save}
                  </Button>
                </CardFooter>
                <CardContent className="px-5 pt-0">
                  <ExportValidationChecklist
                    draft={draft}
                    lang={lang}
                    visible={!draftReady || showExportChecks}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

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
