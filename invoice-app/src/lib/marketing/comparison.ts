import type { MarketingLang } from './lang'

/**
 * Qaftr vs the two alternatives Saudi SMEs weigh: full accounting suites and
 * free template sites. Categories, not brand claims. Suite prices and trials
 * come from vendors' published pricing (docs/LANDING_SEO_PLAN_2026-11-15.md §3).
 */
export type ComparisonMark = 'yes' | 'no' | 'partial'
export type ComparisonCell = { mark: ComparisonMark; text: string }
export type ComparisonRow = { id: string; label: string; cells: [ComparisonCell, ComparisonCell, ComparisonCell] }

export type Comparison = {
  title: string
  subtitle: string
  columns: [string, string, string]
  rows: ComparisonRow[]
  footnote: string
  legend: Record<ComparisonMark, string>
}

const y = (text: string): ComparisonCell => ({ mark: 'yes', text })
const n = (text: string): ComparisonCell => ({ mark: 'no', text })
const half = (text: string): ComparisonCell => ({ mark: 'partial', text })

const en: Comparison = {
  title: 'Qaftr compared with the alternatives',
  subtitle: 'Most Saudi SMEs choose between a full accounting suite and a free invoice template. Here is where Qaftr sits.',
  columns: ['Qaftr', 'Full accounting suites', 'Free template sites'],
  rows: [
    { id: 'price', label: 'Starting price', cells: [y('Free plan; Pro SAR 39/month'), half('About SAR 99–199/month on entry plans'), y('Free')] },
    { id: 'no-signup', label: 'Try without signing up', cells: [y('First invoice with no account'), n('Sign-up, usually a 14-day trial'), y('No account')] },
    { id: 'arabic', label: 'Arabic-first invoice (RTL)', cells: [y('Arabic or English, right to left'), y('Arabic and English'), half('Depends on the template')] },
    { id: 'vat', label: '15% VAT calculated for you', cells: [y('Automatic'), y('Automatic'), half('Often typed by hand')] },
    { id: 'qr', label: 'ZATCA Phase 1 QR code', cells: [y('On simplified tax invoices'), y('Included'), half('Not always included')] },
    { id: 'notes', label: 'Credit and debit notes', cells: [y('Linked to the original invoice'), y('Included'), n('Separate document')] },
    { id: 'whatsapp', label: 'Share as PDF on WhatsApp', cells: [y('One tap'), half('PDF or email; varies'), half('Download only')] },
    { id: 'customers', label: 'Saved customers and invoice history', cells: [y('With a free account'), y('Included'), n('Not saved')] },
    { id: 'phase2', label: 'ZATCA Phase 2 (integration)', cells: [half('Private beta'), y('On paid plans'), n('Not available')] },
    { id: 'accounting', label: 'Full accounting (ledger, inventory, payroll)', cells: [n('Invoicing only; export for your accountant'), y('Included, varies by plan'), n('Not available')] },
  ],
  footnote:
    'Suite prices are entry-plan monthly prices published by Saudi accounting software vendors, checked in November 2026; trials and features vary by vendor and plan. “Free template sites” means generic online invoice templates.',
  legend: { yes: 'Yes', no: 'No', partial: 'Partly' },
}

const ar: Comparison = {
  title: 'قافتر مقارنة بالبدائل',
  subtitle: 'تختار معظم المنشآت الصغيرة والمتوسطة في السعودية بين برنامج محاسبة متكامل وقالب فاتورة مجاني. هذا موقع قافتر بينهما.',
  columns: ['قافتر', 'برامج المحاسبة المتكاملة', 'مواقع القوالب المجانية'],
  rows: [
    { id: 'price', label: 'السعر المبدئي', cells: [y('خطة مجانية؛ الاحترافية ٣٩ ريالاً شهرياً'), half('نحو ٩٩–١٩٩ ريالاً شهرياً في الخطط الأولى'), y('مجاني')] },
    { id: 'no-signup', label: 'التجربة بدون تسجيل', cells: [y('الفاتورة الأولى بلا حساب'), n('تسجيل، وغالباً تجربة ١٤ يوماً'), y('بلا حساب')] },
    { id: 'arabic', label: 'فاتورة عربية أولاً (من اليمين لليسار)', cells: [y('بالعربية أو الإنجليزية'), y('عربية وإنجليزية'), half('بحسب القالب')] },
    { id: 'vat', label: 'حساب ضريبة ١٥٪ تلقائياً', cells: [y('تلقائي'), y('تلقائي'), half('غالباً تُكتب يدوياً')] },
    { id: 'qr', label: 'رمز QR للمرحلة الأولى من زاتكا', cells: [y('في الفاتورة المبسطة'), y('متوفر'), half('ليس دائماً')] },
    { id: 'notes', label: 'إشعارات الدائن والمدين', cells: [y('مرتبطة بالفاتورة الأصلية'), y('متوفرة'), n('مستند منفصل')] },
    { id: 'whatsapp', label: 'مشاركة PDF عبر واتساب', cells: [y('بلمسة واحدة'), half('PDF أو بريد؛ يختلف'), half('تنزيل فقط')] },
    { id: 'customers', label: 'حفظ العملاء وسجل الفواتير', cells: [y('مع حساب مجاني'), y('متوفر'), n('لا يُحفظ')] },
    { id: 'phase2', label: 'المرحلة الثانية من زاتكا (الربط)', cells: [half('مرحلة تجريبية خاصة'), y('في الخطط المدفوعة'), n('غير متوفر')] },
    { id: 'accounting', label: 'محاسبة كاملة (دفاتر، مخزون، رواتب)', cells: [n('فوترة فقط؛ تصدير لمحاسبك'), y('متوفرة بحسب الخطة'), n('غير متوفرة')] },
  ],
  footnote:
    'أسعار برامج المحاسبة هي الأسعار الشهرية للخطط الأولى المنشورة لدى مزودي برامج المحاسبة في السعودية، رُوجعت في نوفمبر ٢٠٢٦، وتختلف التجربة والمزايا بحسب المزود والخطة. ونقصد بمواقع القوالب المجانية قوالب الفواتير العامة على الإنترنت.',
  legend: { yes: 'نعم', no: 'لا', partial: 'جزئياً' },
}

export function getComparison(lang: MarketingLang): Comparison {
  return lang === 'ar' ? ar : en
}
