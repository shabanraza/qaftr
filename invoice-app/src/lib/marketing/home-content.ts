import { GUIDE_SLUGS, getGuide } from '#/lib/guides/content'
import type { GuideSlug } from '#/lib/guides/content'
import type { MarketingLang } from './lang'
import type { SeoLandingSlug } from './seo-landing-pages'
import { seoLandingSlugs } from './seo-landing-pages'

/**
 * Home page sections below the hero (docs/LANDING_SEO_PLAN_2026-11-15.md §2).
 * Kept out of t(lang).home so the Phase 1 H1 rule keeps covering the hero only;
 * the Phase 2 tile and FAQ say "private beta" (copy-positioning.test.ts).
 */
export type BentoTile = {
  id: string
  size: 'lg' | 'md' | 'sm'
  title: string
  body: string
  href?: string
  linkLabel?: string
}

export type ResourceItem = { href: string; label: string; group: 'guides' | 'solutions' | 'tools' }

const SOLUTION_LABELS: Record<MarketingLang, Record<SeoLandingSlug, string>> = {
  en: {
    'invoicing-software-saudi-arabia': 'Invoicing software for Saudi SMEs',
    'e-invoicing-software-comparison-saudi-arabia': 'E-invoicing software compared',
    'e-invoicing-saudi-arabia': 'E-invoicing in Saudi Arabia',
    'zatca-invoice-generator': 'ZATCA invoice with QR code',
    'vat-invoice-generator-saudi-arabia': 'VAT invoice generator',
    'invoice-generator-saudi-arabia': 'Saudi invoice generator',
    'small-business-invoicing-saudi-arabia': 'Invoicing for small businesses',
    'free-invoice-generator': 'Free invoice generator',
  },
  ar: {
    'invoicing-software-saudi-arabia': 'برنامج فواتير للمنشآت في السعودية',
    'e-invoicing-software-comparison-saudi-arabia': 'مقارنة برامج الفوترة الإلكترونية',
    'e-invoicing-saudi-arabia': 'الفوترة الإلكترونية في السعودية',
    'zatca-invoice-generator': 'فاتورة زاتكا مع رمز QR',
    'vat-invoice-generator-saudi-arabia': 'فاتورة ضريبة القيمة المضافة',
    'invoice-generator-saudi-arabia': 'برنامج إصدار الفواتير',
    'small-business-invoicing-saudi-arabia': 'فواتير المنشآت الصغيرة',
    'free-invoice-generator': 'برنامج فواتير مجاني',
  },
}

const GUIDE_LABELS: Record<MarketingLang, Record<GuideSlug, string>> = {
  en: {
    'saudi-tax-invoice-requirements': 'Tax invoice requirements',
    'tax-invoice-vs-simplified-invoice': 'Standard vs simplified tax invoice',
  },
  ar: {
    'saudi-tax-invoice-requirements': 'متطلبات الفاتورة الضريبية',
    'tax-invoice-vs-simplified-invoice': 'الفرق بين الفاتورة الضريبية والمبسطة',
  },
}

function resources(lang: MarketingLang): ResourceItem[] {
  const ar = lang === 'ar'
  return [
    { href: '/guides', label: ar ? 'كل الأدلة' : 'All guides', group: 'guides' },
    { href: '/guides/zatca-wave-25', label: ar ? 'دليل الموجة ٢٥ من زاتكا' : 'ZATCA Wave 25 guide', group: 'guides' },
    ...GUIDE_SLUGS.map((slug) => ({
      href: `/guides/${slug}`,
      label: GUIDE_LABELS[lang][slug] ?? getGuide(slug, lang).breadcrumb,
      group: 'guides' as const,
    })),
    ...seoLandingSlugs.map((slug) => ({ href: `/${slug}`, label: SOLUTION_LABELS[lang][slug], group: 'solutions' as const })),
    { href: '/tools/fatora', label: ar ? 'أداة الفاتورة الضريبية' : 'Tax invoice tool', group: 'tools' },
    { href: '/tools/zatca-wave-checker', label: ar ? 'هل منشأتك ضمن الموجة ٢٥؟' : 'Wave 25 checker', group: 'tools' },
    { href: '/tools/vat-calculator', label: ar ? 'حاسبة ضريبة القيمة المضافة' : 'VAT calculator', group: 'tools' },
    { href: '/tools/zatca-qr', label: ar ? 'فاحص رمز QR' : 'ZATCA QR checker', group: 'tools' },
    { href: '/tools/credit-note', label: ar ? 'الإشعار الدائن' : 'Credit note', group: 'tools' },
    { href: '/tools', label: ar ? 'كل الأدوات المجانية' : 'All free tools', group: 'tools' },
  ]
}

const en = {
  demo: {
    label: 'Live demo · no sign-up',
    hint: 'Fill in the form below and download a real PDF. Nothing is saved until you create an account.',
    secondaryCta: 'Create a free account',
    signedInLabel: 'New invoice',
    signedInHint: 'Fill in the form below, then download the PDF or save it to your invoices.',
  },
  bentoTitle: 'Everything a Saudi SME needs to invoice, nothing it does not',
  bentoSubtitle: 'Built for businesses that sell to companies and to consumers.',
  bento: [
    {
      id: 'qr-pdf-whatsapp',
      size: 'lg',
      title: 'Tax invoice, QR code and PDF in one step',
      body: 'Enter the buyer and the items. Qaftr calculates 15% VAT, adds the ZATCA Phase 1 QR code to simplified tax invoices and gives you a PDF to send on WhatsApp or keep for your records.',
      href: '/tools/fatora',
      linkLabel: 'Open the invoice tool',
    },
    {
      id: 'arabic',
      size: 'md',
      title: 'Arabic first',
      body: 'Right-to-left screens and invoices in Arabic or English.',
    },
    {
      id: 'vat',
      size: 'md',
      title: '15% VAT, worked out for you',
      body: 'Totals excluding VAT, the VAT amount and the total due, with no spreadsheet.',
      href: '/tools/vat-calculator',
      linkLabel: 'VAT calculator',
    },
    {
      id: 'notes',
      size: 'md',
      title: 'Credit and debit notes',
      body: 'Correct an invoice the way ZATCA expects: a note that cites the original invoice number.',
      href: '/guides/saudi-tax-invoice-requirements',
      linkLabel: 'Tax invoice rules',
    },
    {
      id: 'phase2',
      size: 'md',
      title: 'ZATCA Phase 2: private beta',
      body: 'Signing, clearance and reporting are being tested with a small group of businesses on ZATCA’s simulation environment. In Wave 25? Email support@qaftr.com for early access.',
      href: '/guides/zatca-wave-25',
      linkLabel: 'Wave 25 guide',
    },
    {
      id: 'accountant',
      size: 'sm',
      title: 'Ready for your accountant',
      body: 'Monthly totals and a CSV export of your invoices.',
    },
    {
      id: 'tools',
      size: 'sm',
      title: 'Free tools',
      body: 'Wave checker, QR checker, VAT number check and more.',
      href: '/tools',
      linkLabel: 'All tools',
    },
  ] satisfies BentoTile[],
  comparisonCta: 'See the full comparison',
  resourcesTitle: 'Guides and free tools',
  resourcesSubtitle: 'Plain-language answers on Saudi tax invoices and e-invoicing.',
  groups: { guides: 'Guides', solutions: 'Solutions', tools: 'Free tools' },
  faqTitle: 'Questions businesses ask',
  faq: [
    {
      question: 'Is Qaftr free?',
      answer: 'Yes. The free plan lets you issue invoices with the QR code and save 3 invoices a month. Pro costs SAR 39 a month (or SAR 349 a year) for unlimited invoices.',
    },
    {
      question: 'Do I need an account to try it?',
      answer: 'No. Create and download your first invoice from this page without signing up. An account is only needed to save invoices and customers.',
    },
    {
      question: 'Does Qaftr support ZATCA Phase 2?',
      answer:
        "Phase 2 support in Qaftr is in private beta. Qaftr already signs invoices, sends them to ZATCA for clearance or reporting and prints the Phase 2 QR code; we are testing it with a small group of businesses on ZATCA's simulation environment before opening it to everyone. If you are in Wave 25, email support@qaftr.com to join the early-access list; until it opens, Qaftr issues Phase 1 invoices.",
    },
    {
      question: 'Can I issue both standard (B2B) and simplified (B2C) tax invoices?',
      answer: 'Yes. Choose the invoice type at the top of the form. A standard tax invoice asks for the buyer’s name and VAT number; a simplified tax invoice carries the QR code.',
    },
    {
      question: 'Is Qaftr accounting software?',
      answer: 'No. Qaftr does invoicing only: tax invoices, credit and debit notes, customers and monthly totals. Your accountant can take the CSV export into their own system.',
    },
    {
      question: 'Can I send invoices on WhatsApp?',
      answer: 'Yes. Every invoice exports as a PDF that you can share with your customer on WhatsApp in one tap.',
    },
  ],
}

const ar: typeof en = {
  demo: {
    label: 'تجربة حية · بدون تسجيل',
    hint: 'املأ النموذج أدناه ونزّل ملف PDF حقيقياً. لا يُحفظ شيء حتى تُنشئ حساباً.',
    secondaryCta: 'أنشئ حساباً مجانياً',
    signedInLabel: 'فاتورة جديدة',
    signedInHint: 'املأ النموذج أدناه، ثم نزّل ملف PDF أو احفظه في فواتيرك.',
  },
  bentoTitle: 'كل ما تحتاجه منشأتك لإصدار الفواتير، بلا تعقيد',
  bentoSubtitle: 'مصمم للمنشآت التي تبيع للشركات والأفراد.',
  bento: [
    {
      id: 'qr-pdf-whatsapp',
      size: 'lg',
      title: 'فاتورة ضريبية ورمز QR وملف PDF في خطوة واحدة',
      body: 'أدخل المشتري والبنود، ويحسب قافتر ضريبة ١٥٪، ويضيف رمز QR للمرحلة الأولى من زاتكا إلى الفاتورة المبسطة، ويمنحك ملف PDF ترسله عبر واتساب أو تحفظه في سجلاتك.',
      href: '/tools/fatora',
      linkLabel: 'افتح أداة الفاتورة',
    },
    {
      id: 'arabic',
      size: 'md',
      title: 'عربي أولاً',
      body: 'واجهة من اليمين إلى اليسار، وفواتير بالعربية أو الإنجليزية.',
    },
    {
      id: 'vat',
      size: 'md',
      title: 'ضريبة ١٥٪ محسوبة تلقائياً',
      body: 'الإجمالي غير شامل الضريبة، ومبلغ الضريبة، والإجمالي المستحق، بلا جداول بيانات.',
      href: '/tools/vat-calculator',
      linkLabel: 'حاسبة الضريبة',
    },
    {
      id: 'notes',
      size: 'md',
      title: 'إشعارات الدائن والمدين',
      body: 'صحّح الفاتورة كما تطلب زاتكا: بإشعار يذكر رقم الفاتورة الأصلية.',
      href: '/guides/saudi-tax-invoice-requirements',
      linkLabel: 'متطلبات الفاتورة الضريبية',
    },
    {
      id: 'phase2',
      size: 'md',
      title: 'المرحلة الثانية من زاتكا: تجريبية خاصة',
      body: 'نختبر التوقيع والاعتماد والإبلاغ مع عدد محدود من المنشآت على بيئة المحاكاة لدى زاتكا. منشأتك ضمن الموجة ٢٥؟ راسلنا على support@qaftr.com للوصول المبكر.',
      href: '/guides/zatca-wave-25',
      linkLabel: 'دليل الموجة ٢٥',
    },
    {
      id: 'accountant',
      size: 'sm',
      title: 'جاهز لمحاسبك',
      body: 'إجماليات شهرية وتصدير فواتيرك بصيغة CSV.',
    },
    {
      id: 'tools',
      size: 'sm',
      title: 'أدوات مجانية',
      body: 'فاحص الموجة، وفاحص رمز QR، والتحقق من الرقم الضريبي، وغيرها.',
      href: '/tools',
      linkLabel: 'كل الأدوات',
    },
  ],
  comparisonCta: 'اطّلع على المقارنة كاملة',
  resourcesTitle: 'أدلة وأدوات مجانية',
  resourcesSubtitle: 'إجابات واضحة عن الفاتورة الضريبية والفوترة الإلكترونية في السعودية.',
  groups: { guides: 'الأدلة', solutions: 'الحلول', tools: 'أدوات مجانية' },
  faqTitle: 'أسئلة تطرحها المنشآت',
  faq: [
    {
      question: 'هل قافتر مجاني؟',
      answer: 'نعم. تتيح الخطة المجانية إصدار الفواتير مع رمز QR وحفظ ٣ فواتير شهرياً. وخطة برو بـ ٣٩ ريالاً شهرياً (أو ٣٤٩ ريالاً سنوياً) لفواتير غير محدودة.',
    },
    {
      question: 'هل أحتاج إلى حساب للتجربة؟',
      answer: 'لا. أصدر فاتورتك الأولى ونزّلها من هذه الصفحة بدون تسجيل، ولا تحتاج إلى حساب إلا لحفظ الفواتير والعملاء.',
    },
    {
      question: 'هل يدعم قافتر المرحلة الثانية من زاتكا؟',
      answer:
        'دعم المرحلة الثانية في قافتر في مرحلة تجريبية خاصة. يوقّع قافتر الفواتير ويرسلها إلى زاتكا للاعتماد أو الإبلاغ ويطبع رمز QR للمرحلة الثانية، ونختبره حالياً مع عدد محدود من المنشآت على بيئة المحاكاة لدى زاتكا قبل إتاحته للجميع. إذا كانت منشأتك ضمن الموجة ٢٥ فراسلنا على support@qaftr.com للانضمام إلى قائمة الوصول المبكر، وحتى الإتاحة يُصدر قافتر فواتير وفق المرحلة الأولى.',
    },
    {
      question: 'هل يمكن إصدار الفاتورة الضريبية (للشركات) والمبسطة (للأفراد)؟',
      answer: 'نعم. اختر نوع الفاتورة أعلى النموذج؛ تطلب الفاتورة الضريبية اسم المشتري ورقمه الضريبي، وتحمل الفاتورة المبسطة رمز QR.',
    },
    {
      question: 'هل قافتر برنامج محاسبة؟',
      answer: 'لا. قافتر للفوترة فقط: الفواتير الضريبية، وإشعارات الدائن والمدين، والعملاء، والإجماليات الشهرية. ويمكن لمحاسبك نقل ملف CSV إلى نظامه.',
    },
    {
      question: 'هل يمكن إرسال الفواتير عبر واتساب؟',
      answer: 'نعم. تُصدَّر كل فاتورة بصيغة PDF يمكنك مشاركتها مع عميلك عبر واتساب بلمسة واحدة.',
    },
  ],
}

export function getHomeContent(lang: MarketingLang) {
  const c = lang === 'ar' ? ar : en
  return { ...c, resources: { title: c.resourcesTitle, subtitle: c.resourcesSubtitle, items: resources(lang) } }
}

export type FooterColumn = { title: string; links: Array<{ href: string; label: string }> }

/** Footer link columns: every page links to the guides, SEO pages and tools. */
export function getFooterColumns(lang: MarketingLang): FooterColumn[] {
  const items = resources(lang)
  const groups = (lang === 'ar' ? ar : en).groups
  return (['guides', 'solutions', 'tools'] as const).map((g) => ({
    title: groups[g],
    links: items.filter((i) => i.group === g).map(({ href, label }) => ({ href, label })),
  }))
}
