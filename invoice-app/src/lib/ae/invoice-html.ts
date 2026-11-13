import { analyzeUaeTrn, buildUaeInvoiceTotals, getUaeInvoiceTitle } from '@zatca/shared'
import { documentFontFaceCss } from '#/lib/fonts/document-fonts'
import type { UaeInvoiceLineTotals, UaeInvoiceOutputLang } from '@zatca/shared'
import { AE_INVOICE_CONFIG } from '#/lib/invoice/country-config'
import { formatAeDate } from './format'
import type { UaeInvoiceDraft } from './invoice-draft'

/** Labels printed on the invoice document (not the form UI). */
const DOC = {
  supplier: { ar: 'المورّد', en: 'Supplier' },
  recipient: { ar: 'العميل', en: 'Recipient' },
  trn: { ar: 'رقم التسجيل الضريبي', en: 'TRN' },
  invoiceNo: { ar: 'رقم الفاتورة', en: 'Invoice no.' },
  issueDate: { ar: 'تاريخ الفاتورة', en: 'Invoice date' },
  supplyDate: { ar: 'تاريخ التوريد', en: 'Date of supply' },
  description: { ar: 'الوصف', en: 'Description' },
  qty: { ar: 'الكمية', en: 'Qty' },
  unitPrice: { ar: 'سعر الوحدة', en: 'Unit price' },
  discount: { ar: 'الخصم', en: 'Discount' },
  net: { ar: 'المبلغ الخاضع للضريبة', en: 'Taxable amount' },
  vatRate: { ar: 'نسبة الضريبة', en: 'VAT rate' },
  vat: { ar: 'مبلغ الضريبة', en: 'VAT amount' },
  lineTotal: { ar: 'الإجمالي', en: 'Total' },
  exempt: { ar: 'معفى', en: 'Exempt' },
  totalDiscount: { ar: 'إجمالي الخصم', en: 'Total discount' },
  totalExcl: { ar: 'الإجمالي غير شامل الضريبة', en: 'Total excluding VAT' },
  totalVat: { ar: 'ضريبة القيمة المضافة', en: 'VAT' },
  totalPayable: { ar: 'المبلغ المستحق', en: 'Total payable' },
  notes: { ar: 'ملاحظات', en: 'Notes' },
  amountsIn: { ar: 'جميع المبالغ بالدرهم الإماراتي', en: 'All amounts in UAE dirhams (AED)' },
  notEInvoice: {
    ar: 'هذه فاتورة ضريبية بصيغة PDF، وليست فاتورة إلكترونية عبر Peppol / PINT AE.',
    en: 'This is a PDF tax invoice, not a Peppol / PINT AE e-invoice.',
  },
  createdWith: { ar: 'أُنشئت عبر قافتر · qaftr.com', en: 'Created with Qaftr · qaftr.com' },
} as const

type Label = { ar: string; en: string }

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Groups a fils-exact "1234.50" string with Latin digits: "1,234.50". */
function money(value: string): string {
  const [whole, fraction = '00'] = value.split('.')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
}

function makeLabel(lang: UaeInvoiceOutputLang, inline = false) {
  return (l: Label): string => {
    if (lang === 'bilingual' && inline) {
      return `<span class="bi-inline"><span lang="en">${escapeHtml(l.en)}</span><span class="sep">/</span><span lang="ar" dir="rtl">${escapeHtml(l.ar)}</span></span>`
    }
    if (lang === 'bilingual') {
      return `<span class="bi"><span lang="en">${escapeHtml(l.en)}</span><span lang="ar" dir="rtl">${escapeHtml(l.ar)}</span></span>`
    }
    return escapeHtml(l[lang])
  }
}

/** "Label: " for field rows. In bilingual mode the colon goes inside each language
 * run so bidi keeps it next to its own word (not beside the "/" separator). */
function makeFieldLabel(lang: UaeInvoiceOutputLang) {
  const inline = makeLabel(lang, true)
  return (l: Label): string =>
    lang === 'bilingual'
      ? inline({ en: `${l.en}:`, ar: `${l.ar}:` }) + ' '
      : `${inline(l)}: `
}

function makeHeaderLabel(lang: UaeInvoiceOutputLang) {
  return (l: Label): string =>
    lang === 'bilingual'
      ? `<span lang="ar" dir="rtl">${escapeHtml(l.ar)}</span><br><span lang="en">${escapeHtml(l.en)}</span>`
      : escapeHtml(l[lang])
}

const text = (v: string) => `<span dir="auto">${escapeHtml(v.trim())}</span>`
const ltr = (v: string) => `<span dir="ltr">${escapeHtml(v)}</span>`

function displayTrn(trn: string): string {
  const analysis = analyzeUaeTrn(trn)
  return analysis.valid ? analysis.normalized : trn.trim()
}

/** Date as HTML: Arabic month names read right-to-left, others left-to-right. */
function displayDate(iso: string, lang: UaeInvoiceOutputLang): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ltr(iso)
  if (lang === 'ar') return `<span dir="rtl">${escapeHtml(formatAeDate(iso, 'ar'))}</span>`
  return ltr(formatAeDate(iso, 'en'))
}

export function buildUaeInvoiceHtml(
  draft: UaeInvoiceDraft,
  options: { forPdf?: boolean } = {},
): string {
  const lang = draft.outputLang
  const L = makeLabel(lang)
  const LI = makeLabel(lang, true)
  const LF = makeFieldLabel(lang)
  const H = makeHeaderLabel(lang)
  const isAr = lang === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'
  const htmlLang = isAr ? 'ar' : 'en'
  const start = isAr ? 'right' : 'left'
  const end = isAr ? 'left' : 'right'
  const currency =
    lang === 'ar' ? AE_INVOICE_CONFIG.currency.labelAr : AE_INVOICE_CONFIG.currency.labelEn
  const totals = buildUaeInvoiceTotals(draft.lines)
  const title = getUaeInvoiceTitle(draft.type, lang)
  const full = draft.type === 'full'
  const r = draft.recipient
  const showRecipient = full || Boolean(r.name.trim() || r.address.trim() || r.trn.trim())
  const showNumber = full || Boolean(draft.invoiceNumber.trim())
  const showSupplyDate = Boolean(draft.supplyDate.trim()) && draft.supplyDate !== draft.issueDate
  const fontFamily = options.forPdf
    ? "'Arial', 'Helvetica Neue', 'Segoe UI', sans-serif"
    : "'IBM Plex Sans Arabic', 'Arial', sans-serif"
  const fontImport = options.forPdf
    ? ''
    : documentFontFaceCss([400, 600, 700])

  const rate = (line: UaeInvoiceLineTotals) =>
    line.vatRatePercent === null ? H(DOC.exempt) : ltr(`${line.vatRatePercent}%`)

  const rows = totals.lines
    .map(
      (line, i) => `<tr>
  <td class="n">${i + 1}</td>
  <td class="desc">${text(line.description)}</td>
  <td class="n">${ltr(line.qty)}</td>
  <td class="n">${ltr(money(line.unitPrice))}</td>
  <td class="n">${ltr(money(line.discount))}</td>
  <td class="n">${ltr(money(line.net))}</td>
  <td class="n">${rate(line)}</td>
  <td class="n">${ltr(money(line.vatAmount))}</td>
  <td class="n b">${ltr(money(line.total))}</td>
</tr>`,
    )
    .join('')

  const party = (label: Label, p: { name: string; address: string; trn: string }) => `
  <div class="party">
    <div class="muted">${LI(label)}</div>
    <div class="party-name">${text(p.name)}</div>
    ${p.address.trim() ? `<div>${text(p.address)}</div>` : ''}
    ${p.trn.trim() ? `<div>${LF(DOC.trn)}${ltr(displayTrn(p.trn))}</div>` : ''}
  </div>`

  const meta = [
    showNumber ? `<div>${LF(DOC.invoiceNo)}${ltr(draft.invoiceNumber.trim())}</div>` : '',
    `<div>${LF(DOC.issueDate)}${displayDate(draft.issueDate, lang)}</div>`,
    showSupplyDate
      ? `<div>${LF(DOC.supplyDate)}${displayDate(draft.supplyDate, lang)}</div>`
      : '',
  ].join('')

  const totalRow = (label: Label, value: string, cls = '') =>
    `<tr class="${cls}"><td>${L(label)}</td><td class="n">${ltr(`${money(value)} ${currency}`)}</td></tr>`

  return `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} ${escapeHtml(draft.invoiceNumber)}</title>
<style>
  ${fontImport}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${fontFamily}; color: #0D1F19; background: #fff; padding: ${options.forPdf ? '32px 36px' : '36px'}; font-size: 13px; line-height: 1.55; text-align: ${start}; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 2px solid #0D1F19; padding-bottom: 16px; margin-bottom: 20px; }
  h1 { font-size: 24px; font-weight: 700; }
  .meta { text-align: ${end}; font-size: 12px; }
  .parties { display: flex; gap: 24px; margin-bottom: 20px; }
  .party { flex: 1; border: 1px solid #E3E8E5; border-radius: 8px; padding: 12px 14px; }
  .party-name { font-weight: 700; font-size: 14px; }
  .muted { color: #5B6B64; font-size: 11px; margin-bottom: 2px; }
  .bi { display: flex; justify-content: space-between; gap: 8px; width: 100%; }
  .bi-inline { display: inline-flex; gap: 6px; align-items: baseline; }
  .bi-inline .sep { color: #9AA8A2; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  table.items th { background: #0D1F19; color: #fff; font-size: 11px; font-weight: 600; padding: 7px 6px; text-align: ${start}; vertical-align: bottom; }
  table.items td { border-bottom: 1px solid #E3E8E5; padding: 7px 6px; vertical-align: top; }
  .n { text-align: ${end}; white-space: nowrap; font-variant-numeric: tabular-nums; }
  th.n { text-align: ${end}; }
  .b { font-weight: 700; }
  .desc { width: 30%; }
  table.totals { width: 55%; margin-${start}: auto; border-collapse: collapse; }
  table.totals td { padding: 6px 4px; border-bottom: 1px solid #E3E8E5; }
  table.totals .grand td { font-size: 15px; font-weight: 700; border-top: 2px solid #0D1F19; border-bottom: none; }
  .notes { margin-top: 18px; border-top: 1px dashed #C9D1CD; padding-top: 10px; white-space: pre-wrap; }
  .foot { margin-top: 24px; font-size: 11px; color: #5B6B64; display: flex; flex-direction: column; gap: 2px; }
</style>
</head>
<body>
<div class="head">
  <div>
    <h1>${escapeHtml(title)}</h1>
    <div class="muted">${LI(DOC.amountsIn)}</div>
  </div>
  <div class="meta">${meta}</div>
</div>
<div class="parties">
  ${party(DOC.supplier, draft.supplier)}
  ${showRecipient ? party(DOC.recipient, r) : ''}
</div>
<table class="items">
  <thead><tr>
    <th class="n">#</th>
    <th>${H(DOC.description)}</th>
    <th class="n">${H(DOC.qty)}</th>
    <th class="n">${H(DOC.unitPrice)}</th>
    <th class="n">${H(DOC.discount)}</th>
    <th class="n">${H(DOC.net)}</th>
    <th class="n">${H(DOC.vatRate)}</th>
    <th class="n">${H(DOC.vat)}</th>
    <th class="n">${H(DOC.lineTotal)}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<table class="totals">
  ${totalRow(DOC.totalDiscount, totals.totalDiscount)}
  ${totalRow(DOC.totalExcl, totals.totalExclVat)}
  ${totalRow(DOC.totalVat, totals.totalVat)}
  ${totalRow(DOC.totalPayable, totals.totalPayable, 'grand')}
</table>
${draft.notes.trim() ? `<div class="notes"><div class="muted">${LI(DOC.notes)}</div>${text(draft.notes)}</div>` : ''}
<div class="foot">
  <div>${L(DOC.notEInvoice)}</div>
  <div>${L(DOC.createdWith)}</div>
</div>
</body>
</html>`
}
