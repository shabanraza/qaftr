import type { MarketingLang } from '#/lib/marketing/lang'
import { UAE_EINVOICING_MILESTONES as M } from '@zatca/shared'

/** Bump when the guide content changes; feeds Article JSON-LD dateModified. */
export const AE_GUIDE_DATE_PUBLISHED = '2026-11-08'
export const AE_GUIDE_DATE_MODIFIED = '2026-11-09'

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }

export type GuideSectionId =
  | 'what'
  | 'timeline'
  | 'scope'
  | 'b2c'
  | 'five-corner'
  | 'pint-ae'
  | 'asp'
  | 'freelancers'
  | 'checklist'

export type GuideSection = {
  id: GuideSectionId
  heading: string
  blocks: GuideBlock[]
}

export type AeGuide = {
  title: string
  intro: string
  updatedLabel: string
  tocTitle: string
  verifyNote: string
  timeline: {
    caption: string
    headers: [string, string, string]
    rows: { date: string; who: string; what: string }[]
  }
  sections: GuideSection[]
  toolsTitle: string
  tools: { readiness: string; trn: string; vat: string }
  faqTitle: string
  faq: { question: string; answer: string }[]
}

const p = (text: string): GuideBlock => ({ type: 'p', text })
const ul = (...items: string[]): GuideBlock => ({ type: 'ul', items })

const guideEn: AeGuide = {
  title: 'UAE e-invoicing 2027: the complete guide for businesses and SMEs',
  intro:
    'The UAE is moving business invoicing onto a national e-invoicing network. If you send invoices to companies or government bodies, the way you issue them is about to change: a PDF attached to an email will no longer be enough. This guide explains the timeline, who is in scope, how the Peppol 5-corner model and the PINT AE format work, what an Accredited Service Provider (ASP) does, and what it all means for your business, including SMEs and freelancers. All dates are per MoF/FTA guidance as publicly reported — verify them before relying on them.',
  updatedLabel: 'Last updated',
  tocTitle: 'Contents',
  verifyNote:
    'Dates and rules are per MoF/FTA guidance as publicly reported. Verify before relying on them. Qaftr is independent and not affiliated with the FTA or the Ministry of Finance.',
  timeline: {
    caption:
      'UAE e-invoicing timeline (per MoF/FTA guidance, verify before relying)',
    headers: ['Date', 'Who', 'What happens'],
    rows: [
      {
        date: M.pilotStart,
        who: 'Pilot participants',
        what: 'Pilot phase begins with selected businesses testing the network through ASPs.',
      },
      {
        date: M.largeBusinessGoLive,
        who: 'Businesses with revenue of AED 50M or more',
        what: 'E-invoicing becomes mandatory for B2B and B2G invoices.',
      },
      {
        date: M.otherBusinessGoLive,
        who: 'All other businesses in scope',
        what: 'E-invoicing becomes mandatory, including for SMEs and freelancers who invoice businesses.',
      },
      {
        date: M.governmentGoLive,
        who: 'Government entities',
        what: 'E-invoicing becomes mandatory for government entities.',
      },
    ],
  },
  sections: [
    {
      id: 'what',
      heading: 'What is UAE e-invoicing?',
      blocks: [
        p(
          'E-invoicing is not the same as sending a PDF by email. Under the UAE model, an electronic invoice is a structured data file that machines can read without a person retyping it. The invoice travels from the seller’s system to the buyer’s system through certified intermediaries, and the key tax data is reported to the Federal Tax Authority (FTA) along the way.',
        ),
        p(
          'The goal is faster, cleaner invoicing and better VAT visibility for the authorities. For businesses, the practical effect is that every B2B or B2G invoice must be created in the right format and sent through the right channel. A scanned image, a Word document or a PDF on its own will not count as a valid e-invoice once your phase becomes mandatory.',
        ),
        p(
          'The UAE has chosen an open, internationally used framework called Peppol rather than building a closed national portal. This matters because Peppol is already used in many countries, so software vendors and service providers can plug into it with standard tools.',
        ),
      ],
    },
    {
      id: 'timeline',
      heading: 'The timeline: pilot in 2026, go-live in 2027',
      blocks: [
        p(
          'Per MoF/FTA guidance, the rollout is phased by business size and type. The pilot started on 1 Jul 2026. After that, the mandatory dates are 1 Jan 2027 for businesses with annual revenue of AED 50M or more, 1 Jul 2027 for all other businesses, and 1 Oct 2027 for government entities.',
        ),
        p(
          'Before the go-live date, each business is expected to appoint an Accredited Service Provider. For large businesses, the ASP-appointment deadline is reported as 31 Jul 2026, although some sources say 30 Oct 2026. Because reports differ, treat the earlier date as the safe assumption and confirm the current rule with your adviser or the official announcements.',
        ),
        p(
          'If you are a smaller business, 1 Jul 2027 can feel far away, but appointing a provider, getting your Peppol ID, cleaning up your customer data and testing all take time. Working back from your go-live date is the simplest way to plan.',
        ),
      ],
    },
    {
      id: 'scope',
      heading: 'Who is in scope?',
      blocks: [
        p(
          'The mandate is aimed at invoices between businesses (B2B) and between businesses and government (B2G). If you sell services or goods to companies in the UAE and issue them invoices, you should assume you are in scope and check the detail for your situation.',
        ),
        ul(
          'Large businesses with revenue of AED 50M or more: mandatory from 1 Jan 2027.',
          'All other businesses that issue B2B or B2G invoices, including SMEs and many freelancers: mandatory from 1 Jul 2027.',
          'Government entities: mandatory from 1 Oct 2027.',
        ),
        p(
          'Revenue is the main dividing line between the first two phases, so it helps to know your annual revenue figure in AED. Free-zone status, VAT registration and the type of supply can all affect the detail, so confirm your own position with a tax adviser. Our readiness checker gives you a quick first answer based on the public timeline.',
        ),
      ],
    },
    {
      id: 'b2c',
      heading: 'The B2C exclusion',
      blocks: [
        p(
          'Business-to-consumer (B2C) transactions are excluded for now. If you only sell to individuals, for example a café, a salon or an online shop selling to the public, the current phases do not require you to issue Peppol e-invoices for those sales.',
        ),
        p(
          '“For now” is the important part. Many countries start with B2B and later widen the scope. If you sell to both consumers and businesses, the business invoices are still in scope, so you will need an e-invoicing setup for that part of your sales.',
        ),
      ],
    },
    {
      id: 'five-corner',
      heading: 'How the Peppol 5-corner model works',
      blocks: [
        p(
          'Peppol normally uses a 4-corner model: the seller, the seller’s provider, the buyer’s provider and the buyer. The UAE adds a fifth corner, the tax authority, so the model is called 5-corner.',
        ),
        ul(
          'Corner 1 — the supplier creates the invoice in its own system or app.',
          'Corner 2 — the supplier’s ASP validates the invoice and sends it over the Peppol network.',
          'Corner 3 — the buyer’s ASP receives the invoice and checks it.',
          'Corner 4 — the buyer receives the invoice in its own system, ready to approve and pay.',
          'Corner 5 — the required tax data is reported to the FTA.',
        ),
        p(
          'For you this means two things. First, you do not connect to the FTA directly; your ASP does the technical work. Second, your buyer also needs an ASP, which is why large companies are already asking their suppliers for Peppol details.',
        ),
      ],
    },
    {
      id: 'pint-ae',
      heading: 'PINT AE: the invoice data format',
      blocks: [
        p(
          'PINT stands for Peppol International. PINT AE is the UAE-specific version of that invoice specification. It defines which fields an invoice must contain and how they are structured so that every system on the network reads them the same way.',
        ),
        p(
          'You will rarely see the raw file, but your data has to be complete for it to be generated correctly. Typical fields include:',
        ),
        ul(
          'Supplier and buyer legal names, addresses and TRNs (15 digits, starting with 100).',
          'Invoice number, issue date and, where relevant, the supply date.',
          'Line items with description, quantity, unit price and the VAT category.',
          'VAT at 5% (or the correct zero-rated or exempt treatment) and totals in AED.',
          'Peppol participant identifiers for both parties.',
        ),
        p(
          'Clean master data is the cheapest thing you can fix today. Check that your customers’ TRNs are in the right format and that your item descriptions and VAT categories are consistent.',
        ),
      ],
    },
    {
      id: 'asp',
      heading: 'Accredited Service Providers (ASPs)',
      blocks: [
        p(
          'An ASP is a provider accredited to connect businesses to the UAE e-invoicing network. It validates your invoices, sends and receives them over Peppol, and handles the reporting corner. Check the official list of accredited providers before you sign with anyone.',
        ),
        p(
          'When comparing providers, ask about pricing per invoice, how they connect to your accounting software, whether they support Arabic, how they handle invoices you receive, and how much help they give with testing. Qaftr is not an ASP; we build free tools and Arabic-first invoicing that help you prepare.',
        ),
      ],
    },
    {
      id: 'freelancers',
      heading: 'What it means for freelancers',
      blocks: [
        p(
          'If you are a freelancer in Dubai, Abu Dhabi or a free zone and you bill companies, e-invoicing will affect you from your phase’s go-live date. Your clients’ finance teams will expect to receive your invoices over Peppol, and some may stop accepting PDFs.',
        ),
        ul(
          'Know your phase: most freelancers fall into the 1 Jul 2027 group.',
          'Keep your TRN and your clients’ TRNs accurate if you are VAT-registered.',
          'Choose tools that can export structured data, not just PDFs.',
          'Budget for a provider fee; many ASPs offer plans for low invoice volumes.',
          'Ask your biggest clients what they need from you and by when.',
        ),
        p(
          'Freelancers who only work with individuals fall under the B2C exclusion for now. If your client list is mixed, plan for the business side.',
        ),
      ],
    },
    {
      id: 'checklist',
      heading: 'Your readiness checklist',
      blocks: [
        ul(
          'Confirm your phase and go-live date with the readiness checker.',
          'Shortlist and appoint an Accredited Service Provider.',
          'Get your Peppol ID through your provider.',
          'Map your invoice data to the PINT AE fields and fix gaps.',
          'Run test invoices with your provider and a friendly client.',
          'Train whoever issues invoices and set a go-live date internally.',
        ),
        p(
          'Start with the step you can do today: check your phase, verify your TRNs, and make sure your VAT maths is right.',
        ),
      ],
    },
  ],
  toolsTitle: 'Free tools to get ready',
  tools: {
    readiness: 'Check your e-invoicing deadline',
    trn: 'Check a TRN format',
    vat: 'Calculate 5% VAT',
  },
  faqTitle: 'UAE e-invoicing — frequently asked questions',
  faq: [
    {
      question: 'When does UAE e-invoicing become mandatory?',
      answer:
        'Per MoF/FTA guidance: 1 Jan 2027 for businesses with revenue of AED 50M or more, 1 Jul 2027 for all other businesses, and 1 Oct 2027 for government entities. The pilot started on 1 Jul 2026. Verify before relying on these dates.',
    },
    {
      question: 'Is a PDF invoice still valid?',
      answer:
        'Once your phase is mandatory, a PDF on its own will not be a valid e-invoice for in-scope B2B or B2G sales. Invoices must be exchanged as structured PINT AE data through an ASP.',
    },
    {
      question: 'What is the ASP appointment deadline?',
      answer:
        'For large businesses it is reported as 31 Jul 2026, though some sources say 30 Oct 2026. Other businesses should appoint a provider well before their go-live date.',
    },
    {
      question: 'Are B2C sales included?',
      answer: 'No. Business-to-consumer transactions are excluded for now.',
    },
    {
      question: 'What is PINT AE?',
      answer:
        'The UAE version of the Peppol International invoice specification. It sets the fields and structure every e-invoice must follow.',
    },
    {
      question: 'Do freelancers need e-invoicing?',
      answer:
        'Freelancers who invoice businesses or government are expected to be in scope, usually from 1 Jul 2027. Those who only sell to individuals fall under the B2C exclusion for now.',
    },
    {
      question: 'Is Qaftr an official or accredited provider?',
      answer:
        'No. Qaftr is an independent product, not an ASP, and not affiliated with the FTA or the Ministry of Finance.',
    },
  ],
}

const guideAr: AeGuide = {
  title:
    'الفوترة الإلكترونية في الإمارات 2027: الدليل الشامل للشركات والمنشآت الصغيرة والمتوسطة',
  intro:
    'تنقل الإمارات فواتير الشركات إلى شبكة وطنية للفوترة الإلكترونية. فإذا كانت شركتك تُصدر فواتير لشركات أو جهات حكومية، فستتغير طريقة إصدارها، ولن يكفي ملف PDF مرفق برسالة بريد إلكتروني. يشرح هذا الدليل الجدول الزمني، ونطاق الإلزام، وآلية عمل نموذج Peppol بخمس زوايا وصيغة PINT AE، ودور مزوّد الخدمة المعتمد (ASP)، وما يعنيه ذلك لشركتك، بما في ذلك المنشآت الصغيرة والمستقلون. كل التواريخ حسب إرشادات وزارة المالية والهيئة الاتحادية للضرائب كما أُعلنت — تحقّق منها قبل الاعتماد عليها.',
  updatedLabel: 'آخر تحديث',
  tocTitle: 'المحتويات',
  verifyNote:
    'التواريخ والقواعد حسب إرشادات وزارة المالية والهيئة الاتحادية للضرائب كما أُعلنت. تحقّق منها قبل الاعتماد عليها. قافتر منتج مستقل وغير تابع للهيئة الاتحادية للضرائب أو وزارة المالية.',
  timeline: {
    caption:
      'الجدول الزمني للفوترة الإلكترونية في الإمارات (حسب إرشادات وزارة المالية والهيئة — تحقّق قبل الاعتماد)',
    headers: ['التاريخ', 'من يشمل', 'ماذا يحدث'],
    rows: [
      {
        date: M.pilotStart,
        who: 'المشاركون في التجربة',
        what: 'بدء المرحلة التجريبية بمشاركة شركات مختارة تختبر الشبكة عبر مزوّدي الخدمة المعتمدين.',
      },
      {
        date: M.largeBusinessGoLive,
        who: 'الشركات التي إيراداتها 50 مليون درهم فأكثر',
        what: 'تصبح الفوترة الإلكترونية إلزامية لفواتير B2B وB2G.',
      },
      {
        date: M.otherBusinessGoLive,
        who: 'باقي الشركات المشمولة',
        what: 'تصبح إلزامية، بما فيها الشركات الصغيرة والمتوسطة والمستقلون الذين يفوترون شركات.',
      },
      {
        date: M.governmentGoLive,
        who: 'الجهات الحكومية',
        what: 'تصبح الفوترة الإلكترونية إلزامية على الجهات الحكومية.',
      },
    ],
  },
  sections: [
    {
      id: 'what',
      heading: 'ما هي الفوترة الإلكترونية في الإمارات؟',
      blocks: [
        p(
          'الفوترة الإلكترونية ليست مجرد إرسال ملف PDF بالبريد الإلكتروني. ففي النموذج الإماراتي، الفاتورة الإلكترونية ملف بيانات منظّم تقرؤه الأنظمة مباشرة دون الحاجة إلى إعادة إدخاله يدوياً. وتنتقل الفاتورة من نظام المورّد إلى نظام العميل عبر وسطاء معتمدين، وتُرسل بياناتها الضريبية الأساسية إلى الهيئة الاتحادية للضرائب أثناء ذلك.',
        ),
        p(
          'والهدف فوترة أسرع وأدق، ورؤية أوضح لضريبة القيمة المضافة. وعملياً، يجب أن تُنشأ كل فاتورة بين الشركات أو مع جهة حكومية بالصيغة الصحيحة وتُرسل عبر القناة الصحيحة. ولن تُعدّ الصورة الممسوحة أو ملف Word أو ملف PDF وحده فاتورة إلكترونية صالحة بعد أن يصبح موعد مرحلتك إلزامياً.',
        ),
        p(
          'اختارت الإمارات إطاراً مفتوحاً ومستخدماً عالمياً اسمه Peppol بدل بوابة وطنية مغلقة. وهذا مهم لأن Peppol مستخدم في دول كثيرة، فيستطيع مزوّدو البرامج والخدمات ربط أنظمتهم به بأدوات قياسية معروفة.',
        ),
      ],
    },
    {
      id: 'timeline',
      heading: 'الجدول الزمني: تجربة في 2026 وإلزام في 2027',
      blocks: [
        p(
          'حسب إرشادات وزارة المالية والهيئة الاتحادية للضرائب، التطبيق على مراحل حسب حجم المنشأة ونوعها. بدأت المرحلة التجريبية في 1 يوليو 2026. بعدها تصبح الفوترة إلزامية في 1 يناير 2027 للشركات التي إيراداتها السنوية 50 مليون درهم فأكثر، وفي 1 يوليو 2027 لباقي الشركات، وفي 1 أكتوبر 2027 للجهات الحكومية.',
        ),
        p(
          'قبل موعد الإلزام، يُتوقّع من كل منشأة تعيين مزوّد خدمة معتمد. للشركات الكبيرة، الموعد المُعلن لتعيين المزوّد هو 31 يوليو 2026، مع أن بعض المصادر تذكر 30 أكتوبر 2026. وبما أن المصادر تختلف، اعتبر التاريخ الأبكر هو الافتراض الآمن، وتأكد من القاعدة الحالية مع مستشارك أو من الإعلانات الرسمية.',
        ),
        p(
          'إذا كانت شركتك صغيرة، فقد يبدو موعد 1 يوليو 2027 بعيداً، لكن تعيين المزوّد والحصول على معرّف Peppol وتنقية بيانات العملاء والاختبار تستغرق وقتاً. وأسهل طريقة للتخطيط أن تبدأ من موعدك الإلزامي وتعود إلى الوراء.',
        ),
      ],
    },
    {
      id: 'scope',
      heading: 'من يشمله الإلزام؟',
      blocks: [
        p(
          'الإلزام موجّه للفواتير بين الشركات (B2B) وبين الشركات والجهات الحكومية (B2G). إذا كنت تبيع خدمات أو بضائع لشركات في الإمارات وتصدر لها فواتير، فافترض أنك مشمول وراجع التفاصيل الخاصة بوضعك.',
        ),
        ul(
          'الشركات الكبيرة التي إيراداتها 50 مليون درهم فأكثر: إلزامي من 1 يناير 2027.',
          'بقية الشركات التي تصدر فواتير B2B أو B2G، ومنها الشركات الصغيرة والمتوسطة وكثير من المستقلين: إلزامي من 1 يوليو 2027.',
          'الجهات الحكومية: إلزامي من 1 أكتوبر 2027.',
        ),
        p(
          'الإيرادات هي الحد الفاصل الأساسي بين المرحلتين الأولى والثانية، فمن المفيد أن تعرف إيرادات شركتك السنوية بالدرهم. وقد يؤثر وضع المنطقة الحرة والتسجيل في ضريبة القيمة المضافة ونوع التوريد في التفاصيل، فتأكد من وضعك مع مستشار ضريبي. ويمنحك اختبار الجاهزية إجابة أولية سريعة مبنية على الجدول المُعلن.',
        ),
      ],
    },
    {
      id: 'b2c',
      heading: 'استثناء البيع للأفراد (B2C)',
      blocks: [
        p(
          'معاملات البيع للأفراد (B2C) مستثناة حالياً. إذا كنت تبيع للأفراد فقط، مثل مقهى أو صالون أو متجر إلكتروني يبيع للجمهور، فالمراحل الحالية لا تُلزمك بإصدار فواتير إلكترونية عبر Peppol لهذه المبيعات.',
        ),
        p(
          'كلمة «حالياً» هي المهمة هنا. دول كثيرة تبدأ بالشركات ثم توسّع النطاق لاحقاً. وإذا كنت تبيع لأفراد وشركات معاً، ففواتير الشركات تبقى مشمولة، أي أنك تحتاج إلى نظام فوترة إلكترونية لهذا الجزء من مبيعاتك.',
        ),
      ],
    },
    {
      id: 'five-corner',
      heading: 'كيف يعمل نموذج Peppol بخمس زوايا؟',
      blocks: [
        p(
          'تستخدم شبكة Peppol عادةً نموذج الزوايا الأربع: المورّد، ومزوّد المورّد، ومزوّد العميل، والعميل. الإمارات أضافت زاوية خامسة هي الجهة الضريبية، ولذلك يُسمّى النموذج بخمس زوايا.',
        ),
        ul(
          'الزاوية 1 — المورّد ينشئ الفاتورة في نظامه أو تطبيقه.',
          'الزاوية 2 — مزوّد الخدمة المعتمد للمورّد يتحقق من الفاتورة ويرسلها عبر شبكة Peppol.',
          'الزاوية 3 — مزوّد العميل يستلم الفاتورة ويفحصها.',
          'الزاوية 4 — العميل يستلم الفاتورة في نظامه جاهزة للاعتماد والدفع.',
          'الزاوية 5 — تُرسل البيانات الضريبية المطلوبة إلى الهيئة الاتحادية للضرائب.',
        ),
        p(
          'ويعني هذا لشركتك أمرين: أولاً، لا تتصل بالهيئة مباشرة، فمزوّدك يتولى العمل التقني. وثانياً، يحتاج عميلك أيضاً إلى مزوّد خدمة، ولهذا بدأت الشركات الكبيرة تطلب من مورّديها بيانات Peppol منذ الآن.',
        ),
      ],
    },
    {
      id: 'pint-ae',
      heading: 'PINT AE: صيغة بيانات الفاتورة',
      blocks: [
        p(
          'PINT اختصار لـ Peppol International، وPINT AE هي النسخة الإماراتية من مواصفات الفاتورة هذه. وهي تحدد الحقول التي يجب أن تتضمنها الفاتورة وطريقة تنظيمها، لكي يقرأها كل نظام على الشبكة بالطريقة نفسها.',
        ),
        p(
          'لن ترى الملف الخام في الغالب، لكن يجب أن تكون بياناتك مكتملة لكي يُنشأ بشكل صحيح. ومن الحقول المعتادة:',
        ),
        ul(
          'الاسم القانوني والعنوان ورقم التسجيل الضريبي للمورّد والعميل (15 رقماً يبدأ بـ 100).',
          'رقم الفاتورة وتاريخ الإصدار، وتاريخ التوريد إذا لزم.',
          'البنود مع الوصف والكمية وسعر الوحدة وفئة الضريبة.',
          'ضريبة 5٪ (أو المعاملة الصحيحة للنسبة الصفرية أو الإعفاء) والإجماليات بالدرهم.',
          'معرّفات Peppol للطرفين.',
        ),
        p(
          'تنقية البيانات الأساسية هي أقل الخطوات تكلفة ويمكنك البدء بها اليوم: تأكد من أن أرقام التسجيل الضريبي لعملائك بالصيغة الصحيحة، وأن أوصاف البنود وفئات الضريبة متسقة.',
        ),
      ],
    },
    {
      id: 'asp',
      heading: 'مزوّدو الخدمة المعتمدون (ASP)',
      blocks: [
        p(
          'مزوّد الخدمة المعتمد جهة معتمدة لربط الشركات بشبكة الفوترة الإلكترونية في الإمارات. يتحقق من فواتيرك، ويرسلها ويستقبلها عبر Peppol، ويتولى زاوية الإبلاغ. وراجع القائمة الرسمية للمزوّدين المعتمدين قبل التعاقد مع أي جهة.',
        ),
        p(
          'وعند المقارنة، اسأل عن السعر لكل فاتورة، وطريقة الربط مع برنامجك المحاسبي، ودعم اللغة العربية، وطريقة التعامل مع الفواتير التي تستلمها، ومقدار المساعدة في الاختبار. قافتر ليس مزوّد خدمة معتمداً، بل نقدّم أدوات مجانية وفوترة عربية تساعد شركتك على الاستعداد.',
        ),
      ],
    },
    {
      id: 'freelancers',
      heading: 'ماذا يعني هذا للمستقلين؟',
      blocks: [
        p(
          'إذا كنت مستقلاً في دبي أو أبوظبي أو في منطقة حرة وتُصدر فواتير لشركات، فستؤثر عليك الفوترة الإلكترونية ابتداءً من موعد مرحلتك. وستتوقع الإدارات المالية لدى عملائك استلام فواتيرك عبر Peppol، وقد يتوقف بعضها عن قبول ملفات PDF.',
        ),
        ul(
          'اعرف مرحلتك: أغلب المستقلين ضمن مجموعة 1 يوليو 2027.',
          'حافظ على دقة رقم تسجيلك الضريبي وأرقام عملائك إذا كنت مسجلاً في الضريبة.',
          'اختر أدوات تستطيع تصدير بيانات منظّمة، لا ملفات PDF فقط.',
          'خصّص ميزانية لرسوم المزوّد، فكثير من المزوّدين يقدّمون باقات للأعداد القليلة من الفواتير.',
          'اسأل كبار عملائك عمّا يحتاجونه منك ومتى.',
        ),
        p(
          'المستقلون الذين يتعاملون مع الأفراد فقط يدخلون ضمن استثناء B2C حالياً. أما إذا كان عملاؤك من الشركات والأفراد معاً، فخطّط لفواتير الشركات.',
        ),
      ],
    },
    {
      id: 'checklist',
      heading: 'قائمة الاستعداد',
      blocks: [
        ul(
          'تأكد من مرحلتك وموعدك الإلزامي باختبار الجاهزية.',
          'جهّز قائمة مختصرة وعيّن مزوّد خدمة معتمداً.',
          'احصل على معرّف Peppol عن طريق مزوّدك.',
          'طابق بيانات فواتيرك مع حقول PINT AE وسدّ النواقص.',
          'شغّل فواتير تجريبية مع مزوّدك ومع عميل متعاون.',
          'درّب المسؤول عن إصدار الفواتير وحدد موعد تشغيل داخلي.',
        ),
        p(
          'ابدأ بالخطوة التي يمكنك تنفيذها اليوم: اعرف مرحلتك، وتحقّق من صيغة أرقام التسجيل الضريبي، وتأكد من صحة حساب ضريبة 5٪ لديك.',
        ),
      ],
    },
  ],
  toolsTitle: 'أدوات مجانية للاستعداد',
  tools: {
    readiness: 'اعرف موعدك الإلزامي',
    trn: 'تحقّق من صيغة رقم التسجيل الضريبي',
    vat: 'احسب ضريبة 5٪',
  },
  faqTitle: 'أسئلة شائعة عن الفوترة الإلكترونية في الإمارات',
  faq: [
    {
      question: 'متى تصبح الفوترة الإلكترونية إلزامية في الإمارات؟',
      answer:
        'حسب إرشادات وزارة المالية والهيئة الاتحادية للضرائب: 1 يناير 2027 للشركات التي تبلغ إيراداتها 50 مليون درهم فأكثر، و1 يوليو 2027 لبقية الشركات، و1 أكتوبر 2027 للجهات الحكومية. وبدأت التجربة في 1 يوليو 2026. تحقّق منها قبل الاعتماد عليها.',
    },
    {
      question: 'هل ما زالت فاتورة PDF مقبولة؟',
      answer:
        'بعد أن يصبح موعد مرحلتك إلزامياً، لن يُعدّ ملف PDF وحده فاتورة إلكترونية صالحة لمبيعات B2B أو B2G المشمولة، إذ يجب تبادل الفواتير كبيانات PINT AE منظّمة عبر مزوّد خدمة معتمد.',
    },
    {
      question: 'ما هو موعد تعيين مزوّد الخدمة المعتمد؟',
      answer:
        'للشركات الكبيرة، الموعد المُعلن 31 يوليو 2026، وتذكر بعض المصادر 30 أكتوبر 2026. ويُفضَّل أن تعيّن بقية الشركات مزوّداً قبل موعدها الإلزامي بوقت كافٍ.',
    },
    {
      question: 'هل البيع للأفراد مشمول؟',
      answer: 'لا. معاملات البيع للأفراد (B2C) مستثناة حالياً.',
    },
    {
      question: 'ما هي PINT AE؟',
      answer:
        'النسخة الإماراتية من مواصفات فاتورة Peppol الدولية، وتحدد الحقول والهيكل اللذين يجب أن تتبعهما كل فاتورة إلكترونية.',
    },
    {
      question: 'هل يحتاج المستقلون للفوترة الإلكترونية؟',
      answer:
        'يُتوقّع أن يشمل الإلزام المستقلين الذين يُصدرون فواتير لشركات أو جهات حكومية، غالباً من 1 يوليو 2027. أما من يبيعون للأفراد فقط فيدخلون ضمن استثناء B2C حالياً.',
    },
    {
      question: 'هل قافتر مزوّد رسمي أو معتمد؟',
      answer:
        'لا. قافتر منتج مستقل، وليس مزوّد خدمة معتمداً، وغير تابع للهيئة الاتحادية للضرائب أو وزارة المالية.',
    },
  ],
}

export function getAeGuide(lang: MarketingLang): AeGuide {
  return lang === 'en' ? guideEn : guideAr
}

/** Counts visible words across the whole guide (intro, table, sections, FAQ). */
export function guideWordCount(guide: AeGuide): number {
  const parts: string[] = [
    guide.title,
    guide.intro,
    guide.verifyNote,
    guide.timeline.caption,
  ]
  parts.push(...guide.timeline.headers)
  for (const row of guide.timeline.rows) parts.push(row.who, row.what)
  for (const section of guide.sections) {
    parts.push(section.heading)
    for (const block of section.blocks) {
      if (block.type === 'p') parts.push(block.text)
      else parts.push(...block.items)
    }
  }
  for (const item of guide.faq) parts.push(item.question, item.answer)
  return parts
    .join(' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}
