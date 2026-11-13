import { useDeferredValue, useMemo } from 'react'
import { amountInArabicWords, amountInEnglishWords, parseLocaleDecimal, validateReceiptVoucher } from '@zatca/shared'
import type { ReceiptPaymentMethod } from '@zatca/shared'
import { track } from '#/lib/analytics/track'
import type { MarketingLang } from '#/lib/marketing/lang'
import { todayInSaudi } from '#/lib/sa/format'
import { getDocumentCopy } from '#/lib/documents/copy'
import { buildReceiptHtml } from '#/lib/documents/document-html'
import { createEmptyReceiptDraft } from '#/lib/documents/draft'
import type { ReceiptDraft } from '#/lib/documents/draft'
import { RadioCards, Section, TextField } from '#/components/invoice-kit/FormKit'
import {
  DocumentShell,
  OutputLangPicker,
  defaultOutputLang,
  formatSar,
  safeFilePart,
  useDocumentDownload,
  useDocumentDraft,
} from './DocumentShell'

export function ReceiptVoucherTool({ lang }: { lang: MarketingLang }) {
  const copy = getDocumentCopy(lang)['receipt-voucher']
  const [draft, setDraft] = useDocumentDraft('receipt-voucher', (today) =>
    createEmptyReceiptDraft(today, defaultOutputLang(lang)),
  )
  const dl = useDocumentDownload()
  const validation = useMemo(() => validateReceiptVoucher(draft), [draft])
  const previewDraft = useDeferredValue(draft)
  const previewHtml = useMemo(() => buildReceiptHtml(previewDraft), [previewDraft])

  const arWords = amountInArabicWords(draft.amount, 'SAR')
  const enWords = amountInEnglishWords(draft.amount, 'SAR')
  const hasAmount = draft.amount.trim() !== '' && arWords !== null
  const amountNumber = hasAmount ? parseLocaleDecimal(draft.amount.trim()) : 0

  const update = (patch: Partial<ReceiptDraft>) => {
    dl.setStatus('idle')
    setDraft((d) => ({ ...d, ...patch }))
  }

  const download = () =>
    void dl.download({
      valid: validation.valid,
      html: () => buildReceiptHtml(draft, { forPdf: true }),
      filename: `qaftr-receipt-voucher-${safeFilePart(draft.number) || draft.date}.pdf`,
      title: `Receipt Voucher ${draft.number.trim()}`,
      onSuccess: () =>
        track('document_pdf_download', {
          tool: 'receipt_voucher',
          output_lang: draft.outputLang,
          currency: 'SAR',
          payment_method: draft.paymentMethod,
        }),
    })

  const methods: ReadonlyArray<readonly [ReceiptPaymentMethod, string]> = [
    ['cash', copy.methods.cash],
    ['bank_transfer', copy.methods.bank_transfer],
    ['cheque', copy.methods.cheque],
    ['card', copy.methods.card],
  ]

  const form = (
    <>
      <OutputLangPicker lang={lang} name="rv-output" value={draft.outputLang} onChange={(outputLang) => update({ outputLang })} />
      <Section legend={copy.issuerTitle}>
        <TextField id="rv-issuer" label={copy.issuerName} hint={copy.issuerHint} value={draft.issuerName} onChange={(issuerName) => update({ issuerName })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="rv-number" label={copy.number} value={draft.number} onChange={(number) => update({ number })} ltr />
          <TextField id="rv-date" label={copy.date} type="date" value={draft.date} onChange={(date) => update({ date })} ltr />
        </div>
      </Section>
      <Section legend={copy.formTitle}>
        <TextField id="rv-from" label={copy.receivedFrom} value={draft.receivedFrom} onChange={(receivedFrom) => update({ receivedFrom })} />
        <TextField id="rv-amount" label={copy.amount} hint={copy.amountHint} value={draft.amount} onChange={(amount) => update({ amount })} ltr inputMode="decimal" />
        <RadioCards<ReceiptPaymentMethod>
          name="rv-method"
          legend={copy.paymentMethod}
          options={methods}
          value={draft.paymentMethod}
          onChange={(paymentMethod) => update({ paymentMethod })}
        />
        {draft.paymentMethod === 'cheque' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="rv-cheque" label={copy.chequeNumber} value={draft.chequeNumber} onChange={(chequeNumber) => update({ chequeNumber })} ltr />
            <TextField id="rv-bank" label={copy.bank} value={draft.bankName} onChange={(bankName) => update({ bankName })} />
          </div>
        ) : draft.paymentMethod === 'bank_transfer' ? (
          <TextField id="rv-bank" label={copy.bankOptional} value={draft.bankName} onChange={(bankName) => update({ bankName })} />
        ) : null}
        <TextField id="rv-purpose" label={copy.purpose} value={draft.purpose} onChange={(purpose) => update({ purpose })} multiline />
        <TextField id="rv-receiver" label={copy.receiverName} hint={copy.receiverHint} value={draft.receiverName} onChange={(receiverName) => update({ receiverName })} />
      </Section>
    </>
  )

  const summary = (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-medium text-foreground">{copy.amount}</span>
        <span
          className="break-all font-[family-name:var(--font-qaftr-display)] text-2xl font-bold tabular-nums text-[var(--qaftr-gold-ink)]"
          data-testid="doc-total"
        >
          {formatSar(amountNumber, lang)}
        </span>
      </div>
      <div data-testid="doc-amount-words" className="rounded-lg bg-muted/40 p-3">
        {hasAmount ? (
          <>
            <p className="text-xs text-muted-foreground">{copy.amountInWords}</p>
            <p lang="ar" dir="rtl" className="font-semibold text-foreground">{arWords}</p>
            <p className="mt-2 text-xs text-muted-foreground">{copy.amountInWordsEn}</p>
            <p lang="en" dir="ltr" className="font-semibold text-foreground">{enWords}</p>
          </>
        ) : (
          <p className="text-muted-foreground">{copy.amountWordsEmpty}</p>
        )}
      </div>
    </div>
  )

  return (
    <DocumentShell
      lang={lang}
      kind="receipt-voucher"
      status={dl.status}
      issues={dl.showIssues && !validation.valid ? validation.issues.map((i) => copy.issues[i.code]) : null}
      alertRef={dl.alertRef}
      form={form}
      summary={summary}
      notice={<p>{copy.notTaxInvoice}</p>}
      previewHtml={previewHtml}
      totalLabel={copy.amount}
      totalText={formatSar(amountNumber, lang)}
      onDownload={download}
      onClear={() => {
        dl.reset()
        setDraft((d) => createEmptyReceiptDraft(todayInSaudi(), d.outputLang))
      }}
    />
  )
}
