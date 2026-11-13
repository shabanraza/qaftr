import {
  amountInArabicWords,
  amountInEnglishWords,
  computeSaudiDocumentTotals,
  normalizeSaudiVatNumber,
  parseLocaleDecimal,
} from '@zatca/shared'
import { formatAeDate } from '#/lib/ae/format'
import { documentFontFaceCss } from '#/lib/fonts/document-fonts'
import { getDocumentCopy } from './copy'
import type { CreditNoteDraft, DocumentOutputLang, QuotationDraft, ReceiptDraft } from './draft'

/**
 * Printable HTML for the Saudi document generators (preview iframe and PDF via
 * the shared renderer in #/lib/invoice/pdf-render). Amounts and dates use Latin
 * digits, as on the Saudi and UAE invoice PDFs.
 */
type Label = { ar: string; en: string }

const DOC = {
  receipt: { ar: 'سند قبض', en: 'Receipt Voucher' },
  quotation: { ar: 'عرض سعر', en: 'Quotation' },
  creditNote: { ar: 'إشعار دائن', en: 'Credit Note' },
  receiptNo: { ar: 'رقم السند', en: 'Receipt no.' },
  quotationNo: { ar: 'رقم العرض', en: 'Quotation no.' },
  creditNoteNo: { ar: 'رقم الإشعار', en: 'Credit note no.' },
  date: { ar: 'التاريخ', en: 'Date' },
  validUntil: { ar: 'صالح حتى', en: 'Valid until' },
  receivedFrom: { ar: 'استلمنا من السيد / السادة', en: 'Received from' },
  sumOf: { ar: 'مبلغاً وقدره', en: 'The sum of' },
  paymentMethod: { ar: 'طريقة الدفع', en: 'Payment method' },
  chequeNo: { ar: 'رقم الشيك', en: 'Cheque no.' },
  bank: { ar: 'البنك', en: 'Bank' },
  purpose: { ar: 'وذلك عن', en: 'Being payment for' },
  receiverSignature: { ar: 'توقيع المستلم', en: 'Receiver signature' },
  stamp: { ar: 'الختم', en: 'Stamp' },
  seller: { ar: 'البائع', en: 'Seller' },
  buyer: { ar: 'المشتري', en: 'Buyer' },
  vatNumber: { ar: 'الرقم الضريبي', en: 'VAT number' },
  description: { ar: 'الوصف', en: 'Description' },
  qty: { ar: 'الكمية', en: 'Qty' },
  unitPrice: { ar: 'سعر الوحدة', en: 'Unit price' },
  taxable: { ar: 'المبلغ الخاضع للضريبة', en: 'Taxable amount' },
  vatRate: { ar: 'نسبة الضريبة', en: 'VAT rate' },
  subtotal: { ar: 'الإجمالي غير شامل الضريبة', en: 'Total excl. VAT' },
  vat: { ar: 'ضريبة القيمة المضافة 15%', en: 'VAT 15%' },
  total: { ar: 'الإجمالي شامل الضريبة', en: 'Total incl. VAT' },
  creditedTotal: { ar: 'إجمالي المبلغ الدائن شامل الضريبة', en: 'Total credited incl. VAT' },
  totalInWords: { ar: 'الإجمالي كتابةً', en: 'Total in words' },
  terms: { ar: 'الشروط والأحكام', en: 'Terms and conditions' },
  notes: { ar: 'ملاحظات', en: 'Notes' },
  reason: { ar: 'سبب الإصدار', en: 'Reason for issuing' },
  originalInvoice: { ar: 'الفاتورة الضريبية الأصلية', en: 'Original tax invoice' },
  amountsIn: { ar: 'جميع المبالغ بالريال السعودي', en: 'All amounts in Saudi riyals (SAR)' },
  receiptNotInvoice: {
    ar: 'هذا السند إثبات لاستلام المبلغ، وهو ليس فاتورة ضريبية.',
    en: 'This voucher confirms receipt of payment. It is not a tax invoice.',
  },
  quotationNotInvoice: {
    ar: 'عرض السعر ليس فاتورة ضريبية. تصدر الفاتورة الضريبية عند التوريد.',
    en: 'This quotation is not a tax invoice. A tax invoice is issued on supply.',
  },
  creditLinked: {
    ar: 'يرتبط هذا الإشعار الدائن بالفاتورة الضريبية الأصلية المذكورة أعلاه ويعدّل قيمتها.',
    en: 'This credit note is linked to and amends the original tax invoice stated above.',
  },
  createdWith: { ar: 'أُنشئ عبر قافتر · qaftr.com', en: 'Created with Qaftr · qaftr.com' },
} as const satisfies Record<string, Label>

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** "1234.5" → "1,234.50" (Latin digits). */
function money(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value)
  const [whole, fraction] = (Number.isFinite(n) ? n : 0).toFixed(2).split('.')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
}

const text = (v: string) => `<span dir="auto">${escapeHtml(v.trim())}</span>`
const ltr = (v: string) => `<span dir="ltr">${escapeHtml(v)}</span>`

class Printer {
  constructor(readonly lang: DocumentOutputLang) {}

  get isAr() {
    return this.lang === 'ar'
  }

  /** Label text: one language, or English / Arabic inline. */
  label(l: Label): string {
    if (this.lang === 'bilingual') {
      return `<span class="bi-inline"><span lang="en">${escapeHtml(l.en)}</span><span class="sep">/</span><span lang="ar" dir="rtl">${escapeHtml(l.ar)}</span></span>`
    }
    return escapeHtml(l[this.lang])
  }

  /** Table header: stacked Arabic over English in bilingual mode. */
  header(l: Label): string {
    return this.lang === 'bilingual'
      ? `<span lang="ar" dir="rtl">${escapeHtml(l.ar)}</span><br><span lang="en">${escapeHtml(l.en)}</span>`
      : escapeHtml(l[this.lang])
  }

  /** A whole sentence: bilingual prints both on separate lines. */
  sentence(l: Label): string {
    if (this.lang === 'bilingual') {
      return `<div lang="ar" dir="rtl">${escapeHtml(l.ar)}</div><div lang="en" dir="ltr">${escapeHtml(l.en)}</div>`
    }
    return `<div>${escapeHtml(l[this.lang])}</div>`
  }

  field(l: Label, valueHtml: string): string {
    const name =
      this.lang === 'bilingual'
        ? this.label({ en: `${l.en}:`, ar: `${l.ar}:` })
        : `${this.label(l)}:`
    return `<div class="field"><span class="muted-label">${name}</span> ${valueHtml}</div>`
  }

  date(iso: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ltr(iso)
    if (this.isAr) return `<span dir="rtl">${escapeHtml(formatAeDate(iso, 'ar'))}</span>`
    return ltr(formatAeDate(iso, 'en'))
  }

  amount(value: string | number): string {
    return this.isAr ? ltr(`${money(value)} ر.س`) : ltr(`SAR ${money(value)}`)
  }

  title(l: Label): string {
    if (this.lang === 'bilingual') {
      return `<h1><span lang="ar" dir="rtl">${escapeHtml(l.ar)}</span><span class="h1-sep">|</span><span lang="en">${escapeHtml(l.en)}</span></h1>`
    }
    return `<h1>${escapeHtml(l[this.lang])}</h1>`
  }

  /** Amount in words in the document language(s). */
  words(amount: string | number): string {
    const arWords = amountInArabicWords(amount, 'SAR')
    const enWords = amountInEnglishWords(amount, 'SAR')
    const parts: string[] = []
    if (this.lang !== 'en' && arWords) parts.push(`<div lang="ar" dir="rtl" class="words">${escapeHtml(arWords)}</div>`)
    if (this.lang !== 'ar' && enWords) parts.push(`<div lang="en" dir="ltr" class="words">${escapeHtml(enWords)}</div>`)
    return parts.join('')
  }
}

function page(p: Printer, docTitle: Label, docNumber: string, body: string, forPdf: boolean): string {
  const dir = p.isAr ? 'rtl' : 'ltr'
  const start = p.isAr ? 'right' : 'left'
  const end = p.isAr ? 'left' : 'right'
  const fontFamily = forPdf
    ? "'Arial', 'Helvetica Neue', 'Segoe UI', sans-serif"
    : "'IBM Plex Sans Arabic', 'Arial', sans-serif"
  const fontImport = forPdf
    ? ''
    : documentFontFaceCss([400, 600, 700])
  const titleText = p.lang === 'bilingual' ? `${docTitle.ar} / ${docTitle.en}` : docTitle[p.lang]
  return `<!DOCTYPE html>
<html lang="${p.isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(titleText)} ${escapeHtml(docNumber)}</title>
<style>
  ${fontImport}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${fontFamily}; color: #0D1F19; background: #fff; padding: ${forPdf ? '32px 36px' : '36px'}; font-size: 13px; line-height: 1.6; text-align: ${start}; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 2px solid #0D1F19; padding-bottom: 16px; margin-bottom: 20px; }
  h1 { font-size: 24px; font-weight: 700; display: flex; gap: 10px; flex-wrap: wrap; align-items: baseline; }
  .h1-sep { color: #9AA8A2; font-weight: 400; }
  .issuer { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .meta { text-align: ${end}; font-size: 12px; }
  .muted { color: #5B6B64; font-size: 11px; }
  .muted-label { color: #5B6B64; }
  .bi-inline { display: inline-flex; gap: 6px; align-items: baseline; }
  .bi-inline .sep { color: #9AA8A2; }
  .field { padding: 8px 0; border-bottom: 1px dashed #C9D1CD; }
  .amount-box { display: inline-block; border: 2px solid #0D1F19; border-radius: 8px; padding: 8px 16px; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
  .words { font-weight: 600; }
  .box { border: 1px solid #E3E8E5; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; }
  .parties { display: flex; gap: 24px; margin-bottom: 20px; }
  .party { flex: 1; border: 1px solid #E3E8E5; border-radius: 8px; padding: 12px 14px; }
  .party-name { font-weight: 700; font-size: 14px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  table.items th { background: #0D1F19; color: #fff; font-size: 11px; font-weight: 600; padding: 7px 6px; text-align: ${start}; vertical-align: bottom; }
  table.items td { border-bottom: 1px solid #E3E8E5; padding: 7px 6px; vertical-align: top; }
  .n { text-align: ${end}; white-space: nowrap; font-variant-numeric: tabular-nums; }
  th.n { text-align: ${end}; }
  .b { font-weight: 700; }
  table.totals { width: 55%; margin-${start}: auto; border-collapse: collapse; }
  table.totals td { padding: 6px 4px; border-bottom: 1px solid #E3E8E5; }
  table.totals .grand td { font-size: 15px; font-weight: 700; border-top: 2px solid #0D1F19; border-bottom: none; }
  .section { margin-top: 18px; border-top: 1px dashed #C9D1CD; padding-top: 10px; white-space: pre-wrap; }
  .signatures { display: flex; justify-content: space-between; gap: 32px; margin-top: 48px; }
  .sign { flex: 1; text-align: center; }
  .sign .line { border-top: 1px solid #0D1F19; margin-top: 40px; padding-top: 6px; }
  .foot { margin-top: 28px; font-size: 11px; color: #5B6B64; display: flex; flex-direction: column; gap: 2px; }
</style>
</head>
<body>
${body}
</body>
</html>`
}

function head(p: Printer, title: Label, meta: string, issuer = ''): string {
  return `<div class="head">
  <div>
    ${issuer.trim() ? `<div class="issuer">${text(issuer)}</div>` : ''}
    ${p.title(title)}
    <div class="muted">${p.label(DOC.amountsIn)}</div>
  </div>
  <div class="meta">${meta}</div>
</div>`
}

function party(p: Printer, label: Label, v: { name: string; address: string; vatNumber: string }): string {
  const vat = normalizeSaudiVatNumber(v.vatNumber)
  return `<div class="party">
    <div class="muted">${p.label(label)}</div>
    <div class="party-name">${text(v.name)}</div>
    ${v.address.trim() ? `<div>${text(v.address)}</div>` : ''}
    ${vat ? p.field(DOC.vatNumber, ltr(vat)) : ''}
  </div>`
}

function itemsAndTotals(
  p: Printer,
  lines: QuotationDraft['lines'],
  grandLabel: Label,
): { html: string; total: string } {
  const totals = computeSaudiDocumentTotals(lines)
  const rows = totals.lineItems
    .map(
      (l, i) => `<tr>
  <td class="n">${i + 1}</td>
  <td>${text(l.description)}</td>
  <td class="n">${ltr(String(Number(l.qty)))}</td>
  <td class="n">${ltr(money(l.unitPrice))}</td>
  <td class="n">${ltr('15%')}</td>
  <td class="n b">${ltr(money(l.lineTotal))}</td>
</tr>`,
    )
    .join('')
  const totalRow = (label: Label, value: string, cls = '') =>
    `<tr class="${cls}"><td>${p.label(label)}</td><td class="n">${p.amount(value)}</td></tr>`
  const html = `<table class="items">
  <thead><tr>
    <th class="n">#</th>
    <th>${p.header(DOC.description)}</th>
    <th class="n">${p.header(DOC.qty)}</th>
    <th class="n">${p.header(DOC.unitPrice)}</th>
    <th class="n">${p.header(DOC.vatRate)}</th>
    <th class="n">${p.header(DOC.taxable)}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<table class="totals">
  ${totalRow(DOC.subtotal, totals.subtotal)}
  ${totalRow(DOC.vat, totals.vatAmount)}
  ${totalRow(grandLabel, totals.total, 'grand')}
</table>
${Number(totals.total) > 0 ? `<div class="box" style="margin-top:12px"><div class="muted">${p.label(DOC.totalInWords)}</div>${p.words(totals.total)}</div>` : ''}`
  return { html, total: totals.total }
}

const foot = (p: Printer, note: Label) => `<div class="foot">
  ${p.sentence(note)}
  <div>${p.label(DOC.createdWith)}</div>
</div>`

export function buildReceiptHtml(draft: ReceiptDraft, options: { forPdf?: boolean } = {}): string {
  const p = new Printer(draft.outputLang)
  const methodLabel: Label = {
    ar: getDocumentCopy('ar')['receipt-voucher'].methods[draft.paymentMethod],
    en: getDocumentCopy('en')['receipt-voucher'].methods[draft.paymentMethod],
  }
  const meta = [
    p.field(DOC.receiptNo, ltr(draft.number.trim())),
    p.field(DOC.date, p.date(draft.date)),
  ].join('')
  const cheque =
    draft.paymentMethod === 'cheque'
      ? `${p.field(DOC.chequeNo, ltr(draft.chequeNumber.trim()))}${p.field(DOC.bank, text(draft.bankName))}`
      : draft.paymentMethod === 'bank_transfer' && draft.bankName.trim()
        ? p.field(DOC.bank, text(draft.bankName))
        : ''
  const hasAmount = draft.amount.trim() !== '' && amountInEnglishWords(draft.amount, 'SAR') !== null
  const body = `${head(p, DOC.receipt, meta, draft.issuerName)}
${hasAmount ? `<div class="amount-box">${p.amount(parseLocaleDecimal(draft.amount.trim()))}</div>` : ''}
${p.field(DOC.receivedFrom, text(draft.receivedFrom))}
<div class="field"><span class="muted-label">${p.label(DOC.sumOf)}:</span>${hasAmount ? p.words(draft.amount) : ''}</div>
${p.field(DOC.paymentMethod, p.label(methodLabel))}
${cheque}
${p.field(DOC.purpose, text(draft.purpose))}
<div class="signatures">
  <div class="sign"><div class="line">${p.label(DOC.stamp)}</div></div>
  <div class="sign">${draft.receiverName.trim() ? `<div>${text(draft.receiverName)}</div>` : ''}<div class="line">${p.label(DOC.receiverSignature)}</div></div>
</div>
${foot(p, DOC.receiptNotInvoice)}`
  return page(p, DOC.receipt, draft.number, body, Boolean(options.forPdf))
}

export function buildQuotationHtml(draft: QuotationDraft, options: { forPdf?: boolean } = {}): string {
  const p = new Printer(draft.outputLang)
  const meta = [
    p.field(DOC.quotationNo, ltr(draft.number.trim())),
    p.field(DOC.date, p.date(draft.date)),
    draft.validUntil.trim() ? p.field(DOC.validUntil, p.date(draft.validUntil)) : '',
  ].join('')
  const { html: items } = itemsAndTotals(p, draft.lines, DOC.total)
  const body = `${head(p, DOC.quotation, meta)}
<div class="parties">
  ${party(p, DOC.seller, draft.seller)}
  ${party(p, DOC.buyer, draft.buyer)}
</div>
${items}
${draft.terms.trim() ? `<div class="section"><div class="muted">${p.label(DOC.terms)}</div>${text(draft.terms)}</div>` : ''}
${foot(p, DOC.quotationNotInvoice)}`
  return page(p, DOC.quotation, draft.number, body, Boolean(options.forPdf))
}

export function buildCreditNoteHtml(draft: CreditNoteDraft, options: { forPdf?: boolean } = {}): string {
  const p = new Printer(draft.outputLang)
  const meta = [
    p.field(DOC.creditNoteNo, ltr(draft.number.trim())),
    p.field(DOC.date, p.date(draft.date)),
  ].join('')
  const number = escapeHtml(draft.originalInvoiceNumber.trim())
  const arRef = `هذا الإشعار الدائن يتعلق بالفاتورة الضريبية رقم (<span dir="ltr">${number}</span>) الصادرة بتاريخ ${new Printer('ar').date(draft.originalInvoiceDate)}`
  const enRef = `This credit note relates to tax invoice no. (<span dir="ltr">${number}</span>) issued on ${new Printer('en').date(draft.originalInvoiceDate)}`
  const reference =
    p.lang === 'bilingual'
      ? `<div lang="ar" dir="rtl">${arRef}</div><div lang="en" dir="ltr">${enRef}</div>`
      : `<div>${p.isAr ? arRef : enRef}</div>`
  const reasonLabel: Label | null = draft.reason
    ? draft.reason === 'other'
      ? { ar: draft.reasonDetail.trim(), en: draft.reasonDetail.trim() }
      : {
          ar: getDocumentCopy('ar')['credit-note'].reasons[draft.reason],
          en: getDocumentCopy('en')['credit-note'].reasons[draft.reason],
        }
    : null
  const reasonHtml = reasonLabel
    ? draft.reason === 'other'
      ? text(reasonLabel.en)
      : p.label(reasonLabel)
    : ''
  const detail =
    draft.reason && draft.reason !== 'other' && draft.reasonDetail.trim()
      ? ` — ${text(draft.reasonDetail)}`
      : ''
  const { html: items } = itemsAndTotals(p, draft.lines, DOC.creditedTotal)
  const body = `${head(p, DOC.creditNote, meta)}
<div class="box">
  <div class="muted">${p.label(DOC.originalInvoice)}</div>
  <div class="b">${reference}</div>
  ${p.field(DOC.reason, `${reasonHtml}${detail}`)}
</div>
<div class="parties">
  ${party(p, DOC.seller, draft.seller)}
  ${party(p, DOC.buyer, draft.buyer)}
</div>
${items}
${draft.notes.trim() ? `<div class="section"><div class="muted">${p.label(DOC.notes)}</div>${text(draft.notes)}</div>` : ''}
${foot(p, DOC.creditLinked)}`
  return page(p, DOC.creditNote, draft.number, body, Boolean(options.forPdf))
}
