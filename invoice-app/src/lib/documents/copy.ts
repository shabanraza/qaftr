import type {
  CreditNoteIssueCode,
  CreditNoteReason,
  NonTaxInvoiceIssueCode,
  QuotationIssueCode,
  ReceiptIssueCode,
  ReceiptPaymentMethod,
} from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'

/**
 * UI copy for the free Saudi document generators. Saudi Arabic copy uses
 * Arabic-Indic digits; document numbers and amounts typed by the user don't.
 * Glossary: docs/COMPETITOR_UX_SPEC_2026-11-09.md §2.1 (البائع / المشتري,
 * الرقم الضريبي, إشعار دائن / Credit Note).
 */
export const DOCUMENT_KINDS = ['receipt-voucher', 'quotation', 'credit-note', 'non-tax-invoice'] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

export const DOCUMENT_PATHS: Record<DocumentKind, `/tools/${DocumentKind}`> = {
  'receipt-voucher': '/tools/receipt-voucher',
  quotation: '/tools/quotation',
  'credit-note': '/tools/credit-note',
  'non-tax-invoice': '/tools/non-tax-invoice',
}

type Seo = { title: string; description: string }
type Faq = { question: string; answer: string }[]
type HowTo = { name: string; steps: { name: string; text: string }[] }

type PageCopy = {
  seo: Seo
  /** H1 and breadcrumb name. */
  title: string
  subtitle: string
  faq: Faq
  howTo: HowTo
  formTitle: string
}

type LinesCopy = {
  linesTitle: string
  lineLabel: (n: number) => string
  removeLine: (n: number) => string
  addLine: string
  description: string
  qty: string
  unitPrice: string
  lineIssue: (n: number, message: string) => string
}

type PartyCopy = {
  sellerTitle: string
  buyerTitle: string
  name: string
  sellerName: string
  buyerName: string
  address: string
  vatNumber: string
  vatOptional: string
}

export type CommonDocumentCopy = {
  badge: string
  draftNote: string
  settingsTitle: string
  outputLangLabel: string
  outputAr: string
  outputEn: string
  outputBilingual: string
  summaryTitle: string
  issuesTitle: string
  download: string
  generating: string
  downloaded: string
  pdfFailed: string
  clearForm: string
  previewTitle: string
  previewFrameTitle: string
  actionsBarLabel: string
  saveTitle: string
  saveBody: string
  signup: string
  subtotal: string
  vat: string
  total: string
  faqTitle: string
  relatedTitle: string
}

export type ReceiptCopy = PageCopy & {
  number: string
  date: string
  issuerTitle: string
  issuerName: string
  issuerHint: string
  receivedFrom: string
  amount: string
  amountHint: string
  amountInWords: string
  amountInWordsEn: string
  amountWordsEmpty: string
  paymentMethod: string
  methods: Record<ReceiptPaymentMethod, string>
  chequeNumber: string
  bank: string
  bankOptional: string
  purpose: string
  receiverName: string
  receiverHint: string
  notTaxInvoice: string
  issues: Record<ReceiptIssueCode, string>
}

export type QuotationCopy = PageCopy &
  LinesCopy &
  PartyCopy & {
    number: string
    date: string
    validUntil: string
    terms: string
    termsHint: string
    convert: string
    convertHint: string
    issues: Record<QuotationIssueCode, string>
  }

export type CreditNoteCopy = PageCopy &
  LinesCopy &
  PartyCopy & {
    number: string
    date: string
    originalTitle: string
    originalNumber: string
    originalDate: string
    reason: string
    reasonPlaceholder: string
    reasons: Record<CreditNoteReason, string>
    reasonDetail: string
    reasonDetailHint: string
    notes: string
    linkedNote: string
    deadlineNote: string
    sellerVatRequired: string
    issues: Record<CreditNoteIssueCode, string>
  }

export type NonTaxInvoiceCopy = PageCopy &
  LinesCopy & {
    number: string
    date: string
    sellerTitle: string
    sellerName: string
    address: string
    crNumber: string
    crHint: string
    buyerTitle: string
    buyerHint: string
    buyerName: string
    notes: string
    notesHint: string
    totalLabel: string
    /** Printed on the document and shown under the preview. */
    notRegisteredNote: string
    /** Shown above the form: registered businesses must issue a tax invoice. */
    registeredWarning: string
    registeredCta: string
    issues: Record<NonTaxInvoiceIssueCode, string>
  }

export type DocumentCopy = {
  common: CommonDocumentCopy
  'receipt-voucher': ReceiptCopy
  quotation: QuotationCopy
  'credit-note': CreditNoteCopy
  'non-tax-invoice': NonTaxInvoiceCopy
}

const linesAr: LinesCopy = {
  linesTitle: 'البنود',
  lineLabel: (n) => `البند ${toIndic(n)}`,
  removeLine: (n) => `حذف البند ${toIndic(n)}`,
  addLine: 'إضافة بند',
  description: 'الوصف',
  qty: 'الكمية',
  unitPrice: 'سعر الوحدة (غير شامل الضريبة)',
  lineIssue: (n, message) => `البند ${toIndic(n)}: ${message}`,
}

const linesEn: LinesCopy = {
  linesTitle: 'Line items',
  lineLabel: (n) => `Item ${n}`,
  removeLine: (n) => `Remove item ${n}`,
  addLine: 'Add item',
  description: 'Description',
  qty: 'Quantity',
  unitPrice: 'Unit price (excl. VAT)',
  lineIssue: (n, message) => `Item ${n}: ${message}`,
}

const partyAr: PartyCopy = {
  sellerTitle: 'بيانات البائع (منشأتك)',
  buyerTitle: 'بيانات المشتري (العميل)',
  name: 'الاسم',
  sellerName: 'الاسم التجاري',
  buyerName: 'اسم المشتري',
  address: 'العنوان',
  vatNumber: 'الرقم الضريبي',
  vatOptional: 'اختياري: ١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣.',
}

const partyEn: PartyCopy = {
  sellerTitle: 'Seller (your business)',
  buyerTitle: 'Buyer (customer)',
  name: 'Name',
  sellerName: 'Trade name',
  buyerName: 'Buyer name',
  address: 'Address',
  vatNumber: 'VAT number',
  vatOptional: 'Optional: 15 digits, starts and ends with 3.',
}

/** Arabic-Indic digits for numbers inside Saudi Arabic copy. */
function toIndic(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)))
}

const lineIssuesAr = {
  LINES_REQUIRED: 'أضف بنداً واحداً على الأقل بوصف وسعر.',
  LINE_DESCRIPTION_REQUIRED: 'أدخل وصف البند.',
  LINE_PRICE_INVALID: 'أدخل سعراً صحيحاً أكبر من صفر.',
  LINE_QTY_INVALID: 'أدخل كمية أكبر من صفر.',
} as const

const lineIssuesEn = {
  LINES_REQUIRED: 'Add at least one item with a description and price.',
  LINE_DESCRIPTION_REQUIRED: 'Enter the item description.',
  LINE_PRICE_INVALID: 'Enter a valid price above zero.',
  LINE_QTY_INVALID: 'Enter a quantity above zero.',
} as const

const ar: DocumentCopy = {
  common: {
    badge: 'مجاني · دون تسجيل',
    draftNote: 'تُحفظ مسودتك في هذا المتصفح فقط، ولا تُرسل بياناتك إلى خوادمنا.',
    settingsTitle: 'إعدادات المستند',
    outputLangLabel: 'لغة المستند',
    outputAr: 'العربية',
    outputEn: 'الإنجليزية',
    outputBilingual: 'ثنائي اللغة',
    summaryTitle: 'الملخص',
    issuesTitle: 'أكمل الحقول التالية قبل التنزيل:',
    download: 'تنزيل PDF',
    generating: 'جارٍ إنشاء الملف…',
    downloaded: 'تم تنزيل الملف.',
    pdfFailed: 'تعذّر إنشاء الملف. حاول مرة أخرى.',
    clearForm: 'مسح النموذج',
    previewTitle: 'معاينة المستند',
    previewFrameTitle: 'معاينة المستند قبل التنزيل',
    actionsBarLabel: 'إجراءات المستند',
    saveTitle: 'احفظ عملاءك ومستنداتك في مكان واحد',
    saveBody: 'أنشئ حساباً مجانياً لحفظ بيانات منشأتك وعملائك وإصدار فواتير متتالية.',
    signup: 'أنشئ حساباً مجاناً',
    subtotal: 'الإجمالي غير شامل الضريبة',
    vat: 'ضريبة القيمة المضافة ١٥٪',
    total: 'الإجمالي شامل الضريبة',
    faqTitle: 'أسئلة شائعة',
    relatedTitle: 'أدوات ذات صلة',
  },
  'receipt-voucher': {
    seo: {
      title: 'سند قبض PDF مجاني — نموذج سند قبض جاهز | قافتر',
      description:
        'أنشئ سند قبض لمنشأتك مع المبلغ كتابةً (فقط … لا غير) وطريقة الدفع نقداً أو تحويلاً أو شيكاً، ونزّله PDF بالعربية أو الإنجليزية مجاناً ودون تسجيل.',
    },
    title: 'سند قبض مجاني بصيغة PDF',
    subtitle:
      'أصدر سند قبض لعملائك يثبت استلام مبلغ نقدي أو تحويل أو شيك، مع كتابة المبلغ بالحروف تلقائياً وسطر توقيع المستلم.',
    formTitle: 'بيانات سند القبض',
    number: 'رقم السند',
    date: 'التاريخ',
    issuerTitle: 'الجهة المستلمة (منشأتك)',
    issuerName: 'الاسم التجاري',
    issuerHint: 'اختياري: يظهر في رأس السند.',
    receivedFrom: 'استلمنا من السيد / السادة',
    amount: 'المبلغ (ريال سعودي)',
    amountHint: 'يُكتب المبلغ بالحروف تلقائياً.',
    amountInWords: 'المبلغ كتابةً',
    amountInWordsEn: 'المبلغ كتابةً بالإنجليزية',
    amountWordsEmpty: 'أدخل المبلغ لعرضه كتابةً.',
    paymentMethod: 'طريقة الدفع',
    methods: { cash: 'نقداً', bank_transfer: 'تحويل بنكي', cheque: 'شيك', card: 'بطاقة' },
    chequeNumber: 'رقم الشيك',
    bank: 'البنك',
    bankOptional: 'البنك (اختياري)',
    purpose: 'وذلك عن',
    receiverName: 'اسم المستلم',
    receiverHint: 'اختياري: يظهر فوق سطر التوقيع.',
    notTaxInvoice:
      'سند القبض يثبت استلام المبلغ فقط، وهو ليس فاتورة ضريبية ولا يغني عن إصدار الفاتورة الضريبية للتوريد.',
    issues: {
      NUMBER_REQUIRED: 'أدخل رقم السند.',
      DATE_REQUIRED: 'اختر تاريخ السند.',
      RECEIVED_FROM_REQUIRED: 'أدخل اسم من استُلم منه المبلغ.',
      AMOUNT_INVALID: 'أدخل مبلغاً صحيحاً أكبر من صفر.',
      AMOUNT_TOO_LARGE: 'المبلغ أكبر من الحد المسموح.',
      CHEQUE_NUMBER_REQUIRED: 'أدخل رقم الشيك.',
      BANK_REQUIRED: 'أدخل اسم البنك المسحوب عليه الشيك.',
      PURPOSE_REQUIRED: 'اكتب سبب الدفع (وذلك عن).',
    },
    faq: [
      {
        question: 'ما هو سند القبض؟',
        answer:
          'سند القبض مستند تُصدره المنشأة عند استلام مبلغ من عميل أو أي طرف آخر، ويتضمن رقم السند وتاريخه واسم الدافع والمبلغ بالأرقام والحروف وطريقة الدفع وسبب الدفع وتوقيع المستلم.',
      },
      {
        question: 'هل سند القبض فاتورة ضريبية؟',
        answer:
          'لا. سند القبض يثبت الدفع فقط. إذا كان المبلغ مقابل توريد خاضع للضريبة فيجب إصدار فاتورة ضريبية وفق متطلبات هيئة الزكاة والضريبة والجمارك، ويمكنك إصدارها مجاناً من أداة الفاتورة في قافتر.',
      },
      {
        question: 'كيف يُكتب المبلغ بالحروف في سند القبض؟',
        answer:
          'تكتب الأداة المبلغ تلقائياً بصيغة «فقط … ريال سعودي لا غير» مع الهللات ومطابقة العدد والمعدود، وتعرض الصيغة الإنجليزية أيضاً في السند ثنائي اللغة.',
      },
      {
        question: 'هل أحتاج إلى حساب لتنزيل نموذج سند قبض PDF؟',
        answer:
          'لا. التنزيل مجاني ودون تسجيل، وتُحفظ المسودة في متصفحك فقط. أنشئ حساباً إذا أردت حفظ عملائك وإصدار مستندات متتالية.',
      },
    ],
    howTo: {
      name: 'كيف تُصدر سند قبض PDF',
      steps: [
        { name: 'أدخل بيانات السند', text: 'اكتب رقم السند وتاريخه واسم من استلمت منه المبلغ.' },
        { name: 'أدخل المبلغ وطريقة الدفع', text: 'اكتب المبلغ بالريال واختر نقداً أو تحويلاً أو شيكاً أو بطاقة، وسيظهر المبلغ بالحروف تلقائياً.' },
        { name: 'اكتب سبب الدفع', text: 'اكتب ما دُفع المبلغ مقابله، واسم المستلم إن أردت.' },
        { name: 'نزّل الملف', text: 'اختر العربية أو الإنجليزية أو ثنائي اللغة، ثم اضغط «تنزيل PDF» ووقّع السند.' },
      ],
    },
  },
  quotation: {
    ...linesAr,
    ...partyAr,
    seo: {
      title: 'عرض سعر مجاني PDF — نموذج عرض سعر مع الضريبة | قافتر',
      description:
        'أنشئ عرض سعر احترافياً لعملائك مع ضريبة القيمة المضافة ١٥٪ وتاريخ صلاحية وشروط، ونزّله PDF، ثم حوّله إلى فاتورة ضريبية بضغطة. مجاناً ودون تسجيل.',
    },
    title: 'عرض سعر مجاني مع ضريبة القيمة المضافة',
    subtitle:
      'جهّز عرض سعر لعملائك من الشركات والأفراد ببنود وضريبة ١٥٪ وتاريخ صلاحية، ثم حوّله إلى فاتورة ضريبية عند قبول العرض.',
    formTitle: 'بيانات عرض السعر',
    number: 'رقم العرض',
    date: 'تاريخ العرض',
    validUntil: 'صالح حتى',
    terms: 'الشروط والأحكام',
    termsHint: 'مثل: مدة التنفيذ، وطريقة الدفع، وما يشمله السعر.',
    convert: 'حوّل إلى فاتورة ضريبية',
    convertHint: 'تُنقل بيانات البائع والمشتري والبنود إلى أداة الفاتورة الضريبية.',
    issues: {
      NUMBER_REQUIRED: 'أدخل رقم العرض.',
      DATE_REQUIRED: 'اختر تاريخ العرض.',
      VALID_UNTIL_BEFORE_DATE: 'تاريخ الصلاحية يجب أن يكون بعد تاريخ العرض.',
      SELLER_NAME_REQUIRED: 'أدخل الاسم التجاري للبائع.',
      SELLER_VAT_INVALID: 'الرقم الضريبي للبائع غير صحيح.',
      BUYER_NAME_REQUIRED: 'أدخل اسم المشتري.',
      BUYER_VAT_INVALID: 'الرقم الضريبي للمشتري غير صحيح.',
      ...lineIssuesAr,
    },
    faq: [
      {
        question: 'ما الذي يتضمنه عرض السعر؟',
        answer:
          'يتضمن عرض السعر رقم العرض وتاريخه وتاريخ صلاحيته، وبيانات البائع والمشتري، والبنود بالكميات والأسعار، وضريبة القيمة المضافة ١٥٪، والإجمالي، والشروط مثل مدة التنفيذ وطريقة الدفع.',
      },
      {
        question: 'هل عرض السعر فاتورة ضريبية؟',
        answer:
          'لا. عرض السعر مستند تجاري قبل البيع ولا يُعتد به ضريبياً. عند قبول العرض وتنفيذ التوريد يجب إصدار فاتورة ضريبية، ويمكنك تحويل العرض إليها مباشرة من هذه الصفحة.',
      },
      {
        question: 'هل تُحسب الضريبة في عرض السعر؟',
        answer:
          'نعم. تحسب الأداة ضريبة القيمة المضافة ١٥٪ على كل البنود بالطريقة نفسها المستخدمة في الفاتورة الضريبية، حتى تتطابق المبالغ عند التحويل.',
      },
      {
        question: 'هل نموذج عرض السعر مجاني؟',
        answer:
          'نعم. أنشئ عرض السعر ونزّله PDF بالعربية أو الإنجليزية أو بلغتين دون تسجيل. تُحفظ المسودة في متصفحك فقط.',
      },
    ],
    howTo: {
      name: 'كيف تُعد عرض سعر PDF',
      steps: [
        { name: 'أدخل بيانات العرض', text: 'اكتب رقم العرض وتاريخه وتاريخ صلاحيته.' },
        { name: 'أدخل البائع والمشتري', text: 'اكتب الاسم التجاري لمنشأتك واسم العميل، والرقم الضريبي إن وُجد.' },
        { name: 'أضف البنود', text: 'أضف الوصف والكمية وسعر الوحدة، وتُحسب الضريبة ١٥٪ والإجمالي تلقائياً.' },
        { name: 'نزّل أو حوّل', text: 'نزّل العرض PDF، وعند قبوله حوّله إلى فاتورة ضريبية.' },
      ],
    },
  },
  'credit-note': {
    ...linesAr,
    ...partyAr,
    seo: {
      title: 'إشعار دائن مجاني PDF مرتبط بالفاتورة الضريبية | قافتر',
      description:
        'أصدر إشعاراً دائناً لمنشأتك يشير إلى رقم الفاتورة الضريبية الأصلية وتاريخها وسبب الإصدار، مع ضريبة ١٥٪ وتنزيل PDF بالعربية والإنجليزية. مجاناً.',
    },
    title: 'إشعار دائن (Credit Note) مجاني',
    subtitle:
      'أصدر إشعاراً دائناً عند إلغاء توريد أو إرجاع بضاعة أو خفض السعر، مع الإشارة إلى الفاتورة الضريبية الأصلية وتعديل ضريبة القيمة المضافة.',
    formTitle: 'بيانات الإشعار الدائن',
    number: 'رقم الإشعار',
    date: 'تاريخ الإشعار',
    originalTitle: 'الفاتورة الضريبية الأصلية',
    originalNumber: 'رقم الفاتورة الأصلية',
    originalDate: 'تاريخ الفاتورة الأصلية',
    reason: 'سبب الإصدار',
    reasonPlaceholder: 'اختر السبب',
    reasons: {
      cancellation: 'إلغاء التوريد أو إيقافه كلياً أو جزئياً',
      supply_change: 'تغيير جوهري في طبيعة التوريد',
      price_change: 'تعديل قيمة التوريد المتفق عليها (مثل خصم لاحق)',
      return: 'إرجاع السلع أو الخدمات وقبول المورد لها',
      info_error: 'تصحيح خطأ في بيانات المورد أو العميل',
      other: 'سبب آخر',
    },
    reasonDetail: 'تفاصيل السبب',
    reasonDetailHint: 'مطلوب عند اختيار «سبب آخر».',
    notes: 'ملاحظات',
    linkedNote:
      'يجب أن يرتبط الإشعار الدائن بالفاتورة الضريبية الأصلية التي يعدّلها، وأن يتضمن رقمها التسلسلي.',
    deadlineNote:
      'يُصدر الإشعار في موعد لا يتجاوز اليوم الخامس عشر من الشهر التالي للحدث الذي استدعى إصداره.',
    sellerVatRequired: 'مطلوب: الرقم الضريبي للبائع كما في الفاتورة الأصلية.',
    issues: {
      NUMBER_REQUIRED: 'أدخل رقم الإشعار.',
      DATE_REQUIRED: 'اختر تاريخ الإشعار.',
      ORIGINAL_INVOICE_NUMBER_REQUIRED: 'أدخل رقم الفاتورة الضريبية الأصلية.',
      ORIGINAL_INVOICE_DATE_REQUIRED: 'اختر تاريخ الفاتورة الضريبية الأصلية.',
      ORIGINAL_DATE_AFTER_NOTE: 'تاريخ الفاتورة الأصلية يجب ألا يكون بعد تاريخ الإشعار.',
      REASON_REQUIRED: 'اختر سبب إصدار الإشعار.',
      REASON_DETAIL_REQUIRED: 'اكتب تفاصيل السبب.',
      SELLER_NAME_REQUIRED: 'أدخل الاسم التجاري للبائع.',
      SELLER_VAT_REQUIRED: 'أدخل الرقم الضريبي للبائع.',
      SELLER_VAT_INVALID: 'الرقم الضريبي للبائع غير صحيح.',
      BUYER_NAME_REQUIRED: 'أدخل اسم المشتري.',
      BUYER_VAT_INVALID: 'الرقم الضريبي للمشتري غير صحيح.',
      ...lineIssuesAr,
    },
    faq: [
      {
        question: 'متى أُصدر إشعاراً دائناً؟',
        answer:
          'يُصدر الإشعار الدائن عند خفض قيمة توريد سبق إصدار فاتورة ضريبية له: إلغاء التوريد كلياً أو جزئياً، أو تغيير جوهري فيه، أو تعديل القيمة المتفق عليها كخصم لاحق، أو إرجاع السلع، أو تصحيح خطأ في بيانات المورد أو العميل.',
      },
      {
        question: 'ما البيانات المطلوبة في الإشعار الدائن؟',
        answer:
          'وفق دليل هيئة الزكاة والضريبة والجمارك للفوترة، يستوفي الإشعار متطلبات الفاتورة الضريبية، ويُذكر نوعه «إشعار دائن»، والرقم التسلسلي للفاتورة الضريبية التي يعدّلها. تضيف الأداة تاريخ الفاتورة الأصلية وسبب الإصدار والمبالغ والضريبة.',
      },
      {
        question: 'هل يمكن إصدار إشعار دائن دون فاتورة أصلية؟',
        answer:
          'لا. لا يجوز إصدار إشعار دائن لمبلغ أو تسوية لا تتعلق بتوريد سابق صدرت له فاتورة ضريبية، مثل رصيد ترويجي يُمنح للعملاء.',
      },
      {
        question: 'هل يكفي هذا الملف للمرحلة الثانية من الفوترة الإلكترونية؟',
        answer:
          'لا. تُصدر الأداة ملف PDF. المنشآت الملزمة بمرحلة الربط والتكامل يجب أن تُصدر الإشعارات إلكترونياً عبر حل مرتبط ببوابة فاتورة.',
      },
    ],
    howTo: {
      name: 'كيف تُصدر إشعاراً دائناً',
      steps: [
        { name: 'أدخل الفاتورة الأصلية', text: 'اكتب رقم الفاتورة الضريبية الأصلية وتاريخها.' },
        { name: 'اختر سبب الإصدار', text: 'اختر الحالة المناسبة مثل الإرجاع أو الخصم اللاحق أو الإلغاء.' },
        { name: 'أدخل البائع والمشتري والبنود', text: 'اكتب البيانات كما في الفاتورة الأصلية، والبنود والمبالغ المخفّضة قبل الضريبة.' },
        { name: 'نزّل الإشعار', text: 'راجع الضريبة والإجمالي، ثم نزّل الإشعار PDF وأرسله إلى العميل.' },
      ],
    },
  },
  'non-tax-invoice': {
    ...linesAr,
    unitPrice: 'سعر الوحدة',
    seo: {
      title: 'فاتورة غير ضريبية PDF مجاناً — للمنشآت غير المسجلة | قافتر',
      description:
        'أنشئ فاتورة غير ضريبية لمنشأتك غير المسجلة في ضريبة القيمة المضافة، دون ضريبة أو رقم ضريبي، ونزّلها PDF بالعربية أو الإنجليزية. مجاناً ودون تسجيل.',
    },
    title: 'فاتورة غير ضريبية مجانية للمنشآت غير المسجلة في الضريبة',
    subtitle:
      'للمحلات والمنشآت الصغيرة غير المسجلة في ضريبة القيمة المضافة: فاتورة لعملائك من الأفراد والشركات ببنود وإجمالي دون ضريبة، جاهزة PDF في دقائق.',
    formTitle: 'بيانات الفاتورة غير الضريبية',
    number: 'رقم الفاتورة',
    date: 'تاريخ الفاتورة',
    sellerTitle: 'بيانات منشأتك',
    sellerName: 'اسم المنشأة',
    address: 'العنوان',
    crNumber: 'رقم السجل التجاري',
    crHint: 'اختياري: ١٠ أرقام.',
    buyerTitle: 'بيانات العميل',
    buyerHint: 'اختياري للعملاء الأفراد.',
    buyerName: 'اسم العميل',
    notes: 'ملاحظات',
    notesHint: 'مثل: الضمان، أو طريقة الدفع، أو رقم الجوال.',
    totalLabel: 'الإجمالي',
    notRegisteredNote: 'صادرة من منشأة غير مسجلة في ضريبة القيمة المضافة، ولا تتضمن ضريبة.',
    registeredWarning:
      'إذا كانت منشأتك مسجلة في ضريبة القيمة المضافة فيجب عليك إصدار فاتورة ضريبية بدلاً من الفاتورة غير الضريبية.',
    registeredCta: 'أصدر فاتورة ضريبية',
    issues: {
      NUMBER_REQUIRED: 'أدخل رقم الفاتورة.',
      DATE_REQUIRED: 'اختر تاريخ الفاتورة.',
      SELLER_NAME_REQUIRED: 'أدخل اسم المنشأة.',
      SELLER_CR_INVALID: 'رقم السجل التجاري يتكون من ١٠ أرقام.',
      ...lineIssuesAr,
    },
    faq: [
      {
        question: 'ما هي الفاتورة غير الضريبية؟',
        answer:
          'هي فاتورة تصدرها منشأة غير مسجلة في ضريبة القيمة المضافة لإثبات البيع أو تقديم الخدمة. تتضمن رقم الفاتورة وتاريخها، واسم المنشأة، والبنود والإجمالي، ولا تتضمن ضريبة ولا رقماً ضريبياً.',
      },
      {
        question: 'من يحق له إصدار فاتورة غير ضريبية؟',
        answer:
          'المنشأة غير المسجلة في الضريبة، وغالباً تكون توريداتها الخاضعة للضريبة أقل من ٣٧٥٬٠٠٠ ريال سنوياً، وهو حد التسجيل الإلزامي. يمكن التسجيل اختيارياً عند تجاوز ١٨٧٬٥٠٠ ريال. بعد التسجيل يجب إصدار فواتير ضريبية.',
      },
      {
        question: 'هل أضيف ضريبة القيمة المضافة على الفاتورة غير الضريبية؟',
        answer:
          'لا. يُحظر على المنشأة غير المسجلة إصدار فاتورة ضريبية أو أي مستند يُظهر مبلغ الضريبة، أو تحصيل أي مبلغ بوصفه ضريبة قيمة مضافة، وغرامة ذلك تصل إلى ١٠٠٬٠٠٠ ريال. إذا تجاوزت توريداتك حد التسجيل الإلزامي فسجّل في الضريبة ثم أصدر فواتير ضريبية.',
      },
      {
        question: 'هل تحتاج الفاتورة غير الضريبية إلى رمز QR أو الفوترة الإلكترونية؟',
        answer:
          'الفوترة الإلكترونية ورمز QR يخصّان الفواتير الضريبية التي يصدرها الخاضعون لضريبة القيمة المضافة. المنشأة غير المسجلة لا يحق لها إصدار فاتورة ضريبية، فتصدر فاتورة عادية دون ضريبة ودون رمز QR. وإذا أصبحت ملزمة بالتسجيل فسجّل أولاً.',
      },
      {
        question: 'هل الأداة مجانية؟',
        answer:
          'نعم. أنشئ الفاتورة ونزّلها PDF بالعربية أو الإنجليزية أو بلغتين دون تسجيل. تُحفظ المسودة في متصفحك فقط.',
      },
    ],
    howTo: {
      name: 'كيف تُصدر فاتورة غير ضريبية PDF',
      steps: [
        { name: 'أدخل بيانات منشأتك', text: 'اكتب اسم المنشأة وعنوانها، ورقم السجل التجاري إن وُجد.' },
        { name: 'أدخل العميل والبنود', text: 'اكتب اسم العميل إن أردت، ثم الوصف والكمية وسعر الوحدة لكل بند.' },
        { name: 'نزّل الفاتورة', text: 'راجع الإجمالي دون ضريبة، ثم نزّل الفاتورة PDF وأرسلها إلى العميل.' },
      ],
    },
  },
}

const en: DocumentCopy = {
  common: {
    badge: 'Free · No sign-up',
    draftNote: 'Your draft is kept in this browser only. Nothing is sent to our servers.',
    settingsTitle: 'Document settings',
    outputLangLabel: 'Document language',
    outputAr: 'Arabic',
    outputEn: 'English',
    outputBilingual: 'Bilingual',
    summaryTitle: 'Summary',
    issuesTitle: 'Complete these fields before downloading:',
    download: 'Download PDF',
    generating: 'Creating the PDF…',
    downloaded: 'PDF downloaded.',
    pdfFailed: 'The PDF could not be created. Please try again.',
    clearForm: 'Clear form',
    previewTitle: 'Document preview',
    previewFrameTitle: 'Document preview before download',
    actionsBarLabel: 'Document actions',
    saveTitle: 'Keep your customers and documents in one place',
    saveBody: 'Create a free account to save your business and customer details and issue invoices in sequence.',
    signup: 'Create a free account',
    subtotal: 'Total excl. VAT',
    vat: 'VAT 15%',
    total: 'Total incl. VAT',
    faqTitle: 'Frequently asked questions',
    relatedTitle: 'Related tools',
  },
  'receipt-voucher': {
    seo: {
      title: 'Free Receipt Voucher Generator — Arabic & English PDF',
      description:
        'Create a receipt voucher for your business with the amount in words, cash, bank transfer, cheque or card payment, and download an Arabic or English PDF.',
    },
    title: 'Free Receipt Voucher (PDF)',
    subtitle:
      'Issue a receipt voucher to confirm a cash, transfer or cheque payment, with the amount written in words and a receiver signature line.',
    formTitle: 'Receipt voucher details',
    number: 'Receipt no.',
    date: 'Date',
    issuerTitle: 'Received by (your business)',
    issuerName: 'Trade name',
    issuerHint: 'Optional: shown in the voucher header.',
    receivedFrom: 'Received from',
    amount: 'Amount (SAR)',
    amountHint: 'The amount is written in words automatically.',
    amountInWords: 'Amount in words (Arabic)',
    amountInWordsEn: 'Amount in words',
    amountWordsEmpty: 'Enter the amount to see it in words.',
    paymentMethod: 'Payment method',
    methods: { cash: 'Cash', bank_transfer: 'Bank transfer', cheque: 'Cheque', card: 'Card' },
    chequeNumber: 'Cheque no.',
    bank: 'Bank',
    bankOptional: 'Bank (optional)',
    purpose: 'Being payment for',
    receiverName: 'Receiver name',
    receiverHint: 'Optional: shown above the signature line.',
    notTaxInvoice:
      'A receipt voucher only confirms that money was received. It is not a tax invoice and does not replace the tax invoice for the supply.',
    issues: {
      NUMBER_REQUIRED: 'Enter the receipt number.',
      DATE_REQUIRED: 'Choose the receipt date.',
      RECEIVED_FROM_REQUIRED: 'Enter who paid the amount.',
      AMOUNT_INVALID: 'Enter a valid amount above zero.',
      AMOUNT_TOO_LARGE: 'The amount is too large.',
      CHEQUE_NUMBER_REQUIRED: 'Enter the cheque number.',
      BANK_REQUIRED: 'Enter the bank the cheque is drawn on.',
      PURPOSE_REQUIRED: 'Enter what the payment is for.',
    },
    faq: [
      {
        question: 'What is a receipt voucher?',
        answer:
          'A receipt voucher (سند قبض) is issued by a business when it receives money. It shows the voucher number and date, the payer, the amount in figures and words, the payment method, what the payment is for, and the receiver’s signature.',
      },
      {
        question: 'Is a receipt voucher a tax invoice?',
        answer:
          'No. It only proves payment. If the payment is for a taxable supply, you must issue a tax invoice under ZATCA rules. You can create one free with Qaftr’s invoice tool.',
      },
      {
        question: 'How is the amount written in words?',
        answer:
          'The tool writes it automatically in Arabic («فقط … ريال سعودي لا غير», with halalas and correct number agreement) and in English, e.g. “One thousand two hundred Saudi riyals only”.',
      },
      {
        question: 'Do I need an account to download the PDF?',
        answer:
          'No. Downloading is free with no sign-up, and the draft stays in your browser. Create an account if you want to save customers and issue documents in sequence.',
      },
    ],
    howTo: {
      name: 'How to create a receipt voucher PDF',
      steps: [
        { name: 'Enter the voucher details', text: 'Type the receipt number, date and the name of the payer.' },
        { name: 'Enter the amount and payment method', text: 'Type the amount in SAR and choose cash, transfer, cheque or card. The amount in words appears automatically.' },
        { name: 'Describe the payment', text: 'Write what the payment is for and, optionally, the receiver’s name.' },
        { name: 'Download', text: 'Choose Arabic, English or bilingual, click “Download PDF” and sign the voucher.' },
      ],
    },
  },
  quotation: {
    ...linesEn,
    ...partyEn,
    seo: {
      title: 'Free Quotation Generator with 15% VAT — PDF | Qaftr',
      description:
        'Create a professional quotation with 15% VAT, a validity date and terms, download a PDF and turn it into a tax invoice in one click. Free, no sign-up.',
    },
    title: 'Free Quotation with 15% VAT',
    subtitle:
      'Prepare a quotation for business or consumer customers with line items, 15% VAT and a validity date, then turn it into a tax invoice once accepted.',
    formTitle: 'Quotation details',
    number: 'Quotation no.',
    date: 'Quotation date',
    validUntil: 'Valid until',
    terms: 'Terms and conditions',
    termsHint: 'For example: delivery time, payment terms, what the price includes.',
    convert: 'Convert to tax invoice',
    convertHint: 'Copies the seller, buyer and line items into the tax invoice tool.',
    issues: {
      NUMBER_REQUIRED: 'Enter the quotation number.',
      DATE_REQUIRED: 'Choose the quotation date.',
      VALID_UNTIL_BEFORE_DATE: 'The validity date must be after the quotation date.',
      SELLER_NAME_REQUIRED: 'Enter the seller’s trade name.',
      SELLER_VAT_INVALID: 'The seller VAT number is not valid.',
      BUYER_NAME_REQUIRED: 'Enter the buyer name.',
      BUYER_VAT_INVALID: 'The buyer VAT number is not valid.',
      ...lineIssuesEn,
    },
    faq: [
      {
        question: 'What goes on a quotation?',
        answer:
          'A quotation shows its number, date and validity date, the seller and buyer, line items with quantities and prices, 15% VAT, the total, and terms such as delivery time and payment.',
      },
      {
        question: 'Is a quotation a tax invoice?',
        answer:
          'No. A quotation is a pre-sale commercial document with no tax effect. Once the customer accepts and you make the supply, issue a tax invoice — you can convert the quotation directly from this page.',
      },
      {
        question: 'Is VAT included in the quotation?',
        answer:
          'Yes. The tool calculates 15% VAT on all items with the same rounding as the tax invoice, so the amounts match after conversion.',
      },
      {
        question: 'Is the quotation template free?',
        answer:
          'Yes. Create the quotation and download it in Arabic, English or both, with no sign-up. The draft stays in your browser.',
      },
    ],
    howTo: {
      name: 'How to create a quotation PDF',
      steps: [
        { name: 'Enter the quotation details', text: 'Type the quotation number, date and validity date.' },
        { name: 'Enter seller and buyer', text: 'Add your trade name and the customer, with VAT numbers if any.' },
        { name: 'Add line items', text: 'Add description, quantity and unit price. VAT at 15% and totals are calculated automatically.' },
        { name: 'Download or convert', text: 'Download the PDF and, once accepted, convert it into a tax invoice.' },
      ],
    },
  },
  'credit-note': {
    ...linesEn,
    ...partyEn,
    seo: {
      title: 'Free Credit Note Generator for Saudi VAT — PDF | Qaftr',
      description:
        'Issue a credit note that references the original tax invoice number and date and the reason, with 15% VAT and an Arabic or English PDF. Free, no sign-up.',
    },
    title: 'Free Credit Note (إشعار دائن)',
    subtitle:
      'Issue a credit note when a supply is cancelled, goods are returned or the price is reduced, linked to the original tax invoice with the VAT adjustment.',
    formTitle: 'Credit note details',
    number: 'Credit note no.',
    date: 'Credit note date',
    originalTitle: 'Original tax invoice',
    originalNumber: 'Original invoice no.',
    originalDate: 'Original invoice date',
    reason: 'Reason for issuing',
    reasonPlaceholder: 'Choose a reason',
    reasons: {
      cancellation: 'Supply cancelled or suspended, in whole or in part',
      supply_change: 'Substantial change in the nature of the supply',
      price_change: 'Agreed value changed (e.g. a later discount)',
      return: 'Goods or services returned and accepted',
      info_error: 'Correction of supplier or customer details',
      other: 'Other reason',
    },
    reasonDetail: 'Reason details',
    reasonDetailHint: 'Required when “Other reason” is chosen.',
    notes: 'Notes',
    linkedNote:
      'A credit note must be linked to the original tax invoice it amends and show that invoice’s serial number.',
    deadlineNote:
      'Issue it no later than the 15th day of the month after the event that requires it.',
    sellerVatRequired: 'Required: the seller VAT number as on the original invoice.',
    issues: {
      NUMBER_REQUIRED: 'Enter the credit note number.',
      DATE_REQUIRED: 'Choose the credit note date.',
      ORIGINAL_INVOICE_NUMBER_REQUIRED: 'Enter the original tax invoice number.',
      ORIGINAL_INVOICE_DATE_REQUIRED: 'Choose the original tax invoice date.',
      ORIGINAL_DATE_AFTER_NOTE: 'The original invoice date cannot be after the credit note date.',
      REASON_REQUIRED: 'Choose the reason for issuing the note.',
      REASON_DETAIL_REQUIRED: 'Describe the reason.',
      SELLER_NAME_REQUIRED: 'Enter the seller’s trade name.',
      SELLER_VAT_REQUIRED: 'Enter the seller VAT number.',
      SELLER_VAT_INVALID: 'The seller VAT number is not valid.',
      BUYER_NAME_REQUIRED: 'Enter the buyer name.',
      BUYER_VAT_INVALID: 'The buyer VAT number is not valid.',
      ...lineIssuesEn,
    },
    faq: [
      {
        question: 'When do I issue a credit note?',
        answer:
          'Issue a credit note when the value of a supply already invoiced goes down: the supply is cancelled in whole or in part, it changes substantially, the agreed price changes (such as a later discount), goods are returned, or supplier or customer details were wrong.',
      },
      {
        question: 'What must a credit note show?',
        answer:
          'Under ZATCA’s tax invoicing guideline, the note meets the tax invoice requirements, states its type (“Credit Note”) and the serial number of the tax invoice it amends. The tool also adds the original invoice date, the reason, the amounts and the VAT.',
      },
      {
        question: 'Can I issue a credit note without an original invoice?',
        answer:
          'No. A credit note cannot be issued for a payment or account adjustment that does not relate to a prior supply with a tax invoice, such as a promotional credit given to customers.',
      },
      {
        question: 'Is this PDF enough for e-invoicing Phase 2?',
        answer:
          'No. The tool creates a PDF. Businesses in the Integration Phase (Phase 2) must issue notes electronically through a solution connected to the FATOORA portal.',
      },
    ],
    howTo: {
      name: 'How to issue a credit note',
      steps: [
        { name: 'Enter the original invoice', text: 'Type the original tax invoice number and date.' },
        { name: 'Choose the reason', text: 'Pick the case, such as a return, a later discount or a cancellation.' },
        { name: 'Enter parties and items', text: 'Copy the seller and buyer from the original invoice and enter the credited items before VAT.' },
        { name: 'Download', text: 'Check the VAT and total, download the PDF and send it to the customer.' },
      ],
    },
  },
  'non-tax-invoice': {
    ...linesEn,
    unitPrice: 'Unit price',
    seo: {
      title: 'Free Non-Tax Invoice PDF for Non-VAT Businesses | Qaftr',
      description:
        'Create a non-tax invoice for a business not registered for VAT in Saudi Arabia: no VAT, no VAT number, PDF in Arabic or English. Free, no sign-up.',
    },
    title: 'Free non-tax invoice for businesses not registered for VAT',
    subtitle:
      'For shops and small businesses that are not VAT-registered: invoice consumers and companies with line items and a total without VAT, ready as a PDF in minutes.',
    formTitle: 'Non-tax invoice details',
    number: 'Invoice number',
    date: 'Invoice date',
    sellerTitle: 'Your business',
    sellerName: 'Business name',
    address: 'Address',
    crNumber: 'CR number',
    crHint: 'Optional: 10-digit commercial registration number.',
    buyerTitle: 'Customer',
    buyerHint: 'Optional for consumers.',
    buyerName: 'Customer name',
    notes: 'Notes',
    notesHint: 'For example: warranty, payment method or phone number.',
    totalLabel: 'Total',
    notRegisteredNote: 'Issued by a business not registered for VAT. No VAT is charged.',
    registeredWarning:
      'If your business is registered for VAT, you must issue a tax invoice instead of a non-tax invoice.',
    registeredCta: 'Create a tax invoice',
    issues: {
      NUMBER_REQUIRED: 'Enter the invoice number.',
      DATE_REQUIRED: 'Choose the invoice date.',
      SELLER_NAME_REQUIRED: 'Enter your business name.',
      SELLER_CR_INVALID: 'The CR number has 10 digits.',
      ...lineIssuesEn,
    },
    faq: [
      {
        question: 'What is a non-tax invoice?',
        answer:
          'An invoice issued by a business that is not registered for VAT, to record a sale or service. It shows the invoice number and date, the business name, the items and the total, with no VAT and no VAT number.',
      },
      {
        question: 'Who can issue a non-tax invoice?',
        answer:
          'A business that is not registered for VAT, usually because its taxable supplies are below SAR 375,000 a year, the mandatory registration threshold. Voluntary registration is possible above SAR 187,500. Once registered, you must issue tax invoices.',
      },
      {
        question: 'Do I add VAT to a non-tax invoice?',
        answer:
          'No. A business that is not registered for VAT must not issue a tax invoice or any document showing a VAT amount, or collect VAT, and faces a fine of up to SAR 100,000. If your taxable supplies pass the mandatory threshold, register for VAT and then issue tax invoices.',
      },
      {
        question: 'Does a non-tax invoice need a QR code or e-invoicing?',
        answer:
          'E-invoicing and the QR code apply to tax invoices issued by VAT taxpayers. A business that is not registered may not issue tax invoices, so it issues a regular invoice without VAT and without a QR code. If you become required to register, register first.',
      },
      {
        question: 'Is the tool free?',
        answer:
          'Yes. Create the invoice and download it in Arabic, English or both, with no sign-up. The draft stays in your browser.',
      },
    ],
    howTo: {
      name: 'How to issue a non-tax invoice PDF',
      steps: [
        { name: 'Enter your business', text: 'Type your business name and address, and the CR number if you have one.' },
        { name: 'Enter the customer and items', text: 'Optionally add the customer, then the description, quantity and unit price of each item.' },
        { name: 'Download', text: 'Check the total without VAT, download the PDF and send it to the customer.' },
      ],
    },
  },
}

export function getDocumentCopy(lang: MarketingLang): DocumentCopy {
  return lang === 'en' ? en : ar
}
