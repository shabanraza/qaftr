import type {
  SignatureVerification,
  ZatcaQrMismatchField,
  ZatcaTotalsCheckCode,
  ZatcaXmlField,
  ZatcaXmlInputError,
  ZatcaXmlRuleCode,
} from '@zatca/shared/zatca-phase2'
import type { MarketingLang } from '#/lib/marketing/lang'

/**
 * Copy for /tools/zatca-xml-validator. Facts checked against ZATCA's
 * "Electronic Invoice XML Implementation Standard" v1.2 (2023-05-19): UBL 2.1
 * syntax (§4), InvoiceTypeCode 388/381/383 with subtype 01/02, ICV
 * mandatory (BR-KSA-33), PIH mandatory (BR-KSA-61), totals rules
 * BR-CO-10..16; and "Detailed Guidelines for E-Invoicing" v2 (May 2023):
 * clearance adds ZATCA's stamp and QR to standard tax invoices (§2.15,
 * §4.1.2), simplified invoices carry the taxpayer's cryptographic stamp
 * (§2.16), ZATCA's toolkit is the sandbox, SDK and web-based validator
 * (§2.18). See docs/REGULATORY_CLAIMS_2026-11-13.md.
 */
export type XmlValidatorCopy = {
  seo: { title: string; description: string }
  pageName: string
  title: string
  subtitle: string
  inputLabel: string
  inputHint: string
  upload: string
  uploadHint: string
  sample: string
  clear: string
  checking: string
  resultTitle: string
  emptyResult: string
  statusOk: string
  statusIssues: (n: number) => string
  statusWarnings: (n: number) => string
  types: { standard: string; simplified: string; unknown: string }
  kinds: { invoice: string; 'credit-note': string; 'debit-note': string }
  summary: {
    title: string
    number: string
    issued: string
    seller: string
    vat: string
    buyer: string
    total: string
    lines: string
  }
  sections: { missing: string; rules: string; totals: string; qr: string; signature: string }
  allPresent: string
  noRuleIssues: string
  totalsOk: string
  expectedFound: (expected: string, found: string) => string
  linePrefix: (n: number) => string
  subtotalPrefix: (n: number) => string
  fields: Record<ZatcaXmlField, string>
  rules: Record<ZatcaXmlRuleCode, string>
  totals: Record<ZatcaTotalsCheckCode, string>
  mismatches: Record<ZatcaQrMismatchField, string>
  qrPhase: (phase: number) => string
  qrMatches: string
  qrMismatchValues: (qr: string, doc: string) => string
  qrMissingSimplified: string
  qrMissingStandard: string
  qrMissingUnknown: string
  signatureVerified: string
  signatureFailed: string
  signatureError: string
  signatureMissingSimplified: string
  signatureMissingStandard: string
  signatureMissingUnknown: string
  signatureChecks: Record<keyof Omit<SignatureVerification, 'valid'>, string>
  errors: Record<ZatcaXmlInputError | 'FILE_TOO_LARGE' | 'FILE_UNREADABLE', string>
  officialNote: string
  privacyNote: string
  ctaTitle: string
  ctaBody: string
  ctaLink: string
  faqTitle: string
  faq: { question: string; answer: string }[]
}

/** Arabic-Indic digits for numbers inside Saudi Arabic copy. */
function toIndic(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)))
}

const ar: XmlValidatorCopy = {
  seo: {
    title: 'مدقق ملف XML للفاتورة الإلكترونية — فحص مجاني | قافتر',
    description:
      'ارفع ملف XML لفاتورة زاتكا أو الصقه لفحص الحقول الإلزامية وقواعد العمل والإجماليات ورمز QR والتوقيع داخل متصفحك. مجاني ودون رفع للخادم.',
  },
  pageName: 'مدقق ملف XML للفاتورة',
  title: 'مدقق ملف XML للفاتورة الإلكترونية (زاتكا)',
  subtitle:
    'افحص ملف الفاتورة بصيغة UBL 2.1 قبل إرساله أو بعد استلامه: الحقول الإلزامية، وقواعد العمل، وتطابق الإجماليات، ورمز QR، والختم التشفيري.',
  inputLabel: 'نص ملف XML',
  inputHint: 'الصق محتوى ملف الفاتورة كاملاً، أو ارفع الملف.',
  upload: 'ارفع ملف XML',
  uploadHint: 'ملف فاتورة أو إشعار دائن أو مدين بصيغة XML.',
  sample: 'جرّب مثالاً',
  clear: 'مسح',
  checking: 'جارٍ الفحص…',
  resultTitle: 'تقرير الفحص',
  emptyResult: 'الصق ملف XML أو ارفعه لعرض التقرير.',
  statusOk: 'لا توجد مشكلات',
  statusIssues: (n) => (n === 1 ? 'توجد مشكلة واحدة' : n === 2 ? 'توجد مشكلتان' : `توجد ${toIndic(n)} مشكلات`),
  statusWarnings: (n) => (n === 1 ? 'تنبيه واحد' : `${toIndic(n)} تنبيهات`),
  types: { standard: 'فاتورة ضريبية (قياسية)', simplified: 'فاتورة ضريبية مبسطة', unknown: 'نوع غير معروف' },
  kinds: { invoice: 'فاتورة', 'credit-note': 'إشعار دائن', 'debit-note': 'إشعار مدين' },
  summary: {
    title: 'ملخص المستند',
    number: 'رقم الفاتورة',
    issued: 'تاريخ ووقت الإصدار',
    seller: 'البائع',
    vat: 'الرقم الضريبي للبائع',
    buyer: 'المشتري',
    total: 'الإجمالي شامل الضريبة',
    lines: 'عدد البنود',
  },
  sections: {
    missing: 'الحقول الإلزامية',
    rules: 'قواعد العمل',
    totals: 'تطابق الإجماليات',
    qr: 'رمز QR',
    signature: 'الختم التشفيري (التوقيع)',
  },
  allPresent: 'كل الحقول الإلزامية التي نفحصها موجودة.',
  noRuleIssues: 'لا توجد مخالفات في القواعد التي نفحصها.',
  totalsOk: 'الإجماليات متطابقة.',
  expectedFound: (expected, found) => `المتوقع ${expected}، والموجود ${found}`,
  linePrefix: (n) => `البند ${toIndic(n)}: `,
  subtotalPrefix: (n) => `فئة الضريبة ${toIndic(n)}: `,
  fields: {
    PROFILE_ID: 'معرّف العملية (ProfileID)',
    INVOICE_NUMBER: 'رقم الفاتورة',
    UUID: 'المعرّف الفريد (UUID)',
    ISSUE_DATE: 'تاريخ الإصدار',
    ISSUE_TIME: 'وقت الإصدار',
    INVOICE_TYPE: 'نوع الفاتورة',
    CURRENCY: 'عملة الفاتورة',
    TAX_CURRENCY: 'عملة الضريبة',
    ICV: 'عدّاد الفاتورة (ICV)',
    PIH: 'بصمة الفاتورة السابقة (PIH)',
    SELLER_NAME: 'اسم البائع',
    SELLER_VAT: 'الرقم الضريبي للبائع',
    SELLER_ID: 'معرّف البائع الآخر (مثل السجل التجاري)',
    SELLER_STREET: 'اسم الشارع (البائع)',
    SELLER_BUILDING_NUMBER: 'رقم المبنى (البائع)',
    SELLER_DISTRICT: 'الحي (البائع)',
    SELLER_CITY: 'المدينة (البائع)',
    SELLER_POSTAL_CODE: 'الرمز البريدي (البائع)',
    SELLER_COUNTRY: 'رمز الدولة (البائع)',
    VAT_TOTAL: 'إجمالي الضريبة',
    LINE_EXTENSION_TOTAL: 'مجموع صافي البنود',
    TAX_EXCLUSIVE_TOTAL: 'الإجمالي دون الضريبة',
    TAX_INCLUSIVE_TOTAL: 'الإجمالي شامل الضريبة',
    PAYABLE_TOTAL: 'المبلغ المستحق',
    LINES: 'بنود الفاتورة',
  },
  rules: {
    UUID_INVALID: 'المعرّف الفريد (UUID) ليس بالصيغة الصحيحة.',
    INVOICE_NUMBER_REQUIRED: 'رقم الفاتورة فارغ.',
    ISSUE_DATE_INVALID: 'تاريخ الإصدار ليس تاريخاً صحيحاً بصيغة YYYY-MM-DD.',
    ISSUE_DATE_IN_FUTURE: 'تاريخ الإصدار في المستقبل.',
    ISSUE_TIME_INVALID: 'وقت الإصدار ليس بصيغة HH:mm:ss.',
    ICV_INVALID: 'عدّاد الفاتورة (ICV) يجب أن يكون رقماً صحيحاً موجباً.',
    PIH_INVALID: 'بصمة الفاتورة السابقة (PIH) ليست بصمة صحيحة بترميز Base64.',
    SELLER_NAME_REQUIRED: 'اسم البائع فارغ.',
    SELLER_VAT_INVALID: 'الرقم الضريبي للبائع يجب أن يكون ١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣.',
    SELLER_ID_REQUIRED: 'معرّف البائع الآخر (مثل السجل التجاري) فارغ.',
    SELLER_ID_SCHEME_INVALID: 'نوع معرّف البائع غير مقبول (مثل CRN أو MOM أو MLS أو 700 أو SAG أو OTH).',
    SELLER_COUNTRY_INVALID: 'رمز دولة البائع يجب أن يكون SA.',
    ADDRESS_STREET_REQUIRED: 'اسم الشارع فارغ في العنوان.',
    ADDRESS_BUILDING_NUMBER_INVALID: 'رقم المبنى يجب أن يكون ٤ أرقام.',
    ADDRESS_DISTRICT_REQUIRED: 'اسم الحي فارغ في العنوان.',
    ADDRESS_CITY_REQUIRED: 'اسم المدينة فارغ في العنوان.',
    ADDRESS_POSTAL_CODE_INVALID: 'الرمز البريدي يجب أن يكون ٥ أرقام.',
    ADDRESS_COUNTRY_INVALID: 'رمز الدولة في العنوان يجب أن يكون حرفين.',
    BUYER_REQUIRED: 'بيانات المشتري مطلوبة في الفاتورة الضريبية القياسية.',
    BUYER_NAME_REQUIRED: 'اسم المشتري مطلوب في الفاتورة الضريبية القياسية.',
    BUYER_ID_REQUIRED: 'يلزم الرقم الضريبي للمشتري أو معرّف آخر له.',
    BUYER_ID_SCHEME_INVALID: 'نوع معرّف المشتري غير مقبول.',
    BUYER_VAT_INVALID: 'الرقم الضريبي للمشتري يجب أن يكون ١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣.',
    BUYER_NATIONAL_ID_REQUIRED: 'يلزم رقم الهوية الوطنية للمشتري مع إعفاء التعليم أو الصحة للمواطنين.',
    SUPPLY_DATE_REQUIRED: 'تاريخ التوريد مطلوب في الفاتورة الضريبية القياسية.',
    SUPPLY_DATE_INVALID: 'تاريخ التوريد ليس تاريخاً صحيحاً.',
    SUPPLY_END_DATE_BEFORE_START: 'تاريخ نهاية التوريد قبل تاريخ بدايته.',
    BILLING_REFERENCE_REQUIRED: 'الإشعار الدائن أو المدين يجب أن يشير إلى رقم الفاتورة الأصلية.',
    NOTE_REASON_REQUIRED: 'يلزم ذكر سبب إصدار الإشعار الدائن أو المدين.',
    PAYMENT_MEANS_INVALID: 'رمز وسيلة الدفع غير مقبول.',
    LINES_REQUIRED: 'يجب أن تحتوي الفاتورة على بند واحد على الأقل.',
    LINE_NAME_REQUIRED: 'اسم البند فارغ.',
    LINE_QUANTITY_INVALID: 'كمية البند يجب أن تكون أكبر من صفر.',
    LINE_PRICE_INVALID: 'سعر البند غير صحيح.',
    LINE_DISCOUNT_INVALID: 'خصم البند غير صحيح أو أكبر من السعر.',
    LINE_VAT_RATE_INVALID: 'نسبة الضريبة لا تناسب فئة الضريبة للبند.',
    LINE_EXEMPTION_REASON_REQUIRED: 'البنود المعفاة أو بنسبة صفر تحتاج رمز سبب الإعفاء (VATEX).',
    LINE_EXEMPTION_REASON_INVALID: 'رمز سبب الإعفاء لا يناسب فئة الضريبة.',
    LINE_EXEMPTION_REASON_NOT_ALLOWED: 'البنود الخاضعة للنسبة الأساسية لا تحمل رمز سبب إعفاء.',
    INVOICE_TYPE_INVALID: 'رمز نوع الفاتورة أو نوعها الفرعي غير صحيح (المتوقع 388 أو 381 أو 383، والنوع الفرعي يبدأ بـ ٠١ أو ٠٢).',
  },
  totals: {
    LINE_NET: 'صافي البند = الكمية × السعر',
    LINE_EXTENSION_SUM: 'مجموع صافي البنود',
    TAX_EXCLUSIVE: 'الإجمالي دون الضريبة',
    SUBTOTAL_VAT: 'ضريبة الفئة = المبلغ الخاضع × النسبة',
    VAT_SUM: 'إجمالي الضريبة = مجموع ضرائب الفئات',
    TAX_INCLUSIVE: 'الإجمالي شامل الضريبة',
    PAYABLE: 'المبلغ المستحق',
  },
  mismatches: {
    SELLER_NAME: 'اسم البائع في الرمز لا يطابق الملف',
    VAT_NUMBER: 'الرقم الضريبي في الرمز لا يطابق الملف',
    TIMESTAMP: 'تاريخ ووقت الإصدار في الرمز لا يطابق الملف',
    TOTAL: 'الإجمالي في الرمز لا يطابق الملف',
    VAT_TOTAL: 'مبلغ الضريبة في الرمز لا يطابق الملف',
    INVOICE_HASH: 'بصمة الفاتورة في الرمز لا تطابق بصمة الملف المحسوبة',
    SIGNATURE: 'التوقيع في الرمز لا يطابق توقيع الملف',
  },
  qrPhase: (phase) => (phase === 2 ? 'المرحلة الثانية' : 'المرحلة الأولى'),
  qrMatches: 'حقول الرمز تطابق بيانات الملف.',
  qrMismatchValues: (qr, doc) => `في الرمز: ${qr} — في الملف: ${doc || '—'}`,
  qrMissingSimplified: 'لا يوجد رمز QR. الفاتورة المبسطة يجب أن تحمل رمز QR يُنشئه نظام الفوترة لديك.',
  qrMissingStandard:
    'لا يوجد رمز QR. في الفاتورة الضريبية القياسية تضيف منصة فاتورة الرمز عند اعتماد الفاتورة (التخليص)، لذلك لا يحمله الملف قبل التخليص.',
  qrMissingUnknown: 'لا يوجد رمز QR.',
  signatureVerified:
    'التوقيع سليم: بصمة الفاتورة والخصائص الموقّعة وبصمة الشهادة والتوقيع تطابق الشهادة الموجودة في الملف. هذا لا يؤكد أن الهيئة أصدرت الشهادة أو استلمت الفاتورة.',
  signatureFailed: 'التوقيع لا يطابق الملف أو الشهادة الموجودة فيه:',
  signatureError: 'تعذّرت قراءة التوقيع أو الشهادة في الملف.',
  signatureMissingSimplified: 'لا يوجد ختم تشفيري. الفاتورة المبسطة يجب أن تحمل الختم التشفيري من نظام الفوترة لديك.',
  signatureMissingStandard:
    'لا يوجد ختم تشفيري. في الفاتورة الضريبية القياسية تضيف منصة فاتورة ختمها عند التخليص.',
  signatureMissingUnknown: 'لا يوجد ختم تشفيري.',
  signatureChecks: {
    invoiceHashMatches: 'بصمة الفاتورة',
    signedPropertiesMatches: 'الخصائص الموقّعة',
    certificateDigestMatches: 'بصمة الشهادة',
    signatureValid: 'التوقيع الرقمي',
  },
  errors: {
    EMPTY: 'الصق ملف XML أو ارفعه لعرض التقرير.',
    NOT_XML: 'النص ليس ملف XML صحيحاً. تأكد من نسخ الملف كاملاً.',
    NOT_INVOICE: 'الملف بصيغة XML لكنه ليس فاتورة UBL (العنصر الجذر ليس Invoice).',
    PREFIXES_UNSUPPORTED: 'يستخدم الملف بادئات غير cac و cbc لعناصر UBL، والأداة تدعم الصيغة المعتادة في أمثلة الهيئة فقط.',
    FILE_TOO_LARGE: 'الملف كبير جداً. الحد الأقصى ٥ ميغابايت.',
    FILE_UNREADABLE: 'تعذّرت قراءة الملف.',
  },
  officialNote:
    'هذا فحص محلي يساعدك على اكتشاف الأخطاء مبكراً، وليس تحققاً رسمياً. للتحقق الرسمي استخدم أدوات هيئة الزكاة والضريبة والجمارك: حزمة SDK والمدقق الإلكتروني وبيئة الاختبار في بوابة المطورين، ونتيجة منصة فاتورة عند الاعتماد أو الإبلاغ.',
  privacyNote: 'يتم الفحص داخل متصفحك، ولا يُرسل الملف إلى خوادمنا.',
  ctaTitle: 'تريد فواتير متوافقة دون فحص يدوي؟',
  ctaBody: 'أنشئ فاتورة ضريبية مبسطة أو قياسية مجاناً من قافتر.',
  ctaLink: 'أنشئ فاتورة ضريبية',
  faqTitle: 'أسئلة شائعة عن ملف XML للفاتورة',
  faq: [
    {
      question: 'ما الذي تفحصه الأداة؟',
      answer:
        'الحقول الإلزامية مثل رقم الفاتورة والمعرّف الفريد وعدّاد الفاتورة وبصمة الفاتورة السابقة وبيانات البائع، وقواعد العمل مثل صيغة الرقم الضريبي والعنوان ونسب الضريبة، وتطابق الإجماليات، وحقول رمز QR، والختم التشفيري.',
    },
    {
      question: 'كيف أعرف إن كانت الفاتورة قياسية أو مبسطة؟',
      answer:
        'من رمز نوع الفاتورة: القيمة 388 للفاتورة الضريبية، و381 للإشعار الدائن، و383 للإشعار المدين. ويبدأ النوع الفرعي (السمة name) بـ ٠١ للفاتورة الضريبية القياسية و٠٢ للفاتورة المبسطة.',
    },
    {
      question: 'هل نتيجة الأداة تحقق رسمي من الهيئة؟',
      answer:
        'لا. توفر الهيئة لمطوري الأنظمة بيئة اختبار وحزمة SDK ومدققاً إلكترونياً للتحقق من الفواتير، ومنصة فاتورة هي التي تعتمد الفاتورة القياسية أو تستلم المبسطة. استخدم هذه الأداة لاكتشاف الأخطاء الشائعة بسرعة.',
    },
    {
      question: 'لماذا لا يوجد رمز QR أو ختم في فاتورتي القياسية؟',
      answer:
        'في الفاتورة الضريبية القياسية ترسل المنشأة الملف إلى منصة فاتورة للتخليص، وتضيف المنصة الختم التشفيري ورمز QR بعد اجتياز الفحص. أما الفاتورة المبسطة فيضيف نظام الفوترة لدى المنشأة الختم والرمز قبل مشاركتها.',
    },
    {
      question: 'ماذا يعني أن التوقيع سليم؟',
      answer:
        'أن بصمة الملف والخصائص الموقّعة والتوقيع الرقمي تطابق الشهادة المضمّنة في الملف، أي أن الملف لم يتغير بعد توقيعه. لا تتحقق الأداة من أن الهيئة أصدرت الشهادة.',
    },
    {
      question: 'هل يُرفع ملفي إلى خوادم قافتر؟',
      answer: 'لا. تتم قراءة الملف وفحصه داخل متصفحك فقط.',
    },
  ],
}

const en: XmlValidatorCopy = {
  seo: {
    title: 'ZATCA XML Validator — Check E-Invoice XML Free | Qaftr',
    description:
      'Upload or paste a ZATCA invoice XML to check mandatory fields, business rules, totals, the QR code and signature in your browser. Free, nothing uploaded.',
  },
  pageName: 'ZATCA XML validator',
  title: 'ZATCA e-invoice XML validator',
  subtitle:
    'Check a UBL 2.1 invoice file before you send it or after you receive it: mandatory fields, business rules, totals, the QR code and the cryptographic stamp.',
  inputLabel: 'Invoice XML',
  inputHint: 'Paste the whole invoice file, or upload it.',
  upload: 'Upload an XML file',
  uploadHint: 'An invoice, credit note or debit note in XML.',
  sample: 'Try a sample',
  clear: 'Clear',
  checking: 'Checking…',
  resultTitle: 'Report',
  emptyResult: 'Paste or upload an XML file to see the report.',
  statusOk: 'No issues found',
  statusIssues: (n) => (n === 1 ? '1 issue found' : `${n} issues found`),
  statusWarnings: (n) => (n === 1 ? '1 warning' : `${n} warnings`),
  types: { standard: 'Standard tax invoice', simplified: 'Simplified tax invoice', unknown: 'Unknown type' },
  kinds: { invoice: 'Invoice', 'credit-note': 'Credit note', 'debit-note': 'Debit note' },
  summary: {
    title: 'Document summary',
    number: 'Invoice number',
    issued: 'Issue date and time',
    seller: 'Seller',
    vat: 'Seller VAT number',
    buyer: 'Buyer',
    total: 'Total incl. VAT',
    lines: 'Lines',
  },
  sections: {
    missing: 'Mandatory fields',
    rules: 'Business rules',
    totals: 'Totals',
    qr: 'QR code',
    signature: 'Cryptographic stamp (signature)',
  },
  allPresent: 'All mandatory fields we check are present.',
  noRuleIssues: 'No issues with the rules we check.',
  totalsOk: 'The totals add up.',
  expectedFound: (expected, found) => `expected ${expected}, found ${found}`,
  linePrefix: (n) => `Line ${n}: `,
  subtotalPrefix: (n) => `VAT category ${n}: `,
  fields: {
    PROFILE_ID: 'Business process (ProfileID)',
    INVOICE_NUMBER: 'Invoice number',
    UUID: 'Unique identifier (UUID)',
    ISSUE_DATE: 'Issue date',
    ISSUE_TIME: 'Issue time',
    INVOICE_TYPE: 'Invoice type',
    CURRENCY: 'Invoice currency',
    TAX_CURRENCY: 'Tax currency',
    ICV: 'Invoice counter (ICV)',
    PIH: 'Previous invoice hash (PIH)',
    SELLER_NAME: 'Seller name',
    SELLER_VAT: 'Seller VAT number',
    SELLER_ID: 'Other seller ID (e.g. CR number)',
    SELLER_STREET: 'Seller street',
    SELLER_BUILDING_NUMBER: 'Seller building number',
    SELLER_DISTRICT: 'Seller district',
    SELLER_CITY: 'Seller city',
    SELLER_POSTAL_CODE: 'Seller postal code',
    SELLER_COUNTRY: 'Seller country code',
    VAT_TOTAL: 'VAT total',
    LINE_EXTENSION_TOTAL: 'Sum of line net amounts',
    TAX_EXCLUSIVE_TOTAL: 'Total excl. VAT',
    TAX_INCLUSIVE_TOTAL: 'Total incl. VAT',
    PAYABLE_TOTAL: 'Amount due',
    LINES: 'Invoice lines',
  },
  rules: {
    UUID_INVALID: 'The UUID is not in a valid format.',
    INVOICE_NUMBER_REQUIRED: 'The invoice number is empty.',
    ISSUE_DATE_INVALID: 'The issue date is not a valid YYYY-MM-DD date.',
    ISSUE_DATE_IN_FUTURE: 'The issue date is in the future.',
    ISSUE_TIME_INVALID: 'The issue time is not in HH:mm:ss format.',
    ICV_INVALID: 'The invoice counter (ICV) must be a positive whole number.',
    PIH_INVALID: 'The previous invoice hash (PIH) is not a valid Base64 hash.',
    SELLER_NAME_REQUIRED: 'The seller name is empty.',
    SELLER_VAT_INVALID: 'The seller VAT number must be 15 digits, starting and ending with 3.',
    SELLER_ID_REQUIRED: 'The other seller ID (e.g. CR number) is empty.',
    SELLER_ID_SCHEME_INVALID: 'The seller ID type is not accepted (e.g. CRN, MOM, MLS, 700, SAG or OTH).',
    SELLER_COUNTRY_INVALID: 'The seller country code must be SA.',
    ADDRESS_STREET_REQUIRED: 'The street name is empty in an address.',
    ADDRESS_BUILDING_NUMBER_INVALID: 'The building number must be 4 digits.',
    ADDRESS_DISTRICT_REQUIRED: 'The district is empty in an address.',
    ADDRESS_CITY_REQUIRED: 'The city is empty in an address.',
    ADDRESS_POSTAL_CODE_INVALID: 'The postal code must be 5 digits.',
    ADDRESS_COUNTRY_INVALID: 'The country code in an address must be two letters.',
    BUYER_REQUIRED: 'Buyer details are required on a standard tax invoice.',
    BUYER_NAME_REQUIRED: 'The buyer name is required on a standard tax invoice.',
    BUYER_ID_REQUIRED: "The buyer's VAT number or another buyer ID is required.",
    BUYER_ID_SCHEME_INVALID: 'The buyer ID type is not accepted.',
    BUYER_VAT_INVALID: 'The buyer VAT number must be 15 digits, starting and ending with 3.',
    BUYER_NATIONAL_ID_REQUIRED: "The buyer's national ID is required with the citizens' education or healthcare exemption.",
    SUPPLY_DATE_REQUIRED: 'The supply date is required on a standard tax invoice.',
    SUPPLY_DATE_INVALID: 'The supply date is not a valid date.',
    SUPPLY_END_DATE_BEFORE_START: 'The supply end date is before the supply date.',
    BILLING_REFERENCE_REQUIRED: 'A credit or debit note must reference the original invoice number.',
    NOTE_REASON_REQUIRED: 'A credit or debit note needs the reason it was issued.',
    PAYMENT_MEANS_INVALID: 'The payment means code is not accepted.',
    LINES_REQUIRED: 'The invoice must have at least one line.',
    LINE_NAME_REQUIRED: 'A line has no item name.',
    LINE_QUANTITY_INVALID: 'A line quantity must be greater than zero.',
    LINE_PRICE_INVALID: 'A line price is not valid.',
    LINE_DISCOUNT_INVALID: 'A line discount is not valid or is larger than the price.',
    LINE_VAT_RATE_INVALID: "A line's VAT rate does not match its VAT category.",
    LINE_EXEMPTION_REASON_REQUIRED: 'Exempt and zero-rated lines need an exemption reason code (VATEX).',
    LINE_EXEMPTION_REASON_INVALID: "A line's exemption reason code does not match its VAT category.",
    LINE_EXEMPTION_REASON_NOT_ALLOWED: 'Standard-rated lines must not carry an exemption reason code.',
    INVOICE_TYPE_INVALID: 'The invoice type code or subtype is not valid (expected 388, 381 or 383, with a subtype starting 01 or 02).',
  },
  totals: {
    LINE_NET: 'Line net = quantity × price',
    LINE_EXTENSION_SUM: 'Sum of line net amounts',
    TAX_EXCLUSIVE: 'Total excl. VAT',
    SUBTOTAL_VAT: 'Category VAT = taxable amount × rate',
    VAT_SUM: 'VAT total = sum of category VAT',
    TAX_INCLUSIVE: 'Total incl. VAT',
    PAYABLE: 'Amount due',
  },
  mismatches: {
    SELLER_NAME: 'Seller name in the QR does not match the file',
    VAT_NUMBER: 'VAT number in the QR does not match the file',
    TIMESTAMP: 'Issue date and time in the QR do not match the file',
    TOTAL: 'Total in the QR does not match the file',
    VAT_TOTAL: 'VAT amount in the QR does not match the file',
    INVOICE_HASH: "Invoice hash in the QR does not match the file's computed hash",
    SIGNATURE: "Signature in the QR does not match the file's signature",
  },
  qrPhase: (phase) => `Phase ${phase}`,
  qrMatches: 'The QR fields match the file.',
  qrMismatchValues: (qr, doc) => `QR: ${qr} — file: ${doc || '—'}`,
  qrMissingSimplified: 'No QR code. A simplified invoice must carry a QR code generated by your e-invoicing solution.',
  qrMissingStandard:
    'No QR code. For standard tax invoices, the FATOORA platform adds the QR code at clearance, so a file before clearance has none.',
  qrMissingUnknown: 'No QR code.',
  signatureVerified:
    'Signature checks out: the invoice hash, signed properties, certificate digest and signature match the certificate in the file. This does not confirm that ZATCA issued the certificate or received the invoice.',
  signatureFailed: 'The signature does not match the file or its certificate:',
  signatureError: 'The signature or certificate in the file could not be read.',
  signatureMissingSimplified: 'No cryptographic stamp. A simplified invoice must carry the stamp from your e-invoicing solution.',
  signatureMissingStandard: 'No cryptographic stamp. For standard tax invoices, the FATOORA platform adds its stamp at clearance.',
  signatureMissingUnknown: 'No cryptographic stamp.',
  signatureChecks: {
    invoiceHashMatches: 'Invoice hash',
    signedPropertiesMatches: 'Signed properties',
    certificateDigestMatches: 'Certificate digest',
    signatureValid: 'Digital signature',
  },
  errors: {
    EMPTY: 'Paste or upload an XML file to see the report.',
    NOT_XML: 'This is not valid XML. Make sure you copied the whole file.',
    NOT_INVOICE: 'This is XML, but not a UBL invoice (the root element is not Invoice).',
    PREFIXES_UNSUPPORTED:
      "The file uses prefixes other than cac and cbc for UBL elements; this tool supports the usual form used in ZATCA's samples only.",
    FILE_TOO_LARGE: 'The file is too large. The limit is 5 MB.',
    FILE_UNREADABLE: 'The file could not be read.',
  },
  officialNote:
    "This is a local check to catch mistakes early, not an official validation. For official checks use ZATCA's own tools: the SDK, the web-based validator and the sandbox on the developer portal, and the FATOORA platform's response at clearance or reporting.",
  privacyNote: 'The check runs in your browser. The file is not sent to our servers.',
  ctaTitle: 'Want compliant invoices without manual checks?',
  ctaBody: 'Create a simplified or standard tax invoice for free with Qaftr.',
  ctaLink: 'Create a tax invoice',
  faqTitle: 'E-invoice XML FAQ',
  faq: [
    {
      question: 'What does the validator check?',
      answer:
        'Mandatory fields such as the invoice number, UUID, invoice counter, previous invoice hash and seller details; business rules such as the VAT number and address formats and VAT rates; whether the totals add up; the QR code fields; and the cryptographic stamp.',
    },
    {
      question: 'How do I tell a standard invoice from a simplified one?',
      answer:
        'From the invoice type code: 388 is a tax invoice, 381 a credit note and 383 a debit note. The subtype (the name attribute) starts with 01 for a standard tax invoice and 02 for a simplified tax invoice.',
    },
    {
      question: 'Is the result an official ZATCA validation?',
      answer:
        'No. ZATCA gives system developers a sandbox, an SDK and a web-based validator to check invoices, and the FATOORA platform is what clears standard invoices and receives simplified ones. Use this tool to catch common mistakes quickly.',
    },
    {
      question: 'Why does my standard invoice have no QR code or stamp?',
      answer:
        'A standard tax invoice is sent to the FATOORA platform for clearance, and the platform adds the cryptographic stamp and QR code once it passes validation. For simplified invoices, the business’s e-invoicing solution adds the stamp and QR before sharing them.',
    },
    {
      question: 'What does "signature checks out" mean?',
      answer:
        'The file hash, signed properties and digital signature match the certificate embedded in the file, so the file has not changed since it was signed. The tool does not check that ZATCA issued the certificate.',
    },
    {
      question: 'Is my file uploaded to Qaftr?',
      answer: 'No. The file is read and checked in your browser only.',
    },
  ],
}

export function getXmlValidatorCopy(lang: MarketingLang): XmlValidatorCopy {
  return lang === 'en' ? en : ar
}
