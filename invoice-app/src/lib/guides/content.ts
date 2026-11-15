import type { MarketingLang } from '#/lib/marketing/lang'
import { getWaveGuide } from '#/lib/sa/wave-guide-content'

/**
 * Saudi invoicing guides (/guides/*). Every tax statement here comes from
 * docs/REGULATORY_CLAIMS_2026-11-13.md (rows 11, 12, 17, 19–24) or the
 * Wave 25 guide; re-check them when ZATCA publishes a new guideline.
 */
export const GUIDES_DATE_PUBLISHED = '2026-11-15'
export const GUIDES_DATE_MODIFIED = '2026-11-15'

export const GUIDE_SLUGS = ['saudi-tax-invoice-requirements', 'tax-invoice-vs-simplified-invoice'] as const
export type GuideSlug = (typeof GUIDE_SLUGS)[number]

export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; caption: string; headers: string[]; rows: string[][] }

export type Guide = {
  slug: GuideSlug
  seo: { title: string; description: string }
  breadcrumb: string
  title: string
  intro: string
  sections: Array<{ id: string; heading: string; blocks: ContentBlock[] }>
  faq: Array<{ question: string; answer: string }>
  related: Array<{ label: string; href: string }>
  cta: { title: string; body: string; button: string }
}

const p = (text: string): ContentBlock => ({ type: 'p', text })
const ul = (...items: string[]): ContentBlock => ({ type: 'ul', items })
const table = (caption: string, headers: string[], rows: string[][]): ContentBlock => ({
  type: 'table',
  caption,
  headers,
  rows,
})

const PHASE2_EN =
  "Phase 2 support in Qaftr is in private beta. Qaftr already signs invoices, sends them to ZATCA for clearance or reporting and prints the Phase 2 QR code; we are testing it with a small group of businesses on ZATCA's simulation environment before opening it to everyone. Email support@qaftr.com to join the early-access list; until it opens, Qaftr issues Phase 1 invoices."
const PHASE2_AR =
  'دعم المرحلة الثانية في قافتر في مرحلة تجريبية خاصة. يوقّع قافتر الفواتير ويرسلها إلى زاتكا للاعتماد أو الإبلاغ ويطبع رمز QR للمرحلة الثانية، ونختبره حالياً مع عدد محدود من المنشآت على بيئة المحاكاة لدى زاتكا قبل إتاحته للجميع. راسلنا على support@qaftr.com للانضمام إلى قائمة الوصول المبكر، وحتى الإتاحة يُصدر قافتر فواتير وفق المرحلة الأولى.'

const guides: Record<GuideSlug, Record<MarketingLang, Guide>> = {
  'saudi-tax-invoice-requirements': {
    en: {
      slug: 'saudi-tax-invoice-requirements',
      seo: {
        title: 'Saudi Tax Invoice Requirements: Mandatory Fields | Qaftr',
        description:
          'What a Saudi VAT tax invoice must show: seller and buyer details, VAT numbers, 15% VAT, totals and the QR code, plus credit notes and record keeping.',
      },
      breadcrumb: 'Tax invoice requirements',
      title: 'Saudi tax invoice requirements: the fields every invoice must show',
      intro:
        'If your business is registered for VAT in Saudi Arabia, every sale you invoice must be documented with a tax invoice that carries specific fields. This guide lists what a standard tax invoice and a simplified tax invoice must show, the rules on language and currency, when the QR code is required, how to correct an invoice with a credit or debit note, and who must not issue a tax invoice at all. It follows ZATCA’s Guideline for Tax Invoicing and Records (May 2026).',
      sections: [
        {
          id: 'who',
          heading: 'Who issues a tax invoice',
          blocks: [
            p('Only a business registered for VAT may issue a tax invoice. Registration is mandatory when taxable supplies exceed SAR 375,000 in 12 months and voluntary above SAR 187,500.'),
            p('A business that is not registered must not issue a tax invoice, show a VAT amount on any document or collect VAT. ZATCA treats any document that shows a tax amount as a tax invoice, and the fine for doing so can reach SAR 100,000. A non-registered business issues a regular invoice without VAT or a QR code.'),
          ],
        },
        {
          id: 'standard-fields',
          heading: 'Fields on a standard tax invoice (B2B)',
          blocks: [
            p('A standard tax invoice is issued when you sell to another VAT-registered business. It must show:'),
            ul(
              'The words “Tax Invoice”, the date of issue and a sequential number that identifies the invoice.',
              'Your name, address and VAT registration number.',
              'The buyer’s name, address and VAT registration number.',
              'The date of supply, if it differs from the date of issue.',
              'A description of the goods or services, the quantity and the unit price excluding VAT.',
              'Any discount, the VAT rate (15% standard rate) and the taxable amount for each rate.',
              'The VAT amount in Saudi riyals and the total including VAT.',
              'Where VAT is not charged at the standard rate, a statement of the special treatment, such as an export or a deemed supply.',
            ),
          ],
        },
        {
          id: 'simplified-fields',
          heading: 'Fields on a simplified tax invoice (B2C)',
          blocks: [
            p('A simplified tax invoice is issued when you sell to consumers. It needs fewer fields:'),
            ul(
              'The words “Simplified Tax Invoice”, the date of issue and a sequential number.',
              'Your name, address and VAT registration number.',
              'A description of the goods or services.',
              'The total including VAT and the VAT amount, or a statement that the total includes VAT.',
              'The ZATCA QR code.',
            ),
            p('Buyer details are optional on a simplified tax invoice. The differences between the two types are set out in our guide to the standard and simplified tax invoice.'),
          ],
        },
        {
          id: 'language-currency',
          heading: 'Language, currency and the QR code',
          blocks: [
            ul(
              'Language: a tax invoice must be in Arabic. It may also show another language alongside the Arabic.',
              'Currency: the invoice may be priced in another currency, but the VAT amount must be shown in Saudi riyals.',
              'QR code (Phase 1): the five-field QR code — seller name, VAT number, timestamp, total including VAT and VAT amount — is required on simplified tax invoices, not on standard tax invoices.',
              'QR code (Phase 2): businesses in an integration wave print a QR code with cryptographic data. For standard invoices ZATCA generates it at clearance.',
            ),
          ],
        },
        {
          id: 'corrections',
          heading: 'Correcting an invoice: credit and debit notes',
          blocks: [
            p('An issued tax invoice is not edited or deleted. To change it, you issue a credit note (to reduce the amount) or a debit note (to increase it).'),
            ul(
              'A credit note may only be issued for an adjustment to a prior supply: a cancellation, a substantial change, a change in the agreed price (including a later discount), an accepted return, or an error in the supplier or customer details.',
              'The note must state its type and the serial number of the tax invoice it amends.',
              'It must be issued no later than the 15th day of the month after the event.',
            ),
          ],
        },
        {
          id: 'checklist',
          heading: 'Checklist before you send an invoice',
          blocks: [
            table(
              'Quick check of a Saudi tax invoice',
              ['Check', 'Standard (B2B)', 'Simplified (B2C)'],
              [
                ['Title on the invoice', 'Tax Invoice', 'Simplified Tax Invoice'],
                ['Your VAT number', 'Required', 'Required'],
                ['Buyer VAT number', 'Required', 'Optional'],
                ['VAT amount in SAR', 'Required', 'Required'],
                ['Phase 1 QR code', 'Not required', 'Required'],
                ['Arabic text', 'Required', 'Required'],
              ],
            ),
          ],
        },
      ],
      faq: [
        {
          question: 'Can I issue a tax invoice in English only?',
          answer: 'No. A Saudi tax invoice must be in Arabic. You can show English alongside the Arabic, which is what bilingual invoices do.',
        },
        {
          question: 'Does a standard tax invoice need a QR code?',
          answer: 'In Phase 1 the QR code is required on simplified tax invoices, not on standard tax invoices. In Phase 2, ZATCA generates the QR code for standard invoices when it clears them.',
        },
        {
          question: 'Can I edit an invoice after I send it?',
          answer: 'No. Issue a credit note or a debit note that refers to the original invoice number, no later than the 15th day of the month after the change.',
        },
        {
          question: 'Does Qaftr fill in these fields for me?',
          answer: 'Yes. Qaftr asks for your business and buyer details, calculates 15% VAT, numbers invoices in sequence, prints the invoice in Arabic and adds the Phase 1 QR code.',
        },
      ],
      related: [
        { label: 'Standard vs simplified tax invoice', href: '/guides/tax-invoice-vs-simplified-invoice' },
        { label: 'Free tax invoice tool', href: '/tools/fatora' },
        { label: 'Credit note tool', href: '/tools/credit-note' },
        { label: 'VAT number checker', href: '/tools/trn-checker' },
      ],
      cta: {
        title: 'Issue a tax invoice with every field filled in',
        body: 'Qaftr adds the VAT number, 15% VAT, the totals and the QR code for you. Your first invoice is free, no sign-up.',
        button: 'Create your first invoice free',
      },
    },
    ar: {
      slug: 'saudi-tax-invoice-requirements',
      seo: {
        title: 'متطلبات الفاتورة الضريبية: الحقول الإلزامية | قافتر',
        description:
          'ما الذي يجب أن تتضمنه الفاتورة الضريبية في السعودية: بيانات البائع والمشتري، والأرقام الضريبية، وضريبة ١٥٪، والإجماليات، ورمز QR، وإشعارات الدائن والمدين.',
      },
      breadcrumb: 'متطلبات الفاتورة الضريبية',
      title: 'متطلبات الفاتورة الضريبية في السعودية: الحقول التي يجب أن تظهر في كل فاتورة',
      intro:
        'إذا كانت منشأتك مسجلة في ضريبة القيمة المضافة في السعودية، فيجب توثيق كل عملية بيع بفاتورة ضريبية تتضمن حقولاً محددة. يوضح هذا الدليل ما يجب أن تتضمنه الفاتورة الضريبية والفاتورة الضريبية المبسطة، وقواعد اللغة والعملة، ومتى يلزم رمز QR، وكيف تصحّح فاتورة بإشعار دائن أو مدين، ومن لا يحق له إصدار فاتورة ضريبية أصلاً. ويستند إلى الدليل الإرشادي للفواتير الضريبية والسجلات الصادر عن زاتكا (مايو ٢٠٢٦).',
      sections: [
        {
          id: 'who',
          heading: 'من يُصدر الفاتورة الضريبية؟',
          blocks: [
            p('لا يُصدر الفاتورة الضريبية إلا المسجّل في ضريبة القيمة المضافة. والتسجيل إلزامي إذا تجاوزت التوريدات الخاضعة للضريبة ٣٧٥٬٠٠٠ ريال خلال ١٢ شهراً، واختياري إذا تجاوزت ١٨٧٬٥٠٠ ريال.'),
            p('لا يجوز لغير المسجّل إصدار فاتورة ضريبية أو إظهار مبلغ ضريبة في أي مستند أو تحصيل الضريبة؛ إذ تعامل زاتكا أي مستند يُظهر مبلغ الضريبة معاملة الفاتورة الضريبية، وقد تصل الغرامة إلى ١٠٠٬٠٠٠ ريال. ويُصدر غير المسجّل فاتورة عادية بلا ضريبة ولا رمز QR.'),
          ],
        },
        {
          id: 'standard-fields',
          heading: 'حقول الفاتورة الضريبية (للشركات)',
          blocks: [
            p('تُصدر الفاتورة الضريبية عند البيع لمنشأة أخرى مسجلة في الضريبة، ويجب أن تتضمن:'),
            ul(
              'عبارة «فاتورة ضريبية»، وتاريخ الإصدار، ورقماً تسلسلياً يميّز الفاتورة.',
              'اسمك وعنوانك ورقم تسجيلك الضريبي.',
              'اسم المشتري وعنوانه ورقم تسجيله الضريبي.',
              'تاريخ التوريد إذا اختلف عن تاريخ الإصدار.',
              'وصف السلع أو الخدمات، والكمية، وسعر الوحدة غير شامل الضريبة.',
              'أي خصم، ونسبة الضريبة (النسبة الأساسية ١٥٪)، والمبلغ الخاضع للضريبة لكل نسبة.',
              'مبلغ الضريبة بالريال السعودي، والإجمالي شامل الضريبة.',
              'إذا لم تُطبق النسبة الأساسية، عبارة توضح المعاملة الخاصة، مثل التصدير أو التوريد الحكمي.',
            ),
          ],
        },
        {
          id: 'simplified-fields',
          heading: 'حقول الفاتورة الضريبية المبسطة (للأفراد)',
          blocks: [
            p('تُصدر الفاتورة الضريبية المبسطة عند البيع للمستهلكين، وحقولها أقل:'),
            ul(
              'عبارة «فاتورة ضريبية مبسطة»، وتاريخ الإصدار، ورقم تسلسلي.',
              'اسمك وعنوانك ورقم تسجيلك الضريبي.',
              'وصف السلع أو الخدمات.',
              'الإجمالي شامل الضريبة ومبلغ الضريبة، أو عبارة تفيد بأن الإجمالي يشمل الضريبة.',
              'رمز QR وفق متطلبات زاتكا.',
            ),
            p('بيانات المشتري اختيارية في الفاتورة المبسطة. وتجد الفروق بين النوعين في دليلنا عن الفرق بين الفاتورة الضريبية والمبسطة.'),
          ],
        },
        {
          id: 'language-currency',
          heading: 'اللغة والعملة ورمز QR',
          blocks: [
            ul(
              'اللغة: يجب أن تكون الفاتورة الضريبية باللغة العربية، ويجوز أن تظهر لغة أخرى بجانب العربية.',
              'العملة: يجوز تسعير الفاتورة بعملة أخرى، لكن يجب إظهار مبلغ الضريبة بالريال السعودي.',
              'رمز QR (المرحلة الأولى): الرمز ذو الحقول الخمسة — اسم البائع، والرقم الضريبي، والوقت، والإجمالي شامل الضريبة، ومبلغ الضريبة — مطلوب في الفاتورة المبسطة، وليس في الفاتورة الضريبية.',
              'رمز QR (المرحلة الثانية): تطبع المنشآت المشمولة بموجات الربط رمزاً يتضمن بيانات تشفير، وفي الفاتورة الضريبية تُنشئه زاتكا عند الاعتماد.',
            ),
          ],
        },
        {
          id: 'corrections',
          heading: 'تصحيح الفاتورة: إشعار الدائن والمدين',
          blocks: [
            p('لا تُعدَّل الفاتورة الضريبية بعد إصدارها ولا تُحذف، بل تُصدر إشعاراً دائناً لتخفيض المبلغ أو إشعاراً مديناً لزيادته.'),
            ul(
              'لا يُصدر الإشعار الدائن إلا لتعديل توريد سابق: إلغاء أو تغيير جوهري، أو تغيير السعر المتفق عليه (ومنه الخصم اللاحق)، أو مرتجع مقبول، أو خطأ في بيانات المورد أو العميل.',
              'يجب أن يذكر الإشعار نوعه والرقم التسلسلي للفاتورة الضريبية التي يعدّلها.',
              'يُصدر في موعد أقصاه اليوم ١٥ من الشهر التالي للحدث.',
            ),
          ],
        },
        {
          id: 'checklist',
          heading: 'قائمة تحقق قبل إرسال الفاتورة',
          blocks: [
            table(
              'تحقق سريع من الفاتورة الضريبية في السعودية',
              ['البند', 'فاتورة ضريبية (للشركات)', 'فاتورة مبسطة (للأفراد)'],
              [
                ['العنوان في الفاتورة', 'فاتورة ضريبية', 'فاتورة ضريبية مبسطة'],
                ['رقمك الضريبي', 'مطلوب', 'مطلوب'],
                ['الرقم الضريبي للمشتري', 'مطلوب', 'اختياري'],
                ['مبلغ الضريبة بالريال', 'مطلوب', 'مطلوب'],
                ['رمز QR للمرحلة الأولى', 'غير مطلوب', 'مطلوب'],
                ['النص العربي', 'مطلوب', 'مطلوب'],
              ],
            ),
          ],
        },
      ],
      faq: [
        {
          question: 'هل يمكن إصدار فاتورة ضريبية بالإنجليزية فقط؟',
          answer: 'لا. يجب أن تكون الفاتورة الضريبية في السعودية باللغة العربية، ويمكن إظهار الإنجليزية بجانبها كما في الفواتير ثنائية اللغة.',
        },
        {
          question: 'هل تحتاج الفاتورة الضريبية (للشركات) إلى رمز QR؟',
          answer: 'في المرحلة الأولى يلزم رمز QR في الفاتورة المبسطة وليس في الفاتورة الضريبية. وفي المرحلة الثانية تُنشئ زاتكا رمز الفاتورة الضريبية عند اعتمادها.',
        },
        {
          question: 'هل يمكن تعديل الفاتورة بعد إرسالها؟',
          answer: 'لا. أصدر إشعاراً دائناً أو مديناً يذكر رقم الفاتورة الأصلية، في موعد أقصاه اليوم ١٥ من الشهر التالي للتغيير.',
        },
        {
          question: 'هل يملأ قافتر هذه الحقول عني؟',
          answer: 'نعم. يطلب قافتر بيانات منشأتك والمشتري، ويحسب ضريبة ١٥٪، ويرقّم الفواتير تسلسلياً، ويطبع الفاتورة بالعربية، ويضيف رمز QR للمرحلة الأولى.',
        },
      ],
      related: [
        { label: 'الفرق بين الفاتورة الضريبية والمبسطة', href: '/guides/tax-invoice-vs-simplified-invoice' },
        { label: 'أداة الفاتورة الضريبية المجانية', href: '/tools/fatora' },
        { label: 'أداة الإشعار الدائن', href: '/tools/credit-note' },
        { label: 'التحقق من الرقم الضريبي', href: '/tools/trn-checker' },
      ],
      cta: {
        title: 'أصدر فاتورة ضريبية بكل حقولها',
        body: 'يضيف قافتر الرقم الضريبي وضريبة ١٥٪ والإجماليات ورمز QR تلقائياً. فاتورتك الأولى مجاناً وبدون تسجيل.',
        button: 'أصدر فاتورتك الأولى مجاناً',
      },
    },
  },
  'tax-invoice-vs-simplified-invoice': {
    en: {
      slug: 'tax-invoice-vs-simplified-invoice',
      seo: {
        title: 'Tax Invoice vs Simplified Tax Invoice (Saudi) | Qaftr',
        description:
          'Standard (B2B) vs simplified (B2C) tax invoices in Saudi Arabia: required fields, the QR code, and Phase 2 clearance vs reporting within 24 hours.',
      },
      breadcrumb: 'Standard vs simplified invoice',
      title: 'Tax invoice vs simplified tax invoice: which one to issue and how Phase 2 treats each',
      intro:
        'Saudi VAT rules have two kinds of tax invoice. The standard tax invoice is for sales to other businesses; the simplified tax invoice is for sales to consumers. They differ in the fields they show, in when a QR code is needed and, in Phase 2, in how they reach ZATCA: standard invoices are cleared before you send them, simplified invoices are reported after. This guide explains each difference and how to choose.',
      sections: [
        {
          id: 'buyer',
          heading: 'Who the invoice is for',
          blocks: [
            p('Issue a standard tax invoice when you sell to a business, typically one registered for VAT that will reclaim the VAT you charge. Issue a simplified tax invoice when you sell to an individual consumer.'),
            p('If you sell to both, you will issue both types. In Qaftr you choose standard or simplified at the top of the invoice form, and the buyer fields follow.'),
          ],
        },
        {
          id: 'comparison',
          heading: 'Side by side',
          blocks: [
            table(
              'Standard and simplified tax invoices in Saudi Arabia',
              ['', 'Standard tax invoice', 'Simplified tax invoice'],
              [
                ['Typical buyer', 'Business (B2B)', 'Consumer (B2C)'],
                ['Buyer name and VAT number', 'Required', 'Optional'],
                ['Phase 1 QR code', 'Not required', 'Required'],
                ['Phase 2 path to ZATCA', 'Clearance before sharing', 'Reporting within 24 hours'],
                ['Phase 2 QR code', 'Generated by ZATCA at clearance', 'Generated by your solution'],
                ['Cryptographic stamp', 'Added by ZATCA at clearance', 'Your solution’s stamp'],
              ],
            ),
          ],
        },
        {
          id: 'fields',
          heading: 'What each invoice must show',
          blocks: [
            p('Both types show the date of issue, a sequential number, your name, address and VAT number, the goods or services, the VAT amount and the total including VAT, in Arabic.'),
            p('The standard tax invoice adds the buyer’s name, address and VAT number, the unit price, the VAT rate and the taxable amount for each line. The full list is in our guide to Saudi tax invoice requirements.'),
          ],
        },
        {
          id: 'qr',
          heading: 'The QR code',
          blocks: [
            p('In Phase 1 the QR code is required on simplified tax invoices and not on standard tax invoices. It encodes five fields: seller name, VAT number, timestamp, total including VAT and VAT amount.'),
            p('In Phase 2 simplified invoices carry a nine-field QR code produced by your e-invoicing solution, which adds the invoice hash, the signature and the public key. For standard invoices ZATCA generates the QR code when it clears the invoice.'),
          ],
        },
        {
          id: 'phase2',
          heading: 'Phase 2: clearance vs reporting',
          blocks: [
            ul(
              'Clearance (standard invoices): your solution sends the invoice to ZATCA’s FATOORA platform first. ZATCA validates it, adds its cryptographic stamp and the QR code, and returns the cleared invoice. Only the cleared invoice is shared with the buyer.',
              'Reporting (simplified invoices): you give the invoice to the customer straight away, signed with your solution’s cryptographic stamp, and your solution reports it to ZATCA within 24 hours.',
            ),
            p('Clearance does not apply to simplified invoices. Credit and debit notes follow the path of the invoice they amend: a note on a standard invoice is cleared, a note on a simplified invoice is reported.'),
          ],
        },
        {
          id: 'choose',
          heading: 'Which one should you issue?',
          blocks: [
            ul(
              'Selling to a company that gave you its VAT number: standard tax invoice.',
              'Selling to a walk-in customer or an individual online: simplified tax invoice.',
              'Not registered for VAT: neither. Issue a regular invoice without VAT or a QR code.',
            ),
          ],
        },
      ],
      faq: [
        {
          question: 'Can I issue a simplified invoice to a business?',
          answer: 'A business buyer that wants to reclaim VAT needs a standard tax invoice with its name and VAT number. Use the simplified tax invoice for consumers.',
        },
        {
          question: 'How long do I have to report a simplified invoice in Phase 2?',
          answer: 'Your e-invoicing solution must report a simplified tax invoice to ZATCA within 24 hours of issuing it. Standard tax invoices are cleared before you share them.',
        },
        {
          question: 'Does a standard tax invoice need a QR code in Phase 1?',
          answer: 'No. In Phase 1 the QR code is required on simplified tax invoices. In Phase 2, ZATCA adds the QR code to standard invoices at clearance.',
        },
        {
          question: 'Does Qaftr support Phase 2 clearance and reporting?',
          answer: PHASE2_EN,
        },
      ],
      related: [
        { label: 'Saudi tax invoice requirements', href: '/guides/saudi-tax-invoice-requirements' },
        { label: 'ZATCA Wave 25 guide', href: '/guides/zatca-wave-25' },
        { label: 'ZATCA QR code checker', href: '/tools/zatca-qr' },
        { label: 'E-invoicing in Saudi Arabia', href: '/e-invoicing-saudi-arabia' },
      ],
      cta: {
        title: 'Issue standard and simplified tax invoices',
        body: 'Choose standard or simplified in Qaftr, and it calculates 15% VAT and adds the QR code. Your first invoice is free.',
        button: 'Create your first invoice free',
      },
    },
    ar: {
      slug: 'tax-invoice-vs-simplified-invoice',
      seo: {
        title: 'الفرق بين الفاتورة الضريبية والفاتورة المبسطة | قافتر',
        description:
          'الفاتورة الضريبية (للشركات) والمبسطة (للأفراد) في السعودية: الحقول المطلوبة، ورمز QR، والاعتماد والإبلاغ خلال ٢٤ ساعة في المرحلة الثانية.',
      },
      breadcrumb: 'الفاتورة الضريبية والمبسطة',
      title: 'الفرق بين الفاتورة الضريبية والفاتورة الضريبية المبسطة: أيهما تُصدر وكيف تعاملهما المرحلة الثانية',
      intro:
        'في نظام ضريبة القيمة المضافة السعودي نوعان من الفواتير الضريبية: الفاتورة الضريبية للبيع للشركات، والفاتورة الضريبية المبسطة للبيع للمستهلكين. ويختلفان في الحقول، وفي متى يلزم رمز QR، وفي المرحلة الثانية في طريقة وصولهما إلى زاتكا: تُعتمد الفاتورة الضريبية قبل إرسالها، ويُبلَّغ عن المبسطة بعد إصدارها. يشرح هذا الدليل كل فرق وكيف تختار.',
      sections: [
        {
          id: 'buyer',
          heading: 'لمن تُصدر الفاتورة؟',
          blocks: [
            p('أصدر فاتورة ضريبية عند البيع لمنشأة، وغالباً تكون مسجلة في الضريبة وتستردّ الضريبة التي تحتسبها عليها. وأصدر فاتورة ضريبية مبسطة عند البيع لمستهلك فرد.'),
            p('إذا كنت تبيع للفئتين فستُصدر النوعين. وفي قافتر تختار الفاتورة الضريبية أو المبسطة أعلى نموذج الفاتورة، وتظهر حقول المشتري بحسب اختيارك.'),
          ],
        },
        {
          id: 'comparison',
          heading: 'مقارنة مباشرة',
          blocks: [
            table(
              'الفاتورة الضريبية والفاتورة الضريبية المبسطة في السعودية',
              ['', 'فاتورة ضريبية', 'فاتورة ضريبية مبسطة'],
              [
                ['المشتري المعتاد', 'منشأة (للشركات)', 'مستهلك (للأفراد)'],
                ['اسم المشتري ورقمه الضريبي', 'مطلوب', 'اختياري'],
                ['رمز QR للمرحلة الأولى', 'غير مطلوب', 'مطلوب'],
                ['المسار إلى زاتكا في المرحلة الثانية', 'الاعتماد قبل المشاركة', 'الإبلاغ خلال ٢٤ ساعة'],
                ['رمز QR للمرحلة الثانية', 'تُنشئه زاتكا عند الاعتماد', 'يُنشئه نظامك'],
                ['الختم التشفيري', 'تضيفه زاتكا عند الاعتماد', 'ختم نظامك'],
              ],
            ),
          ],
        },
        {
          id: 'fields',
          heading: 'ما الذي يجب أن تتضمنه كل فاتورة؟',
          blocks: [
            p('يتضمن النوعان تاريخ الإصدار، ورقماً تسلسلياً، واسمك وعنوانك ورقمك الضريبي، والسلع أو الخدمات، ومبلغ الضريبة، والإجمالي شامل الضريبة، باللغة العربية.'),
            p('وتضيف الفاتورة الضريبية اسم المشتري وعنوانه ورقمه الضريبي، وسعر الوحدة، ونسبة الضريبة، والمبلغ الخاضع للضريبة لكل بند. والقائمة الكاملة في دليلنا عن متطلبات الفاتورة الضريبية.'),
          ],
        },
        {
          id: 'qr',
          heading: 'رمز QR',
          blocks: [
            p('في المرحلة الأولى يلزم رمز QR في الفاتورة المبسطة ولا يلزم في الفاتورة الضريبية، ويتضمن خمسة حقول: اسم البائع، والرقم الضريبي، والوقت، والإجمالي شامل الضريبة، ومبلغ الضريبة.'),
            p('وفي المرحلة الثانية تحمل الفاتورة المبسطة رمزاً من تسعة حقول يُنشئه نظام الفوترة، ويضيف بصمة الفاتورة والتوقيع والمفتاح العام. أما الفاتورة الضريبية فتُنشئ زاتكا رمزها عند اعتمادها.'),
          ],
        },
        {
          id: 'phase2',
          heading: 'المرحلة الثانية: الاعتماد والإبلاغ',
          blocks: [
            ul(
              'الاعتماد (الفاتورة الضريبية): يرسل نظامك الفاتورة أولاً إلى منصة فاتورة، فتتحقق منها زاتكا وتضيف ختمها التشفيري ورمز QR وتعيدها معتمدة، ولا تُشارك مع المشتري إلا بعد اعتمادها.',
              'الإبلاغ (الفاتورة المبسطة): تسلّم الفاتورة للعميل فوراً موقّعة بالختم التشفيري لنظامك، ويُبلّغ نظامك زاتكا عنها خلال ٢٤ ساعة.',
            ),
            p('لا ينطبق الاعتماد على الفاتورة المبسطة. وتتبع إشعارات الدائن والمدين مسار الفاتورة التي تعدّلها: إشعار الفاتورة الضريبية يُعتمد، وإشعار الفاتورة المبسطة يُبلَّغ عنه.'),
          ],
        },
        {
          id: 'choose',
          heading: 'أيهما تُصدر؟',
          blocks: [
            ul(
              'البيع لشركة أعطتك رقمها الضريبي: فاتورة ضريبية.',
              'البيع لعميل في المتجر أو لفرد عبر الإنترنت: فاتورة ضريبية مبسطة.',
              'غير مسجّل في الضريبة: لا هذه ولا تلك، بل فاتورة عادية بلا ضريبة ولا رمز QR.',
            ),
          ],
        },
      ],
      faq: [
        {
          question: 'هل يمكن إصدار فاتورة مبسطة لمنشأة؟',
          answer: 'المنشأة التي تريد استرداد الضريبة تحتاج إلى فاتورة ضريبية باسمها ورقمها الضريبي. استخدم الفاتورة المبسطة للمستهلكين.',
        },
        {
          question: 'ما مهلة الإبلاغ عن الفاتورة المبسطة في المرحلة الثانية؟',
          answer: 'يجب أن يُبلّغ نظام الفوترة زاتكا عن الفاتورة المبسطة خلال ٢٤ ساعة من إصدارها، أما الفاتورة الضريبية فتُعتمد قبل مشاركتها.',
        },
        {
          question: 'هل تحتاج الفاتورة الضريبية إلى رمز QR في المرحلة الأولى؟',
          answer: 'لا. في المرحلة الأولى يلزم رمز QR في الفاتورة المبسطة، وفي المرحلة الثانية تضيف زاتكا الرمز إلى الفاتورة الضريبية عند اعتمادها.',
        },
        {
          question: 'هل يدعم قافتر الاعتماد والإبلاغ في المرحلة الثانية؟',
          answer: PHASE2_AR,
        },
      ],
      related: [
        { label: 'متطلبات الفاتورة الضريبية', href: '/guides/saudi-tax-invoice-requirements' },
        { label: 'دليل الموجة ٢٥', href: '/guides/zatca-wave-25' },
        { label: 'فاحص رمز QR', href: '/tools/zatca-qr' },
        { label: 'الفوترة الإلكترونية في السعودية', href: '/e-invoicing-saudi-arabia' },
      ],
      cta: {
        title: 'أصدر الفاتورة الضريبية والمبسطة',
        body: 'اختر الفاتورة الضريبية أو المبسطة في قافتر، وهو يحسب ضريبة ١٥٪ ويضيف رمز QR. فاتورتك الأولى مجاناً.',
        button: 'أصدر فاتورتك الأولى مجاناً',
      },
    },
  },
}

export function getGuide(slug: GuideSlug, lang: MarketingLang): Guide {
  return guides[slug][lang]
}

export type GuideListItem = { href: string; title: string; description: string }

/** Everything shown on the /guides hub, the Wave 25 pillar guide first. */
export function getGuideList(lang: MarketingLang): GuideListItem[] {
  const wave = getWaveGuide(lang)
  return [
    { href: '/guides/zatca-wave-25', title: wave.title, description: wave.seo.description },
    ...GUIDE_SLUGS.map((slug) => {
      const g = guides[slug][lang]
      return { href: `/guides/${slug}`, title: g.title, description: g.seo.description }
    }),
  ]
}

export function getGuidesHub(lang: MarketingLang) {
  return lang === 'ar'
    ? {
        seo: {
          title: 'أدلة الفوترة الإلكترونية في السعودية | قافتر',
          description:
            'أدلة عملية للمنشآت في السعودية: متطلبات الفاتورة الضريبية، والفرق بين الفاتورة الضريبية والمبسطة، والموجة ٢٥ من المرحلة الثانية لدى زاتكا.',
        },
        breadcrumb: 'الأدلة',
        title: 'أدلة الفوترة الإلكترونية في السعودية',
        intro:
          'شروحات مختصرة لما تطلبه زاتكا في الفاتورة الضريبية والفوترة الإلكترونية، مكتوبة للمنشآت الصغيرة والمتوسطة التي تبيع للشركات والأفراد.',
        readMore: 'اقرأ الدليل',
        toolsTitle: 'أدوات مجانية',
        toolsBody: 'تحقق من موجتك، أو من رمز QR، أو أصدر فاتورة ضريبية الآن.',
        toolsCta: 'كل الأدوات',
        tocTitle: 'المحتويات',
        updatedLabel: 'آخر تحديث',
        faqTitle: 'أسئلة شائعة',
        relatedTitle: 'روابط ذات صلة',
        verifyNote:
          'إرشادات عامة وليست استشارة ضريبية، مبنية على الدليل الإرشادي للفواتير الضريبية والسجلات والدليل التفصيلي للفوترة الإلكترونية الصادرين عن زاتكا. قافتر جهة مستقلة غير تابعة لزاتكا؛ راجع زاتكا أو محاسبك قبل الاعتماد عليها.',
      }
    : {
        seo: {
          title: 'Saudi E-Invoicing Guides for Businesses | Qaftr',
          description:
            'Practical guides for Saudi businesses: tax invoice requirements, standard vs simplified tax invoices and ZATCA Phase 2 Wave 25.',
        },
        breadcrumb: 'Guides',
        title: 'Saudi e-invoicing guides',
        intro:
          'Short explanations of what ZATCA requires on tax invoices and e-invoicing, written for small and medium businesses that sell to companies and consumers.',
        readMore: 'Read the guide',
        toolsTitle: 'Free tools',
        toolsBody: 'Check your wave or a QR code, or issue a tax invoice now.',
        toolsCta: 'All tools',
        tocTitle: 'Contents',
        updatedLabel: 'Last updated',
        faqTitle: 'Frequently asked questions',
        relatedTitle: 'Related pages',
        verifyNote:
          "General guidance, not tax advice, based on ZATCA's Guideline for Tax Invoicing and Records and its Detailed Guidelines for E-Invoicing. Qaftr is independent and not affiliated with ZATCA; check with ZATCA or your accountant before relying on it.",
      }
}
