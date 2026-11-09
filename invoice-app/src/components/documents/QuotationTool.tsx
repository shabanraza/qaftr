import { useDeferredValue, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { FileOutputIcon } from 'lucide-react'
import { computeSaudiDocumentTotals, validateQuotation } from '@zatca/shared'
import { track } from '#/lib/analytics/track'
import type { MarketingLang } from '#/lib/marketing/lang'
import { todayInSaudi } from '#/lib/sa/format'
import { getDocumentCopy } from '#/lib/documents/copy'
import { buildQuotationHtml } from '#/lib/documents/document-html'
import { createEmptyQuotationDraft, writeQuotationToInvoiceTool } from '#/lib/documents/draft'
import type { QuotationDraft } from '#/lib/documents/draft'
import { Section, TextField } from '#/components/invoice-kit/FormKit'
import { Button } from '#/components/ui/button'
import {
  DocumentShell,
  LinesEditor,
  OutputLangPicker,
  PartyFields,
  TotalsList,
  defaultOutputLang,
  formatSar,
  safeFilePart,
  useDocumentDownload,
  useDocumentDraft,
} from './DocumentShell'

export function QuotationTool({ lang }: { lang: MarketingLang }) {
  const copy = getDocumentCopy(lang).quotation
  const common = getDocumentCopy(lang).common
  const [draft, setDraft] = useDocumentDraft('quotation', (today) =>
    createEmptyQuotationDraft(today, defaultOutputLang(lang)),
  )
  const dl = useDocumentDownload()
  const totals = useMemo(() => computeSaudiDocumentTotals(draft.lines), [draft.lines])
  const validation = useMemo(() => validateQuotation(draft), [draft])
  const previewDraft = useDeferredValue(draft)
  const previewHtml = useMemo(() => buildQuotationHtml(previewDraft), [previewDraft])
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  const update = (patch: Partial<QuotationDraft>) => {
    dl.setStatus('idle')
    setDraft((d) => ({ ...d, ...patch }))
  }

  const download = () =>
    void dl.download({
      valid: validation.valid,
      html: () => buildQuotationHtml(draft, { forPdf: true }),
      filename: `qaftr-quotation-${safeFilePart(draft.number) || draft.date}.pdf`,
      title: `Quotation ${draft.number.trim()}`,
      onSuccess: () =>
        track('document_pdf_download', {
          tool: 'quotation',
          output_lang: draft.outputLang,
          currency: 'SAR',
          line_count: totals.lineItems.length,
        }),
    })

  const form = (
    <>
      <OutputLangPicker lang={lang} name="q-output" value={draft.outputLang} onChange={(outputLang) => update({ outputLang })} />
      <Section legend={copy.formTitle}>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField id="q-number" label={copy.number} value={draft.number} onChange={(number) => update({ number })} ltr />
          <TextField id="q-date" label={copy.date} type="date" value={draft.date} onChange={(date) => update({ date })} ltr />
          <TextField id="q-valid" label={copy.validUntil} type="date" value={draft.validUntil} onChange={(validUntil) => update({ validUntil })} ltr />
        </div>
      </Section>
      <PartyFields
        idPrefix="q-seller"
        legend={copy.sellerTitle}
        nameLabel={copy.sellerName}
        addressLabel={copy.address}
        vatLabel={copy.vatNumber}
        vatHint={copy.vatOptional}
        value={draft.seller}
        onChange={(patch) => update({ seller: { ...draft.seller, ...patch } })}
      />
      <PartyFields
        idPrefix="q-buyer"
        legend={copy.buyerTitle}
        nameLabel={copy.buyerName}
        addressLabel={copy.address}
        vatLabel={copy.vatNumber}
        vatHint={copy.vatOptional}
        value={draft.buyer}
        onChange={(patch) => update({ buyer: { ...draft.buyer, ...patch } })}
      />
      <LinesEditor idPrefix="q" copy={copy} lines={draft.lines} onChange={(lines) => update({ lines })} />
      <TextField id="q-terms" label={copy.terms} hint={copy.termsHint} value={draft.terms} onChange={(terms) => update({ terms })} multiline />
    </>
  )

  const convert = (
    <Button asChild variant="outline" size="sm">
      <Link
        to="/tools/fatora"
        search={search}
        title={copy.convertHint}
        onClick={() => {
          writeQuotationToInvoiceTool(draft)
          track('cta_click', { cta: 'quotation_to_invoice', cta_location: 'document_result' })
        }}
      >
        <FileOutputIcon data-icon="inline-start" aria-hidden />
        {copy.convert}
      </Link>
    </Button>
  )

  return (
    <DocumentShell
      lang={lang}
      kind="quotation"
      status={dl.status}
      issues={
        dl.showIssues && !validation.valid
          ? validation.issues.map((i) =>
              i.line === undefined ? copy.issues[i.code] : copy.lineIssue(i.line + 1, copy.issues[i.code]),
            )
          : null
      }
      alertRef={dl.alertRef}
      form={form}
      summary={
        <>
          <TotalsList lang={lang} totals={totals} />
          <p className="text-xs text-muted-foreground">{copy.convertHint}</p>
        </>
      }
      extraActions={convert}
      notice={<p>{copy.faq[1].answer}</p>}
      previewHtml={previewHtml}
      totalLabel={common.total}
      totalText={formatSar(totals.total, lang)}
      onDownload={download}
      onClear={() => {
        dl.reset()
        setDraft((d) => ({ ...createEmptyQuotationDraft(todayInSaudi(), d.outputLang), seller: d.seller }))
      }}
    />
  )
}
