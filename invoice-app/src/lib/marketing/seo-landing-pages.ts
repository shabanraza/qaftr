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
      title: 'Invoice Generator for Saudi Businesses | Qaftr',
      description:
        'Issue invoices for your Saudi business with 15% VAT, a ZATCA Phase 1 QR code and PDF export, in Arabic or English. Create your first invoice free.',
      eyebrow: 'Saudi invoice generator',
      heading: 'Issue invoices to your Saudi customers in minutes',
      intro:
        'Qaftr helps Saudi SMEs that sell to businesses and consumers issue clear invoices with seller and buyer details, VAT totals and a ZATCA Phase 1 QR code.',
      cta: 'Create your first invoice free',
      sections: [
        {
          heading: 'What a Saudi tax invoice shows',
          body: 'A Saudi tax invoice shows the seller name and VAT number, the buyer details, the issue date, line items, the total excluding VAT, 15% VAT, the total including VAT and, on simplified tax invoices, the ZATCA QR code.',
        },
        {
          heading: 'Why businesses use Qaftr',
          body: 'Qaftr keeps invoicing light: enter your business details, add items, review the VAT totals, then export a PDF to send to your customer or keep for your records.',
        },
      ],
      faq: [
        {
          question: 'Can I create a Saudi invoice without signing up?',
          answer:
            'Yes. You can create and download a PDF invoice free. Signing up is only needed to save invoices and customers.',
        },
        {
          question: 'Does Qaftr calculate Saudi VAT?',
          answer:
            'Yes. Qaftr calculates 15% Saudi VAT and shows the total excluding VAT, the VAT amount and the total including VAT.',
        },
      ],
      related: [
        { label: 'ZATCA invoice generator', href: '/zatca-invoice-generator' },
        { label: 'VAT calculator', href: '/tools/vat-calculator' },
      ],
    },
    ar: {
      slug: 'invoice-generator-saudi-arabia',
      title: 'برنامج إصدار فواتير للمنشآت في السعودية | قافتر',
      description:
        'أصدر فواتير منشأتك مع ضريبة القيمة المضافة ١٥٪ ورمز QR وفق المرحلة الأولى من زاتكا، وصدّرها PDF بالعربية أو الإنجليزية. فاتورتك الأولى مجاناً.',
      eyebrow: 'برنامج فواتير السعودية',
      heading: 'أصدر فواتير لعملائك في السعودية خلال دقائق',
      intro:
        'يساعد قافتر المنشآت الصغيرة والمتوسطة التي تبيع للشركات والأفراد على إصدار فواتير واضحة تتضمن بيانات البائع والمشتري، والبنود، وضريبة القيمة المضافة، والإجمالي، مع رمز QR وفق المرحلة الأولى من زاتكا.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'ماذا تتضمن الفاتورة الضريبية في السعودية؟',
          body: 'تتضمن الفاتورة الضريبية اسم البائع ورقمه الضريبي، وبيانات المشتري، وتاريخ الإصدار، والبنود، والإجمالي غير شامل الضريبة، وضريبة القيمة المضافة ١٥٪، والإجمالي شامل الضريبة، ورمز QR في الفاتورة الضريبية المبسطة.',
        },
        {
          heading: 'لماذا تختار المنشآت قافتر؟',
          body: 'يجعل قافتر إصدار الفاتورة سريعاً: أدخل بيانات منشأتك، وأضف البنود، وراجع الضريبة والإجمالي، ثم نزّل ملف PDF جاهزاً للإرسال إلى عميلك.',
        },
      ],
      faq: [
        {
          question: 'هل يمكن إصدار فاتورة دون تسجيل؟',
          answer:
            'نعم. يمكنك إصدار الفاتورة وتنزيلها بصيغة PDF مجاناً. التسجيل مطلوب فقط لحفظ الفواتير والعملاء.',
        },
        {
          question: 'هل يحسب قافتر ضريبة القيمة المضافة السعودية؟',
          answer:
            'نعم. يحسب قافتر ضريبة القيمة المضافة ١٥٪ ويعرض الإجمالي غير شامل الضريبة ومبلغ الضريبة والإجمالي شامل الضريبة.',
        },
      ],
      related: [
        { label: 'فاتورة زاتكا مع QR', href: '/zatca-invoice-generator' },
        { label: 'حاسبة ضريبة القيمة المضافة', href: '/tools/vat-calculator' },
      ],
    },
  },
  'zatca-invoice-generator': {
    en: {
      slug: 'zatca-invoice-generator',
      title: 'ZATCA Phase 1 Invoice Generator with QR Code | Qaftr',
      description:
        'Generate ZATCA Phase 1 simplified tax invoices with a QR code, 15% VAT and PDF export for Saudi SMEs and shops. Free, no signup.',
      eyebrow: 'ZATCA Phase 1 invoices',
      heading: 'ZATCA Phase 1 tax invoices with a QR code',
      intro:
        'Qaftr issues simplified tax invoices with the fields Saudi businesses need under Phase 1 (Generation), including the QR code and VAT totals.',
      cta: 'Create your first invoice free',
      sections: [
        {
          heading: 'What is a ZATCA QR invoice?',
          body: 'Under Phase 1, a simplified tax invoice carries a QR code that encodes the seller name, VAT number, invoice timestamp, invoice total and VAT amount.',
        },
        {
          heading: 'Who this is for',
          body: 'Shops, service companies, contractors and other Saudi SMEs that need a fast, correct PDF invoice without heavy accounting software.',
        },
      ],
      faq: [
        {
          question: 'Is Qaftr an official ZATCA app?',
          answer:
            'No. Qaftr is an independent invoicing tool that issues Phase 1 invoice data and QR codes. It is not affiliated with ZATCA.',
        },
        {
          question: 'Does Qaftr cover ZATCA Phase 2 (Integration)?',
          answer:
            'Not yet. Phase 2 requires integrating your invoicing with the FATOORA portal. Wave 25 covers taxpayers with VAT-subject revenue above SAR 187,500 in any year from 2022 to 2025, with integration due by 1 February 2027. If ZATCA has notified you, use an integrated solution and confirm with your accountant.',
        },
        {
          question: 'Can I export the invoice as PDF?',
          answer:
            'Yes. Qaftr supports PDF export so you can share or archive the invoice.',
        },
      ],
      related: [
        { label: 'Free invoice tool', href: '/tools/fatora' },
        { label: 'VAT number checker', href: '/tools/trn-checker' },
        { label: 'Is your business in Wave 25?', href: '/tools/zatca-wave-checker' },
        { label: 'ZATCA Wave 25 guide', href: '/guides/zatca-wave-25' },
      ],
    },
    ar: {
      slug: 'zatca-invoice-generator',
      title: 'فاتورة زاتكا للمرحلة الأولى مع رمز QR | قافتر',
      description:
        'أصدر فاتورة ضريبية مبسطة وفق المرحلة الأولى من زاتكا مع رمز QR وضريبة ١٥٪ وتصدير PDF، للمنشآت الصغيرة والمتوسطة والمتاجر. مجاناً ودون تسجيل.',
      eyebrow: 'فواتير المرحلة الأولى من زاتكا',
      heading: 'فاتورة ضريبية وفق المرحلة الأولى من زاتكا مع رمز QR',
      intro:
        'يُصدر قافتر فاتورة ضريبية مبسطة بالحقول التي تحتاجها المنشآت في السعودية ضمن المرحلة الأولى (مرحلة الإصدار والحفظ)، مع رمز QR وإجماليات الضريبة.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'ما رمز QR في فاتورة زاتكا؟',
          body: 'في المرحلة الأولى تحمل الفاتورة الضريبية المبسطة رمز QR يتضمن اسم البائع، ورقمه الضريبي، ووقت إصدار الفاتورة، وإجمالي الفاتورة، ومبلغ الضريبة.',
        },
        {
          heading: 'لمن هذه الأداة؟',
          body: 'للمتاجر وشركات الخدمات والمقاولين وغيرهم من المنشآت الصغيرة والمتوسطة التي تحتاج فاتورة PDF سريعة وصحيحة دون تعقيد برامج المحاسبة.',
        },
      ],
      faq: [
        {
          question: 'هل قافتر تطبيق رسمي من زاتكا؟',
          answer:
            'لا. قافتر أداة فوترة مستقلة تُصدر بيانات الفاتورة ورمز QR وفق المرحلة الأولى، وهي غير تابعة لهيئة الزكاة والضريبة والجمارك.',
        },
        {
          question: 'هل يغطي قافتر المرحلة الثانية (مرحلة الربط والتكامل)؟',
          answer:
            'ليس بعد. تتطلب المرحلة الثانية ربط نظام الفوترة ببوابة فاتورة. والموجة ٢٥ تشمل من تجاوزت إيراداته الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في أي سنة من ٢٠٢٢ إلى ٢٠٢٥، وموعد ربطها ١ فبراير ٢٠٢٧. إذا أبلغتك زاتكا، فاستخدم حلاً مربوطاً وراجع محاسبك.',
        },
        {
          question: 'هل يمكن تصدير الفاتورة بصيغة PDF؟',
          answer: 'نعم. يمكنك تنزيل الفاتورة بصيغة PDF لإرسالها إلى عميلك أو أرشفتها.',
        },
      ],
      related: [
        { label: 'أداة الفاتورة المجانية', href: '/tools/fatora' },
        { label: 'التحقق من الرقم الضريبي', href: '/tools/trn-checker' },
        { label: 'هل منشأتك ضمن الموجة ٢٥؟', href: '/tools/zatca-wave-checker' },
        { label: 'دليل الموجة ٢٥', href: '/guides/zatca-wave-25' },
      ],
    },
  },
  'vat-invoice-generator-saudi-arabia': {
    en: {
      slug: 'vat-invoice-generator-saudi-arabia',
      title: 'Saudi VAT Invoice Generator — Automatic 15% | Qaftr',
      description:
        'Create Saudi VAT invoices for your business with automatic 15% VAT, line items, totals excluding and including VAT, a QR code and PDF download.',
      eyebrow: 'Saudi VAT invoices',
      heading: 'VAT invoices with automatic 15% VAT',
      intro:
        'Qaftr calculates VAT while you prepare a professional invoice for your Saudi customers, then exports it as a PDF.',
      cta: 'Create your first invoice free',
      sections: [
        {
          heading: 'Totals excluding and including VAT',
          body: 'Qaftr shows the total excluding VAT, the VAT amount and the total including VAT separately, so customers and accountants can read the invoice at a glance.',
        },
        {
          heading: 'Built for repeat customers',
          body: 'Save customers and invoice details with a free account, or use the browser tool for a one-off invoice.',
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
            'Yes. The VAT calculator adds VAT to a net amount or extracts it from a VAT-inclusive total.',
        },
      ],
      related: [
        { label: 'VAT calculator', href: '/tools/vat-calculator' },
        { label: 'Invoice generator', href: '/invoice-generator-saudi-arabia' },
      ],
    },
    ar: {
      slug: 'vat-invoice-generator-saudi-arabia',
      title: 'فاتورة ضريبية بحساب ضريبة ١٥٪ تلقائياً | قافتر',
      description:
        'أصدر فاتورة ضريبية سعودية لمنشأتك مع حساب ضريبة القيمة المضافة ١٥٪ تلقائياً، والبنود، والإجماليات، ورمز QR، وتنزيل PDF.',
      eyebrow: 'فواتير ضريبية سعودية',
      heading: 'فاتورة ضريبية مع حساب ضريبة ١٥٪ تلقائياً',
      intro:
        'يحسب قافتر ضريبة القيمة المضافة أثناء إعداد فاتورة احترافية لعملائك في السعودية، ثم يصدّرها بصيغة PDF.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'الإجمالي غير شامل الضريبة وشاملها',
          body: 'يعرض قافتر الإجمالي غير شامل الضريبة، ومبلغ الضريبة، والإجمالي شامل الضريبة كلاً على حدة، لتكون الفاتورة واضحة للعميل والمحاسب.',
        },
        {
          heading: 'مناسب للعملاء المتكررين',
          body: 'احفظ العملاء والفواتير بحساب مجاني، أو استخدم الأداة المجانية لفاتورة واحدة سريعة.',
        },
      ],
      faq: [
        {
          question: 'ما نسبة الضريبة التي يستخدمها قافتر؟',
          answer: 'يستخدم قافتر النسبة الأساسية لضريبة القيمة المضافة في السعودية، وهي ١٥٪.',
        },
        {
          question: 'هل يمكن حساب الضريبة وحدها؟',
          answer: 'نعم. تضيف حاسبة الضريبة النسبة إلى المبلغ غير شامل الضريبة أو تستخرجها من الإجمالي شامل الضريبة.',
        },
      ],
      related: [
        { label: 'حاسبة ضريبة القيمة المضافة', href: '/tools/vat-calculator' },
        { label: 'برنامج إصدار الفواتير', href: '/invoice-generator-saudi-arabia' },
      ],
    },
  },
  'free-invoice-generator': {
    en: {
      slug: 'free-invoice-generator',
      title: 'Free Invoice Generator for Freelancers & Shops | Qaftr',
      description:
        'Create a free invoice online for freelance work or a small business: customer details, line items, VAT totals, QR code and PDF export. No signup.',
      eyebrow: 'Free invoice generator',
      heading: 'Create a free invoice online',
      intro:
        'Freelancers and small shops can create a clean invoice in the browser without setting up a full accounting system. When you grow, save customers and invoices in a free account.',
      cta: 'Create your first invoice free',
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
      title: 'برنامج فواتير مجاني للمستقلين والمتاجر | قافتر',
      description:
        'أنشئ فاتورة مجانية عبر الإنترنت لعملك الحر أو منشأتك الصغيرة: بيانات العميل، والبنود، والضريبة، ورمز QR، وتنزيل PDF. دون تسجيل.',
      eyebrow: 'برنامج فواتير مجاني',
      heading: 'أنشئ فاتورة مجانية عبر الإنترنت',
      intro:
        'يتيح قافتر لأصحاب العمل الحر والمتاجر الصغيرة إنشاء فاتورة واضحة من المتصفح دون إعداد نظام محاسبي كامل. وعندما يكبر عملك، احفظ عملاءك وفواتيرك في حساب مجاني.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'فاتورتك الأولى دون تسجيل',
          body: 'أنشئ الفاتورة ونزّلها بصيغة PDF مباشرة، وأنشئ حساباً فقط عندما تريد حفظ الفواتير والعملاء.',
        },
        {
          heading: 'جاهزة للإرسال',
          body: 'تتضمن الفاتورة بيانات البائع والمشتري والبنود والضريبة بتنسيق PDF مناسب للمشاركة.',
        },
      ],
      faq: [
        {
          question: 'هل برنامج الفواتير مجاني؟',
          answer:
            'نعم. يمكنك إنشاء الفواتير وتنزيلها مجاناً، مع خطة مدفوعة لمن يحتاج حفظ عدد أكبر من الفواتير.',
        },
        {
          question: 'هل يعمل على الجوال؟',
          answer:
            'نعم. يعمل قافتر في متصفح الجوال ومصمم لإصدار الفواتير بسرعة.',
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
      title: 'E-invoicing in Saudi Arabia for SMEs | Qaftr',
      description:
        'A practical guide to Saudi e-invoicing for SMEs: Phase 1 (Generation), Phase 2 (Integration) and Wave 25, with a free ZATCA Phase 1 invoice tool.',
      eyebrow: 'Saudi e-invoicing basics',
      heading: 'E-invoicing basics for Saudi SMEs',
      intro:
        'If your business invoices customers in Saudi Arabia, Qaftr helps you keep consistent invoice records with VAT totals, the QR code and PDF exports.',
      cta: 'Create your first invoice free',
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
            'E-invoicing means issuing, exchanging and storing invoices in a structured electronic format instead of paper or handwritten invoices. ZATCA rolls it out in two phases: Generation (Phase 1) and Integration (Phase 2).',
        },
        {
          question: 'Can Qaftr replace accounting advice?',
          answer:
            'No. Qaftr helps create invoices, but tax and compliance decisions should be reviewed with a qualified advisor.',
        },
        {
          question: 'Does Qaftr cover ZATCA Phase 2 (Integration)?',
          answer:
            'Not yet. Phase 2 requires integrating your invoicing with the FATOORA portal. Wave 25 covers taxpayers with VAT-subject revenue above SAR 187,500 in any year from 2022 to 2025, with integration due by 1 February 2027. If ZATCA has notified you, use an integrated solution and confirm with your accountant.',
        },
      ],
      related: [
        { label: 'ZATCA invoice generator', href: '/zatca-invoice-generator' },
        { label: 'ZATCA Wave 25 guide', href: '/guides/zatca-wave-25' },
        { label: 'Is your business in Wave 25?', href: '/tools/zatca-wave-checker' },
        { label: 'Support', href: '/support' },
      ],
    },
    ar: {
      slug: 'e-invoicing-saudi-arabia',
      title: 'الفوترة الإلكترونية في السعودية للمنشآت | قافتر',
      description:
        'دليل عملي للفوترة الإلكترونية في السعودية للمنشآت الصغيرة والمتوسطة: مرحلة الإصدار، ومرحلة الربط والتكامل، والموجة ٢٥، مع أداة فاتورة مجانية.',
      eyebrow: 'أساسيات الفوترة الإلكترونية',
      heading: 'أساسيات الفوترة الإلكترونية للمنشآت الصغيرة والمتوسطة',
      intro:
        'إذا كانت منشأتك تُصدر فواتير لعملاء في السعودية، فقافتر يساعدك على الاحتفاظ بسجلات فواتير منتظمة مع الضريبة ورمز QR وتصدير PDF.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'ابدأ بسجلات فواتير منتظمة',
          body: 'استخدم الاسم التجاري والرقم الضريبي نفسيهما، وتسلسلاً واضحاً لأرقام الفواتير وتواريخها، وبيانات عملاء وبنوداً بالبنية نفسها في كل فاتورة.',
        },
        {
          heading: 'احتفظ بنسخ PDF',
          body: 'يسهّل تصدير PDF إرسال الفواتير إلى العملاء وحفظها في سجلات منشأتك المحاسبية.',
        },
      ],
      faq: [
        {
          question: 'ما الفوترة الإلكترونية في السعودية؟',
          answer:
            'هي إصدار الفواتير وتبادلها وحفظها بصيغة إلكترونية منظمة بدلاً من الفواتير الورقية أو المكتوبة يدوياً. وتطبّقها زاتكا على مرحلتين: مرحلة الإصدار والحفظ (المرحلة الأولى)، ومرحلة الربط والتكامل (المرحلة الثانية).',
        },
        {
          question: 'هل يغني قافتر عن الاستشارة المحاسبية؟',
          answer:
            'لا. يساعدك قافتر في إصدار الفواتير، لكن قرارات الضريبة والامتثال ينبغي مراجعتها مع مختص.',
        },
        {
          question: 'هل يغطي قافتر المرحلة الثانية (مرحلة الربط والتكامل)؟',
          answer:
            'ليس بعد. تتطلب المرحلة الثانية ربط نظام الفوترة ببوابة فاتورة. والموجة ٢٥ تشمل من تجاوزت إيراداته الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في أي سنة من ٢٠٢٢ إلى ٢٠٢٥، وموعد ربطها ١ فبراير ٢٠٢٧. إذا أبلغتك زاتكا، فاستخدم حلاً مربوطاً وراجع محاسبك.',
        },
      ],
      related: [
        { label: 'فاتورة زاتكا مع QR', href: '/zatca-invoice-generator' },
        { label: 'دليل الموجة ٢٥', href: '/guides/zatca-wave-25' },
        { label: 'هل منشأتك ضمن الموجة ٢٥؟', href: '/tools/zatca-wave-checker' },
        { label: 'الدعم', href: '/support' },
      ],
    },
  },
  'small-business-invoicing-saudi-arabia': {
    en: {
      slug: 'small-business-invoicing-saudi-arabia',
      title: 'Invoicing Software for Saudi Small Businesses | Qaftr',
      description:
        'Simple invoicing for Saudi small businesses selling B2B and B2C: customers, line items, 15% VAT, QR tax invoices, PDF export and WhatsApp sharing.',
      eyebrow: 'Small business invoicing',
      heading: 'Simple invoicing for Saudi small businesses',
      intro:
        'Qaftr keeps invoicing light enough for owner-led shops and service companies while covering the fields your business and consumer customers expect.',
      cta: 'Create your first invoice free',
      sections: [
        {
          heading: 'Built for owner-led businesses',
          body: 'Issue invoices between customer visits, from your phone or at your desk, without a full finance team.',
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
            'Yes. A free account saves customer details so repeat invoices are faster to issue.',
        },
        {
          question: 'Can I share invoices on WhatsApp?',
          answer:
            'Yes. Qaftr exports PDF invoices that are easy to share with customers on WhatsApp.',
        },
      ],
      related: [
        { label: 'Invoice generator', href: '/invoice-generator-saudi-arabia' },
        { label: 'Tools', href: '/tools' },
      ],
    },
    ar: {
      slug: 'small-business-invoicing-saudi-arabia',
      title: 'برنامج فواتير للمنشآت الصغيرة في السعودية | قافتر',
      description:
        'فوترة بسيطة للمنشآت الصغيرة التي تبيع للشركات والأفراد: العملاء، والبنود، وضريبة ١٥٪، وفواتير ضريبية مع QR، وتصدير PDF، ومشاركة عبر واتساب.',
      eyebrow: 'فواتير المنشآت الصغيرة',
      heading: 'فوترة بسيطة للمنشآت الصغيرة في السعودية',
      intro:
        'يبقي قافتر الفوترة خفيفة تناسب المتاجر وشركات الخدمات التي يديرها أصحابها، مع الحقول التي يتوقعها عملاؤك من الشركات والأفراد.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'مناسب للمنشآت التي يديرها أصحابها',
          body: 'أصدر الفواتير بين زيارات العملاء، أو من الجوال، أو من المكتب، دون الحاجة إلى فريق مالي كامل.',
        },
        {
          heading: 'مصمم للوضوح',
          body: 'إجماليات واضحة، وفصل للضريبة، ورمز QR، وتصدير PDF، لتكون كل فاتورة أسهل في المراجعة والمشاركة.',
        },
      ],
      faq: [
        {
          question: 'هل يدير قافتر بيانات العملاء؟',
          answer:
            'نعم. يحفظ الحساب المجاني بيانات العملاء لتسريع إصدار الفواتير المتكررة.',
        },
        {
          question: 'هل يمكن مشاركة الفواتير عبر واتساب؟',
          answer: 'نعم. يصدّر قافتر الفواتير بصيغة PDF سهلة المشاركة مع العملاء عبر واتساب.',
        },
      ],
      related: [
        { label: 'برنامج إصدار الفواتير', href: '/invoice-generator-saudi-arabia' },
        { label: 'الأدوات', href: '/tools' },
      ],
    },
  },
}

export const seoLandingSlugs = Object.keys(pages) as SeoLandingSlug[]

export function getSeoLandingPage(slug: SeoLandingSlug, lang: MarketingLang) {
  return pages[slug][lang]
}
