import { useDeferredValue, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { InfoIcon } from 'lucide-react'
import { computeNonTaxDocumentTotals, validateNonTaxInvoice } from '@zatca/shared'
import { track } from '#/lib/analytics/track'
import type { MarketingLang } from '#/lib/marketing/lang'
import { todayInSaudi } from '#/lib/sa/format'
import { getDocumentCopy } from '#/lib/documents/copy'
import { buildNonTaxInvoiceHtml } from '#/lib/documents/document-html'
import { createEmptyNonTaxInvoiceDraft } from '#/lib/documents/draft'
import type { NonTaxInvoiceDraft } from '#/lib/documents/draft'
import { Section, TextField } from '#/components/invoice-kit/FormKit'
import {
  DocumentShell,
  LinesEditor,
  OutputLangPicker,
  defaultOutputLang,
  formatSar,
  safeFilePart,
  useDocumentDownload,
  useDocumentDraft,
} from './DocumentShell'

/**
 * فاتورة غير ضريبية: for businesses NOT registered for VAT. There is
 * deliberately no VAT number field and no VAT line; registered businesses are
 * sent to the tax invoice tool.
 */
export function NonTaxInvoiceTool({ lang }: { lang: MarketingLang }) {
  const all = getDocumentCopy(lang)
  const copy = all['non-tax-invoice']
  const [draft, setDraft] = useDocumentDraft('non-tax-invoice', (today) =>
    createEmptyNonTaxInvoiceDraft(today, defaultOutputLang(lang)),
  )
  const dl = useDocumentDownload()
  const totals = useMemo(() => computeNonTaxDocumentTotals(draft.lines), [draft.lines])
  const validation = useMemo(() => validateNonTaxInvoice(draft), [draft])
  const previewDraft = useDeferredValue(draft)
  const previewHtml = useMemo(() => buildNonTaxInvoiceHtml(previewDraft), [previewDraft])
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  const update = (patch: Partial<NonTaxInvoiceDraft>) => {
    dl.setStatus('idle')
    setDraft((d) => ({ ...d, ...patch }))
  }

  const download = () =>
    void dl.download({
      valid: validation.valid,
      html: () => buildNonTaxInvoiceHtml(draft, { forPdf: true }),
      filename: `qaftr-non-tax-invoice-${safeFilePart(draft.number) || draft.date}.pdf`,
      title: `Invoice ${draft.number.trim()}`,
      onSuccess: () =>
        track('document_pdf_download', {
          tool: 'non_tax_invoice',
          output_lang: draft.outputLang,
          currency: 'SAR',
          line_count: totals.lineItems.length,
        }),
    })

  const form = (
    <>
      <div className="flex gap-3 rounded-xl border border-[var(--qaftr-gold)]/50 bg-[var(--qaftr-gold)]/5 p-4 text-sm">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-[var(--qaftr-gold)]" aria-hidden />
        <p className="text-foreground">
          {copy.registeredWarning}{' '}
          <Link
            to="/tools/fatora"
            search={search}
            className="font-medium underline underline-offset-4"
            onClick={() => track('cta_click', { cta: 'non_tax_to_tax_invoice', cta_location: 'document_form' })}
          >
            {copy.registeredCta}
          </Link>
        </p>
      </div>
      <OutputLangPicker lang={lang} name="nt-output" value={draft.outputLang} onChange={(outputLang) => update({ outputLang })} />
      <Section legend={copy.formTitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="nt-number" label={copy.number} value={draft.number} onChange={(number) => update({ number })} ltr />
          <TextField id="nt-date" label={copy.date} type="date" value={draft.date} onChange={(date) => update({ date })} ltr />
        </div>
      </Section>
      <Section legend={copy.sellerTitle}>
        <TextField
          id="nt-seller-name"
          label={copy.sellerName}
          value={draft.seller.name}
          onChange={(name) => update({ seller: { ...draft.seller, name } })}
        />
        <TextField
          id="nt-seller-address"
          label={copy.address}
          value={draft.seller.address}
          onChange={(address) => update({ seller: { ...draft.seller, address } })}
          multiline
        />
        <TextField
          id="nt-seller-cr"
          label={copy.crNumber}
          hint={copy.crHint}
          value={draft.seller.crNumber}
          onChange={(crNumber) => update({ seller: { ...draft.seller, crNumber } })}
          ltr
          inputMode="numeric"
        />
      </Section>
      <Section legend={copy.buyerTitle}>
        <TextField
          id="nt-buyer-name"
          label={copy.buyerName}
          hint={copy.buyerHint}
          value={draft.buyer.name}
          onChange={(name) => update({ buyer: { ...draft.buyer, name } })}
        />
        <TextField
          id="nt-buyer-address"
          label={copy.address}
          value={draft.buyer.address}
          onChange={(address) => update({ buyer: { ...draft.buyer, address } })}
          multiline
        />
      </Section>
      <LinesEditor idPrefix="nt" copy={copy} lines={draft.lines} onChange={(lines) => update({ lines })} />
      <TextField id="nt-notes" label={copy.notes} hint={copy.notesHint} value={draft.notes} onChange={(notes) => update({ notes })} multiline />
    </>
  )

  return (
    <DocumentShell
      lang={lang}
      kind="non-tax-invoice"
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
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <dt className="font-medium text-foreground">{copy.totalLabel}</dt>
              <dd
                className="break-all font-[family-name:var(--font-qaftr-display)] text-2xl font-bold tabular-nums text-[var(--qaftr-gold-ink)]"
                data-testid="doc-total"
              >
                {formatSar(totals.total, lang)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">{copy.notRegisteredNote}</p>
        </>
      }
      notice={<p>{copy.faq[2].answer}</p>}
      previewHtml={previewHtml}
      totalLabel={copy.totalLabel}
      totalText={formatSar(totals.total, lang)}
      onDownload={download}
      onClear={() => {
        dl.reset()
        setDraft((d) => ({ ...createEmptyNonTaxInvoiceDraft(todayInSaudi(), d.outputLang), seller: d.seller }))
      }}
    />
  )
}
