import type { MarketingLang } from './lang'

type Copy = {
  nav: { features: string; pricing: string; support: string }
  cta: { download: string; comingSoon: string }
  footer: { privacy: string; support: string; rights: string; tagline: string }
  home: {
    kicker: string
    title: string
    titleAccent: string
    subtitle: string
    badgeZatca: string
    badgeFreelancer: string
    featuresTitle: string
    features: Array<{ title: string; body: string }>
    howTitle: string
    steps: Array<{ num: string; title: string; body: string }>
    pricingTitle: string
    pricingSubtitle: string
    free: { name: string; price: string; period: string; features: string[] }
    pro: { name: string; priceMonthly: string; priceYearly: string; badge: string; features: string[] }
    ctaTitle: string
    ctaBody: string
  }
  privacy: {
    title: string
    updated: string
    sections: Array<{ heading: string; body: string }>
  }
  support: {
    title: string
    subtitle: string
    emailLabel: string
    emailHint: string
    topics: Array<{ title: string; body: string }>
    faqTitle: string
    faqs: Array<{ q: string; a: string }>
  }
}

const ar: Copy = {
  nav: { features: 'المميزات', pricing: 'الأسعار', support: 'الدعم' },
  cta: { download: 'حمّل التطبيق', comingSoon: 'قريباً على المتاجر' },
  footer: {
    privacy: 'سياسة الخصوصية',
    support: 'الدعم',
    rights: 'جميع الحقوق محفوظة',
    tagline: 'فواتير زاتكا للمستقلين في السعودية',
  },
  home: {
    kicker: 'فوترة إلكترونية للمستقلين',
    title: 'أنشئ فاتورة زاتكا',
    titleAccent: 'في ثوانٍ',
    subtitle:
      'قافتر — تطبيق بسيط بالعربية لإنشاء فاتورة ضريبية متوافقة مع المرحلة الأولى: عملاء، ضريبة 15٪، QR، PDF، ومشاركة واتساب.',
    badgeZatca: 'ZATCA Phase 1',
    badgeFreelancer: 'للمستقلين',
    featuresTitle: 'كل ما تحتاجه للفوترة',
    features: [
      {
        title: 'QR فاتورة زاتكا',
        body: 'رمز QR متوافق مع متطلبات المرحلة الأولى على كل فاتورة ضريبية.',
      },
      {
        title: 'عربي أولاً',
        body: 'واجهة RTL، عملاء، وفواتير بالعربية والإنجليزية — بدون تعقيد برامج المحاسبة.',
      },
      {
        title: 'فاتورة واتساب',
        body: 'شارك PDF الفاتورة مباشرة مع عملائك بنقرة واحدة.',
      },
      {
        title: 'شعار وعلامة تجارية',
        body: 'ارفع شعارك وخصّص قالب الفاتورة ليعكس هوية عملك.',
      },
      {
        title: 'ضريبة 15٪',
        body: 'حساب تلقائي للضريبة والإجمالي — بدون أخطاء يدوية.',
      },
      {
        title: 'PDF جاهز',
        body: 'صدّر فاتورتك PDF احترافية جاهزة للإرسال والأرشفة.',
      },
    ],
    howTitle: 'كيف يعمل؟',
    steps: [
      { num: '١', title: 'أضف بياناتك', body: 'اسم النشاط، الرقم الضريبي، والشعار.' },
      { num: '٢', title: 'أنشئ فاتورة', body: 'اختر العميل، أضف البنود، وشاهد الإجمالي.' },
      { num: '٣', title: 'شارك', body: 'أرسل PDF عبر واتساب أو احفظه للأرشفة.' },
    ],
    pricingTitle: 'أسعار بسيطة وشفافة',
    pricingSubtitle: 'ابدأ مجاناً — ترقّ للبرو عندما تحتاج فواتير غير محدودة.',
    free: {
      name: 'مجاني',
      price: '٠',
      period: 'ر.س / شهر',
      features: ['٣ فواتير شهرياً', 'QR زاتكا', 'PDF وواتساب', 'قالب أساسي'],
    },
    pro: {
      name: 'برو',
      priceMonthly: '٣٩',
      priceYearly: '٣٤٩',
      badge: 'الأكثر شعبية',
      features: [
        'فواتير غير محدودة',
        'كل القوالب',
        'تذكيرات الفواتير',
        'دعم أولوية',
      ],
    },
    ctaTitle: 'جاهز لتبسيط فواتيرك؟',
    ctaBody: 'قافتر قادم قريباً على App Store و Google Play.',
  },
  privacy: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: يونيو ٢٠٢٦',
    sections: [
      {
        heading: 'مقدمة',
        body: 'قافتر («نحن») يحترم خصوصيتك. توضّح هذه السياسة كيف نجمع ونستخدم ونحمي بياناتك عند استخدام تطبيق وموقع قافتر لإنشاء فواتير زاتكا.',
      },
      {
        heading: 'البيانات التي نجمعها',
        body: 'نجمع: (١) البريد الإلكتروني لإنشاء الحساب والتواصل؛ (٢) بيانات النشاط التجاري مثل الاسم، الرقم الضريبي، العنوان، ورقم الهاتف؛ (٣) بيانات العملاء والفواتير التي تُدخلها؛ (٤) الشعار والصور التي ترفعها (تُخزَّن بصيغة base64 داخل حسابك)؛ (٥) بيانات الاستخدام التقنية لتحسين الخدمة.',
      },
      {
        heading: 'كيف نستخدم بياناتك',
        body: 'نستخدم بياناتك لتوليد الفواتير، مزامنة حسابك، إرسال إشعارات مهمة، وتحسين التطبيق. لا نبيع بياناتك لأطراف ثالثة.',
      },
      {
        heading: 'التخزين والأمان',
        body: 'تُخزَّن البيانات على خوادم آمنة مع تشفير أثناء النقل (HTTPS). الشعارات والبيانات الحساسة محمية بصلاحيات الحساب.',
      },
      {
        heading: 'حقوقك',
        body: 'يمكنك طلب تصدير أو حذف بياناتك عبر support@qaftr.com. للمستخدمين في المملكة العربية السعودية، نلتزم بالأنظمة المعمول بها.',
      },
      {
        heading: 'تواصل معنا',
        body: 'لأي استفسار حول الخصوصية: support@qaftr.com',
      },
    ],
  },
  support: {
    title: 'الدعم',
    subtitle: 'نحن هنا لمساعدتك في الفوترة الإلكترونية وفواتير زاتكا.',
    emailLabel: 'البريد الإلكتروني',
    emailHint: 'نرد خلال ٢٤–٤٨ ساعة عمل.',
    topics: [
      { title: 'الحساب والاشتراك', body: 'تفعيل برو، استرداد، أو مشاكل تسجيل الدخول.' },
      { title: 'الفواتير والـ QR', body: 'أسئلة عن متطلبات زاتكا المرحلة الأولى.' },
      { title: 'الخصوصية والبيانات', body: 'تصدير أو حذف بياناتك التجارية.' },
    ],
    faqTitle: 'أسئلة شائعة',
    faqs: [
      {
        q: 'هل قافتر متوافق مع زاتكا؟',
        a: 'نعم — قافتر يدعم متطلبات المرحلة الأولى بما فيها QR الفاتورة الضريبية.',
      },
      {
        q: 'كم فاتورة في الخطة المجانية؟',
        a: '٣ فواتير شهرياً مجاناً. البرو يمنحك فواتير غير محدودة.',
      },
      {
        q: 'هل يمكنني مشاركة الفاتورة عبر واتساب؟',
        a: 'نعم — صدّر PDF وشاركه مباشرة مع عملائك.',
      },
    ],
  },
}

const en: Copy = {
  nav: { features: 'Features', pricing: 'Pricing', support: 'Support' },
  cta: { download: 'Get the app', comingSoon: 'Coming soon to stores' },
  footer: {
    privacy: 'Privacy Policy',
    support: 'Support',
    rights: 'All rights reserved',
    tagline: 'ZATCA Phase 1 invoices for Saudi freelancers',
  },
  home: {
    kicker: 'E-invoicing for freelancers',
    title: 'Create ZATCA invoices',
    titleAccent: 'in seconds',
    subtitle:
      'Qaftr — a simple Arabic-first app for tax-compliant Phase 1 invoices: clients, 15% VAT, QR, PDF, and WhatsApp sharing.',
    badgeZatca: 'ZATCA Phase 1',
    badgeFreelancer: 'For freelancers',
    featuresTitle: 'Everything you need to invoice',
    features: [
      {
        title: 'ZATCA QR invoice',
        body: 'Phase 1 compliant QR code on every tax invoice.',
      },
      {
        title: 'Arabic-first',
        body: 'RTL UI, clients, and invoices in Arabic and English — without accounting software complexity.',
      },
      {
        title: 'WhatsApp invoice',
        body: 'Share PDF invoices with clients in one tap.',
      },
      {
        title: 'Logo & branding',
        body: 'Upload your logo and customize invoice templates for your business.',
      },
      {
        title: '15% VAT',
        body: 'Automatic tax and total calculations — no manual errors.',
      },
      {
        title: 'Ready PDF',
        body: 'Export professional PDF invoices ready to send and archive.',
      },
    ],
    howTitle: 'How it works',
    steps: [
      { num: '1', title: 'Add your details', body: 'Business name, VAT number, and logo.' },
      { num: '2', title: 'Create an invoice', body: 'Pick a client, add line items, see totals.' },
      { num: '3', title: 'Share', body: 'Send PDF via WhatsApp or save for records.' },
    ],
    pricingTitle: 'Simple, transparent pricing',
    pricingSubtitle: 'Start free — upgrade to Pro when you need unlimited invoices.',
    free: {
      name: 'Free',
      price: '0',
      period: 'SAR / month',
      features: ['3 invoices / month', 'ZATCA QR', 'PDF & WhatsApp', 'Basic template'],
    },
    pro: {
      name: 'Pro',
      priceMonthly: '39',
      priceYearly: '349',
      badge: 'Most popular',
      features: [
        'Unlimited invoices',
        'All templates',
        'Invoice reminders',
        'Priority support',
      ],
    },
    ctaTitle: 'Ready to simplify invoicing?',
    ctaBody: 'Qaftr is coming soon to the App Store and Google Play.',
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: June 2026',
    sections: [
      {
        heading: 'Introduction',
        body: 'Qaftr ("we") respects your privacy. This policy explains how we collect, use, and protect your data when you use the Qaftr app and website to create ZATCA invoices.',
      },
      {
        heading: 'Data we collect',
        body: 'We collect: (1) email for account creation and communication; (2) business data such as name, VAT number, address, and phone; (3) client and invoice data you enter; (4) logos and images you upload (stored as base64 in your account); (5) technical usage data to improve the service.',
      },
      {
        heading: 'How we use your data',
        body: 'We use your data to generate invoices, sync your account, send important notifications, and improve the app. We do not sell your data to third parties.',
      },
      {
        heading: 'Storage & security',
        body: 'Data is stored on secure servers with encryption in transit (HTTPS). Logos and sensitive data are protected by account permissions.',
      },
      {
        heading: 'Your rights',
        body: 'You may request export or deletion of your data via support@qaftr.com. For users in Saudi Arabia, we comply with applicable regulations.',
      },
      {
        heading: 'Contact us',
        body: 'For privacy questions: support@qaftr.com',
      },
    ],
  },
  support: {
    title: 'Support',
    subtitle: 'We are here to help with e-invoicing and ZATCA Phase 1 invoices.',
    emailLabel: 'Email',
    emailHint: 'We reply within 24–48 business hours.',
    topics: [
      { title: 'Account & subscription', body: 'Pro activation, refunds, or sign-in issues.' },
      { title: 'Invoices & QR', body: 'Questions about ZATCA Phase 1 requirements.' },
      { title: 'Privacy & data', body: 'Export or delete your business data.' },
    ],
    faqTitle: 'FAQ',
    faqs: [
      {
        q: 'Is Qaftr ZATCA compliant?',
        a: 'Yes — Qaftr supports Phase 1 requirements including tax invoice QR codes.',
      },
      {
        q: 'How many invoices on the free plan?',
        a: '3 invoices per month free. Pro gives unlimited invoices.',
      },
      {
        q: 'Can I share invoices via WhatsApp?',
        a: 'Yes — export PDF and share directly with clients.',
      },
    ],
  },
}

const copies: Record<MarketingLang, Copy> = { ar, en }

export function t(lang: MarketingLang): Copy {
  return copies[lang]
}

export function seoCopy(lang: MarketingLang) {
  const isAr = lang === 'ar'
  return {
    home: {
      title: isAr
        ? 'قافتر — فاتورة زاتكا للمستقلين | فوترة إلكترونية'
        : 'Qaftr — ZATCA Invoice for Saudi Freelancers | E-invoicing',
      description: isAr
        ? 'أنشئ فاتورة ضريبية متوافقة مع زاتكا المرحلة الأولى: QR، PDF، ضريبة 15٪، ومشاركة واتساب. تطبيق بسيط للمستقلين في السعودية.'
        : 'Create ZATCA Phase 1 tax invoices with QR, PDF, 15% VAT, and WhatsApp sharing. Simple invoicing for Saudi freelancers.',
    },
    privacy: {
      title: isAr ? 'سياسة الخصوصية — قافتر' : 'Privacy Policy — Qaftr',
      description: isAr
        ? 'كيف يجمع قافتر ويحمي بياناتك التجارية، البريد الإلكتروني، والشعارات.'
        : 'How Qaftr collects and protects your business data, email, and uploaded logos.',
    },
    support: {
      title: isAr ? 'الدعم — قافتر' : 'Support — Qaftr',
      description: isAr
        ? 'تواصل مع فريق قافتر للمساعدة في الفوترة الإلكترونية وفواتير زاتكا.'
        : 'Contact the Qaftr team for help with e-invoicing and ZATCA invoices.',
    },
  }
}
