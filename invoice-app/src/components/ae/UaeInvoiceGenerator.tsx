import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { track } from '#/lib/analytics/track'
import {
  ArrowUpRightIcon,
  DownloadIcon,
  FilePlusIcon,
  InfoIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import {
  buildUaeInvoiceTotals,
  getUaeInvoiceWarnings,
  nextUaeInvoiceNumber,
  validateUaeTaxInvoice,
} from '@zatca/shared'
import type {
  UaeInvoiceIssue,
  UaeInvoiceOutputLang,
  UaeInvoiceType,
  UaeVatCategory,
} from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'
import { formatAed, langSearch, todayInUae } from '#/lib/ae/format'
import { getAeInvoiceCopy } from '#/lib/ae/invoice-copy'
import type { AeInvoiceCopy } from '#/lib/ae/invoice-copy'
import {
  createEmptyLine,
  createEmptyUaeDraft,
  loadUaeDraft,
  saveUaeDraft,
  toUaeTaxInvoiceInput,
} from '#/lib/ae/invoice-draft'
import type { UaeInvoiceDraft, UaeInvoiceDraftLine } from '#/lib/ae/invoice-draft'
import { buildUaeInvoiceHtml } from '#/lib/ae/invoice-html'
import { downloadBlob, htmlToPdfBlob } from '#/lib/invoice/pdf-render'
import { MobileInvoiceActionBar } from '#/components/instant-invoice/MobileInvoiceActionBar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldLabel } from '#/components/ui/field'
import { Separator } from '#/components/ui/separator'
import { Spinner } from '#/components/ui/spinner'
import { InvoicePreview, RadioCards, Section, TextField } from '#/components/invoice-kit/FormKit'

type UaeInvoiceGeneratorProps = { lang: MarketingLang }

function defaultOutput(lang: MarketingLang): UaeInvoiceOutputLang {
  return lang === 'en' ? 'en' : 'ar'
}

function issueMessage(copy: AeInvoiceCopy, issue: UaeInvoiceIssue) {
  const message = copy.issues[issue.code]
  return issue.line === undefined ? message : copy.lineIssue(issue.line + 1, message)
}

function safeFilePart(value: string) {
  return value.trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}

export function UaeInvoiceGenerator({ lang }: UaeInvoiceGeneratorProps) {
  const copy = getAeInvoiceCopy(lang)
  const search = langSearch(lang)
  // SSR and the first client render use the same empty draft (no date, no
  // storage) so hydration matches; the saved draft is applied after mount.
  const [draft, setDraft] = useState<UaeInvoiceDraft>(() =>
    createEmptyUaeDraft('', defaultOutput(lang)),
  )
  const [hydrated, setHydrated] = useState(false)
  const [showIssues, setShowIssues] = useState(false)
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'failed'>('idle')
  const alertRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = loadUaeDraft()
    setDraft(saved ?? createEmptyUaeDraft(todayInUae(), defaultOutput(lang)))
    setHydrated(true)
    // only on mount (lang changes remount the route)
  }, [])

  useEffect(() => {
    if (hydrated) saveUaeDraft(draft)
  }, [draft, hydrated])

  const totals = useMemo(() => buildUaeInvoiceTotals(draft.lines), [draft.lines])
  const validation = useMemo(() => validateUaeTaxInvoice(toUaeTaxInvoiceInput(draft)), [draft])
  const supplyDateAfterIssue = getUaeInvoiceWarnings(draft).includes('SUPPLY_DATE_AFTER_ISSUE')
  const previewDraft = useDeferredValue(draft)
  const previewHtml = useMemo(() => buildUaeInvoiceHtml(previewDraft), [previewDraft])

  const update = (patch: Partial<UaeInvoiceDraft>) => {
    setStatus('idle')
    setDraft((d) => ({ ...d, ...patch }))
  }
  const updateSupplier = (patch: Partial<UaeInvoiceDraft['supplier']>) =>
    setDraft((d) => ({ ...d, supplier: { ...d.supplier, ...patch } }))
  const updateRecipient = (patch: Partial<UaeInvoiceDraft['recipient']>) =>
    setDraft((d) => ({ ...d, recipient: { ...d.recipient, ...patch } }))
  const updateLine = (index: number, patch: Partial<UaeInvoiceDraftLine>) =>
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }))

  async function handleDownload() {
    if (!validation.valid) {
      setShowIssues(true)
      requestAnimationFrame(() => alertRef.current?.focus())
      return
    }
    setShowIssues(false)
    setStatus('generating')
    try {
      const blob = await htmlToPdfBlob(buildUaeInvoiceHtml(draft, { forPdf: true }))
      const name = safeFilePart(draft.invoiceNumber) || draft.issueDate
      downloadBlob(blob, `qaftr-tax-invoice-${name}.pdf`)
      setStatus('done')
      track('invoice_pdf_download', {
        tool: 'uae_invoice_generator',
        invoice_type: draft.type === 'full' ? 'full' : 'simplified',
        line_count: draft.lines.length,
        currency: 'AED',
      })
    } catch {
      setStatus('failed')
    }
  }

  function startNextInvoice() {
    setShowIssues(false)
    setStatus('idle')
    setDraft((d) => ({
      ...createEmptyUaeDraft(todayInUae(), d.outputLang),
      type: d.type,
      supplier: d.supplier,
      invoiceNumber: nextUaeInvoiceNumber(d.invoiceNumber),
    }))
  }

  function clearForm() {
    setShowIssues(false)
    setStatus('idle')
    setDraft((d) => createEmptyUaeDraft(todayInUae(), d.outputLang))
  }

  const full = draft.type === 'full'

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-5 pb-28 md:px-8 lg:pb-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card className="min-w-0 overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <Badge variant="outline" className="w-fit">
              {copy.badge}
            </Badge>
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{copy.formTitle}</h2>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{copy.draftNote}</p>
          </CardHeader>
          <CardContent className="qaftr-form-sections flex flex-col gap-7 px-5 py-6">
            <Section legend={copy.settingsTitle}>
              <RadioCards<UaeInvoiceType>
                name="ae-invoice-type"
                legend={copy.typeLabel}
                options={[
                  ['full', copy.typeFull],
                  ['simplified', copy.typeSimplified],
                ]}
                value={draft.type}
                onChange={(type) => update({ type })}
              />
              {!full ? (
                <p className="flex gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{copy.simplifiedRule}</span>
                </p>
              ) : null}
              <RadioCards<UaeInvoiceOutputLang>
                name="ae-invoice-output"
                legend={copy.outputLangLabel}
                options={[
                  ['ar', copy.outputAr],
                  ['en', copy.outputEn],
                  ['bilingual', copy.outputBilingual],
                ]}
                value={draft.outputLang}
                onChange={(outputLang) => update({ outputLang })}
              />
            </Section>

            <Section legend={copy.supplierTitle}>
              <TextField id="ae-inv-supplier-name" label={copy.name} value={draft.supplier.name} onChange={(name) => updateSupplier({ name })} />
              <TextField id="ae-inv-supplier-address" label={copy.address} value={draft.supplier.address} onChange={(address) => updateSupplier({ address })} multiline />
              <TextField id="ae-inv-supplier-trn" label={copy.trn} hint={copy.trnHint} value={draft.supplier.trn} onChange={(trn) => updateSupplier({ trn })} ltr inputMode="numeric" />
            </Section>

            <Section legend={copy.recipientTitle} hint={full ? undefined : copy.recipientOptional}>
              <TextField id="ae-inv-recipient-name" label={copy.name} value={draft.recipient.name} onChange={(name) => updateRecipient({ name })} />
              <TextField id="ae-inv-recipient-address" label={copy.address} value={draft.recipient.address} onChange={(address) => updateRecipient({ address })} multiline />
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--qaftr-teal,currentColor)]"
                  checked={draft.recipient.vatRegistered}
                  onChange={(e) => updateRecipient({ vatRegistered: e.target.checked })}
                />
                {copy.recipientRegistered}
              </label>
              {draft.recipient.vatRegistered || draft.recipient.trn ? (
                <TextField id="ae-inv-recipient-trn" label={copy.trn} hint={copy.trnHint} value={draft.recipient.trn} onChange={(trn) => updateRecipient({ trn })} ltr inputMode="numeric" />
              ) : null}
            </Section>

            <Section legend={copy.detailsTitle}>
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField id="ae-inv-number" label={copy.invoiceNumber} hint={copy.invoiceNumberHint} value={draft.invoiceNumber} onChange={(invoiceNumber) => update({ invoiceNumber })} ltr />
                <TextField id="ae-inv-issue-date" label={copy.issueDate} type="date" value={draft.issueDate} onChange={(issueDate) => update({ issueDate })} ltr />
                <TextField id="ae-inv-supply-date" label={copy.supplyDate} hint={supplyDateAfterIssue ? copy.supplyDateAfterIssue : undefined} type="date" value={draft.supplyDate} onChange={(supplyDate) => update({ supplyDate })} ltr />
              </div>
            </Section>

            <Section legend={copy.linesTitle}>
              {draft.lines.map((line, index) => {
                const n = index + 1
                const id = `ae-inv-line-${index}`
                return (
                  <fieldset key={index} className="relative flex min-w-0 flex-col gap-3 rounded-xl border border-border/80 p-4">
                    <legend className="float-start mb-1 pe-10 text-sm font-medium text-foreground">
                      {copy.lineLabel(n)}
                    </legend>
                    {draft.lines.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-2 top-2"
                        aria-label={copy.removeLine(n)}
                        onClick={() =>
                          setDraft((d) => ({ ...d, lines: d.lines.filter((_, i) => i !== index) }))
                        }
                      >
                        <Trash2Icon aria-hidden />
                      </Button>
                    ) : null}
                    <TextField id={`${id}-desc`} label={copy.description} value={line.description} onChange={(description) => updateLine(index, { description })} />
                    <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3">
                      <TextField id={`${id}-qty`} label={copy.qty} value={line.qty} onChange={(qty) => updateLine(index, { qty })} ltr inputMode="decimal" />
                      <TextField id={`${id}-price`} label={copy.unitPrice} value={line.unitPrice} onChange={(unitPrice) => updateLine(index, { unitPrice })} ltr inputMode="decimal" />
                      <TextField id={`${id}-discount`} label={copy.discount} value={line.discount} onChange={(discount) => updateLine(index, { discount })} ltr inputMode="decimal" />
                    </div>
                    <Field className="min-w-0 gap-1.5">
                      <FieldLabel htmlFor={`${id}-cat`}>{copy.vatCategory}</FieldLabel>
                      <select
                        id={`${id}-cat`}
                        value={line.vatCategory}
                        onChange={(e) => updateLine(index, { vatCategory: e.target.value as UaeVatCategory })}
                        className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {(['standard', 'zero', 'exempt'] as const).map((c) => (
                          <option key={c} value={c}>
                            {copy.categories[c]}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </fieldset>
                )
              })}
              {draft.lines.length < 50 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() => setDraft((d) => ({ ...d, lines: [...d.lines, createEmptyLine()] }))}
                >
                  <PlusIcon data-icon="inline-start" aria-hidden />
                  {copy.addLine}
                </Button>
              ) : null}
            </Section>

            <TextField id="ae-inv-notes" label={copy.notes} value={draft.notes} onChange={(notes) => update({ notes })} multiline />
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-6">
          <Card ref={summaryRef} className="min-w-0 border-border/80 py-0 shadow-sm">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
                <h2>{copy.summaryTitle}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 pb-5" aria-live="polite">
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap justify-between gap-x-4">
                  <dt className="text-muted-foreground">{copy.totalExclVat}</dt>
                  <dd dir="ltr" className="tabular-nums" data-testid="ae-inv-total-excl">
                    {formatAed(totals.totalExclVat, lang)}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-4">
                  <dt className="text-muted-foreground">{copy.totalVat}</dt>
                  <dd dir="ltr" className="tabular-nums text-primary" data-testid="ae-inv-total-vat">
                    {formatAed(totals.totalVat, lang)}
                  </dd>
                </div>
                <Separator />
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <dt className="font-medium text-foreground">{copy.totalPayable}</dt>
                  <dd
                    dir="ltr"
                    className="break-all font-[family-name:var(--font-qaftr-display)] text-2xl font-bold tabular-nums text-[var(--qaftr-gold-ink)]"
                    data-testid="ae-inv-total-payable"
                  >
                    {formatAed(totals.totalPayable, lang)}
                  </dd>
                </div>
              </dl>

              {showIssues && !validation.valid ? (
                <div
                  ref={alertRef}
                  role="alert"
                  tabIndex={-1}
                  className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive outline-none"
                >
                  <p className="font-medium">{copy.issuesTitle}</p>
                  <ul className="mt-1 list-disc ps-5">
                    {validation.issues.map((issue, i) => (
                      <li key={`${issue.code}-${issue.line ?? ''}-${i}`}>{issueMessage(copy, issue)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Button type="button" size="lg" className="w-full" onClick={handleDownload} disabled={status === 'generating'}>
                {status === 'generating' ? <Spinner aria-hidden /> : <DownloadIcon data-icon="inline-start" aria-hidden />}
                {status === 'generating' ? copy.generating : copy.download}
              </Button>
              <p role="status" className="min-h-0 text-sm empty:hidden">
                {status === 'done' ? copy.downloaded : status === 'failed' ? copy.pdfFailed : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={startNextInvoice}>
                  <FilePlusIcon data-icon="inline-start" aria-hidden />
                  {copy.nextInvoice}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearForm}>
                  {copy.clearForm}
                </Button>
              </div>
            </CardContent>
          </Card>


          <InvoicePreview html={previewHtml} title={copy.previewFrameTitle} heading={copy.previewTitle} />

          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
            <p className="font-semibold text-foreground">{copy.notEInvoiceTitle}</p>
            <p className="mt-1 text-muted-foreground">{copy.notEInvoice}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              <li>
                <Link to="/ae/tools/e-invoicing-readiness" search={search} className="inline-flex items-center gap-1 font-medium">
                  {copy.readinessLink}
                  <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden />
                </Link>
              </li>
              <li>
                <Link to="/ae/guides/uae-e-invoicing-2027" search={search} className="inline-flex items-center gap-1 font-medium">
                  {copy.guideLink}
                  <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden />
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>
      <MobileInvoiceActionBar
        lang={lang}
        label={copy.actionsBarLabel}
        totalLabel={copy.totalPayable}
        totalText={formatAed(totals.totalPayable, lang)}
        downloadLabel={copy.download}
        busy={status === 'generating'}
        downloading={status === 'generating'}
        sectionRef={sectionRef}
        actionsRef={summaryRef}
        onDownload={() => void handleDownload()}
      />
    </section>
  )
}
