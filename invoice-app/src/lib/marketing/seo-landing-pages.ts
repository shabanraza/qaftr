import type { MarketingLang } from './lang'
import { expandedLandingPages } from './expanded-landing-pages'

export type SeoLandingSlug =
  | 'invoicing-software-saudi-arabia'
  | 'e-invoicing-software-comparison-saudi-arabia'
  | 'zatca-invoice-generator'
  | 'e-invoicing-saudi-arabia'
  | 'small-business-invoicing-saudi-arabia'

export type SeoLandingPage = {
  slug: SeoLandingSlug
  /** Renders the Qaftr vs alternatives table (lib/marketing/comparison.ts). */
  comparison?: boolean
  title: string
  description: string
  eyebrow: string
  heading: string
  intro: string
  cta: string
  sections: Array<{ heading: string; body: string }>
  faq: Array<{ question: string; answer: string }>
  related: Array<{ label: string; href: string }>
}

const pages: Record<SeoLandingSlug, Record<MarketingLang, SeoLandingPage>> = {
  ...expandedLandingPages,
  'e-invoicing-software-comparison-saudi-arabia': {
    en: {
      slug: 'e-invoicing-software-comparison-saudi-arabia',
      comparison: true,
      title: 'E-Invoicing Software in Saudi Arabia Compared (2026) | Qaftr',
      description:
        'Compare e-invoicing options for Saudi SMEs: a light invoicing tool, accounting suites and free templates. Prices, Phase 1 QR, Phase 2 and Arabic support.',
      eyebrow: 'E-invoicing software comparison',
      heading: 'E-invoicing software in Saudi Arabia: how the options compare',
      intro:
        'Saudi SMEs usually choose between three kinds of tool: a full accounting suite, a free invoice template, or a light invoicing tool like Qaftr. The table below compares them on price, ZATCA requirements and day-to-day use, so you can pick what fits your business.',
      cta: 'Try Qaftr free',
      sections: [
        {
          heading: 'Choose a full accounting suite if…',
          body: 'you need ledgers, inventory, payroll or several users with approvals, and you are already in a ZATCA Phase 2 wave. Expect a monthly subscription on entry plans and a setup period.',
        },
        {
          heading: 'Choose a free template if…',
          body: 'you are not registered for VAT and send a few invoices a year. Remember that a VAT-registered business must issue tax invoices with the required fields and, for simplified invoices, the QR code.',
        },
        {
          heading: 'Choose Qaftr if…',
          body: 'you are VAT-registered, sell to companies and consumers, and want Phase 1 tax invoices, credit notes and saved customers without paying for an accounting suite.',
        },
        {
          heading: 'Questions to ask any provider',
          body: 'Can I try it without a card? Does it issue standard and simplified tax invoices? How does it handle credit notes? When will it support Phase 2 for my wave, and how do I export my data?',
        },
      ],
      faq: [
        {
          question: 'How much does e-invoicing software cost in Saudi Arabia?',
          answer:
            'Entry plans of full accounting suites published by Saudi vendors cost about SAR 99–199 a month (checked November 2026). Qaftr has a free plan and costs SAR 39 a month for Pro. Free templates cost nothing but do not calculate VAT or keep records.',
        },
        {
          question: 'Does Qaftr support ZATCA Phase 2?',
          answer:
            "Phase 2 support is in private beta. Qaftr already signs invoices, sends them to ZATCA for clearance or reporting and prints the Phase 2 QR code; we are testing it with a small group of businesses on ZATCA's simulation environment before opening it to everyone. If you are in Wave 25, email support@qaftr.com to join the early-access list; until it opens, Qaftr issues Phase 1 invoices. Confirm your plan with your accountant.",
        },
        {
          question: 'Can I switch later?',
          answer: 'Yes. Your invoices stay available as PDFs, and the CSV export gives your accountant or your next system the totals.',
        },
      ],
      related: [
        { label: 'Invoicing software for Saudi SMEs', href: '/invoicing-software-saudi-arabia' },
        { label: 'Standard vs simplified tax invoice', href: '/guides/tax-invoice-vs-simplified-invoice' },
        { label: 'Is your business in Wave 25?', href: '/tools/zatca-wave-checker' },
        { label: 'E-invoicing in Saudi Arabia', href: '/e-invoicing-saudi-arabia' },
      ],
    },
    ar: {
      slug: 'e-invoicing-software-comparison-saudi-arabia',
      comparison: true,
      title: 'مقارنة برامج الفوترة الإلكترونية في السعودية ٢٠٢٦ | قافتر',
      description:
        'قارن خيارات الفوترة الإلكترونية للمنشآت: أداة فوترة خفيفة، أو برنامج محاسبة متكامل، أو قوالب مجانية. الأسعار، ورمز QR، والمرحلة الثانية، والدعم العربي.',
      eyebrow: 'مقارنة برامج الفوترة الإلكترونية',
      heading: 'مقارنة برامج الفوترة الإلكترونية في السعودية',
      intro:
        'تختار المنشآت الصغيرة والمتوسطة في السعودية عادةً بين ثلاثة أنواع: برنامج محاسبة متكامل، أو قالب فاتورة مجاني، أو أداة فوترة خفيفة مثل قافتر. يقارن الجدول أدناه بينها في السعر ومتطلبات زاتكا والاستخدام اليومي، لتختار ما يناسب منشأتك.',
      cta: 'جرّب قافتر مجاناً',
      sections: [
        {
          heading: 'اختر برنامج محاسبة متكاملاً إذا…',
          body: 'كنت تحتاج دفاتر ومخزوناً ورواتب أو عدة مستخدمين مع صلاحيات، ومنشأتك ضمن موجة من المرحلة الثانية. وتوقّع اشتراكاً شهرياً في الخطط الأولى وفترة إعداد.',
        },
        {
          heading: 'اختر قالباً مجانياً إذا…',
          body: 'كنت غير مسجّل في الضريبة وتُصدر فواتير قليلة في السنة. وتذكّر أن المسجّل في الضريبة يجب أن يُصدر فواتير ضريبية بالحقول المطلوبة، ورمز QR في الفاتورة المبسطة.',
        },
        {
          heading: 'اختر قافتر إذا…',
          body: 'كنت مسجّلاً في الضريبة، وتبيع للشركات والأفراد، وتريد فواتير ضريبية وفق المرحلة الأولى وإشعارات دائنة وحفظ العملاء دون دفع ثمن برنامج محاسبة متكامل.',
        },
        {
          heading: 'أسئلة تطرحها على أي مزود',
          body: 'هل أجرّب بدون بطاقة؟ هل يُصدر الفاتورة الضريبية والمبسطة؟ كيف يتعامل مع الإشعارات الدائنة؟ متى يدعم المرحلة الثانية لموجتي، وكيف أصدّر بياناتي؟',
        },
      ],
      faq: [
        {
          question: 'كم تكلفة برنامج الفوترة الإلكترونية في السعودية؟',
          answer:
            'تتراوح الخطط الأولى لبرامج المحاسبة المتكاملة المنشورة لدى المزودين في السعودية بين نحو ٩٩ و١٩٩ ريالاً شهرياً (رُوجعت في نوفمبر ٢٠٢٦). ولدى قافتر خطة مجانية، وخطة برو بـ ٣٩ ريالاً شهرياً. أما القوالب المجانية فلا تكلف شيئاً لكنها لا تحسب الضريبة ولا تحفظ السجلات.',
        },
        {
          question: 'هل يدعم قافتر المرحلة الثانية من زاتكا؟',
          answer:
            'دعم المرحلة الثانية في مرحلة تجريبية خاصة. يوقّع قافتر الفواتير ويرسلها إلى زاتكا للاعتماد أو الإبلاغ ويطبع رمز QR للمرحلة الثانية، ونختبره حالياً مع عدد محدود من المنشآت على بيئة المحاكاة لدى زاتكا قبل إتاحته للجميع. إذا كانت منشأتك ضمن الموجة ٢٥ فراسلنا على support@qaftr.com للانضمام إلى قائمة الوصول المبكر، وحتى الإتاحة يُصدر قافتر فواتير وفق المرحلة الأولى. وراجع خطتك مع محاسبك.',
        },
        {
          question: 'هل يمكنني الانتقال لاحقاً؟',
          answer: 'نعم. تبقى فواتيرك متاحة بصيغة PDF، ويمنح ملف CSV محاسبك أو نظامك القادم الإجماليات.',
        },
      ],
      related: [
        { label: 'برنامج فواتير للمنشآت في السعودية', href: '/invoicing-software-saudi-arabia' },
        { label: 'الفرق بين الفاتورة الضريبية والمبسطة', href: '/guides/tax-invoice-vs-simplified-invoice' },
        { label: 'هل منشأتك ضمن الموجة ٢٥؟', href: '/tools/zatca-wave-checker' },
        { label: 'الفوترة الإلكترونية في السعودية', href: '/e-invoicing-saudi-arabia' },
      ],
    },
  },
}

export const seoLandingSlugs = Object.keys(pages) as SeoLandingSlug[]

export function getSeoLandingPage(slug: SeoLandingSlug, lang: MarketingLang) {
  return pages[slug][lang]
}
