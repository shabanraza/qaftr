import type { MarketingLang } from '#/lib/marketing/lang'
import type { AePageId } from './pages'
import { READINESS_QUESTIONS } from './readiness-quiz'

const aeCopyAr = {
  regionLabel: 'الإمارات',
  brand: 'قافتر',
  verifyNote:
    'حسب إرشادات وزارة المالية والهيئة الاتحادية للضرائب — تحقّق منها قبل الاعتماد عليها.',
  disclaimer:
    'قافتر منتج مستقل وغير تابع للهيئة الاتحادية للضرائب أو وزارة المالية. المعلومات إرشادية عامة وليست استشارة ضريبية.',
  seo: {
    hub: {
      title: 'الفوترة الإلكترونية للشركات في الإمارات 2027 | قافتر',
      description:
        'أدوات عربية مجانية للشركات في الإمارات: تحقّق من صيغة رقم التسجيل الضريبي، واحسب ضريبة 5٪، واعرف موعد إلزام شركتك بالفوترة الإلكترونية 2027.',
    },
    'trn-checker': {
      title: 'التحقق من رقم التسجيل الضريبي (TRN) في الإمارات | قافتر',
      description:
        'تحقّق مجاناً من صيغة رقم التسجيل الضريبي الإماراتي (15 رقماً يبدأ بـ 100). فحص للصيغة فقط، أما حالة التسجيل فتُؤكَّد من خدمة الهيئة الاتحادية للضرائب.',
    },
    'vat-calculator': {
      title: 'حاسبة ضريبة القيمة المضافة 5٪ — الإمارات | قافتر',
      description:
        'احسب ضريبة القيمة المضافة 5٪ بالدرهم: أضف الضريبة إلى المبلغ أو استخرجها من الإجمالي، مع تقريب دقيق إلى الفلس. مجاناً ودون تسجيل.',
    },
    'e-invoicing-readiness': {
      title: 'متى تُلزَم شركتك بالفوترة الإلكترونية في الإمارات؟ | قافتر',
      description:
        'اختبار مجاني في دقيقة: اعرف مرحلة شركتك وموعد إلزامها بالفوترة الإلكترونية في الإمارات، والأيام المتبقية، وخطواتك مع مزوّد الخدمة المعتمد (ASP).',
    },
    'invoice-generator': {
      title: 'فاتورة ضريبية مجانية للشركات في الإمارات — PDF | قافتر',
      description:
        'أنشئ فاتورة ضريبية إماراتية لشركتك مجاناً بالعربية أو الإنجليزية أو باللغتين: درهم، وضريبة 5٪، وبنود بنسبة صفر أو معفاة، وتنزيل PDF. دون تسجيل.',
    },
    guide: {
      title: 'دليل الفوترة الإلكترونية في الإمارات 2027 و PINT AE | قافتر',
      description:
        'دليل عربي شامل للفوترة الإلكترونية في الإمارات: الجدول الزمني 2026–2027، ونموذج Peppol بخمس زوايا، وPINT AE، ونطاق الإلزام، وأثرها على المستقلين.',
    },
  } satisfies Record<AePageId, { title: string; description: string }>,
  pageNames: {
    hub: 'الإمارات',
    'trn-checker': 'التحقق من الرقم الضريبي',
    'vat-calculator': 'حاسبة ضريبة 5٪',
    'e-invoicing-readiness': 'جاهزية الفوترة الإلكترونية',
    'invoice-generator': 'مولّد الفاتورة الضريبية',
    guide: 'دليل الفوترة الإلكترونية 2027',
  } satisfies Record<AePageId, string>,
  trn: {
    title: 'التحقق من صيغة رقم التسجيل الضريبي (TRN) في الإمارات',
    subtitle:
      'يتكوّن رقم التسجيل الضريبي الإماراتي من 15 رقماً ويبدأ بـ 100. الصق الرقم بأي شكل، بمسافات أو شرطات أو بالأرقام العربية، وسننسّقه ونفحص صيغته.',
    badge: 'الإمارات · رقم التسجيل الضريبي',
    inputLabel: 'رقم التسجيل الضريبي (TRN)',
    inputPlaceholder: '100XXXXXXXXXXXX',
    inputHint: 'تُقبل المسافات والشرطات والأرقام العربية (١٢٣).',
    statusEmpty: 'أدخل رقم التسجيل الضريبي للفحص',
    statusValid: 'صيغة صحيحة',
    statusInvalid: 'صيغة غير صحيحة',
    rulesTitle: 'نتيجة الفحص',
    rules: {
      characters: 'أرقام فقط',
      length: '15 رقماً بالضبط',
      prefix: 'يبدأ بـ 100',
    },
    digitCount: 'عدد الأرقام',
    normalizedLabel: 'الرقم بعد التنسيق',
    formatOnlyTitle: 'فحص للصيغة فقط',
    formatOnlyBody:
      'تتحقق هذه الأداة من صيغة الرقم فقط، ولا تستطيع معرفة ما إذا كان مسجّلاً أو سارياً. للتأكد من حالة التسجيل استخدم خدمة التحقق من رقم التسجيل الضريبي على الموقع الرسمي للهيئة الاتحادية للضرائب.',
    ftaLink: 'موقع الهيئة الاتحادية للضرائب (FTA)',
    nextTitle: 'الخطوة التالية',
    nextBody:
      'احسب ضريبة 5٪ على فاتورتك، أو اعرف موعد إلزام شركتك بالفوترة الإلكترونية.',
    nextVat: 'حاسبة ضريبة 5٪',
    nextReadiness: 'اختبار الجاهزية',
    faqTitle: 'أسئلة شائعة عن رقم التسجيل الضريبي في الإمارات',
    faq: [
      {
        question: 'كم عدد أرقام رقم التسجيل الضريبي (TRN) في الإمارات؟',
        answer:
          'يتكوّن رقم التسجيل الضريبي في الإمارات من 15 رقماً، ويبدأ عادةً بـ 100. وأي رقم أقصر أو أطول أو يبدأ بغير 100 تكون صيغته غير صحيحة.',
      },
      {
        question: 'هل تتحقق الأداة من أن الرقم مسجّل فعلاً؟',
        answer:
          'لا. تفحص الأداة الصيغة فقط (الطول والبداية والأرقام). أما حالة التسجيل واسم المنشأة فتتحقق منهما عبر خدمة التحقق من رقم التسجيل الضريبي على الموقع الرسمي للهيئة الاتحادية للضرائب.',
      },
      {
        question: 'أين يُكتب رقم التسجيل الضريبي على الفاتورة؟',
        answer:
          'تتضمن الفاتورة الضريبية في الإمارات عادةً رقم التسجيل الضريبي للمورّد، ورقم العميل إذا كان مسجّلاً، مع التاريخ والمبالغ وضريبة 5٪. راجع متطلبات الهيئة الاتحادية للضرائب لنوع فاتورتك.',
      },
      {
        question: 'هل يختلف عن الرقم الضريبي السعودي؟',
        answer:
          'نعم. الرقم الضريبي السعودي 15 رقماً أيضاً لكنه يبدأ بـ 3 وينتهي بـ 3، بينما يبدأ رقم التسجيل الضريبي الإماراتي بـ 100. فلا تخلط بينهما في فواتير عملائك في البلدين.',
      },
      {
        question: 'هل تحفظون الرقم الذي أدخله؟',
        answer: 'لا. يتم الفحص في متصفحك فقط، ولا يُرسل الرقم إلى أي خادم.',
      },
    ],
  },
  vat: {
    title: 'حاسبة ضريبة القيمة المضافة 5٪ في الإمارات',
    subtitle:
      'احسب ضريبة القيمة المضافة الإماراتية بالدرهم في ثوانٍ: أضف 5٪ إلى المبلغ، أو استخرج الضريبة من إجمالي شامل لها، مع تقريب دقيق إلى أقرب فلس.',
    cardTitle: 'حاسبة الضريبة',
    badge: 'ضريبة 5٪ · درهم',
    amountLabel: 'المبلغ (درهم)',
    amountPlaceholder: 'مثال: 1,000',
    modeLabel: 'نوع المبلغ',
    modeExclusive: 'غير شامل الضريبة',
    modeInclusive: 'شامل الضريبة',
    rateNote: 'النسبة الأساسية لضريبة القيمة المضافة في الإمارات 5٪.',
    resultsTitle: 'النتيجة',
    subtotal: 'المبلغ الخاضع للضريبة',
    vat: 'ضريبة القيمة المضافة (5٪)',
    total: 'الإجمالي شامل الضريبة',
    emptyHint: 'أدخل مبلغاً صحيحاً (رقم موجب) لعرض الحساب.',
    tooLargeHint:
      'المبلغ كبير جداً، والحد الأقصى تريليون درهم (1,000,000,000,000).',
    createInvoice: 'أصدر فاتورتك الضريبية الأولى مجاناً',
    invoiceNote:
      'فاتورة ضريبية PDF بالدرهم وبضريبة 5٪، بالعربية أو الإنجليزية أو باللغتين، دون تسجيل.',
    faqTitle: 'أسئلة شائعة عن ضريبة 5٪ في الإمارات',
    faq: [
      {
        question: 'كم نسبة ضريبة القيمة المضافة في الإمارات؟',
        answer:
          'النسبة الأساسية 5٪. وبعض التوريدات خاضعة لنسبة الصفر أو معفاة وفق أحكام الهيئة الاتحادية للضرائب، فتأكد من تصنيف توريدك.',
      },
      {
        question: 'كيف أضيف ضريبة 5٪ على المبلغ؟',
        answer:
          'اضرب المبلغ الخاضع للضريبة في 0.05 لتحصل على الضريبة، ثم أضفها إلى المبلغ. مثال: 1,000 درهم + 50 = 1,050 درهماً.',
      },
      {
        question: 'كيف أستخرج الضريبة من مبلغ شامل لها؟',
        answer:
          'اقسم الإجمالي على 1.05 لتحصل على المبلغ الخاضع للضريبة، والفرق هو الضريبة. مثال: 1,050 ÷ 1.05 = 1,000 درهم، والضريبة 50 درهماً.',
      },
      {
        question: 'كيف يتم التقريب؟',
        answer:
          'نقرّب كل مبلغ إلى أقرب فلس (منزلتين عشريتين)، ونحرص على أن يساوي المبلغ الخاضع للضريبة مضافاً إليه الضريبة الإجمالي تماماً.',
      },
      {
        question: 'هل يجب أن أكون مسجلاً لأضيف الضريبة؟',
        answer:
          'لا تُفرض ضريبة القيمة المضافة على الفواتير إلا إذا كنت مسجلاً ولديك رقم تسجيل ضريبي (TRN). وتحدد الهيئة الاتحادية للضرائب حد التسجيل الإلزامي وقواعده.',
      },
    ],
  },
  readiness: {
    title: 'متى تُلزَم شركتك بالفوترة الإلكترونية في الإمارات؟',
    subtitle: `أجب عن ${READINESS_QUESTIONS.length} أسئلة سريعة لتعرف مرحلة شركتك، وموعد الإلزام، والأيام المتبقية، وخطواتك التالية مع مزوّد الخدمة المعتمد (ASP).`,
    formTitle: 'اختبار الجاهزية',
    govQuestion: 'هل منشأتك جهة حكومية؟',
    yes: 'نعم',
    no: 'لا',
    customersQuestion: 'لمن تبيع؟',
    customersB2b: 'لشركات أو جهات حكومية (B2B / B2G)',
    customersMixed: 'لشركات وأفراد معاً',
    customersB2c: 'لأفراد فقط (B2C)',
    revenueQuestion: 'إيراداتك السنوية التقريبية (درهم)',
    revenuePlaceholder: 'مثال: 2,000,000',
    revenueHint: 'الحد الفاصل 50 مليون درهم، ويكفي تقدير تقريبي.',
    errors: {
      gov: 'اختر نعم أو لا.',
      customers: 'اختر لمن تبيع.',
      revenue: 'أدخل رقماً صحيحاً موجباً بالدرهم.',
    },
    submit: 'اعرض موعد الإلزام',
    reset: 'ابدأ من جديد',
    resultTitle: 'نتيجتك',
    phases: {
      'large-business': 'المرحلة الأولى — شركات إيراداتها 50 مليون درهم فأكثر',
      'other-business': 'المرحلة الثانية — باقي الشركات',
      government: 'مرحلة الجهات الحكومية',
      'b2c-only': 'البيع للأفراد فقط',
    },
    status: {
      upcoming: 'قادم',
      'overdue-mandatory': 'الموعد الإلزامي بدأ',
      'not-in-scope-yet': 'غير مشمول حالياً',
    },
    mandatoryFrom: 'إلزامي من',
    daysLeft: 'يوماً متبقياً',
    overdueBody:
      'بدأ الموعد الإلزامي لمرحلتك. إذا لم تبدأ بعد، فتواصل فوراً مع مزوّد خدمة معتمد ومع محاسبك.',
    notInScopeBody:
      'معاملات البيع للأفراد (B2C) مستثناة حالياً من الإلزام. تابع التحديثات لأن النطاق قد يتوسع لاحقاً، وأعد الاختبار إذا بدأت البيع للشركات.',
    aspTitle: 'تعيين مزوّد الخدمة المعتمد (ASP)',
    aspLarge:
      'الموعد المُعلن لتعيين مزوّد خدمة معتمد للشركات الكبيرة هو {deadline} (وتذكر بعض المصادر {alternate}). إذا لم تعيّن مزوّداً بعد، فاجعل ذلك أولويتك الآن.',
    aspLargePassed:
      'انتهى الموعد المُعلن لتعيين مزوّد خدمة معتمد للشركات الكبيرة ({deadline}، وتذكر بعض المصادر {alternate}): عيّن مزوّد خدمة معتمداً فوراً إن لم تفعل.',
    aspPlan:
      'لا تتضمن هذه الأداة موعد تعيين منفصلاً ومؤكداً لمرحلتك، لكن التعيين والربط والاختبار تستغرق أسابيع، فابدأ التواصل مع مزوّدي الخدمة المعتمدين مبكراً.',
    aspMonitor: 'لا تحتاج إلى مزوّد خدمة الآن، لكن تابع أي توسّع في نطاق الإلزام.',
    stepsTitle: 'خطواتك للاستعداد',
    steps: [
      {
        title: 'عيّن مزوّد خدمة معتمد (ASP)',
        body: 'اختر مزوّداً من القائمة الرسمية للمزوّدين المعتمدين ليربط نظامك بشبكة Peppol.',
      },
      {
        title: 'احصل على معرّف Peppol',
        body: 'يسجّلك مزوّدك ويمنحك معرّفاً ترسل به الفواتير وتستقبلها، ويرتبط عادةً برقم تسجيلك الضريبي.',
      },
      {
        title: 'جهّز حقول بيانات PINT AE',
        body: 'تأكد من أن فواتيرك تتضمن الحقول المطلوبة: رقم التسجيل الضريبي للطرفين، والتواريخ، وتفاصيل البنود، والضريبة بصيغة PINT AE.',
      },
      {
        title: 'اختبر قبل الموعد',
        body: 'أرسل فواتير تجريبية مع مزوّدك وتأكد من وصولها والإبلاغ عنها قبل التاريخ الإلزامي.',
      },
    ],
    remindersTitle: 'هل تريد تذكيراً قبل موعدك؟',
    remindersBody:
      'التذكيرات التلقائية قادمة قريباً. أرسل لنا بريداً إلكترونياً الآن وسنضيفك إلى القائمة يدوياً، فهذه الصفحة لا تخزّن أي بيانات.',
    remindersCta: 'أرسل طلب التذكير بالبريد الإلكتروني',
    remindersSubject: 'تذكير بموعد الفوترة الإلكترونية في الإمارات — {date}',
    remindersSubjectNoDate: 'تذكير بتحديثات الفوترة الإلكترونية في الإمارات',
    guideCta: 'اقرأ الدليل الكامل',
    faqTitle: 'أسئلة شائعة عن مواعيد الفوترة الإلكترونية',
    faq: [
      {
        question: 'متى تبدأ الفوترة الإلكترونية الإلزامية في الإمارات؟',
        answer:
          'حسب إرشادات وزارة المالية والهيئة الاتحادية للضرائب: بدأت المرحلة التجريبية في 1 يوليو 2026، وتصبح الفوترة الإلكترونية إلزامية في 1 يناير 2027 للشركات التي تبلغ إيراداتها 50 مليون درهم فأكثر، وفي 1 يوليو 2027 لبقية الشركات، وفي 1 أكتوبر 2027 للجهات الحكومية. تحقّق منها قبل الاعتماد عليها.',
      },
      {
        question: 'هل البيع للأفراد مشمول؟',
        answer:
          'لا، معاملات B2C مستثناة حالياً. النطاق الحالي يغطي الفواتير بين الشركات ومع الجهات الحكومية.',
      },
      {
        question: 'متى يجب أن أعيّن مزوّد الخدمة المعتمد؟',
        answer:
          'للشركات الكبيرة، الموعد المُعلن هو 31 يوليو 2026، وتذكر بعض المصادر 30 أكتوبر 2026. وينبغي لبقية الشركات أن تبدأ قبل موعدها الإلزامي بوقت كافٍ للربط والاختبار.',
      },
      {
        question: 'هل هذه الأداة رسمية؟',
        answer:
          'لا. قافتر منتج مستقل وغير تابع للهيئة الاتحادية للضرائب أو وزارة المالية، والنتيجة إرشادية فقط.',
      },
    ],
  },
  hub: {
    eyebrow: 'الإمارات · الفوترة الإلكترونية 2027',
    title: 'استعد للفوترة الإلكترونية في الإمارات 2027 — فوترة عربية لشركتك',
    intro:
      'أدوات عربية مجانية للشركات الصغيرة والمتوسطة التي تبيع للشركات والأفراد: تحقّق من صيغة رقم التسجيل الضريبي، واحسب ضريبة 5٪ بالدرهم، واعرف موعد إلزام شركتك بالفوترة الإلكترونية قبل حلوله.',
    primaryCta: 'اعرف موعد الإلزام',
    secondaryCta: 'اقرأ الدليل الكامل',
    timelineTitle: 'الجدول الزمني للفوترة الإلكترونية',
    timeline: [
      { label: 'بدء المرحلة التجريبية', key: 'pilotStart' },
      {
        label: 'إلزامي — إيرادات 50 مليون درهم فأكثر',
        key: 'largeBusinessGoLive',
      },
      { label: 'إلزامي — باقي الشركات', key: 'otherBusinessGoLive' },
      { label: 'إلزامي — الجهات الحكومية', key: 'governmentGoLive' },
    ],
    b2cNote: 'معاملات البيع للأفراد (B2C) مستثناة حالياً.',
    toolsTitle: 'أدوات مجانية للشركات في الإمارات',
    cardCta: 'افتح',
    cards: {
      'e-invoicing-readiness': {
        title: 'اختبار جاهزية الفوترة الإلكترونية',
        description: `أجب عن ${READINESS_QUESTIONS.length} أسئلة لتعرف مرحلتك وموعد الإلزام والأيام المتبقية.`,
        badge: 'الأكثر طلباً',
      },
      'trn-checker': {
        title: 'التحقق من صيغة رقم التسجيل الضريبي (TRN)',
        description:
          '15 رقماً يبدأ بـ 100. تأكد من الصيغة قبل كتابته على الفاتورة.',
        badge: 'مجاني',
      },
      'vat-calculator': {
        title: 'حاسبة ضريبة القيمة المضافة 5٪',
        description:
          'أضف 5٪ إلى المبلغ أو استخرجها من الإجمالي بالدرهم، بتقريب دقيق إلى الفلس.',
        badge: 'مجاني',
      },
      'invoice-generator': {
        title: 'مولّد الفاتورة الضريبية',
        description:
          'فاتورة ضريبية بالدرهم وبضريبة 5٪، بالعربية أو الإنجليزية أو باللغتين، مع تنزيل PDF مجاناً.',
        badge: 'جديد',
      },
      guide: {
        title: 'دليل الفوترة الإلكترونية 2027',
        description:
          'المواعيد، ونموذج Peppol بخمس زوايا، وPINT AE، وما يعنيه ذلك لشركتك.',
        badge: 'دليل',
      },
    },
  },
}

export type AeCopy = typeof aeCopyAr

const aeCopyEn: AeCopy = {
  regionLabel: 'UAE',
  brand: 'Qaftr',
  verifyNote: 'Per MoF/FTA guidance — verify before relying on these dates.',
  disclaimer:
    'Qaftr is an independent product and is not affiliated with the FTA or the Ministry of Finance. This is general guidance, not tax advice.',
  seo: {
    hub: {
      title: 'UAE E-invoicing 2027 for Businesses — Free Tools | Qaftr',
      description:
        'Free Arabic-first tools for UAE businesses and SMEs: check a TRN format, calculate 5% VAT and find your company’s mandatory 2027 e-invoicing date.',
    },
    'trn-checker': {
      title: 'UAE TRN Checker — 15 Digits Starting with 100 | Qaftr',
      description:
        'Free UAE Tax Registration Number format check: 15 digits, starts with 100. Format only: confirm registration on the FTA’s TRN verification service.',
    },
    'vat-calculator': {
      title: 'UAE 5% VAT Calculator — Add or Remove VAT in AED | Qaftr',
      description:
        'Calculate UAE 5% VAT in AED both ways: add VAT to a net amount or extract it from a gross total, rounded correctly to the fils. Free, no signup.',
    },
    'e-invoicing-readiness': {
      title: 'UAE E-invoicing Readiness Checker for Businesses | Qaftr',
      description:
        'A one-minute quiz: find your company’s UAE e-invoicing phase, mandatory go-live date, days remaining and next steps with an Accredited Service Provider.',
    },
    'invoice-generator': {
      title: 'Free UAE Tax Invoice Generator — AED, 5% VAT, PDF | Qaftr',
      description:
        'Create a UAE tax invoice for your business free in Arabic, English or both: AED, 5% VAT, zero-rated and exempt lines, PDF download. No signup.',
    },
    guide: {
      title: 'UAE E-invoicing 2027 Guide: Timeline & PINT AE | Qaftr',
      description:
        'UAE e-invoicing explained: the 2026–2027 timeline, the Peppol 5-corner model, PINT AE, who is in scope, the B2C exclusion and freelancers.',
    },
  },
  pageNames: {
    hub: 'UAE',
    'trn-checker': 'TRN checker',
    'vat-calculator': '5% VAT calculator',
    'e-invoicing-readiness': 'E-invoicing readiness',
    'invoice-generator': 'Tax invoice generator',
    guide: 'UAE e-invoicing 2027 guide',
  },
  trn: {
    title: 'UAE TRN format checker',
    subtitle:
      'A UAE Tax Registration Number has 15 digits and starts with 100. Paste it in any shape — spaces, dashes or Arabic digits — and we tidy it up and check the format.',
    badge: 'UAE · TRN',
    inputLabel: 'Tax Registration Number (TRN)',
    inputPlaceholder: '100XXXXXXXXXXXX',
    inputHint: 'Spaces, dashes and Arabic digits (١٢٣) are fine.',
    statusEmpty: 'Enter a TRN to check',
    statusValid: 'Valid format',
    statusInvalid: 'Invalid format',
    rulesTitle: 'Check result',
    rules: {
      characters: 'Digits only',
      length: 'Exactly 15 digits',
      prefix: 'Starts with 100',
    },
    digitCount: 'Digits',
    normalizedLabel: 'Normalized TRN',
    formatOnlyTitle: 'Checks the format only',
    formatOnlyBody:
      'This tool checks the shape of the number only. It cannot tell whether a TRN is registered or active. To confirm registration status, use the TRN verification service on the FTA’s official website.',
    ftaLink: 'Federal Tax Authority (FTA) website',
    nextTitle: 'Next step',
    nextBody:
      'Work out 5% VAT for your invoice, or find your mandatory e-invoicing date.',
    nextVat: '5% VAT calculator',
    nextReadiness: 'Readiness checker',
    faqTitle: 'UAE TRN — frequently asked questions',
    faq: [
      {
        question: 'How many digits is a UAE TRN?',
        answer:
          'A UAE Tax Registration Number has 15 digits and normally starts with 100. Anything shorter, longer, or with a different start has an invalid format.',
      },
      {
        question: 'Does this tool confirm the TRN is registered?',
        answer:
          'No. It checks the format only (length, prefix and digits). Registration status and the business name must be verified on the TRN verification service on the FTA’s official website.',
      },
      {
        question: 'Where does the TRN go on an invoice?',
        answer:
          'A UAE tax invoice normally shows the supplier’s TRN, the buyer’s TRN if registered, the date, the amounts and the 5% VAT. Check FTA requirements for your invoice type.',
      },
      {
        question: 'Is it different from a Saudi VAT number?',
        answer:
          'Yes. A Saudi VAT number also has 15 digits but starts and ends with 3, while a UAE TRN starts with 100. Keep them apart if you invoice clients in both countries.',
      },
      {
        question: 'Do you store the number I enter?',
        answer:
          'No. The check runs in your browser and the number is never sent to a server.',
      },
    ],
  },
  vat: {
    title: 'UAE 5% VAT calculator',
    subtitle:
      'Work out UAE VAT in AED in seconds: add 5% to a net amount, or pull the VAT out of a VAT-inclusive total — rounded correctly to the fils.',
    cardTitle: 'VAT calculator',
    badge: '5% VAT · AED',
    amountLabel: 'Amount (AED)',
    amountPlaceholder: 'e.g. 1,000',
    modeLabel: 'Amount type',
    modeExclusive: 'Before VAT',
    modeInclusive: 'Includes VAT',
    rateNote: 'The UAE standard VAT rate is 5%.',
    resultsTitle: 'Result',
    subtotal: 'Taxable amount',
    vat: 'VAT (5%)',
    total: 'Total including VAT',
    emptyHint: 'Enter a valid positive amount to see the breakdown.',
    tooLargeHint:
      'That amount is too large — the maximum is AED 1 trillion (1,000,000,000,000).',
    createInvoice: 'Create your first tax invoice free',
    invoiceNote:
      'A PDF tax invoice in AED at 5%, in Arabic, English or both — no signup.',
    faqTitle: 'UAE 5% VAT — frequently asked questions',
    faq: [
      {
        question: 'What is the VAT rate in the UAE?',
        answer:
          'The standard rate is 5%. Some supplies are zero-rated or exempt under FTA rules, so check how your service is classified.',
      },
      {
        question: 'How do I add 5% VAT to an amount?',
        answer:
          'Multiply the net amount by 0.05 to get the VAT, then add it. Example: AED 1,000 + 50 = AED 1,050.',
      },
      {
        question: 'How do I remove VAT from a VAT-inclusive total?',
        answer:
          'Divide the total by 1.05 to get the net amount; the difference is the VAT. Example: 1,050 ÷ 1.05 = AED 1,000, so VAT is AED 50.',
      },
      {
        question: 'How is rounding handled?',
        answer:
          'Each amount is rounded to the nearest fils (2 decimals), and the net amount plus VAT always equals the total exactly.',
      },
      {
        question: 'Do I need to be registered to charge VAT?',
        answer:
          'You only charge VAT on invoices if you are VAT-registered with a TRN. The registration threshold and rules are set by the FTA.',
      },
    ],
  },
  readiness: {
    title: 'When does UAE e-invoicing become mandatory for your business?',
    subtitle: `Answer ${READINESS_QUESTIONS.length} quick questions to see your phase, your mandatory go-live date, how many days you have left, and what to do next with an Accredited Service Provider (ASP).`,
    formTitle: 'Readiness check',
    govQuestion: 'Are you a government entity?',
    yes: 'Yes',
    no: 'No',
    customersQuestion: 'Who do you sell to?',
    customersB2b: 'Businesses or government (B2B / B2G)',
    customersMixed: 'Both businesses and consumers',
    customersB2c: 'Consumers only (B2C)',
    revenueQuestion: 'Approximate annual revenue (AED)',
    revenuePlaceholder: 'e.g. 2,000,000',
    revenueHint: 'The dividing line is AED 50M. A rough estimate is fine.',
    errors: {
      gov: 'Choose yes or no.',
      customers: 'Choose who you sell to.',
      revenue: 'Enter a valid positive amount in AED.',
    },
    submit: 'Show my deadline',
    reset: 'Start over',
    resultTitle: 'Your result',
    phases: {
      'large-business': 'Phase 1 — businesses with revenue of AED 50M or more',
      'other-business': 'Phase 2 — all other businesses',
      government: 'Government entities phase',
      'b2c-only': 'Consumer (B2C) sales only',
    },
    status: {
      upcoming: 'Upcoming',
      'overdue-mandatory': 'Mandatory now',
      'not-in-scope-yet': 'Not in scope yet',
    },
    mandatoryFrom: 'Mandatory from',
    daysLeft: 'days left',
    overdueBody:
      'Your phase is already mandatory. If you have not started, talk to an accredited provider and your accountant now.',
    notInScopeBody:
      'Business-to-consumer (B2C) transactions are excluded for now. Watch for updates in case the scope widens, and re-run this check if you start selling to businesses.',
    aspTitle: 'Appointing an Accredited Service Provider (ASP)',
    aspLarge:
      'The reported ASP-appointment deadline for large businesses is {deadline} (some sources say {alternate}). If you have not appointed one yet, treat it as urgent.',
    aspLargePassed:
      'The reported ASP-appointment deadline for large businesses ({deadline}; some sources say {alternate}) has passed: appoint an ASP immediately if you have not.',
    aspPlan:
      'This tool has no separate confirmed appointment deadline for your phase, but onboarding, integration and testing take weeks. Start talking to accredited providers early.',
    aspMonitor:
      'You do not need a provider yet, but watch for any change in scope.',
    stepsTitle: 'Your preparation steps',
    steps: [
      {
        title: 'Appoint an Accredited Service Provider (ASP)',
        body: 'Pick a provider from the official accredited list to connect your system to the Peppol network.',
      },
      {
        title: 'Get your Peppol ID',
        body: 'Your provider registers you and issues the ID you send and receive invoices with, usually linked to your TRN.',
      },
      {
        title: 'Prepare PINT AE data fields',
        body: 'Make sure invoices carry the required data: both TRNs, dates, line details and VAT, in the PINT AE format.',
      },
      {
        title: 'Test before go-live',
        body: 'Send test invoices through your provider and confirm delivery and reporting before your mandatory date.',
      },
    ],
    remindersTitle: 'Want a reminder before your deadline?',
    remindersBody:
      'Automatic reminders are coming soon. For now, email us and we will add you by hand — this page stores nothing.',
    remindersCta: 'Email us to get deadline reminders',
    remindersSubject: 'UAE e-invoicing deadline reminder — {date}',
    remindersSubjectNoDate: 'UAE e-invoicing update reminders',
    guideCta: 'Read the full guide',
    faqTitle: 'UAE e-invoicing deadlines — FAQ',
    faq: [
      {
        question: 'When does UAE e-invoicing become mandatory?',
        answer:
          'Per MoF/FTA guidance: the pilot started on 1 Jul 2026; it becomes mandatory on 1 Jan 2027 for businesses with revenue of AED 50M or more, 1 Jul 2027 for all other businesses, and 1 Oct 2027 for government entities. Verify before relying on these dates.',
      },
      {
        question: 'Are consumer (B2C) sales included?',
        answer:
          'No, B2C transactions are excluded for now. The current scope covers business-to-business and business-to-government invoices.',
      },
      {
        question: 'When must I appoint an Accredited Service Provider?',
        answer:
          'For large businesses the reported deadline is 31 Jul 2026, though some sources say 30 Oct 2026. Other businesses should start early enough before their go-live date to integrate and test.',
      },
      {
        question: 'Is this an official tool?',
        answer:
          'No. Qaftr is independent and not affiliated with the FTA or the Ministry of Finance. Results are guidance only.',
      },
    ],
  },
  hub: {
    eyebrow: 'UAE · E-invoicing 2027',
    title: 'Get ready for UAE e-invoicing in 2027 — Arabic-first invoicing for your business',
    intro:
      'Free tools in Arabic and English for SMEs that sell to businesses and consumers: check a TRN format, work out 5% VAT in AED, and find your company’s mandatory e-invoicing date before it arrives.',
    primaryCta: 'Find your deadline',
    secondaryCta: 'Read the full guide',
    timelineTitle: 'UAE e-invoicing timeline',
    timeline: [
      { label: 'Pilot starts', key: 'pilotStart' },
      {
        label: 'Mandatory — revenue of AED 50M or more',
        key: 'largeBusinessGoLive',
      },
      { label: 'Mandatory — all other businesses', key: 'otherBusinessGoLive' },
      { label: 'Mandatory — government entities', key: 'governmentGoLive' },
    ],
    b2cNote: 'Business-to-consumer (B2C) transactions are excluded for now.',
    toolsTitle: 'Free tools for UAE businesses',
    cardCta: 'Open',
    cards: {
      'e-invoicing-readiness': {
        title: 'E-invoicing readiness checker',
        description: `Answer ${READINESS_QUESTIONS.length} questions to see your phase, mandatory date and days remaining.`,
        badge: 'Most popular',
      },
      'trn-checker': {
        title: 'UAE TRN format checker',
        description:
          '15 digits starting with 100 — check the format before it goes on an invoice.',
        badge: 'Free',
      },
      'vat-calculator': {
        title: '5% VAT calculator',
        description:
          'Add 5% to a net amount or extract it from a gross total in AED, fils-accurate.',
        badge: 'Free',
      },
      'invoice-generator': {
        title: 'Tax invoice generator',
        description:
          'A UAE tax invoice in AED at 5%, in Arabic, English or both, with free PDF download.',
        badge: 'New',
      },
      guide: {
        title: 'UAE e-invoicing 2027 guide',
        description:
          'Deadlines, the Peppol 5-corner model, PINT AE, and what it means for your business.',
        badge: 'Guide',
      },
    },
  },
}

export function getAeCopy(lang: MarketingLang): AeCopy {
  return lang === 'en' ? aeCopyEn : aeCopyAr
}
