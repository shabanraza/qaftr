import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRightIcon, DownloadIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import type { DocumentLineInput, DocumentParty } from '@zatca/shared'
import { track } from '#/lib/analytics/track'
import type { MarketingLang } from '#/lib/marketing/lang'
import { toArabicIndic, todayInSaudi } from '#/lib/sa/format'
import { getDocumentCopy } from '#/lib/documents/copy'
import type { DocumentKind } from '#/lib/documents/copy'
import { createEmptyDocumentLine, loadDocumentDraft, saveDocumentDraft } from '#/lib/documents/draft'
import type { DocumentDrafts, DocumentOutputLang } from '#/lib/documents/draft'
import { downloadBlob, htmlToPdfBlob } from '#/lib/invoice/pdf-render'
import { InvoicePreview, RadioCards, Section, TextField } from '#/components/invoice-kit/FormKit'
import { MobileInvoiceActionBar } from '#/components/instant-invoice/MobileInvoiceActionBar'
import { AuthGateDialog } from '#/components/instant-invoice/AuthGateDialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Spinner } from '#/components/ui/spinner'

export function defaultOutputLang(lang: MarketingLang): DocumentOutputLang {
  return lang === 'en' ? 'en' : 'ar'
}

/** "1,200.00 SAR" / "١٬٢٠٠٫٠٠ ر.س" for the on-page summary. */
export function formatSar(value: string | number, lang: MarketingLang): string {
  const n = typeof value === 'number' ? value : Number(value)
  const [whole, fraction] = (Number.isFinite(n) ? n : 0).toFixed(2).split('.')
  const grouped = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
  return lang === 'ar' ? `${toArabicIndic(grouped)} ر.س` : `${grouped} SAR`
}

export function safeFilePart(value: string) {
  return value.trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Draft kept in localStorage. SSR and the first client render use an empty
 * draft without a date so hydration matches; the saved draft loads on mount.
 */
export function useDocumentDraft<TKind extends DocumentKind>(
  kind: TKind,
  create: (today: string) => DocumentDrafts[TKind],
) {
  const [draft, setDraft] = useState<DocumentDrafts[TKind]>(() => create(''))
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDraft(loadDocumentDraft(kind) ?? create(todayInSaudi()))
    setHydrated(true)
    // only on mount (lang changes remount the route)
  }, [])

  useEffect(() => {
    if (hydrated) saveDocumentDraft(kind, draft)
  }, [kind, draft, hydrated])

  return [draft, setDraft] as const
}

export type DownloadStatus = 'idle' | 'generating' | 'done' | 'failed'

/** Validate → render HTML → PDF → download, with focusable issue list. */
export function useDocumentDownload() {
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [showIssues, setShowIssues] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)

  async function download(opts: {
    valid: boolean
    html: () => string
    filename: string
    /** PDF metadata title (Latin), e.g. "Credit Note CN-0001". */
    title: string
    onSuccess: () => void
  }) {
    if (!opts.valid) {
      setShowIssues(true)
      requestAnimationFrame(() => alertRef.current?.focus())
      return
    }
    setShowIssues(false)
    setStatus('generating')
    try {
      const blob = await htmlToPdfBlob(opts.html(), { title: opts.title })
      downloadBlob(blob, opts.filename)
      setStatus('done')
      opts.onSuccess()
    } catch {
      setStatus('failed')
    }
  }

  function reset() {
    setStatus('idle')
    setShowIssues(false)
  }

  return { status, setStatus, showIssues, alertRef, download, reset }
}

export function OutputLangPicker({
  lang,
  name,
  value,
  onChange,
}: {
  lang: MarketingLang
  name: string
  value: DocumentOutputLang
  onChange: (value: DocumentOutputLang) => void
}) {
  const c = getDocumentCopy(lang).common
  return (
    <Section legend={c.settingsTitle}>
      <RadioCards<DocumentOutputLang>
        name={name}
        legend={c.outputLangLabel}
        options={[
          ['ar', c.outputAr],
          ['en', c.outputEn],
          ['bilingual', c.outputBilingual],
        ]}
        value={value}
        onChange={onChange}
      />
    </Section>
  )
}

export function PartyFields({
  idPrefix,
  legend,
  nameLabel,
  addressLabel,
  vatLabel,
  vatHint,
  value,
  onChange,
}: {
  idPrefix: string
  legend: string
  nameLabel: string
  addressLabel: string
  vatLabel: string
  vatHint: string
  value: DocumentParty
  onChange: (patch: Partial<DocumentParty>) => void
}) {
  return (
    <Section legend={legend}>
      <TextField id={`${idPrefix}-name`} label={nameLabel} value={value.name} onChange={(name) => onChange({ name })} />
      <TextField id={`${idPrefix}-address`} label={addressLabel} value={value.address} onChange={(address) => onChange({ address })} multiline />
      <TextField id={`${idPrefix}-vat`} label={vatLabel} hint={vatHint} value={value.vatNumber} onChange={(vatNumber) => onChange({ vatNumber })} ltr inputMode="numeric" />
    </Section>
  )
}

export function LinesEditor({
  idPrefix,
  copy,
  lines,
  onChange,
}: {
  idPrefix: string
  copy: {
    linesTitle: string
    lineLabel: (n: number) => string
    removeLine: (n: number) => string
    addLine: string
    description: string
    qty: string
    unitPrice: string
  }
  lines: DocumentLineInput[]
  onChange: (lines: DocumentLineInput[]) => void
}) {
  const update = (index: number, patch: Partial<DocumentLineInput>) =>
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  return (
    <Section legend={copy.linesTitle}>
      {lines.map((line, index) => {
        const n = index + 1
        const id = `${idPrefix}-line-${index}`
        return (
          <fieldset key={index} className="relative flex min-w-0 flex-col gap-3 rounded-xl border border-border/80 p-4">
            <legend className="float-start mb-1 pe-10 text-sm font-medium text-foreground">{copy.lineLabel(n)}</legend>
            {lines.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute end-2 top-2"
                aria-label={copy.removeLine(n)}
                onClick={() => onChange(lines.filter((_, i) => i !== index))}
              >
                <Trash2Icon aria-hidden />
              </Button>
            ) : null}
            <TextField id={`${id}-desc`} label={copy.description} value={line.description} onChange={(description) => update(index, { description })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField id={`${id}-qty`} label={copy.qty} value={line.qty} onChange={(qty) => update(index, { qty })} ltr inputMode="decimal" />
              <TextField id={`${id}-price`} label={copy.unitPrice} value={line.unitPrice} onChange={(unitPrice) => update(index, { unitPrice })} ltr inputMode="decimal" />
            </div>
          </fieldset>
        )
      })}
      {lines.length < 50 ? (
        <Button type="button" variant="outline" className="w-fit" onClick={() => onChange([...lines, createEmptyDocumentLine()])}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          {copy.addLine}
        </Button>
      ) : null}
    </Section>
  )
}

export function TotalsList({
  lang,
  totals,
}: {
  lang: MarketingLang
  totals: { subtotal: string; vatAmount: string; total: string }
}) {
  const c = getDocumentCopy(lang).common
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap justify-between gap-x-4">
        <dt className="text-muted-foreground">{c.subtotal}</dt>
        <dd className="tabular-nums" data-testid="doc-subtotal">{formatSar(totals.subtotal, lang)}</dd>
      </div>
      <div className="flex flex-wrap justify-between gap-x-4">
        <dt className="text-muted-foreground">{c.vat}</dt>
        <dd className="tabular-nums text-primary" data-testid="doc-vat">{formatSar(totals.vatAmount, lang)}</dd>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-border pt-2">
        <dt className="font-medium text-foreground">{c.total}</dt>
        <dd
          className="break-all font-[family-name:var(--font-qaftr-display)] text-2xl font-bold tabular-nums text-[var(--qaftr-gold)]"
          data-testid="doc-total"
        >
          {formatSar(totals.total, lang)}
        </dd>
      </div>
    </dl>
  )
}

/** Links to the other free document tools and the tax invoice tool. */
const RELATED: Record<DocumentKind, Array<{ to: string; ar: string; en: string }>> = {
  'receipt-voucher': [
    { to: '/tools/fatora', ar: 'إصدار فاتورة ضريبية مجاناً', en: 'Create a free tax invoice' },
    { to: '/tools/quotation', ar: 'إعداد عرض سعر', en: 'Create a quotation' },
  ],
  quotation: [
    { to: '/tools/fatora', ar: 'إصدار فاتورة ضريبية مجاناً', en: 'Create a free tax invoice' },
    { to: '/tools/receipt-voucher', ar: 'إصدار سند قبض', en: 'Create a receipt voucher' },
  ],
  'credit-note': [
    { to: '/tools/fatora', ar: 'إصدار فاتورة ضريبية مجاناً', en: 'Create a free tax invoice' },
    { to: '/tools/vat-calculator', ar: 'حاسبة ضريبة القيمة المضافة', en: 'VAT calculator' },
  ],
}

type ShellProps = {
  lang: MarketingLang
  kind: DocumentKind
  status: DownloadStatus
  issues: string[] | null
  alertRef: RefObject<HTMLDivElement | null>
  form: ReactNode
  summary: ReactNode
  /** Short notice under the preview (e.g. "not a tax invoice"). */
  notice: ReactNode
  extraActions?: ReactNode
  previewHtml: string
  totalText: string
  totalLabel: string
  onDownload: () => void
  onClear: () => void
}

export function DocumentShell({
  lang,
  kind,
  status,
  issues,
  alertRef,
  form,
  summary,
  notice,
  extraActions,
  previewHtml,
  totalText,
  totalLabel,
  onDownload,
  onClear,
}: ShellProps) {
  const all = getDocumentCopy(lang)
  const c = all.common
  const page = all[kind]
  const [signupOpen, setSignupOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const afterResult = status === 'done'

  const saveOffer = (
    <div
      data-testid="doc-save"
      data-placement={afterResult ? 'after-result' : 'bottom'}
      className={
        afterResult
          ? 'rounded-xl bg-primary p-4 text-sm text-primary-foreground shadow-sm'
          : 'rounded-xl border border-dashed border-[var(--qaftr-gold)]/60 p-4 text-sm'
      }
    >
      <p className={afterResult ? 'font-semibold' : 'font-semibold text-foreground'}>{c.saveTitle}</p>
      <p className={afterResult ? 'mt-1 text-primary-foreground/85' : 'mt-1 text-muted-foreground'}>{c.saveBody}</p>
      <Button
        type="button"
        variant={afterResult ? 'secondary' : 'outline'}
        size="sm"
        className={afterResult ? 'mt-3 text-primary' : 'mt-3'}
        onClick={() => {
          if (afterResult) track('cta_click', { cta: 'sign_up_after_download', cta_location: 'document_result' })
          setSignupOpen(true)
        }}
      >
        {c.signup}
      </Button>
    </div>
  )

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-5 pb-28 md:px-8 lg:pb-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card className="min-w-0 overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <Badge variant="outline" className="w-fit">{c.badge}</Badge>
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{page.formTitle}</h2>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{c.draftNote}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-8 px-5 py-6">{form}</CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-6">
          <Card ref={summaryRef} className="min-w-0 border-border/80 py-0 shadow-sm">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
                <h2>{c.summaryTitle}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 pb-5" aria-live="polite">
              {summary}
              {issues && issues.length ? (
                <div
                  ref={alertRef}
                  role="alert"
                  tabIndex={-1}
                  className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive outline-none"
                >
                  <p className="font-medium">{c.issuesTitle}</p>
                  <ul className="mt-1 list-disc ps-5">
                    {issues.map((message, i) => (
                      <li key={`${message}-${i}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Button type="button" size="lg" className="w-full" onClick={onDownload} disabled={status === 'generating'}>
                {status === 'generating' ? <Spinner aria-hidden /> : <DownloadIcon data-icon="inline-start" aria-hidden />}
                {status === 'generating' ? c.generating : c.download}
              </Button>
              <p role="status" className="min-h-0 text-sm empty:hidden">
                {status === 'done' ? c.downloaded : status === 'failed' ? c.pdfFailed : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {extraActions}
                <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                  {c.clearForm}
                </Button>
              </div>
            </CardContent>
          </Card>

          {afterResult ? saveOffer : null}

          <InvoicePreview html={previewHtml} title={c.previewFrameTitle} heading={c.previewTitle} />

          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
            <div className="text-muted-foreground">{notice}</div>
            <p className="mt-3 font-semibold text-foreground">{c.relatedTitle}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {RELATED[kind].map((r) => (
                <li key={r.to}>
                  <Link to={r.to as never} search={search as never} className="inline-flex items-center gap-1 font-medium">
                    {lang === 'ar' ? r.ar : r.en}
                    <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {afterResult ? null : saveOffer}
        </div>
      </div>
      <MobileInvoiceActionBar
        lang={lang}
        label={c.actionsBarLabel}
        totalLabel={totalLabel}
        totalText={totalText}
        downloadLabel={c.download}
        busy={status === 'generating'}
        downloading={status === 'generating'}
        sectionRef={sectionRef}
        actionsRef={summaryRef}
        onDownload={onDownload}
      />
      <AuthGateDialog
        lang={lang}
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={() => setSignupOpen(false)}
        initialMode="signup"
        context="general"
      />
    </section>
  )
}
