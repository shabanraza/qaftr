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
    terms: string
    refund: string
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
  terms: {
    title: string
    updated: string
    sections: Array<{ heading: string; body: string }>
  }
  refund: {
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
    terms: 'شروط الخدمة',
    refund: 'سياسة الاسترداد',
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
      features: ['٣ فواتير محفوظة شهرياً', 'رمز QR للفاتورة', 'PDF وواتساب'],
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
        'دعم فني بأولوية',
      ],
    },
    ctaTitle: 'جاهز لتبسيط فوترة منشأتك؟',
    ctaBody: 'أصدر فاتورتك الأولى الآن من المتصفح. تطبيق الجوال قادم قريباً على App Store وGoogle Play.',
  },
  privacy: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: نوفمبر ٢٠٢٦',
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
        heading: 'المدفوعات',
        body: 'تُعالَج مدفوعات اشتراك برو عبر Polar، وهو البائع المسجّل لمبيعاتنا. تجمع Polar بيانات البطاقة والفوترة مباشرة، ولا نرى أرقام البطاقات الكاملة ولا نخزّنها. نستلم حالة اشتراكك ومعرّف العميل لدى Polar لنفعّل برو أو نوقفه.',
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
  terms: {
    title: 'شروط الخدمة',
    updated: 'آخر تحديث: نوفمبر ٢٠٢٦',
    sections: [
      {
        heading: 'القبول بالشروط',
        body: 'باستخدامك موقع قافتر أو تطبيقه أو إنشائك حساباً فيه، فإنك توافق على هذه الشروط وعلى سياسة الخصوصية وسياسة الاسترداد. إن لم توافق عليها فلا تستخدم الخدمة.',
      },
      {
        heading: 'عن قافتر',
        body: 'قافتر برنامج لإعداد الفواتير وعروض الأسعار وإدارة العملاء للمنشآت، ويعمل عبر الموقع والتطبيق. نحسّن الخدمة باستمرار وقد تتغير مزاياها مع الوقت.',
      },
      {
        heading: 'حسابك',
        body: 'تُقدّم معلومات صحيحة عند التسجيل، وتحافظ على سرية كلمة المرور، وتتحمل مسؤولية كل نشاط يتم من حسابك. يجب أن تكون ممن يحق لهم قانوناً إبرام العقود، وأن تستخدم الخدمة لأغراض منشأتك.',
      },
      {
        heading: 'الخطة المجانية وخطة برو',
        body: 'تتيح الخطة المجانية حفظ ٣ فواتير شهرياً دون مقابل. وتفتح خطة برو الفواتير بلا حد والدعم ذا الأولوية، باشتراك شهري بسعر ٣٩ ر.س أو سنوي بسعر ٣٤٩ ر.س. السعر الذي يظهر لك عند الدفع هو السعر المطبّق على اشتراكك.',
      },
      {
        heading: 'المدفوعات والاشتراكات',
        body: 'تتم مدفوعات برو عبر Polar، وهو البائع المسجّل لمبيعاتنا، وهو من يحصّل الدفعة ويحتسب الضرائب المنطبقة ويعرضها عند الدفع. تتجدد الاشتراكات تلقائياً في نهاية كل فترة حتى تلغيها. يمكنك الإلغاء في أي وقت من «الخطة والفوترة» ثم «إدارة الاشتراك»، فيبقى برو فعّالاً حتى نهاية الفترة المدفوعة ولا يُخصم منك شيء بعدها. إن غيّرنا الأسعار فسنُعلمك قبل تطبيق السعر الجديد على تجديدك.',
      },
      {
        heading: 'الاسترداد',
        body: 'يخضع استرداد المبالغ لسياسة الاسترداد المنشورة في هذا الموقع، وهي جزء من هذه الشروط.',
      },
      {
        heading: 'محتواك وبياناتك',
        body: 'تبقى بيانات منشأتك وعملائك وفواتيرك ملكاً لك. تمنحنا الحق في تخزينها ومعالجتها بالقدر اللازم لتقديم الخدمة لك فقط، وفق سياسة الخصوصية. يمكنك طلب تصدير بياناتك أو حذفها عبر support@qaftr.com.',
      },
      {
        heading: 'الاستخدام المقبول',
        body: 'لا تستخدم قافتر لإصدار مستندات مزوّرة أو مضللة أو مخالفة للأنظمة، ولا لمحاولة الوصول إلى حسابات الآخرين أو تعطيل الخدمة أو نسخها بصورة آلية. يجوز لنا إيقاف الحسابات المخالفة.',
      },
      {
        heading: 'ليست استشارة ضريبية أو قانونية',
        body: 'قافتر أداة تساعدك على إعداد مستنداتك، والمعلومات والقوالب فيها ليست استشارة ضريبية أو قانونية. أنت المسؤول عن صحة فواتيرك وإقراراتك والتزامك بأنظمة الضريبة المعمول بها. قافتر غير تابع لهيئة الزكاة والضريبة والجمارك (زاتكا) ولا صادر عنها.',
      },
      {
        heading: 'التوفر والتغييرات',
        body: 'نسعى لإبقاء الخدمة متاحة، لكننا لا نضمن خلوها من الانقطاع أو الأخطاء. قد نُجري صيانة أو نغيّر المزايا أو نوقف جزءاً من الخدمة، وسنُعلمك مسبقاً متى أمكن ذلك.',
      },
      {
        heading: 'إخلاء المسؤولية وحدودها',
        body: 'تُقدَّم الخدمة كما هي. وبالقدر الذي تسمح به الأنظمة، لا نتحمل مسؤولية الخسائر غير المباشرة أو أرباح فاتتك، وتقتصر مسؤوليتنا الإجمالية على المبلغ الذي دفعته لنا مقابل الخدمة في الاثني عشر شهراً السابقة للمطالبة. لا يقيّد ذلك أي حقوق لا يجوز نظاماً تقييدها.',
      },
      {
        heading: 'إنهاء الحساب',
        body: 'يمكنك التوقف عن استخدام الخدمة وطلب حذف حسابك في أي وقت عبر support@qaftr.com. ويجوز لنا تعليق حسابك أو إنهاؤه عند مخالفة هذه الشروط.',
      },
      {
        heading: 'تعديل الشروط',
        body: 'قد نحدّث هذه الشروط، وسننشر النسخة الجديدة هنا مع تاريخ التحديث. استمرارك في استخدام الخدمة بعد التحديث يعني قبولك به.',
      },
      {
        heading: 'النظام المطبّق والتواصل',
        body: 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية. لأي سؤال: support@qaftr.com',
      },
    ],
  },
  refund: {
    title: 'سياسة الاسترداد',
    updated: 'آخر تحديث: نوفمبر ٢٠٢٦',
    sections: [
      {
        heading: 'نظرة عامة',
        body: 'الخطة المجانية بلا أي رسوم. تنطبق هذه السياسة على اشتراكات برو الشهرية والسنوية المدفوعة عبر الموقع، وتتم الدفعات والاستردادات عبر Polar، وهو البائع المسجّل لمبيعاتنا.',
      },
      {
        heading: 'الإلغاء في أي وقت',
        body: 'يمكنك إلغاء اشتراكك متى شئت من «الخطة والفوترة» ثم «إدارة الاشتراك». يبقى برو فعّالاً حتى نهاية الفترة التي دفعتها، ولا يُخصم منك شيء بعد ذلك.',
      },
      {
        heading: 'الدفعة الأولى: ١٤ يوماً',
        body: 'إن لم تكن راضياً عن برو، فراسلنا خلال ١٤ يوماً من أول دفعة لك على الخطة وسنسترد لك المبلغ كاملاً.',
      },
      {
        heading: 'التجديد: ٧ أيام',
        body: 'إن نسيت الإلغاء وتم تجديد اشتراكك، فراسلنا خلال ٧ أيام من تاريخ التجديد وسنسترد لك دفعة التجديد إن لم تكن قد استخدمت برو في الفترة الجديدة.',
      },
      {
        heading: 'كيف تطلب الاسترداد',
        body: 'أرسل رسالة إلى support@qaftr.com من البريد المسجّل في حسابك، واذكر تاريخ الدفع. نرد خلال ٢٤–٤٨ ساعة عمل.',
      },
      {
        heading: 'كيف يصلك المبلغ',
        body: 'يُعاد المبلغ إلى وسيلة الدفع نفسها عبر Polar. قد يستغرق ظهوره في حسابك عدة أيام عمل بحسب البنك أو مصدر البطاقة.',
      },
      {
        heading: 'حقوقك النظامية',
        body: 'لا تقيّد هذه السياسة أي حقوق تثبت لك بموجب الأنظمة المعمول بها.',
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
        a: 'يُصدر قافتر فواتير وفق المرحلة الأولى (مرحلة الإصدار والحفظ) مع رمز QR للفاتورة الضريبية. إذا أبلغتك زاتكا بموعد ربطك في المرحلة الثانية (مرحلة الربط والتكامل) — والموجة ٢٥ تشمل من تجاوزت إيراداته الخاضعة للضريبة ١٨٧٬٥٠٠ ريال، وموعدها ١ فبراير ٢٠٢٧ — فستحتاج حلاً مربوطاً ببوابة فاتورة. ودعم المرحلة الثانية في قافتر في مرحلة تجريبية خاصة مع عدد محدود من المنشآت؛ راسلنا على support@qaftr.com للانضمام إلى قائمة الوصول المبكر. قافتر ليس تطبيقاً رسمياً تابعاً لزاتكا.',
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
    terms: 'Terms of Service',
    refund: 'Refund Policy',
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
      features: ['3 saved invoices / month', 'Tax invoice QR code', 'PDF & WhatsApp'],
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
        'Priority support',
      ],
    },
    ctaTitle: 'Ready to simplify invoicing for your business?',
    ctaBody: 'Create your first invoice in the browser today. The mobile app is coming soon to the App Store and Google Play.',
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: November 2026',
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
        heading: 'Payments',
        body: 'Pro subscription payments are processed by Polar, our merchant of record. Polar collects your card and billing details directly; we never see or store full card numbers. We receive your subscription status and your Polar customer reference so we can switch Pro on or off.',
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
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: November 2026',
    sections: [
      {
        heading: 'Accepting these terms',
        body: 'By using the Qaftr website or app, or by creating an account, you agree to these terms, the Privacy Policy and the Refund Policy. If you do not agree, please do not use the service.',
      },
      {
        heading: 'About Qaftr',
        body: 'Qaftr is software for creating invoices and quotes and managing clients for businesses, available on the website and in the app. We keep improving it, so features can change over time.',
      },
      {
        heading: 'Your account',
        body: 'You give accurate details when you sign up, keep your password secret, and are responsible for all activity in your account. You must be legally able to enter a contract and use the service for your business.',
      },
      {
        heading: 'Free and Pro plans',
        body: 'The free plan lets you save 3 invoices a month at no cost. Pro unlocks unlimited invoices and priority support, as a monthly subscription at SAR 39 or a yearly subscription at SAR 349. The price shown at checkout is the price that applies to your subscription.',
      },
      {
        heading: 'Payments and subscriptions',
        body: 'Pro is paid through Polar, our merchant of record, which collects the payment and calculates and shows any applicable taxes at checkout. Subscriptions renew automatically at the end of each period until you cancel. You can cancel any time under Plan & billing, then Manage subscription; Pro then stays active until the end of the paid period and you are not charged again. If we change prices, we will tell you before the new price applies to your renewal.',
      },
      {
        heading: 'Refunds',
        body: 'Refunds follow the Refund Policy published on this website, which is part of these terms.',
      },
      {
        heading: 'Your content and data',
        body: 'Your business, client and invoice data stays yours. You allow us to store and process it only as needed to provide the service to you, as described in the Privacy Policy. You can ask us to export or delete your data at support@qaftr.com.',
      },
      {
        heading: 'Acceptable use',
        body: 'Do not use Qaftr to issue forged, misleading or unlawful documents, to access other people’s accounts, to disrupt the service, or to copy it with automated tools. We may suspend accounts that break these rules.',
      },
      {
        heading: 'Not tax or legal advice',
        body: 'Qaftr is a tool that helps you prepare documents. Its information and templates are not tax or legal advice. You are responsible for the accuracy of your invoices and returns and for following the tax rules that apply to you. Qaftr is not affiliated with or endorsed by ZATCA, the Zakat, Tax and Customs Authority.',
      },
      {
        heading: 'Availability and changes',
        body: 'We work to keep the service available, but we cannot promise it will be free of interruptions or errors. We may do maintenance, change features or retire parts of the service, and will give notice where we can.',
      },
      {
        heading: 'Disclaimer and limit of liability',
        body: 'The service is provided as is. To the extent the law allows, we are not liable for indirect losses or lost profits, and our total liability is limited to the amount you paid us for the service in the 12 months before the claim. This does not limit any right that cannot lawfully be limited.',
      },
      {
        heading: 'Ending your account',
        body: 'You can stop using the service and ask us to delete your account any time at support@qaftr.com. We may suspend or end your account if you break these terms.',
      },
      {
        heading: 'Changes to these terms',
        body: 'We may update these terms. The new version will be posted here with its date. If you keep using the service after an update, you accept it.',
      },
      {
        heading: 'Governing law and contact',
        body: 'These terms are governed by the laws of the Kingdom of Saudi Arabia. Questions: support@qaftr.com',
      },
    ],
  },
  refund: {
    title: 'Refund Policy',
    updated: 'Last updated: November 2026',
    sections: [
      {
        heading: 'Overview',
        body: 'The free plan has no charge. This policy covers Pro monthly and yearly subscriptions bought on the website. Payments and refunds are handled by Polar, our merchant of record.',
      },
      {
        heading: 'Cancel any time',
        body: 'You can cancel your subscription whenever you like under Plan & billing, then Manage subscription. Pro stays active until the end of the period you paid for, and you are not charged again.',
      },
      {
        heading: 'First payment: 14 days',
        body: 'If you are not happy with Pro, email us within 14 days of your first payment for a plan and we will refund it in full.',
      },
      {
        heading: 'Renewals: 7 days',
        body: 'If you forgot to cancel and your subscription renewed, email us within 7 days of the renewal date and we will refund the renewal payment if you have not used Pro in the new period.',
      },
      {
        heading: 'How to ask for a refund',
        body: 'Email support@qaftr.com from the address on your account and tell us the payment date. We reply within 24–48 business hours.',
      },
      {
        heading: 'How you get the money',
        body: 'The refund goes back to the original payment method through Polar. It can take several business days to show up, depending on your bank or card issuer.',
      },
      {
        heading: 'Your legal rights',
        body: 'This policy does not limit any rights you have under the law that applies to you.',
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
        a: 'Qaftr issues Phase 1 (Generation) invoices with the tax invoice QR code. If ZATCA has notified you of a Phase 2 (Integration) date — Wave 25 covers VAT-subject revenue above SAR 187,500, due 1 February 2027 — you need a solution integrated with the FATOORA portal. Phase 2 support in Qaftr is in private beta with a small group of businesses; email support@qaftr.com to join the early-access list. Qaftr is not an official ZATCA application.',
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
    terms: {
      title: isAr ? 'شروط الخدمة | قافتر' : 'Terms of Service | Qaftr',
      description: isAr
        ? 'شروط استخدام قافتر: الحساب، والخطة المجانية وبرو، والاشتراك والدفع عبر Polar، والإلغاء، وحدود المسؤولية.'
        : 'The terms for using Qaftr: your account, the free and Pro plans, subscription billing through Polar, cancelling, and limits of liability.',
    },
    refund: {
      title: isAr ? 'سياسة الاسترداد | قافتر' : 'Refund Policy | Qaftr',
      description: isAr
        ? 'سياسة استرداد اشتراك برو في قافتر: الإلغاء في أي وقت، ومهلة ١٤ يوماً للدفعة الأولى و٧ أيام للتجديد.'
        : 'How refunds work for Qaftr Pro: cancel any time, 14 days to ask for a refund of your first payment and 7 days after a renewal.',
    },
    support: {
      title: isAr ? 'الدعم | قافتر' : 'Support | Qaftr',
      description: isAr
        ? 'تواصل مع فريق قافتر للمساعدة في الفوترة الإلكترونية وفواتير زاتكا لمنشأتك، والحساب والاشتراك.'
        : 'Contact the Qaftr team for help with e-invoicing, ZATCA invoices, your account and your subscription.',
    },
  }
}
