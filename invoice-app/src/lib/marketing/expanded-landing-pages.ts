import type { MarketingLang } from './lang'
import type { SeoLandingPage, SeoLandingSlug } from './seo-landing-pages'

/**
 * The three long-form landing pages (docs/MARKET_SEO_AUDIT_2026-11-08.md S6).
 * Each has its own search intent:
 *  - invoicing-software: commercial ("what do I get, what does it cost")
 *  - e-invoicing: informational ("what is changing and what do I do")
 *  - small-business: practical ("how an owner runs invoicing day to day")
 * Tax statements only use items from docs/REGULATORY_CLAIMS_2026-11-13.md.
 * Phase 2 is a private beta: never say it is available, ready or approved.
 */
type Slug = 'invoicing-software-saudi-arabia' | 'e-invoicing-saudi-arabia' | 'small-business-invoicing-saudi-arabia'

export const expandedLandingPages: Record<Extract<SeoLandingSlug, Slug>, Record<MarketingLang, SeoLandingPage>> = {
  'invoicing-software-saudi-arabia': {
    en: {
      slug: 'invoicing-software-saudi-arabia',
      title: 'Invoicing Software for Saudi SMEs: VAT, QR & PDF | Qaftr',
      description:
        'Online invoicing software for Saudi businesses that sell B2B and B2C: standard and simplified tax invoices, 15% VAT, ZATCA Phase 1 QR, PDF and WhatsApp.',
      eyebrow: 'Invoicing software Saudi Arabia',
      heading: 'Invoicing software for Saudi SMEs, without the accounting suite',
      intro:
        'Qaftr is online invoicing software for small and medium businesses in Saudi Arabia. Issue standard tax invoices to companies and simplified tax invoices to consumers, with 15% VAT, the ZATCA Phase 1 QR code and a PDF you can send on WhatsApp. Try it free without signing up.',
      cta: 'Create your first invoice free',
      sections: [
        {
          heading: 'Standard and simplified tax invoices',
          body: 'Choose the invoice type at the top of the form. A standard tax invoice, used for sales to businesses, shows the title “Tax Invoice”, your name, address and VAT number, the buyer’s name, address and VAT number, the issue date, a sequential number, each item with quantity and unit price, the VAT rate, and the VAT amount in Saudi riyals. A simplified tax invoice, used for consumers and counter sales, needs fewer fields and no buyer details, and it carries the ZATCA Phase 1 QR code.',
        },
        {
          heading: 'Arabic first, English when you need it',
          body: 'Tax invoices in Saudi Arabia must be issued in Arabic, and another language may appear alongside it. Qaftr is built right-to-left from the start, so your Arabic invoice reads correctly and the invoice title is printed in both Arabic and English. The interface works in Arabic and English.',
        },
        {
          heading: 'Customers saved once, reused every time',
          body: 'A free account keeps your customers, including their VAT numbers and addresses. Pick a customer from the list and the invoice switches to a standard tax invoice when they have a VAT number. You can add a new customer from the invoice screen.',
        },
        {
          heading: 'Corrections the way ZATCA expects',
          body: 'Once an invoice is issued, you do not edit it. You correct it with a credit note that states its type and the serial number of the invoice it amends. Qaftr’s free credit note tool records the original invoice number and date.',
        },
        {
          heading: 'PDF, WhatsApp and your accountant',
          body: 'Download a PDF or share it on WhatsApp from the same screen. At month end, your accountant gets the totals and a CSV export, and you can invite your accountant to view your invoices without sharing your password.',
        },
        {
          heading: 'Invoicing only, so it stays simple',
          body: 'Qaftr is not an accounting suite. It does invoicing well and leaves out ledgers, inventory and payroll, so you do not pay for tools you do not use. If you outgrow it, you can export your records as a CSV file.',
        },
        {
          heading: 'Moving from Excel or Word',
          body: 'If your invoices live in a spreadsheet or a Word template, start with your next invoice rather than a big migration. Enter your business details once, add customers as you invoice them, and keep your old files for history.',
        },
        {
          heading: 'Free to start, SAR 39 a month for Pro',
          body: 'The free plan saves 3 invoices a month, and you can create a first invoice without an account. Pro removes the limit for SAR 39 a month or SAR 349 a year. Subscriptions renew until you cancel, and you can cancel from the billing page.',
        },
        {
          heading: "Quotations, receipts and notes in one place",
          body: "Beyond invoices, Qaftr has free tools for a quotation that converts into a tax invoice, a receipt voucher, a credit note, and a non-tax invoice for businesses that are not registered for VAT. They share the same business details and look, so your documents match.",
        },
        {
          heading: "What Qaftr does not do",
          body: "Qaftr does not keep your books, track stock or run payroll, and it does not give tax or legal advice. Phase 2 integration with ZATCA is in private beta and is not open to everyone yet, so today Qaftr issues Phase 1 invoices. Check your obligations with your accountant.",
        },
      ],
      faq: [
        {
          question: 'What is the best invoicing software for a small business in Saudi Arabia?',
          answer:
            'It depends on what you need. If you only need compliant invoices, credit notes and a list of customers, a light invoicing tool like Qaftr costs less and takes minutes to learn. If you also need ledgers, inventory and payroll, a full accounting suite fits better. Our comparison page sets out the differences.',
        },
        {
          question: 'Does Qaftr support ZATCA Phase 2?',
          answer:
            "Phase 2 support is in private beta. Qaftr already signs invoices, sends them to ZATCA for clearance or reporting and prints the Phase 2 QR code; we are testing it with a small group of businesses on ZATCA's simulation environment before opening it to everyone. If you are in Wave 25, email support@qaftr.com to join the early-access list; until it opens, Qaftr issues Phase 1 invoices. Confirm your plan with your accountant.",
        },
        {
          question: 'Can I use Qaftr on my phone?',
          answer: 'Yes. Qaftr runs in the browser on phones, tablets and computers, with an Arabic right-to-left interface.',
        },
        {
          question: 'Do I need to install anything?',
          answer: 'No. Qaftr runs in your browser, so there is nothing to install and nothing to update. Open it on any device and sign in.',
        },
        {
          question: 'Can my accountant see my invoices?',
          answer: 'Yes. You can invite your accountant to view your invoices and download the monthly export. You stay in control and can remove the access at any time.',
        },
      ],
      related: [
        { label: 'E-invoicing software compared', href: '/e-invoicing-software-comparison-saudi-arabia' },
        { label: 'Tax invoice requirements', href: '/guides/saudi-tax-invoice-requirements' },
        { label: 'Free tax invoice tool', href: '/tools/fatora' },
        { label: 'ZATCA Wave 25 guide', href: '/guides/zatca-wave-25' },
      ],
    },
    ar: {
      slug: 'invoicing-software-saudi-arabia',
      title: 'برنامج فواتير إلكترونية للمنشآت في السعودية | قافتر',
      description:
        'برنامج فواتير أون لاين للمنشآت التي تبيع للشركات والأفراد: فاتورة ضريبية ومبسطة، وضريبة ١٥٪، ورمز QR للمرحلة الأولى من زاتكا، وPDF وواتساب.',
      eyebrow: 'برنامج فواتير السعودية',
      heading: 'برنامج فواتير للمنشآت الصغيرة والمتوسطة، بلا تعقيد برامج المحاسبة',
      intro:
        'قافتر برنامج فواتير إلكترونية أون لاين للمنشآت الصغيرة والمتوسطة في السعودية. أصدر الفاتورة الضريبية للشركات والفاتورة المبسطة للأفراد، مع ضريبة ١٥٪ ورمز QR للمرحلة الأولى من زاتكا وملف PDF ترسله عبر واتساب. جرّبه مجاناً بدون تسجيل.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'الفاتورة الضريبية والمبسطة',
          body: 'اختر نوع الفاتورة أعلى النموذج. تتضمن الفاتورة الضريبية، وتُستخدم للبيع للمنشآت، عنوان «فاتورة ضريبية»، واسمك وعنوانك ورقمك الضريبي، واسم المشتري وعنوانه ورقمه الضريبي، وتاريخ الإصدار، ورقماً تسلسلياً، وكل بند بكميته وسعر وحدته، ونسبة الضريبة، ومبلغ الضريبة بالريال السعودي. أما الفاتورة المبسطة، وتُستخدم للأفراد ولمبيعات المحل، فحقولها أقل ولا تحتاج بيانات المشتري، وتحمل رمز QR للمرحلة الأولى من زاتكا.',
        },
        {
          heading: 'عربي أولاً، وإنجليزي عند الحاجة',
          body: 'يجب أن تصدر الفواتير الضريبية في السعودية باللغة العربية، ويجوز أن تظهر معها لغة أخرى. بُني قافتر من اليمين إلى اليسار منذ البداية، فتظهر فاتورتك العربية سليمة، ويُطبع عنوان الفاتورة بالعربية والإنجليزية. وتعمل الواجهة بالعربية والإنجليزية.',
        },
        {
          heading: 'عملاء تحفظهم مرة وتستخدمهم دائماً',
          body: 'يحفظ الحساب المجاني عملاءك مع أرقامهم الضريبية وعناوينهم. اختر عميلاً من القائمة فتتحول الفاتورة إلى فاتورة ضريبية إذا كان له رقم ضريبي. ويمكنك إضافة عميل جديد من شاشة الفاتورة.',
        },
        {
          heading: 'تصحيحات بالطريقة التي تطلبها زاتكا',
          body: 'بعد إصدار الفاتورة لا تعدّلها، بل تصحّحها بإشعار دائن يذكر نوعه والرقم التسلسلي للفاتورة التي يعدّلها. وتسجّل أداة الإشعار الدائن المجانية في قافتر رقم الفاتورة الأصلية وتاريخها.',
        },
        {
          heading: 'PDF وواتساب ومحاسبك',
          body: 'نزّل ملف PDF أو شاركه عبر واتساب من الشاشة نفسها. وفي نهاية الشهر يحصل محاسبك على الإجماليات وملف CSV، ويمكنك دعوته لعرض فواتيرك دون مشاركة كلمة مرورك.',
        },
        {
          heading: 'فوترة فقط، لتبقى بسيطة',
          body: 'قافتر ليس برنامج محاسبة متكاملاً؛ يتقن الفوترة ويستغني عن الدفاتر والمخزون والرواتب، فلا تدفع مقابل أدوات لا تستخدمها. وإذا كبرت حاجتك فيمكنك تصدير سجلاتك بصيغة CSV.',
        },
        {
          heading: 'الانتقال من إكسل أو وورد',
          body: 'إذا كانت فواتيرك في جدول بيانات أو قالب وورد، فابدأ بفاتورتك القادمة بدلاً من ترحيل كبير. أدخل بيانات منشأتك مرة واحدة، وأضف العملاء كلما فوترتهم، واحتفظ بملفاتك القديمة للسجل.',
        },
        {
          heading: 'ابدأ مجاناً، وبرو بـ ٣٩ ريالاً شهرياً',
          body: 'تحفظ الخطة المجانية ٣ فواتير شهرياً، ويمكنك إنشاء أول فاتورة دون حساب. وتلغي خطة برو هذا الحد مقابل ٣٩ ريالاً شهرياً أو ٣٤٩ ريالاً سنوياً. وتتجدد الاشتراكات حتى تلغيها، ويمكنك الإلغاء من صفحة الفوترة.',
        },
        {
          heading: "عروض الأسعار والسندات والإشعارات في مكان واحد",
          body: "إلى جانب الفواتير، يوفر قافتر أدوات مجانية لعرض سعر يتحول إلى فاتورة ضريبية، وسند قبض، وإشعار دائن، وفاتورة غير ضريبية للمنشآت غير المسجلة في ضريبة القيمة المضافة. وتشترك كلها في بيانات منشأتك وشكلها، فتتطابق مستنداتك.",
        },
        {
          heading: "ما لا يفعله قافتر",
          body: "لا يمسك قافتر دفاترك ولا يتتبع المخزون ولا يدير الرواتب، ولا يقدّم استشارة ضريبية أو قانونية. والربط مع زاتكا في المرحلة الثانية في مرحلة تجريبية خاصة وليس متاحاً للجميع بعد، فيُصدر قافتر اليوم فواتير المرحلة الأولى. راجع التزاماتك مع محاسبك.",
        },
      ],
      faq: [
        {
          question: 'ما أفضل برنامج فواتير لمنشأة صغيرة في السعودية؟',
          answer:
            'يعتمد على حاجتك. إذا كنت تحتاج فواتير نظامية وإشعارات دائنة وقائمة عملاء فقط، فأداة فوترة خفيفة مثل قافتر أقل تكلفة وتتعلمها في دقائق. وإذا كنت تحتاج دفاتر ومخزوناً ورواتب، فبرنامج المحاسبة المتكامل أنسب. وتوضح صفحة المقارنة الفروق.',
        },
        {
          question: 'هل يدعم قافتر المرحلة الثانية من زاتكا؟',
          answer:
            'دعم المرحلة الثانية في مرحلة تجريبية خاصة. يوقّع قافتر الفواتير ويرسلها إلى زاتكا للاعتماد أو الإبلاغ ويطبع رمز QR للمرحلة الثانية، ونختبره حالياً مع عدد محدود من المنشآت على بيئة المحاكاة لدى زاتكا قبل إتاحته للجميع. إذا كانت منشأتك ضمن الموجة ٢٥ فراسلنا على support@qaftr.com للانضمام إلى قائمة الوصول المبكر، وحتى الإتاحة يُصدر قافتر فواتير وفق المرحلة الأولى. وراجع خطتك مع محاسبك.',
        },
        {
          question: 'هل يعمل قافتر على الجوال؟',
          answer: 'نعم. يعمل قافتر من المتصفح على الجوال والجهاز اللوحي والحاسب، بواجهة عربية من اليمين إلى اليسار.',
        },
        {
          question: 'هل أحتاج إلى تثبيت برنامج؟',
          answer: 'لا. يعمل قافتر من المتصفح، فلا تثبيت ولا تحديثات. افتحه على أي جهاز وسجّل الدخول.',
        },
        {
          question: 'هل يستطيع محاسبي رؤية فواتيري؟',
          answer: 'نعم. يمكنك دعوة محاسبك لعرض فواتيرك وتنزيل التصدير الشهري، وتبقى أنت المتحكم ويمكنك إزالة الوصول في أي وقت.',
        },
      ],
      related: [
        { label: 'مقارنة برامج الفوترة الإلكترونية', href: '/e-invoicing-software-comparison-saudi-arabia' },
        { label: 'متطلبات الفاتورة الضريبية', href: '/guides/saudi-tax-invoice-requirements' },
        { label: 'أداة الفاتورة الضريبية المجانية', href: '/tools/fatora' },
        { label: 'دليل الموجة ٢٥', href: '/guides/zatca-wave-25' },
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
        'E-invoicing in Saudi Arabia is rolling out in two phases, and Phase 2 is reaching small businesses wave by wave. This page explains what each phase means for an SME, what to do now, and where Qaftr fits.',
      cta: 'Create your first invoice free',
      sections: [
        {
          heading: 'What e-invoicing means',
          body: 'E-invoicing means issuing, exchanging and storing invoices in a structured electronic format instead of paper or handwritten invoices. It applies to VAT-registered businesses. A business that is not registered for VAT may not issue a tax invoice or any document that shows a VAT amount.',
        },
        {
          heading: 'Phase 1: Generation',
          body: 'Phase 1 (Generation) is the first stage of ZATCA’s e-invoicing rules for VAT-registered businesses: tax invoices are generated and stored electronically. Simplified tax invoices, the type used for consumers, must carry a QR code with five fields. Standard tax invoices issued to businesses do not need the Phase 1 QR code.',
        },
        {
          heading: 'Phase 2: Integration',
          body: 'Phase 2 connects your invoicing system to ZATCA’s FATOORA platform. Standard tax invoices and their credit and debit notes are cleared by FATOORA, which adds the cryptographic stamp and QR code. Simplified invoices carry your own stamp and are reported to FATOORA within 24 hours of being generated.',
        },
        {
          heading: 'Waves and deadlines',
          body: 'ZATCA brings taxpayers into Phase 2 in waves. As announced by ZATCA, Wave 25 covers VAT-registered taxpayers whose VAT-subject revenue exceeded SAR 187,500 in the reference years ZATCA specifies (our checker asks about 2022 to 2025), with integration due by 1 February 2027. Your ZATCA notification is what counts. Check your notification, and use our free checker to see where you stand.',
        },
        {
          heading: 'Start with consistent invoice records',
          body: 'Use the same business name, VAT number, invoice dates, customer fields and line-item structure on every invoice. Number invoices in an unbroken sequence. Clean, consistent records make any later move to an integrated system much easier.',
        },
        {
          heading: 'Keep PDF copies and your corrections in order',
          body: 'PDF exports make it easy to share invoices and keep records for your accountant. When an invoice needs correcting, issue a credit note that states its type and the serial number of the original invoice, rather than editing the invoice.',
        },
        {
          heading: 'A short readiness checklist',
          body: 'Confirm whether you are VAT-registered and which wave ZATCA has placed you in. Make sure your invoices show every mandatory field. Choose who will onboard your device or solution, and agree a date with your accountant. If you are in Wave 25, plan to be integrated by 1 February 2027.',
        },
        {
          heading: 'Where Qaftr fits',
          body: 'Today Qaftr issues Phase 1 invoices with the ZATCA QR code, plus a free credit note tool, PDF and WhatsApp sharing. Phase 2 support is in private beta on ZATCA’s simulation environment and is not open to everyone yet. Qaftr does not replace your accountant’s advice.',
        },
        {
          heading: "Why not wait for your deadline",
          body: "Meeting a deadline at the last minute is the riskiest way to do it. Businesses that tidy their invoice records, confirm their wave and agree an onboarding date early have time to test first. If your wave has not been announced yet, use the time to clean up your customer data, since a standard tax invoice needs the buyer’s name, address and VAT number.",
        },
        {
          heading: "Questions to ask any provider",
          body: "Ask any provider whether it can integrate your business with the FATOORA platform for your wave, how it handles clearance and 24-hour reporting, what it costs per month, whether credit and debit notes are supported, and what happens to your invoices if you leave.",
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
            "Phase 2 support is in private beta. Qaftr already signs invoices, sends them to ZATCA for clearance or reporting and prints the Phase 2 QR code; we are testing it with a small group of businesses on ZATCA's simulation environment before opening it to everyone. As announced by ZATCA, Wave 25 covers VAT-registered taxpayers whose VAT-subject revenue exceeded SAR 187,500 in the reference years ZATCA specifies (our checker asks about 2022 to 2025), with integration due by 1 February 2027; your ZATCA notification is what counts. If you are in Wave 25, email support@qaftr.com to join the early-access list; until it opens, Qaftr issues Phase 1 invoices. Confirm your plan with your accountant.",
        },
        {
          question: 'What is the difference between clearance and reporting?',
          answer:
            'Clearance applies to standard tax invoices (sales to businesses): ZATCA’s FATOORA platform checks and stamps the invoice before you share it. Reporting applies to simplified tax invoices (consumer sales): you issue the invoice first and report it to FATOORA within 24 hours.',
        },
        {
          question: 'Do I need e-invoicing if I am not registered for VAT?',
          answer:
            'E-invoicing applies to tax invoices issued by VAT-registered businesses. If you are not registered, you issue a regular invoice without VAT and without a QR code, and you must not show a VAT amount. Registration is mandatory when your taxable supplies pass SAR 375,000 in 12 months, and voluntary when your taxable supplies or expenses pass SAR 187,500.',
        },
      ],
      related: [
        { label: 'ZATCA invoice generator', href: '/zatca-invoice-generator' },
        { label: 'ZATCA Wave 25 guide', href: '/guides/zatca-wave-25' },
        { label: 'Is your business in Wave 25?', href: '/tools/zatca-wave-checker' },
        { label: 'Standard vs simplified invoice', href: '/guides/tax-invoice-vs-simplified-invoice' },
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
        'تُطبَّق الفوترة الإلكترونية في السعودية على مرحلتين، وتصل المرحلة الثانية إلى المنشآت الصغيرة موجةً بعد موجة. تشرح هذه الصفحة معنى كل مرحلة لمنشأة صغيرة، وما تفعله الآن، وأين يناسبك قافتر.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'ما معنى الفوترة الإلكترونية؟',
          body: 'هي إصدار الفواتير وتبادلها وحفظها بصيغة إلكترونية منظمة بدلاً من الفواتير الورقية أو المكتوبة يدوياً، وتنطبق على المنشآت المسجلة في ضريبة القيمة المضافة. أما المنشأة غير المسجلة فلا يجوز لها إصدار فاتورة ضريبية ولا أي مستند يظهر فيه مبلغ ضريبة.',
        },
        {
          heading: 'المرحلة الأولى: الإصدار والحفظ',
          body: 'تطلب المرحلة الأولى من المنشآت المسجلة في الضريبة إصدار الفواتير الضريبية وحفظها إلكترونياً لا يدوياً ولا ورقياً. ويجب أن تحمل الفاتورة الضريبية المبسطة، وهي المستخدمة للأفراد، رمز QR بخمسة حقول. أما الفواتير الضريبية الصادرة للمنشآت فلا تحتاج رمز QR الخاص بالمرحلة الأولى.',
        },
        {
          heading: 'المرحلة الثانية: الربط والتكامل',
          body: 'تربط المرحلة الثانية نظام فوترتك بمنصة فاتورة لدى زاتكا. تُعتمد الفواتير الضريبية وإشعاراتها الدائنة والمدينة عبر المنصة التي تضيف الختم التشفيري ورمز QR، أما الفواتير المبسطة فتحمل ختمك أنت وتُبلَّغ إلى المنصة خلال ٢٤ ساعة من إنشائها.',
        },
        {
          heading: 'الموجات والمواعيد',
          body: 'تُدخل زاتكا المكلفين في المرحلة الثانية على موجات، وتشمل الموجة ٢٥ بحسب إعلان زاتكا المسجلين في الضريبة الذين تجاوزت إيراداتهم الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في السنوات المرجعية التي تحددها زاتكا (تسأل أداتنا عن ٢٠٢٢ إلى ٢٠٢٥)، وموعد الربط ١ فبراير ٢٠٢٧. والمعتمد هو إشعارك من زاتكا. راجع إشعارك، واستخدم أداتنا المجانية لتعرف موقعك.',
        },
        {
          heading: 'ابدأ بسجلات فواتير منتظمة',
          body: 'استخدم الاسم التجاري والرقم الضريبي نفسيهما، وتواريخ الفواتير وحقول العملاء وبنية البنود بالطريقة نفسها في كل فاتورة، ورقّم الفواتير بتسلسل غير منقطع. السجلات المنتظمة تسهّل كثيراً أي انتقال لاحق إلى نظام مرتبط.',
        },
        {
          heading: 'احتفظ بنسخ PDF ورتّب تصحيحاتك',
          body: 'يسهّل تصدير PDF مشاركة الفواتير وحفظ السجلات لمحاسبك. وعندما تحتاج الفاتورة إلى تصحيح، أصدر إشعاراً دائناً يذكر نوعه والرقم التسلسلي للفاتورة الأصلية بدلاً من تعديل الفاتورة.',
        },
        {
          heading: 'قائمة جاهزية مختصرة',
          body: 'تأكد مما إذا كنت مسجلاً في ضريبة القيمة المضافة وفي أي موجة صنّفتك زاتكا. وتأكد أن فواتيرك تتضمن كل الحقول الإلزامية. وحدّد من سيتولى ربط جهازك أو حلّك، واتفق مع محاسبك على موعد. وإذا كنت ضمن الموجة ٢٥ فخطّط للربط بحلول ١ فبراير ٢٠٢٧.',
        },
        {
          heading: 'أين يناسبك قافتر',
          body: 'يُصدر قافتر اليوم فواتير المرحلة الأولى مع رمز QR وفق متطلبات زاتكا، وأداة إشعار دائن مجانية، ومشاركة PDF وواتساب. ودعم المرحلة الثانية في مرحلة تجريبية خاصة على بيئة المحاكاة لدى زاتكا، وليس متاحاً للجميع بعد. ولا يغني قافتر عن استشارة محاسبك.',
        },
        {
          heading: "لماذا لا تنتظر موعدك الأخير",
          body: "الالتزام بالموعد في اللحظة الأخيرة أكثر الطرق مخاطرة. المنشآت التي ترتب سجلات فواتيرها وتتأكد من موجتها وتتفق مبكراً على موعد الربط يتوفر لها وقت للتجربة أولاً. وإذا لم يُعلَن عن موجتك بعد، فاستغل الوقت في تنظيف بيانات عملائك، فالفاتورة الضريبية تحتاج اسم المشتري وعنوانه ورقمه الضريبي.",
        },
        {
          heading: "أسئلة تطرحها على أي مزود",
          body: "اسأل أي مزود هل يستطيع ربط منشأتك بمنصة فاتورة في موجتك، وكيف يتعامل مع الاعتماد والإبلاغ خلال ٢٤ ساعة، وكم يكلّف شهرياً، وهل يدعم الإشعارات الدائنة والمدينة، وماذا يحدث لفواتيرك إذا غادرته.",
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
            'دعم المرحلة الثانية في مرحلة تجريبية خاصة. يوقّع قافتر الفواتير ويرسلها إلى زاتكا للاعتماد أو الإبلاغ ويطبع رمز QR للمرحلة الثانية، ونختبره حالياً مع عدد محدود من المنشآت على بيئة المحاكاة لدى زاتكا قبل إتاحته للجميع. والموجة ٢٥ تشمل بحسب إعلان زاتكا المسجلين الذين تجاوزت إيراداتهم الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في السنوات المرجعية التي تحددها زاتكا (تسأل أداتنا عن ٢٠٢٢ إلى ٢٠٢٥)، وموعد ربطها ١ فبراير ٢٠٢٧، والمعتمد هو إشعارك من زاتكا. إذا كانت منشأتك ضمن الموجة ٢٥ فراسلنا على support@qaftr.com للانضمام إلى قائمة الوصول المبكر، وحتى الإتاحة يُصدر قافتر فواتير وفق المرحلة الأولى. وراجع خطتك مع محاسبك.',
        },
        {
          question: 'ما الفرق بين الاعتماد والإبلاغ؟',
          answer:
            'يُطبَّق الاعتماد على الفواتير الضريبية (البيع للمنشآت): تفحص منصة فاتورة لدى زاتكا الفاتورة وتختمها قبل مشاركتها. ويُطبَّق الإبلاغ على الفواتير الضريبية المبسطة (البيع للأفراد): تُصدر الفاتورة أولاً ثم تبلّغ المنصة خلال ٢٤ ساعة.',
        },
        {
          question: 'هل أحتاج الفوترة الإلكترونية إذا لم أكن مسجلاً في ضريبة القيمة المضافة؟',
          answer:
            'تنطبق الفوترة الإلكترونية على الفواتير الضريبية التي تصدرها المنشآت المسجلة. وإذا لم تكن مسجلاً فتصدر فاتورة عادية بلا ضريبة وبلا رمز QR، ولا يجوز أن تُظهر فيها مبلغ ضريبة. والتسجيل إلزامي إذا تجاوزت توريداتك الخاضعة للضريبة ٣٧٥٬٠٠٠ ريال خلال ١٢ شهراً، واختياري إذا تجاوزت توريداتك أو مصروفاتك الخاضعة للضريبة ١٨٧٬٥٠٠ ريال.',
        },
      ],
      related: [
        { label: 'فاتورة زاتكا مع QR', href: '/zatca-invoice-generator' },
        { label: 'دليل الموجة ٢٥', href: '/guides/zatca-wave-25' },
        { label: 'هل منشأتك ضمن الموجة ٢٥؟', href: '/tools/zatca-wave-checker' },
        { label: 'الفاتورة الضريبية والمبسطة', href: '/guides/tax-invoice-vs-simplified-invoice' },
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
        'Qaftr keeps invoicing light enough for owner-led shops and service companies while covering the fields your business and consumer customers expect. Here is how a small business can run invoicing day to day.',
      cta: 'Create your first invoice free',
      sections: [
        {
          heading: 'Built for owner-led businesses',
          body: 'Issue invoices between customer visits, from your phone or at your desk, without a full finance team. The form asks only for what an invoice needs, and your business details are saved once.',
        },
        {
          heading: 'Shop and counter sales',
          body: 'For walk-in customers, issue a simplified tax invoice in a few taps. It needs no buyer details and carries the ZATCA QR code. Keep the simplified type selected and it is ready for the next customer.',
        },
        {
          heading: 'Selling to companies',
          body: 'When your customer is a business with a VAT number, pick them from your saved list and the invoice becomes a standard tax invoice with their name, address and VAT number. Save the customer once and every later invoice takes seconds.',
        },
        {
          heading: 'Service businesses and repeat customers',
          body: 'If you bill the same clients every month, choose the customer and enter your usual items each time. Clear totals, with VAT shown separately, make each invoice easy for your customer to review and approve.',
        },
        {
          heading: 'Getting paid',
          body: 'Send the PDF on WhatsApp the moment the job is done. A WhatsApp follow-up button on each unpaid invoice helps you chase payments, so late payments do not depend on you remembering to ask.',
        },
        {
          heading: 'Are you registered for VAT?',
          body: 'VAT registration is mandatory when your taxable supplies pass SAR 375,000 in 12 months, and voluntary when your taxable supplies or expenses pass SAR 187,500. If you are not registered, you must not issue a tax invoice or any document showing a VAT amount; use the free non-tax invoice tool instead.',
        },
        {
          heading: 'Month end with your accountant',
          body: 'Give your accountant the monthly totals and a CSV export, or invite them to view your invoices directly. It replaces the shoebox of receipts and the end-of-month scramble, and keeps every invoice and credit note in one place that is easy to look up when a customer or accountant asks.',
        },
        {
          heading: 'Designed for clarity',
          body: 'Clear totals, VAT separation, QR code support and PDF output make every invoice easier to review and share, whether it is your first of the week or your fiftieth, and your customer understands it at a glance without further explanation.',
        },
        {
          heading: "Quotations and receipts before the invoice",
          body: "Win the job with a free quotation that shows the 15% VAT and a validity date, then convert it into a tax invoice when the customer accepts. When a customer pays in cash or by transfer, give a receipt voucher that states the amount in figures and in words. A quotation and a receipt voucher are not tax invoices.",
        },
        {
          heading: "When a customer returns something",
          body: "If a customer returns goods you invoiced, or you agree a discount after the invoice, do not edit the original. Issue a credit note that states its type and the serial number of the invoice it amends. A credit note is only for an adjustment to a prior supply, such as an accepted return, a change in the agreed value, or an error in the customer’s information.",
        },
        {
          heading: "Working from your phone",
          body: "Qaftr runs in the browser, so you can issue and send an invoice from a phone while you are still on site with the customer. The interface is right-to-left Arabic with an English option, so the invoice looks right for both of you.",
        },
        {
          heading: "What it costs",
          body: "You can create an invoice without signing up. A free account saves 3 invoices a month and your customer list. If you invoice more often, Pro removes the limit for SAR 39 a month or SAR 349 a year, and you can cancel any time from the billing page.",
        },
        {
          heading: "A simple weekly routine",
          body: "Issue invoices as the work is done, send the PDF the same day, check which invoices are still open, and follow up on the oldest first. At month end, send your accountant the totals. Ten minutes a week keeps your records current.",
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
        {
          question: 'Is Qaftr free for a small business?',
          answer:
            'You can create an invoice without signing up. A free account saves 3 invoices a month. Pro removes that limit for SAR 39 a month or SAR 349 a year.',
        },
        {
          question: 'I am not registered for VAT. Can I still use Qaftr?',
          answer:
            'Yes, for documents that do not show VAT. If you are not registered for VAT you must not issue a tax invoice or charge VAT, so use the free non-tax invoice tool and register when your supplies pass the threshold.',
        },
        {
          question: 'Do I need an accountant to use Qaftr?',
          answer:
            'No, but we recommend one for tax decisions. Qaftr creates invoices; it does not give tax or legal advice. Your accountant can be invited to view your invoices and download the monthly export.',
        },
        {
          question: "How do I invoice a company and a consumer differently?",
          answer: "For a company with a VAT number, pick it from your customer list and the invoice becomes a standard tax invoice with their name, address and VAT number. For a consumer or a counter sale, keep the simplified type: no buyer details are needed and the invoice carries the QR code.",
        },
      ],
      related: [
        { label: 'Free tax invoice tool', href: '/tools/fatora' },
        { label: 'Non-tax invoice (not VAT-registered)', href: '/tools/non-tax-invoice' },
        { label: 'Invoicing software for SMEs', href: '/invoicing-software-saudi-arabia' },
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
        'يبقي قافتر الفوترة خفيفة تناسب المتاجر وشركات الخدمات التي يديرها أصحابها، مع الحقول التي يتوقعها عملاؤك من الشركات والأفراد. وهذه طريقة تدير بها منشأة صغيرة فوترتها يوماً بيوم.',
      cta: 'أصدر فاتورتك الأولى مجاناً',
      sections: [
        {
          heading: 'مناسب للمنشآت التي يديرها أصحابها',
          body: 'أصدر الفواتير بين زيارات العملاء، أو من الجوال، أو من المكتب، دون الحاجة إلى فريق مالي كامل. يطلب النموذج ما تحتاجه الفاتورة فقط، وتُحفظ بيانات منشأتك مرة واحدة.',
        },
        {
          heading: 'مبيعات المحل والكاشير',
          body: 'لعملاء المحل، أصدر فاتورة ضريبية مبسطة بنقرات قليلة. لا تحتاج بيانات المشتري وتحمل رمز QR وفق متطلبات زاتكا. أبقِ النوع المبسط محدداً فتكون جاهزة للعميل التالي.',
        },
        {
          heading: 'البيع للشركات',
          body: 'عندما يكون عميلك منشأة لها رقم ضريبي، اخترها من قائمتك المحفوظة فتصبح الفاتورة ضريبية باسمها وعنوانها ورقمها الضريبي. احفظ العميل مرة واحدة فتستغرق كل فاتورة لاحقة ثواني.',
        },
        {
          heading: 'شركات الخدمات والعملاء المتكررون',
          body: 'إذا كنت تفوتر العملاء أنفسهم كل شهر، فاختر العميل وأدخل بنودك المعتادة في كل مرة. إجماليات واضحة مع إظهار الضريبة منفصلة تسهّل على عميلك مراجعة كل فاتورة واعتمادها.',
        },
        {
          heading: 'تحصيل المدفوعات',
          body: 'أرسل ملف PDF عبر واتساب فور إنجاز العمل. ويساعدك زر المتابعة عبر واتساب على كل فاتورة غير مدفوعة في مطالبة العملاء، فلا يعتمد التحصيل المتأخر على تذكّرك للمطالبة.',
        },
        {
          heading: 'هل أنت مسجل في ضريبة القيمة المضافة؟',
          body: 'التسجيل إلزامي إذا تجاوزت توريداتك الخاضعة للضريبة ٣٧٥٬٠٠٠ ريال خلال ١٢ شهراً، واختياري إذا تجاوزت توريداتك أو مصروفاتك الخاضعة للضريبة ١٨٧٬٥٠٠ ريال. وإذا لم تكن مسجلاً فلا يجوز لك إصدار فاتورة ضريبية ولا أي مستند يظهر فيه مبلغ ضريبة؛ استخدم أداة الفاتورة غير الضريبية المجانية.',
        },
        {
          heading: 'نهاية الشهر مع محاسبك',
          body: 'سلّم محاسبك الإجماليات الشهرية وملف CSV، أو ادعُه لعرض فواتيرك مباشرة. يغني ذلك عن صندوق الإيصالات وازدحام نهاية الشهر، ويبقي كل فاتورة وإشعار دائن في مكان واحد يسهل الرجوع إليه عند أي استفسار من عميل أو محاسب.',
        },
        {
          heading: 'مصمم للوضوح',
          body: 'إجماليات واضحة، وفصل للضريبة، ورمز QR، وتصدير PDF، لتكون كل فاتورة أسهل في المراجعة والمشاركة، سواء كانت أولى فواتير الأسبوع أو الخمسين، ويفهمها عميلك من النظرة الأولى دون حاجة إلى شرح إضافي.',
        },
        {
          heading: "عرض السعر والإيصال قبل الفاتورة",
          body: "اكسب العمل بعرض سعر مجاني يُظهر ضريبة ١٥٪ وتاريخ صلاحية، ثم حوّله إلى فاتورة ضريبية عندما يقبل العميل. وعندما يدفع العميل نقداً أو بتحويل، أعطه سند قبض يذكر المبلغ بالأرقام وبالحروف. وعرض السعر وسند القبض ليسا فاتورة ضريبية.",
        },
        {
          heading: "عندما يعيد العميل بضاعة",
          body: "إذا أعاد العميل بضاعة فوترتها، أو اتفقتما على خصم بعد الفاتورة، فلا تعدّل الأصل. أصدر إشعاراً دائناً يذكر نوعه والرقم التسلسلي للفاتورة التي يعدّلها. والإشعار الدائن لا يصدر إلا لتعديل توريد سابق، مثل مرتجع مقبول أو تغيير في القيمة المتفق عليها أو خطأ في بيانات العميل.",
        },
        {
          heading: "من جوالك",
          body: "يعمل قافتر من المتصفح، فتستطيع إصدار الفاتورة وإرسالها من الجوال وأنت ما زلت عند العميل. والواجهة عربية من اليمين إلى اليسار مع خيار الإنجليزية، فتظهر الفاتورة سليمة لكليكما.",
        },
        {
          heading: "كم يكلّف",
          body: "يمكنك إنشاء فاتورة دون تسجيل. ويحفظ الحساب المجاني ٣ فواتير شهرياً وقائمة عملائك. وإذا كنت تفوتر أكثر، تلغي خطة برو الحد مقابل ٣٩ ريالاً شهرياً أو ٣٤٩ ريالاً سنوياً، ويمكنك الإلغاء في أي وقت من صفحة الفوترة.",
        },
        {
          heading: "روتين أسبوعي بسيط",
          body: "أصدر الفواتير عند إنجاز العمل، وأرسل ملف PDF في اليوم نفسه، وراجع الفواتير التي ما زالت مفتوحة، وتابع الأقدم أولاً. وفي نهاية الشهر أرسل لمحاسبك الإجماليات. عشر دقائق أسبوعياً تُبقي سجلاتك محدّثة.",
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
        {
          question: 'هل قافتر مجاني للمنشأة الصغيرة؟',
          answer:
            'يمكنك إنشاء فاتورة دون تسجيل. ويحفظ الحساب المجاني ٣ فواتير شهرياً. وتلغي خطة برو هذا الحد مقابل ٣٩ ريالاً شهرياً أو ٣٤٩ ريالاً سنوياً.',
        },
        {
          question: 'لست مسجلاً في ضريبة القيمة المضافة، هل يمكنني استخدام قافتر؟',
          answer:
            'نعم، للمستندات التي لا تُظهر ضريبة. وإذا لم تكن مسجلاً فلا يجوز لك إصدار فاتورة ضريبية ولا تحصيل ضريبة، فاستخدم أداة الفاتورة غير الضريبية المجانية وسجّل عندما تتجاوز توريداتك الحد المطلوب.',
        },
        {
          question: 'هل أحتاج محاسباً لاستخدام قافتر؟',
          answer:
            'لا، لكننا نوصي به لقرارات الضريبة. ينشئ قافتر الفواتير ولا يقدّم استشارة ضريبية أو قانونية. ويمكنك دعوة محاسبك لعرض فواتيرك وتنزيل التصدير الشهري.',
        },
        {
          question: "كيف أفوتر الشركة والفرد بطريقتين مختلفتين؟",
          answer: "للشركة التي لها رقم ضريبي، اخترها من قائمة عملائك فتصبح الفاتورة ضريبية باسمها وعنوانها ورقمها الضريبي. وللفرد أو لمبيعات المحل، أبقِ النوع المبسط: لا تحتاج بيانات المشتري وتحمل الفاتورة رمز QR.",
        },
      ],
      related: [
        { label: 'أداة الفاتورة الضريبية المجانية', href: '/tools/fatora' },
        { label: 'فاتورة غير ضريبية (غير مسجل في الضريبة)', href: '/tools/non-tax-invoice' },
        { label: 'برنامج فواتير للمنشآت', href: '/invoicing-software-saudi-arabia' },
        { label: 'الأدوات', href: '/tools' },
      ],
    },
  },
}
