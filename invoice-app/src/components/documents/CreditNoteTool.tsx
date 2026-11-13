import { useDeferredValue, useMemo } from 'react'
import { InfoIcon } from 'lucide-react'
import { CREDIT_NOTE_REASONS, computeSaudiDocumentTotals, validateCreditNote } from '@zatca/shared'
import { track } from '#/lib/analytics/track'
import type { MarketingLang } from '#/lib/marketing/lang'
import { todayInSaudi } from '#/lib/sa/format'
import { getDocumentCopy } from '#/lib/documents/copy'
import { buildCreditNoteHtml } from '#/lib/documents/document-html'
import { createEmptyCreditNoteDraft } from '#/lib/documents/draft'
import type { CreditNoteDraft } from '#/lib/documents/draft'
import { Section, TextField } from '#/components/invoice-kit/FormKit'
import { Field, FieldLabel } from '#/components/ui/field'
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

export function CreditNoteTool({ lang }: { lang: MarketingLang }) {
  const all = getDocumentCopy(lang)
  const copy = all['credit-note']
  const [draft, setDraft] = useDocumentDraft('credit-note', (today) =>
    createEmptyCreditNoteDraft(today, defaultOutputLang(lang)),
  )
  const dl = useDocumentDownload()
  const totals = useMemo(() => computeSaudiDocumentTotals(draft.lines), [draft.lines])
  const validation = useMemo(() => validateCreditNote(draft), [draft])
  const previewDraft = useDeferredValue(draft)
  const previewHtml = useMemo(() => buildCreditNoteHtml(previewDraft), [previewDraft])

  const update = (patch: Partial<CreditNoteDraft>) => {
    dl.setStatus('idle')
    setDraft((d) => ({ ...d, ...patch }))
  }

  const download = () =>
    void dl.download({
      valid: validation.valid,
      html: () => buildCreditNoteHtml(draft, { forPdf: true }),
      filename: `qaftr-credit-note-${safeFilePart(draft.number) || draft.date}.pdf`,
      title: `Credit Note ${draft.number.trim()}`,
      onSuccess: () =>
        track('document_pdf_download', {
          tool: 'credit_note',
          output_lang: draft.outputLang,
          currency: 'SAR',
          line_count: totals.lineItems.length,
          reason: draft.reason,
        }),
    })

  const linked = (
    <p className="flex gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
      <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {copy.linkedNote} {copy.deadlineNote}
      </span>
    </p>
  )

  const form = (
    <>
      <OutputLangPicker lang={lang} name="cn-output" value={draft.outputLang} onChange={(outputLang) => update({ outputLang })} />
      <Section legend={copy.formTitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="cn-number" label={copy.number} value={draft.number} onChange={(number) => update({ number })} ltr />
          <TextField id="cn-date" label={copy.date} type="date" value={draft.date} onChange={(date) => update({ date })} ltr />
        </div>
      </Section>
      <Section legend={copy.originalTitle}>
        {linked}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="cn-orig-number" label={copy.originalNumber} value={draft.originalInvoiceNumber} onChange={(originalInvoiceNumber) => update({ originalInvoiceNumber })} ltr />
          <TextField id="cn-orig-date" label={copy.originalDate} type="date" value={draft.originalInvoiceDate} onChange={(originalInvoiceDate) => update({ originalInvoiceDate })} ltr />
        </div>
        <Field className="min-w-0 gap-1.5">
          <FieldLabel htmlFor="cn-reason">{copy.reason}</FieldLabel>
          <select
            id="cn-reason"
            value={draft.reason}
            onChange={(e) => update({ reason: e.target.value as CreditNoteDraft['reason'] })}
            className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">{copy.reasonPlaceholder}</option>
            {CREDIT_NOTE_REASONS.map((r) => (
              <option key={r} value={r}>
                {copy.reasons[r]}
              </option>
            ))}
          </select>
        </Field>
        <TextField id="cn-reason-detail" label={copy.reasonDetail} hint={copy.reasonDetailHint} value={draft.reasonDetail} onChange={(reasonDetail) => update({ reasonDetail })} />
      </Section>
      <PartyFields
        idPrefix="cn-seller"
        legend={copy.sellerTitle}
        nameLabel={copy.sellerName}
        addressLabel={copy.address}
        vatLabel={copy.vatNumber}
        vatHint={copy.sellerVatRequired}
        value={draft.seller}
        onChange={(patch) => update({ seller: { ...draft.seller, ...patch } })}
      />
      <PartyFields
        idPrefix="cn-buyer"
        legend={copy.buyerTitle}
        nameLabel={copy.buyerName}
        addressLabel={copy.address}
        vatLabel={copy.vatNumber}
        vatHint={copy.vatOptional}
        value={draft.buyer}
        onChange={(patch) => update({ buyer: { ...draft.buyer, ...patch } })}
      />
      <LinesEditor idPrefix="cn" copy={copy} lines={draft.lines} onChange={(lines) => update({ lines })} />
      <TextField id="cn-notes" label={copy.notes} value={draft.notes} onChange={(notes) => update({ notes })} multiline />
    </>
  )

  return (
    <DocumentShell
      lang={lang}
      kind="credit-note"
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
      summary={<TotalsList lang={lang} totals={totals} />}
      notice={<p>{copy.linkedNote}</p>}
      previewHtml={previewHtml}
      totalLabel={all.common.total}
      totalText={formatSar(totals.total, lang)}
      onDownload={download}
      onClear={() => {
        dl.reset()
        setDraft((d) => ({ ...createEmptyCreditNoteDraft(todayInSaudi(), d.outputLang), seller: d.seller }))
      }}
    />
  )
}
