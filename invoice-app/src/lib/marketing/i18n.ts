import type { MarketingLang } from './lang'

type Copy = {
  nav: { features: string; pricing: string; support: string }
  cta: {
    download: string
    comingSoon: string
    createInvoice: string
    noCard: string
    noCardNote: string
  }
  footer: {
    privacy: string
    support: string
    rights: string
    tagline: string
    taglineAe: string
  }
  home: {
    kicker: string
    title: string
    titleAccent: string
    subtitle: string
    badgeZatca: string
    badgeAudience: string
    featuresTitle: string
    features: Array<{ title: string; body: string }>
    howTitle: string
    steps: Array<{ num: string; title: string; body: string }>
    pricingTitle: string
    pricingSubtitle: string
    free: { name: string; price: string; period: string; features: string[] }
    pro: {
      name: string
      priceMonthly: string
      priceYearly: string
      period: string
      yearly: (price: string) => string
      badge: string
      features: string[]
    }
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
  cta: {
    download: 'حمّل التطبيق',
    comingSoon: 'قريباً على المتاجر',
    createInvoice: 'أصدر فاتورتك الأولى مجاناً',
    noCard: 'بدون بطاقة ائتمان',
    noCardNote: 'بدون بطاقة ائتمان · نزّل PDF دون إنشاء حساب',
  },
  footer: {
    privacy: 'سياسة الخصوصية',
    support: 'الدعم',
    rights: 'جميع الحقوق محفوظة',
    tagline: 'برنامج فواتير للمنشآت في السعودية — المرحلة الأولى من زاتكا',
    taglineAe: 'فوترة عربية للشركات في الإمارات واستعداد للفوترة الإلكترونية',
  },
  home: {
    kicker: 'الفوترة الإلكترونية للمنشآت في السعودية',
    title: 'فواتير ضريبية وفق المرحلة الأولى من زاتكا',
    titleAccent: 'لمنشأتك، في دقائق',
    subtitle:
      'قافتر برنامج فوترة عربي للمنشآت الصغيرة والمتوسطة التي تبيع للشركات والأفراد: فاتورة ضريبية مع رمز QR، وحساب تلقائي لضريبة القيمة المضافة ١٥٪، وملف PDF، ومشاركة عبر واتساب.',
    badgeZatca: 'زاتكا · مرحلة الإصدار (المرحلة الأولى)',
    badgeAudience: 'للشركات والأفراد',
    featuresTitle: 'كل ما تحتاجه منشأتك للفوترة',
    features: [
      {
        title: 'رمز QR للفاتورة الضريبية',
        body: 'رمز QR بصيغة المرحلة الأولى من زاتكا على كل فاتورة ضريبية مبسطة.',
      },
      {
        title: 'عربي أولاً',
        body: 'واجهة عربية من اليمين إلى اليسار، وفواتير بالعربية أو الإنجليزية، دون تعقيد برامج المحاسبة.',
      },
      {
        title: 'مشاركة عبر واتساب',
        body: 'أرسل الفاتورة بصيغة PDF إلى عميلك بنقرة واحدة.',
      },
      {
        title: 'هوية منشأتك',
        body: 'أضف شعار منشأتك وبياناتها لتظهر على كل فاتورة.',
      },
      {
        title: 'ضريبة ١٥٪ تلقائياً',
        body: 'يحسب قافتر ضريبة القيمة المضافة والإجمالي المستحق تلقائياً، دون أخطاء يدوية.',
      },
      {
        title: 'PDF جاهز للإرسال والأرشفة',
        body: 'صدّر فواتير PDF احترافية لعملائك ولسجلات منشأتك.',
      },
    ],
    howTitle: 'كيف يعمل قافتر؟',
    steps: [
      { num: '١', title: 'أضف بيانات منشأتك', body: 'الاسم التجاري، والرقم الضريبي، والشعار.' },
      { num: '٢', title: 'أصدر الفاتورة', body: 'اختر العميل، وأضف البنود، وراجع الإجمالي.' },
      { num: '٣', title: 'أرسلها إلى عميلك', body: 'شارك ملف PDF عبر واتساب أو احفظه في سجلاتك.' },
    ],
    pricingTitle: 'أسعار واضحة لكل منشأة',
    pricingSubtitle:
      'نزّل PDF مجاناً دون حساب، واحفظ ٣ فواتير شهرياً مجاناً بعد التسجيل. رقِّ اشتراكك إلى برو عندما تحتاج فواتير غير محدودة.',
    free: {
      name: 'مجاني',
      // A lone Arabic-Indic zero (٠) reads as a dot, so spell the free price out.
      price: 'مجاناً',
      period: 'دون اشتراك شهري',
      features: ['٣ فواتير محفوظة شهرياً', 'رمز QR للفاتورة', 'PDF وواتساب', 'قالب أساسي'],
    },
    pro: {
      name: 'برو',
      priceMonthly: '٣٩',
      priceYearly: '٣٤٩',
      period: 'ر.س / شهر',
      yearly: (price: string) => `أو ${price} ر.س / سنة`,
      badge: 'الأكثر طلباً',
      features: [
        'فواتير غير محدودة',
        'جميع القوالب',
        'تذكير العملاء بالفواتير المستحقة',
        'دعم فني بأولوية',
      ],
    },
    ctaTitle: 'جاهز لتبسيط فوترة منشأتك؟',
    ctaBody: 'أصدر فاتورتك الأولى الآن من المتصفح. تطبيق الجوال قادم قريباً على App Store وGoogle Play.',
  },
  privacy: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: يونيو ٢٠٢٦',
    sections: [
      {
        heading: 'مقدمة',
        body: 'قافتر («نحن») يحترم خصوصيتك. توضّح هذه السياسة كيف نجمع ونستخدم ونحمي بياناتك عند استخدام تطبيق قافتر وموقعه لإصدار الفواتير الضريبية.',
      },
      {
        heading: 'البيانات التي نجمعها',
        body: 'نجمع: (١) البريد الإلكتروني لإنشاء الحساب والتواصل؛ (٢) بيانات المنشأة مثل الاسم التجاري والرقم الضريبي والعنوان ورقم الهاتف؛ (٣) بيانات العملاء والفواتير التي تُدخلها؛ (٤) الشعار والصور التي ترفعها (تُخزَّن بصيغة base٦٤ داخل حسابك)؛ (٥) بيانات الاستخدام التقنية لتحسين الخدمة.',
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
    subtitle: 'فريقنا جاهز لمساعدة منشأتك في الفوترة الإلكترونية وفواتير زاتكا.',
    emailLabel: 'البريد الإلكتروني',
    emailHint: 'نرد خلال ٢٤–٤٨ ساعة عمل.',
    topics: [
      { title: 'الحساب والاشتراك', body: 'تفعيل اشتراك برو، أو استرداد المبلغ، أو مشكلات تسجيل الدخول.' },
      { title: 'الفواتير ورمز QR', body: 'أسئلة عن متطلبات المرحلة الأولى (الإصدار) من زاتكا.' },
      { title: 'الخصوصية والبيانات', body: 'تصدير بيانات منشأتك أو حذفها.' },
    ],
    faqTitle: 'أسئلة شائعة',
    faqs: [
      {
        q: 'هل يكفي قافتر للامتثال لمتطلبات زاتكا؟',
        a: 'يُصدر قافتر فواتير وفق المرحلة الأولى (مرحلة الإصدار والحفظ) مع رمز QR للفاتورة الضريبية. إذا أبلغتك زاتكا بموعد ربطك في المرحلة الثانية (مرحلة الربط والتكامل) — والموجة ٢٥ تشمل من تجاوزت إيراداته الخاضعة للضريبة ١٨٧٬٥٠٠ ريال، وموعدها ١ فبراير ٢٠٢٧ — فستحتاج حلاً مربوطاً ببوابة فاتورة. قافتر ليس تطبيقاً رسمياً تابعاً لزاتكا.',
      },
      {
        q: 'كم فاتورة في الخطة المجانية؟',
        a: 'تحفظ ٣ فواتير شهرياً مجاناً، وتنزيل PDF دون حساب مجاني دائماً. اشتراك برو يمنحك فواتير غير محدودة.',
      },
      {
        q: 'هل يمكنني مشاركة الفاتورة عبر واتساب؟',
        a: 'نعم. صدّر الفاتورة بصيغة PDF وأرسلها مباشرة إلى عميلك.',
      },
    ],
  },
}

const en: Copy = {
  nav: { features: 'Features', pricing: 'Pricing', support: 'Support' },
  cta: {
    download: 'Get the app',
    comingSoon: 'Coming soon to stores',
    createInvoice: 'Create your first invoice free',
    noCard: 'No credit card',
    noCardNote: 'No credit card · Download the PDF without an account',
  },
  footer: {
    privacy: 'Privacy Policy',
    support: 'Support',
    rights: 'All rights reserved',
    tagline: 'ZATCA Phase 1 invoicing software for Saudi businesses',
    taglineAe: 'Arabic-first invoicing and e-invoicing readiness for UAE businesses',
  },
  home: {
    kicker: 'E-invoicing for Saudi businesses',
    title: 'ZATCA Phase 1 tax invoices',
    titleAccent: 'for your business, in minutes',
    subtitle:
      'Qaftr is Arabic-first invoicing software for Saudi SMEs that sell to businesses and consumers: tax invoices with a QR code, automatic 15% VAT, PDF export and WhatsApp sharing.',
    badgeZatca: 'ZATCA Phase 1 (Generation)',
    badgeAudience: 'B2B and B2C',
    featuresTitle: 'Everything your business needs to invoice',
    features: [
      {
        title: 'Tax invoice QR code',
        body: 'A ZATCA Phase 1 QR code on every simplified tax invoice.',
      },
      {
        title: 'Arabic-first',
        body: 'A right-to-left Arabic interface and invoices in Arabic or English, without the complexity of accounting software.',
      },
      {
        title: 'Share on WhatsApp',
        body: 'Send the PDF invoice to your customer in one tap.',
      },
      {
        title: 'Your brand',
        body: 'Add your logo and business details to every invoice.',
      },
      {
        title: 'Automatic 15% VAT',
        body: 'Qaftr calculates VAT and the total amount due for you, with no manual errors.',
      },
      {
        title: 'PDF ready to send and archive',
        body: 'Export professional PDF invoices for your customers and your records.',
      },
    ],
    howTitle: 'How Qaftr works',
    steps: [
      { num: '1', title: 'Add your business details', body: 'Trade name, VAT number and logo.' },
      { num: '2', title: 'Issue the invoice', body: 'Pick the customer, add line items and review the total.' },
      { num: '3', title: 'Send it to your customer', body: 'Share the PDF on WhatsApp or keep it for your records.' },
    ],
    pricingTitle: 'Clear pricing for every business',
    pricingSubtitle:
      'Download PDFs free without an account, and save 3 invoices a month free once you sign up. Upgrade to Pro when you need unlimited invoices.',
    free: {
      name: 'Free',
      price: '0',
      period: 'SAR / month',
      features: ['3 saved invoices / month', 'Tax invoice QR code', 'PDF & WhatsApp', 'Basic template'],
    },
    pro: {
      name: 'Pro',
      priceMonthly: '39',
      priceYearly: '349',
      period: 'SAR / month',
      yearly: (price: string) => `or ${price} SAR / year`,
      badge: 'Most popular',
      features: [
        'Unlimited invoices',
        'All templates',
        'Payment reminders for customers',
        'Priority support',
      ],
    },
    ctaTitle: 'Ready to simplify invoicing for your business?',
    ctaBody: 'Create your first invoice in the browser today. The mobile app is coming soon to the App Store and Google Play.',
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: June 2026',
    sections: [
      {
        heading: 'Introduction',
        body: 'Qaftr ("we") respects your privacy. This policy explains how we collect, use, and protect your data when you use the Qaftr app and website to issue tax invoices.',
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
    subtitle: 'Our team is here to help your business with e-invoicing and ZATCA Phase 1 invoices.',
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
        q: 'Is Qaftr enough for ZATCA compliance?',
        a: 'Qaftr issues Phase 1 (Generation) invoices with the tax invoice QR code. If ZATCA has notified you of a Phase 2 (Integration) date — Wave 25 covers VAT-subject revenue above SAR 187,500, due 1 February 2027 — you need a solution integrated with the FATOORA portal. Qaftr is not an official ZATCA application.',
      },
      {
        q: 'How many invoices are on the free plan?',
        a: 'You can save 3 invoices a month free, and downloading a PDF without an account is always free. Pro gives you unlimited invoices.',
      },
      {
        q: 'Can I share invoices via WhatsApp?',
        a: 'Yes. Export the invoice as a PDF and send it straight to your customer.',
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
        ? 'قافتر | برنامج فواتير زاتكا للمنشآت في السعودية'
        : 'Qaftr | ZATCA Invoicing Software for Saudi Businesses',
      description: isAr
        ? 'أصدر فواتير ضريبية لمبيعات منشأتك للشركات والأفراد وفق المرحلة الأولى من زاتكا: رمز QR، وضريبة ١٥٪ تلقائياً، وPDF وواتساب. ابدأ مجاناً.'
        : 'Issue ZATCA Phase 1 tax invoices for your B2B and B2C sales: QR code, automatic 15% VAT, PDF and WhatsApp sharing. Create your first invoice free.',
    },
    privacy: {
      title: isAr ? 'سياسة الخصوصية | قافتر' : 'Privacy Policy | Qaftr',
      description: isAr
        ? 'كيف يجمع قافتر بيانات منشأتك وبريدك الإلكتروني وشعارك ويستخدمها ويحميها.'
        : 'How Qaftr collects, uses and protects your business data, email address and uploaded logo.',
    },
    support: {
      title: isAr ? 'الدعم | قافتر' : 'Support | Qaftr',
      description: isAr
        ? 'تواصل مع فريق قافتر للمساعدة في الفوترة الإلكترونية وفواتير زاتكا لمنشأتك، والحساب والاشتراك.'
        : 'Contact the Qaftr team for help with e-invoicing, ZATCA invoices, your account and your subscription.',
    },
  }
}
