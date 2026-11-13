import type { MarketingLang } from '#/lib/marketing/lang'

/**
 * Copy for /tools/zatca-wave-checker. Saudi Arabic uses Arabic-Indic digits.
 * Templates use {wave}, {date}, {days}, {years}.
 */
const ar = {
  seo: {
    title: 'هل منشأتك ضمن الموجة ٢٥ من زاتكا؟ أداة تحقق مجانية | قافتر',
    description:
      'اعرف خلال دقيقة هل منشأتك ضمن الموجة ٢٣ أو ٢٤ أو ٢٥ من مرحلة الربط والتكامل، وموعد ربطك، والأيام المتبقية، وخطواتك التالية. أداة مستقلة غير تابعة لزاتكا.',
  },
  pageName: 'هل منشأتك ضمن الموجة ٢٥؟',
  title: 'هل منشأتك ضمن الموجة ٢٥؟',
  subtitle:
    'أجب عن ٣ أسئلة لنقدّر موجتك في المرحلة الثانية من الفوترة الإلكترونية (مرحلة الربط والتكامل مع بوابة فاتورة)، وموعد ربطك، والأيام المتبقية.',
  formTitle: 'أسئلة سريعة',
  vatQuestion: '١. هل منشأتك مسجّلة في ضريبة القيمة المضافة؟',
  yes: 'نعم',
  no: 'لا',
  notSure: 'لست متأكداً',
  revenueQuestion: '٢. الإيرادات الخاضعة للضريبة في كل سنة (ريال)',
  revenueHint: 'أدخل ما تعرفه، وتكفي سنة واحدة، واترك بقية الحقول فارغة. تُقبل الأرقام العربية والفواصل.',
  revenueLabel: (year: string) => `إيرادات ${year}`,
  notifiedQuestion: '٣. هل وصلك إشعار من زاتكا بموعد الربط؟',
  submit: 'اعرف موجتك',
  errors: {
    vat: 'اختر إجابة.',
    revenue: 'أدخل إيرادات سنة واحدة على الأقل (رقم موجب).',
    invalidYear: (year: string) => `قيمة ${year} غير صحيحة.`,
  },
  resultTitle: 'النتيجة',
  resultEmpty: 'أجب عن الأسئلة لمعرفة موجتك وموعد الربط.',
  resultCtaBody: 'ابدأ اليوم بإصدار فواتير ضريبية وفق المرحلة الأولى، مع رمز QR وملف PDF.',
  resultCta: 'أصدر فاتورتك الأولى مجاناً',
  status: {
    due: 'غالباً أنت ضمن الموجة {wave}',
    overdue: 'غالباً أنت ضمن الموجة {wave} — والموعد فات',
    'below-threshold': 'حسب ما أدخلت، لست ضمن الموجات ٢٣–٢٥',
    'not-registered': 'الربط في المرحلة الثانية يخص المنشآت المسجّلة في ضريبة القيمة المضافة',
    incomplete: '',
  },
  deadlineLabel: 'موعد الربط',
  daysLeft: 'يوماً متبقياً',
  daysLeftOne: 'يوم متبقٍ',
  deadlineToday: 'الموعد اليوم',
  daysOverdue: (days: string) => `فات الموعد منذ ${days} يوماً`,
  triggeringYears: 'السنوات التي تجاوزت فيها الحد: {years}',
  belowBody:
    'إيراداتك المدخلة لا تتجاوز ١٨٧٬٥٠٠ ريال في أي سنة من ٢٠٢٢ إلى ٢٠٢٥. قد تعلن زاتكا موجات لاحقة بحدود أقل، فتابع إشعاراتها.',
  notRegisteredBody:
    'إذا تجاوزت إيراداتك الخاضعة للضريبة ٣٧٥٬٠٠٠ ريال سنوياً فالتسجيل في ضريبة القيمة المضافة إلزامي، وبعدها تنطبق عليك مراحل الفوترة الإلكترونية. تحقّق من زاتكا.',
  earlierWave:
    'إيراداتك تجاوزت ٧٥٠٬٠٠٠ ريال — ربما كنت ضمن موجة سابقة بحدّ أعلى. راجع إشعارات زاتكا لمعرفة موعدك الفعلي.',
  overdueBody:
    'إذا لم تكمل الربط بعد، تواصل مع مزوّد حلول الفوترة الإلكترونية فوراً وراجع زاتكا بخصوص وضعك. قد تترتب غرامات على عدم الالتزام.',
  notifiedCaveat:
    'زاتكا تبلغ المنشآت المستهدفة عبر البريد الإلكتروني والرسائل النصية. عدم وصول إشعار لا يعني الإعفاء — تحقّق من زاتكا.',
  nextStepsTitle: 'خطواتك التالية',
  nextSteps: [
    'اختر حل فوترة إلكترونية للمرحلة الثانية متوافقاً مع متطلبات زاتكا (UBL 2.1 XML، الختم التشفيري، QR).',
    'سجّل وحدات الحل (EGS) في بوابة فاتورة واحصل على شهادة الختم التشفيري (CSID).',
    'اختبر الربط في بيئة المحاكاة: فواتير مبسطة تُبلَّغ خلال ٢٤ ساعة، وفواتير قياسية تُعتمد (Clearance) قبل إرسالها للعميل.',
    'درّب فريقك وانتقل للتشغيل الفعلي قبل الموعد.',
  ],
  guideLink: 'اقرأ دليل الموجة ٢٥ الكامل',
  notifyTitle: 'دعم المرحلة الثانية في قافتر قيد التطوير',
  notifyBody:
    'يُصدر قافتر اليوم فواتير وفق المرحلة الأولى (مرحلة الإصدار والحفظ)، ونعمل على دعم المرحلة الثانية. راسلنا وسنُبلغك فور إطلاقه.',
  notifyCta: 'بلّغني عند إطلاق المرحلة الثانية',
  notifySubject: 'بلّغني عند إطلاق المرحلة الثانية من قافتر',
  disclaimer:
    'تقدير مبني على الحدود والمواعيد المعلنة من زاتكا للموجات ٢٣–٢٥ — تحقّق من زاتكا قبل الاعتماد عليه. قافتر غير تابع لزاتكا، والمعلومات إرشادية وليست استشارة ضريبية.',
  faqTitle: 'أسئلة شائعة عن الموجة ٢٥',
  faq: [
    {
      question: 'من يشمل الإلزام في الموجة ٢٥؟',
      answer:
        'حسب ما أعلنته زاتكا، المكلفون المسجّلون في ضريبة القيمة المضافة الذين تجاوزت إيراداتهم الخاضعة للضريبة ١٨٧٬٥٠٠ ريال في أي من السنوات المرجعية التي تحددها زاتكا (تسأل الأداة عن ٢٠٢٢ إلى ٢٠٢٥). إشعار زاتكا لك هو المرجع — تحقّق منه.',
    },
    {
      question: 'متى موعد الربط للموجة ٢٥؟',
      answer: 'الموعد المعلن هو ١ فبراير ٢٠٢٧. الموجة ٢٤ موعدها ٣٠ يونيو ٢٠٢٦، والموجة ٢٣ موعدها ٣١ مارس ٢٠٢٦.',
    },
    {
      question: 'لم يصلني إشعار من زاتكا، هل أنا معفى؟',
      answer:
        'لا. زاتكا تبلغ المنشآت عبر البريد الإلكتروني والرسائل النصية، لكن عدم وصول الإشعار لا يعني الإعفاء. إذا كانت إيراداتك فوق الحد فتحقّق من زاتكا مباشرة.',
    },
    {
      question: 'ما الفرق بين المرحلة الأولى والثانية؟',
      answer:
        'المرحلة الأولى (مرحلة الإصدار والحفظ) تعني إصدار الفواتير إلكترونياً مع رمز QR. والمرحلة الثانية (مرحلة الربط والتكامل) تعني ربط نظامك بمنصة فاتورة: XML بصيغة UBL 2.1، ختم تشفيري، شهادة CSID، واعتماد أو إبلاغ كل فاتورة.',
    },
    {
      question: 'هل قافتر يدعم المرحلة الثانية؟',
      answer:
        'ليس بعد. يُصدر قافتر فواتير وفق المرحلة الأولى. إذا كانت منشأتك ضمن موجة، فستحتاج حلاً مربوطاً بمنصة فاتورة قبل موعدك.',
    },
  ],
}

export type WaveCopy = typeof ar

const en: WaveCopy = {
  seo: {
    title: 'Is Your Business in ZATCA Wave 25? Free Checker | Qaftr',
    description:
      'Find out in a minute if your business is in ZATCA Phase 2 Wave 23, 24 or 25, your deadline, days left and next steps. Not affiliated with ZATCA.',
  },
  pageName: 'Is your business in Wave 25?',
  title: 'Is your business in ZATCA Wave 25?',
  subtitle:
    'Answer 3 questions to estimate your ZATCA Phase 2 e-invoicing wave (integration with the FATOORA platform), your deadline and how many days you have left.',
  formTitle: 'Quick questions',
  vatQuestion: '1. Is your business registered for VAT?',
  yes: 'Yes',
  no: 'No',
  notSure: 'Not sure',
  revenueQuestion: '2. VAT-subject revenue per year (SAR)',
  revenueHint: 'Enter what you know — one year is enough. Leave the rest blank.',
  revenueLabel: (year: string) => `Revenue ${year}`,
  notifiedQuestion: '3. Has ZATCA notified you of an integration date?',
  submit: 'Check my wave',
  errors: {
    vat: 'Choose an answer.',
    revenue: 'Enter revenue for at least one year (a positive number).',
    invalidYear: (year: string) => `The ${year} value is not valid.`,
  },
  resultTitle: 'Your result',
  resultEmpty: 'Answer the questions to see your wave and deadline.',
  resultCtaBody: 'Start issuing Phase 1 tax invoices today, with a QR code and PDF.',
  resultCta: 'Create your first invoice free',
  status: {
    due: 'You are likely in Wave {wave}',
    overdue: 'You are likely in Wave {wave} — and the deadline has passed',
    'below-threshold': 'Based on what you entered, you are not in Waves 23–25',
    'not-registered': 'Phase 2 integration applies to VAT-registered businesses',
    incomplete: '',
  },
  deadlineLabel: 'Integration deadline',
  daysLeft: 'days left',
  daysLeftOne: 'day left',
  deadlineToday: 'The deadline is today',
  daysOverdue: (days: string) => `Deadline passed ${days} days ago`,
  triggeringYears: 'Years above the threshold: {years}',
  belowBody:
    'The revenue you entered is not above SAR 187,500 in any year from 2022 to 2025. ZATCA may announce later waves with lower thresholds, so keep an eye on its notifications.',
  notRegisteredBody:
    'If your taxable revenue is above SAR 375,000 a year, VAT registration is mandatory, and the e-invoicing phases then apply to you. Verify with ZATCA.',
  earlierWave:
    'Your revenue is above SAR 750,000 — you may have been selected in an earlier wave with a higher threshold. Check your ZATCA notifications for your actual date.',
  overdueBody:
    'If you have not integrated yet, contact an e-invoicing solution provider now and check your position with ZATCA. Non-compliance can lead to penalties.',
  notifiedCaveat:
    'ZATCA notifies selected businesses by email and SMS. Not being notified is not an exemption — verify with ZATCA.',
  nextStepsTitle: 'Your next steps',
  nextSteps: [
    'Choose a Phase 2 e-invoicing solution that meets ZATCA requirements (UBL 2.1 XML, cryptographic stamp, QR).',
    'Onboard your solution units (EGS) on the FATOORA portal and obtain the cryptographic stamp identifier (CSID).',
    'Test the integration in the simulation environment: simplified invoices reported within 24 hours, standard invoices cleared before they go to the buyer.',
    'Train your team and go live before your deadline.',
  ],
  guideLink: 'Read the full Wave 25 guide',
  notifyTitle: 'Phase 2 support in Qaftr is in development',
  notifyBody:
    'Today Qaftr issues Phase 1 (Generation) invoices. We are working on Phase 2 support — email us and we will let you know when it launches.',
  notifyCta: 'Get notified when Qaftr Phase 2 launches',
  notifySubject: 'Notify me when Qaftr Phase 2 launches',
  disclaimer:
    'An estimate based on the thresholds and dates ZATCA announced for Waves 23–25 — verify with ZATCA before relying on it. Qaftr is not affiliated with ZATCA; this is general guidance, not tax advice.',
  faqTitle: 'ZATCA Wave 25 FAQ',
  faq: [
    {
      question: 'Who is in scope for Wave 25?',
      answer:
        'As announced by ZATCA, VAT-registered taxpayers whose VAT-subject revenue exceeded SAR 187,500 in any of the reference years ZATCA specifies (the checker asks about 2022 to 2025). Your ZATCA notification is what counts — verify against it.',
    },
    {
      question: 'What is the Wave 25 deadline?',
      answer:
        'The announced integration deadline is 1 February 2027. Wave 24 is due 30 June 2026 and Wave 23 was due 31 March 2026.',
    },
    {
      question: 'ZATCA has not notified me. Am I exempt?',
      answer:
        'No. ZATCA notifies businesses by email and SMS, but not receiving a notification is not an exemption. If your revenue is above the threshold, verify with ZATCA directly.',
    },
    {
      question: 'What is the difference between Phase 1 and Phase 2?',
      answer:
        'Phase 1 (Generation) means issuing invoices electronically with a QR code. Phase 2 (Integration) means connecting your system to the FATOORA platform: UBL 2.1 XML, a cryptographic stamp, a CSID certificate, and clearance or reporting of every invoice.',
    },
    {
      question: 'Does Qaftr support Phase 2?',
      answer:
        'Not yet. Qaftr issues Phase 1 (Generation) invoices. If you are in a wave, you will need a solution integrated with FATOORA before your deadline.',
    },
  ],
}

export function getWaveCopy(lang: MarketingLang): WaveCopy {
  return lang === 'en' ? en : ar
}
