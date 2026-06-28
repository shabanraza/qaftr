import type { MarketingLang } from './lang'

export type SeoLandingSlug =
  | 'invoice-generator-saudi-arabia'
  | 'zatca-invoice-generator'
  | 'vat-invoice-generator-saudi-arabia'
  | 'free-invoice-generator'
  | 'e-invoicing-saudi-arabia'
  | 'small-business-invoicing-saudi-arabia'

type SeoLandingPage = {
  slug: SeoLandingSlug
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
  'invoice-generator-saudi-arabia': {
    en: {
      slug: 'invoice-generator-saudi-arabia',
      title: 'Invoice generator for Saudi Arabia | Qaftr',
      description:
        'Create Saudi invoices with 15% VAT, ZATCA Phase 1 QR, PDF export, and Arabic or English invoice details.',
      eyebrow: 'Saudi invoice generator',
      heading: 'Create invoices for Saudi clients in minutes',
      intro:
        'Qaftr helps freelancers and small businesses issue clean Saudi invoices with VAT totals, buyer details, seller details, and a ZATCA Phase 1 QR code.',
      cta: 'Create a free invoice',
      sections: [
        {
          heading: 'What a Saudi invoice needs',
          body: 'A practical Saudi invoice should show the seller name, buyer name, invoice date, line items, subtotal, 15% VAT, final total, and tax invoice QR code when VAT information is required.',
        },
        {
          heading: 'Why use Qaftr',
          body: 'Qaftr keeps the workflow lightweight: enter business details, add items, review VAT totals, then export a PDF that can be shared with a client or stored for your records.',
        },
      ],
      faq: [
        {
          question: 'Can I create a Saudi invoice without signing up?',
          answer:
            'Yes. You can create and download a PDF invoice for free. Signing up is only needed when you want to save and manage invoices.',
        },
        {
          question: 'Does Qaftr calculate Saudi VAT?',
          answer:
            'Yes. Qaftr supports 15% Saudi VAT calculations and shows the subtotal, tax amount, and total.',
        },
      ],
      related: [
        { label: 'ZATCA invoice generator', href: '/zatca-invoice-generator' },
        { label: 'VAT calculator', href: '/tools/vat-calculator' },
      ],
    },
    ar: {
      slug: 'invoice-generator-saudi-arabia',
      title: 'منشئ فواتير السعودية | قافتر',
      description:
        'أنشئ فاتورة سعودية مع ضريبة 15٪، رمز QR للمرحلة الأولى من زاتكا، وتصدير PDF بالعربية أو الإنجليزية.',
      eyebrow: 'منشئ فواتير السعودية',
      heading: 'أنشئ فواتير لعملائك في السعودية خلال دقائق',
      intro:
        'يساعدك قافتر على إصدار فاتورة سعودية واضحة تتضمن بيانات البائع والمشتري، البنود، ضريبة القيمة المضافة، والإجمالي مع QR زاتكا.',
      cta: 'أنشئ فاتورة مجانية',
      sections: [
        {
          heading: 'ماذا تحتاج الفاتورة السعودية؟',
          body: 'الفاتورة العملية تعرض اسم البائع، اسم العميل، تاريخ الفاتورة، البنود، المجموع قبل الضريبة، ضريبة 15٪، الإجمالي، ورمز QR عند الحاجة.',
        },
        {
          heading: 'لماذا قافتر؟',
          body: 'قافتر يجعل إنشاء الفاتورة سريعاً: أدخل بيانات النشاط، أضف البنود، راجع الضريبة والإجمالي، ثم حمّل PDF جاهزاً للمشاركة.',
        },
      ],
      faq: [
        {
          question: 'هل يمكن إنشاء فاتورة بدون تسجيل؟',
          answer:
            'نعم. يمكنك إنشاء وتحميل PDF مجاناً. التسجيل مطلوب فقط لحفظ الفواتير وإدارتها.',
        },
        {
          question: 'هل يحسب قافتر ضريبة السعودية؟',
          answer:
            'نعم. يدعم قافتر حساب ضريبة 15٪ وعرض المجموع قبل الضريبة والضريبة والإجمالي.',
        },
      ],
      related: [
        { label: 'منشئ فاتورة زاتكا', href: '/zatca-invoice-generator' },
        { label: 'حاسبة الضريبة', href: '/tools/vat-calculator' },
      ],
    },
  },
  'zatca-invoice-generator': {
    en: {
      slug: 'zatca-invoice-generator',
      title: 'ZATCA invoice generator with QR | Qaftr',
      description:
        'Generate ZATCA Phase 1 tax invoices with QR code, 15% VAT, and PDF export for freelancers and small businesses in Saudi Arabia.',
      eyebrow: 'ZATCA Phase 1 invoices',
      heading: 'Generate ZATCA-style invoices with QR',
      intro:
        'Qaftr creates simplified tax invoices with the fields small businesses need for Saudi Phase 1 invoicing, including QR data and VAT totals.',
      cta: 'Open the ZATCA invoice tool',
      sections: [
        {
          heading: 'What is a ZATCA QR invoice?',
          body: 'A ZATCA Phase 1 QR invoice includes encoded invoice information such as seller name, VAT number, timestamp, VAT amount, and total amount.',
        },
        {
          heading: 'Who this is for',
          body: 'The tool is built for freelancers, consultants, service providers, and small businesses that need a fast PDF invoice without heavy accounting software.',
        },
      ],
      faq: [
        {
          question: 'Is Qaftr an official ZATCA app?',
          answer:
            'No. Qaftr is an independent invoicing tool that helps generate Phase 1 style invoice data and QR codes.',
        },
        {
          question: 'Can I export the invoice as PDF?',
          answer:
            'Yes. Qaftr supports PDF export so you can share or archive the invoice.',
        },
      ],
      related: [
        { label: 'Free invoice tool', href: '/tools/fatora' },
        { label: 'TRN checker', href: '/tools/trn-checker' },
      ],
    },
    ar: {
      slug: 'zatca-invoice-generator',
      title: 'منشئ فاتورة زاتكا مع QR | قافتر',
      description:
        'أنشئ فاتورة ضريبية للمرحلة الأولى من زاتكا مع QR، ضريبة 15٪، وتصدير PDF للمستقلين والمنشآت الصغيرة.',
      eyebrow: 'فواتير زاتكا المرحلة الأولى',
      heading: 'أنشئ فاتورة زاتكا مع QR',
      intro:
        'ينشئ قافتر فاتورة ضريبية مبسطة بالحقول التي تحتاجها المنشآت الصغيرة في السعودية، مع QR وإجمالي الضريبة.',
      cta: 'افتح أداة فاتورة زاتكا',
      sections: [
        {
          heading: 'ما هي فاتورة زاتكا QR؟',
          body: 'فاتورة المرحلة الأولى تحتوي على بيانات مشفرة مثل اسم البائع، الرقم الضريبي، وقت الإصدار، قيمة الضريبة، والإجمالي.',
        },
        {
          heading: 'لمن هذه الأداة؟',
          body: 'الأداة مناسبة للمستقلين والاستشاريين ومقدمي الخدمات والمنشآت الصغيرة التي تحتاج PDF سريعاً بدون تعقيد برامج المحاسبة.',
        },
      ],
      faq: [
        {
          question: 'هل قافتر تطبيق رسمي من زاتكا؟',
          answer:
            'لا. قافتر أداة مستقلة تساعدك على إنشاء بيانات فاتورة وQR بنمط المرحلة الأولى.',
        },
        {
          question: 'هل يمكن تصدير الفاتورة PDF؟',
          answer: 'نعم. يدعم قافتر تصدير PDF للمشاركة أو الأرشفة.',
        },
      ],
      related: [
        { label: 'أداة الفاتورة المجانية', href: '/tools/fatora' },
        { label: 'التحقق من الرقم الضريبي', href: '/tools/trn-checker' },
      ],
    },
  },
  'vat-invoice-generator-saudi-arabia': {
    en: {
      slug: 'vat-invoice-generator-saudi-arabia',
      title: 'VAT invoice generator Saudi Arabia | Qaftr',
      description:
        'Create Saudi VAT invoices with automatic 15% VAT, line items, totals, QR code, and PDF download.',
      eyebrow: 'Saudi VAT invoices',
      heading: 'Make VAT invoices with automatic 15% tax',
      intro:
        'Use Qaftr to calculate VAT while preparing a professional invoice for Saudi customers, then export the result as a PDF.',
      cta: 'Create a VAT invoice',
      sections: [
        {
          heading: 'Before-tax and after-tax totals',
          body: 'Qaftr separates subtotal, VAT amount, and final total so the invoice is easier for clients and accountants to read.',
        },
        {
          heading: 'Built for repeated client work',
          body: 'Save clients and invoice details when you create an account, or use the free browser tool for a one-off invoice.',
        },
      ],
      faq: [
        {
          question: 'What VAT rate does Qaftr use?',
          answer:
            'Qaftr uses the standard 15% VAT rate for Saudi invoice calculations.',
        },
        {
          question: 'Can I check VAT separately?',
          answer:
            'Yes. The VAT calculator tool can calculate tax before or after the total.',
        },
      ],
      related: [
        { label: 'VAT calculator', href: '/tools/vat-calculator' },
        { label: 'Invoice generator', href: '/invoice-generator-saudi-arabia' },
      ],
    },
    ar: {
      slug: 'vat-invoice-generator-saudi-arabia',
      title: 'منشئ فاتورة ضريبية السعودية | قافتر',
      description:
        'أنشئ فاتورة ضريبية سعودية مع حساب 15٪ تلقائياً، بنود، إجماليات، QR، وتحميل PDF.',
      eyebrow: 'فواتير ضريبية سعودية',
      heading: 'أنشئ فاتورة ضريبية مع حساب 15٪ تلقائياً',
      intro:
        'استخدم قافتر لحساب الضريبة أثناء إعداد فاتورة احترافية لعملائك في السعودية، ثم صدّرها PDF.',
      cta: 'أنشئ فاتورة ضريبية',
      sections: [
        {
          heading: 'مجموع قبل الضريبة وبعدها',
          body: 'يفصل قافتر بين المجموع قبل الضريبة، قيمة الضريبة، والإجمالي النهائي حتى تكون الفاتورة واضحة للعميل والمحاسب.',
        },
        {
          heading: 'مناسب للعمل المتكرر',
          body: 'يمكنك حفظ العملاء والفواتير عند إنشاء حساب، أو استخدام الأداة المجانية لفاتورة سريعة مرة واحدة.',
        },
      ],
      faq: [
        {
          question: 'ما نسبة الضريبة في قافتر؟',
          answer: 'يستخدم قافتر نسبة 15٪ القياسية لحساب الفواتير السعودية.',
        },
        {
          question: 'هل يمكن حساب الضريبة وحدها؟',
          answer: 'نعم. أداة حاسبة الضريبة تحسب الضريبة قبل أو بعد الإجمالي.',
        },
      ],
      related: [
        { label: 'حاسبة الضريبة', href: '/tools/vat-calculator' },
        { label: 'منشئ الفواتير', href: '/invoice-generator-saudi-arabia' },
      ],
    },
  },
  'free-invoice-generator': {
    en: {
      slug: 'free-invoice-generator',
      title: 'Free invoice generator | Qaftr',
      description:
        'Create a free invoice online with client details, line items, VAT totals, QR code, and PDF export.',
      eyebrow: 'Free invoice generator',
      heading: 'Create a free invoice online',
      intro:
        'Qaftr gives freelancers a fast way to create a clean invoice from the browser without starting with a full accounting system.',
      cta: 'Start free',
      sections: [
        {
          heading: 'No signup for the first invoice',
          body: 'You can create and download an invoice PDF immediately. Create an account when you want to save invoices and clients.',
        },
        {
          heading: 'Professional enough to send',
          body: 'The invoice includes business details, client details, invoice items, VAT totals, and a share-ready PDF layout.',
        },
      ],
      faq: [
        {
          question: 'Is the invoice generator free?',
          answer:
            'Yes. You can create and download invoices for free, with paid plans for higher-volume use.',
        },
        {
          question: 'Can I use it on mobile?',
          answer:
            'Yes. Qaftr works in the browser and is designed for quick mobile invoice creation.',
        },
      ],
      related: [
        { label: 'Fatora tool', href: '/tools/fatora' },
        { label: 'Free tools', href: '/tools' },
      ],
    },
    ar: {
      slug: 'free-invoice-generator',
      title: 'منشئ فواتير مجاني | قافتر',
      description:
        'أنشئ فاتورة مجانية عبر الإنترنت مع بيانات العميل والبنود والضريبة وQR وتصدير PDF.',
      eyebrow: 'منشئ فواتير مجاني',
      heading: 'أنشئ فاتورة مجانية عبر الإنترنت',
      intro:
        'يمنح قافتر المستقلين طريقة سريعة لإنشاء فاتورة واضحة من المتصفح بدون البدء بنظام محاسبة كامل.',
      cta: 'ابدأ مجاناً',
      sections: [
        {
          heading: 'بدون تسجيل لأول فاتورة',
          body: 'يمكنك إنشاء وتحميل PDF مباشرة. أنشئ حساباً فقط عندما تريد حفظ الفواتير والعملاء.',
        },
        {
          heading: 'جاهزة للإرسال',
          body: 'تتضمن الفاتورة بيانات النشاط والعميل والبنود والضريبة وتنسيق PDF مناسباً للمشاركة.',
        },
      ],
      faq: [
        {
          question: 'هل منشئ الفواتير مجاني؟',
          answer:
            'نعم. يمكنك إنشاء وتحميل فواتير مجاناً، مع خطط مدفوعة للاستخدام الأعلى.',
        },
        {
          question: 'هل يعمل على الجوال؟',
          answer:
            'نعم. يعمل قافتر في المتصفح ومصمم لإنشاء الفواتير بسرعة على الجوال.',
        },
      ],
      related: [
        { label: 'أداة الفاتورة', href: '/tools/fatora' },
        { label: 'الأدوات المجانية', href: '/tools' },
      ],
    },
  },
  'e-invoicing-saudi-arabia': {
    en: {
      slug: 'e-invoicing-saudi-arabia',
      title: 'E-invoicing in Saudi Arabia for small businesses | Qaftr',
      description:
        'A practical guide to Saudi e-invoicing basics for freelancers and small businesses, with a free ZATCA Phase 1 invoice tool.',
      eyebrow: 'Saudi e-invoicing basics',
      heading: 'E-invoicing basics for Saudi small businesses',
      intro:
        'If you invoice clients in Saudi Arabia, Qaftr helps you prepare consistent invoice records with VAT totals, QR data, and PDF exports.',
      cta: 'Create an e-invoice',
      sections: [
        {
          heading: 'Start with consistent invoice records',
          body: 'Use the same business name, VAT number, invoice dates, customer fields, and line-item structure across every invoice.',
        },
        {
          heading: 'Keep PDF copies',
          body: 'PDF exports make it easier to share invoices with clients and keep records for your own accounting process.',
        },
      ],
      faq: [
        {
          question: 'What is e-invoicing in Saudi Arabia?',
          answer:
            'E-invoicing is the process of issuing and storing invoices electronically instead of handwritten or scanned paper-only records.',
        },
        {
          question: 'Can Qaftr replace accounting advice?',
          answer:
            'No. Qaftr helps create invoices, but tax and compliance decisions should be reviewed with a qualified advisor.',
        },
      ],
      related: [
        { label: 'ZATCA invoice generator', href: '/zatca-invoice-generator' },
        { label: 'Support', href: '/support' },
      ],
    },
    ar: {
      slug: 'e-invoicing-saudi-arabia',
      title: 'الفوترة الإلكترونية في السعودية للمنشآت الصغيرة | قافتر',
      description:
        'دليل عملي لأساسيات الفوترة الإلكترونية في السعودية للمستقلين والمنشآت الصغيرة مع أداة فاتورة زاتكا مجانية.',
      eyebrow: 'أساسيات الفوترة الإلكترونية',
      heading: 'أساسيات الفوترة الإلكترونية للمنشآت الصغيرة',
      intro:
        'إذا كنت تفوتر عملاء في السعودية، يساعدك قافتر على إعداد سجلات فواتير منتظمة مع الضريبة وQR وتصدير PDF.',
      cta: 'أنشئ فاتورة إلكترونية',
      sections: [
        {
          heading: 'ابدأ بسجلات فواتير منتظمة',
          body: 'استخدم نفس اسم النشاط، الرقم الضريبي، تواريخ الفواتير، بيانات العملاء، وبنية البنود في كل فاتورة.',
        },
        {
          heading: 'احتفظ بنسخ PDF',
          body: 'تصدير PDF يسهل مشاركة الفواتير مع العملاء وحفظها لسجلاتك المحاسبية.',
        },
      ],
      faq: [
        {
          question: 'ما هي الفوترة الإلكترونية في السعودية؟',
          answer:
            'هي إصدار وحفظ الفواتير إلكترونياً بدلاً من الاعتماد على سجلات ورقية أو صور ممسوحة فقط.',
        },
        {
          question: 'هل يغني قافتر عن الاستشارة المحاسبية؟',
          answer:
            'لا. قافتر يساعد في إنشاء الفواتير، لكن قرارات الضريبة والامتثال يجب مراجعتها مع مختص.',
        },
      ],
      related: [
        { label: 'منشئ فاتورة زاتكا', href: '/zatca-invoice-generator' },
        { label: 'الدعم', href: '/support' },
      ],
    },
  },
  'small-business-invoicing-saudi-arabia': {
    en: {
      slug: 'small-business-invoicing-saudi-arabia',
      title: 'Small business invoicing Saudi Arabia | Qaftr',
      description:
        'Simple invoicing for Saudi small businesses: clients, line items, VAT, QR invoices, PDF export, and WhatsApp sharing.',
      eyebrow: 'Small business invoicing',
      heading: 'Simple invoicing for Saudi small businesses',
      intro:
        'Qaftr keeps invoicing light enough for owner-led businesses while still covering the fields clients expect to see.',
      cta: 'Try the invoice tool',
      sections: [
        {
          heading: 'Built for owner-led workflows',
          body: 'Create invoices between client calls, from your phone, or at your desk without needing a full finance team.',
        },
        {
          heading: 'Designed for clarity',
          body: 'Clear totals, VAT separation, QR code support, and PDF output make each invoice easier to review and share.',
        },
      ],
      faq: [
        {
          question: 'Can Qaftr manage clients?',
          answer:
            'Yes. Accounts can save client details so repeated invoices are faster to create.',
        },
        {
          question: 'Can I share invoices on WhatsApp?',
          answer:
            'Yes. Qaftr is designed around PDF exports that are easy to share with clients.',
        },
      ],
      related: [
        { label: 'Invoice generator', href: '/invoice-generator-saudi-arabia' },
        { label: 'Tools', href: '/tools' },
      ],
    },
    ar: {
      slug: 'small-business-invoicing-saudi-arabia',
      title: 'فواتير المنشآت الصغيرة في السعودية | قافتر',
      description:
        'فوترة بسيطة للمنشآت الصغيرة في السعودية: عملاء، بنود، ضريبة، QR، تصدير PDF، ومشاركة واتساب.',
      eyebrow: 'فواتير المنشآت الصغيرة',
      heading: 'فوترة بسيطة للمنشآت الصغيرة في السعودية',
      intro:
        'يبقي قافتر الفوترة خفيفة ومناسبة لأصحاب الأعمال، مع الحقول التي يتوقع العملاء رؤيتها.',
      cta: 'جرّب أداة الفاتورة',
      sections: [
        {
          heading: 'مناسب لصاحب العمل',
          body: 'أنشئ الفواتير بين مكالمات العملاء أو من الجوال أو من المكتب بدون الحاجة إلى فريق مالي كامل.',
        },
        {
          heading: 'مصمم للوضوح',
          body: 'إجماليات واضحة، فصل الضريبة، دعم QR، وتصدير PDF يجعل كل فاتورة أسهل في المراجعة والمشاركة.',
        },
      ],
      faq: [
        {
          question: 'هل يدير قافتر العملاء؟',
          answer:
            'نعم. يمكن للحسابات حفظ بيانات العملاء لتسريع الفواتير المتكررة.',
        },
        {
          question: 'هل يمكن مشاركة الفواتير على واتساب؟',
          answer: 'نعم. قافتر مصمم حول تصدير PDF سهل المشاركة مع العملاء.',
        },
      ],
      related: [
        { label: 'منشئ الفواتير', href: '/invoice-generator-saudi-arabia' },
        { label: 'الأدوات', href: '/tools' },
      ],
    },
  },
}

export const seoLandingSlugs = Object.keys(pages) as SeoLandingSlug[]

export function getSeoLandingPage(slug: SeoLandingSlug, lang: MarketingLang) {
  return pages[slug][lang]
}
