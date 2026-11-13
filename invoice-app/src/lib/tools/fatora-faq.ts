import type { MarketingLang } from '#/lib/marketing/lang'

/** FAQ for /tools/fatora (kept out of the route file so head and component share one module).
 * The freelancer question is deliberate: it catches freelancer searches (traffic channel). */
const faqAr = [
  {
    question: 'هل يكفي قافتر للامتثال لمتطلبات زاتكا؟',
    answer:
      'يُصدر قافتر فواتير وفق المرحلة الأولى (مرحلة الإصدار والحفظ) مع رمز QR للفاتورة الضريبية. إذا أبلغتك زاتكا بموعد ربطك في المرحلة الثانية (مرحلة الربط والتكامل) — والموجة ٢٥ تشمل من تجاوزت إيراداته الخاضعة للضريبة ١٨٧٬٥٠٠ ريال، وموعدها ١ فبراير ٢٠٢٧ — فستحتاج حلاً مربوطاً ببوابة فاتورة. قافتر ليس تطبيقاً رسمياً تابعاً لزاتكا.',
  },
  {
    question: 'هل أحتاج حساباً لإصدار فاتورة؟',
    answer:
      'لا. يمكنك إصدار فاتورة ضريبية مبسطة وتنزيلها بصيغة PDF مجاناً دون تسجيل. الحساب مطلوب فقط لحفظ الفواتير والعملاء وإدارتها.',
  },
  {
    question: 'هل يناسب قافتر المنشآت التي تبيع للشركات والأفراد؟',
    answer:
      'نعم. قافتر مصمم للمنشآت الصغيرة والمتوسطة في السعودية: المتاجر وشركات الخدمات والمؤسسات التي تصدر فواتير لعملائها من الشركات والأفراد.',
  },
  {
    question: 'هل يوجد برنامج فواتير مجاني للمستقلين؟',
    answer:
      'نعم. يمكن لأصحاب العمل الحر أيضاً إصدار فاتورة ضريبية مبسطة مجاناً مع رمز QR وملف PDF عبر قافتر، إذا كانوا مسجّلين في ضريبة القيمة المضافة.',
  },
]

const waveFaqAr = {
  question: 'هل منشأتي ضمن الموجة ٢٥؟',
  answer:
    'إذا كانت منشأتك مسجّلة في ضريبة القيمة المضافة وتجاوزت إيراداتها الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في سنة مرجعية، فالأرجح أنها ضمن الموجة ٢٥، وموعد الربط ١ فبراير ٢٠٢٧ (حسب ما أعلنته زاتكا، فتحقّق من إشعارها).',
  link: { label: 'اقرأ دليل الموجة ٢٥', href: '/guides/zatca-wave-25' },
}

const waveFaqEn = {
  question: 'Is my business in Wave 25?',
  answer:
    'If you are VAT-registered and your VAT-subject revenue was above SAR 187,500 in a reference year, you are likely in Wave 25 with an integration deadline of 1 February 2027 (as announced by ZATCA — verify with ZATCA).',
  link: { label: 'Read the Wave 25 guide', href: '/guides/zatca-wave-25?lang=en' },
}

const faqEn = [
  {
    question: 'Is Qaftr enough for ZATCA compliance?',
    answer:
      'Qaftr issues Phase 1 (Generation) invoices with the tax invoice QR code. If ZATCA has notified you of a Phase 2 (Integration) date — Wave 25 covers VAT-subject revenue above SAR 187,500, due 1 February 2027 — you need a solution integrated with the FATOORA portal. Qaftr is not an official ZATCA application.',
  },
  {
    question: 'Do I need an account to create an invoice?',
    answer:
      'No. You can issue a simplified tax invoice and download the PDF free without signing up. An account is only needed to save and manage invoices and customers.',
  },
  {
    question: 'Is Qaftr for businesses that sell to companies and consumers?',
    answer:
      'Yes. Qaftr is built for Saudi SMEs: shops, service companies and establishments that invoice both business and consumer customers.',
  },
  {
    question: 'Is there a free invoicing tool for freelancers?',
    answer:
      'Yes. VAT-registered freelancers can also issue a free simplified tax invoice with a QR code and PDF in Qaftr.',
  },
]

export function getFatoraFaq(lang: MarketingLang) {
  return lang === 'en' ? [...faqEn, waveFaqEn] : [...faqAr, waveFaqAr]
}
