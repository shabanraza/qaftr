import type { UaeInvoiceIssueCode } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'

const ar = {
  title: 'فاتورة ضريبية مجانية لشركتك في الإمارات',
  subtitle:
    'أنشئ فاتورة ضريبية بالدرهم وبضريبة 5٪ في متصفحك، بالعربية أو الإنجليزية أو باللغتين جنباً إلى جنب، ونزّلها بصيغة PDF. دون تسجيل، وبياناتك لا تغادر جهازك.',
  badge: 'الإمارات · درهم · 5٪',
  formTitle: 'بيانات الفاتورة',
  settingsTitle: 'نوع الفاتورة ولغتها',
  typeLabel: 'نوع الفاتورة',
  typeFull: 'فاتورة ضريبية',
  typeSimplified: 'فاتورة ضريبية مبسطة',
  simplifiedRule:
    'تجوز الفاتورة المبسطة إذا كان العميل غير مسجّل في ضريبة القيمة المضافة، أو كان مسجّلاً ولا تتجاوز قيمة التوريد 10,000 درهم شاملة الضريبة (المادة 59 من اللائحة التنفيذية). وبموجب البند 16 من المادة 59 المعدّل بقرار مجلس الوزراء رقم 100 لسنة 2025، لا تنطبق أحكام الفاتورة المبسطة متى أصدرت الفاتورة الضريبية بصيغة فاتورة إلكترونية، إلزامياً أو اختيارياً، فأصدر حينها فاتورة ضريبية كاملة.',
  outputLangLabel: 'لغة الفاتورة',
  outputAr: 'عربي',
  outputEn: 'English',
  outputBilingual: 'عربي + English',
  supplierTitle: 'بيانات المورّد (شركتك)',
  recipientTitle: 'بيانات العميل',
  recipientOptional: 'اختيارية في الفاتورة المبسطة.',
  name: 'الاسم',
  address: 'العنوان',
  trn: 'رقم التسجيل الضريبي (TRN)',
  trnHint: '15 رقماً يبدأ بـ 100.',
  recipientRegistered: 'العميل مسجّل في ضريبة القيمة المضافة',
  detailsTitle: 'رقم الفاتورة والتواريخ',
  invoiceNumber: 'رقم الفاتورة',
  invoiceNumberHint: 'رقم تسلسلي، مثل INV-0001.',
  issueDate: 'تاريخ الفاتورة',
  supplyDate: 'تاريخ التوريد (إن اختلف)',
  supplyDateAfterIssue:
    'تاريخ التوريد لاحق لتاريخ الفاتورة. هذا مقبول للفواتير الصادرة مسبقاً (مثل الدفعة المقدّمة)، وإلا فتحقّق من التاريخ.',
  linesTitle: 'البنود',
  lineLabel: (n: number) => `البند ${n}`,
  description: 'الوصف',
  qty: 'الكمية',
  unitPrice: 'سعر الوحدة (درهم)',
  discount: 'الخصم (درهم)',
  vatCategory: 'فئة الضريبة',
  categories: { standard: 'النسبة الأساسية 5٪', zero: 'نسبة الصفر 0٪', exempt: 'معفاة' },
  addLine: 'أضف بنداً',
  removeLine: (n: number) => `احذف البند ${n}`,
  notes: 'ملاحظات (اختياري)',
  summaryTitle: 'الملخص',
  actionsBarLabel: 'إجراءات الفاتورة',
  totalExclVat: 'الإجمالي غير شامل الضريبة',
  totalVat: 'ضريبة القيمة المضافة',
  totalPayable: 'المبلغ المستحق',
  previewTitle: 'معاينة الفاتورة',
  previewFrameTitle: 'معاينة الفاتورة الضريبية',
  download: 'نزّل الفاتورة PDF',
  generating: 'جارٍ إنشاء PDF…',
  pdfFailed: 'تعذّر إنشاء ملف PDF. حاول مرة أخرى.',
  downloaded: 'تم تنزيل الفاتورة.',
  issuesTitle: 'صحّح هذه الحقول قبل التنزيل:',
  nextInvoice: 'ابدأ الفاتورة التالية',
  clearForm: 'امسح النموذج',
  draftNote: 'تُحفظ المسودة في هذا المتصفح فقط.',
  notEInvoiceTitle: 'فاتورة PDF وليست فاتورة إلكترونية',
  notEInvoice:
    'هذه الأداة تُنشئ فاتورة ضريبية بصيغة PDF. هي ليست فاتورة إلكترونية عبر Peppol / PINT AE، ولا تُرسل لأي جهة. الفوترة الإلكترونية الإلزامية تتم عبر مزوّد خدمة معتمد (ASP).',
  readinessLink: 'اعرف موعدك الإلزامي للفوترة الإلكترونية',
  guideLink: 'اقرأ دليل الفوترة الإلكترونية 2027',
  lineIssue: (n: number, message: string) => `البند ${n}: ${message}`,
  issues: {
    TITLE_MISSING_TAX_INVOICE: 'يجب أن تحمل الفاتورة عبارة «فاتورة ضريبية».',
    SUPPLIER_NAME_REQUIRED: 'أدخل اسم المورّد.',
    SUPPLIER_ADDRESS_REQUIRED: 'أدخل عنوان المورّد.',
    SUPPLIER_TRN_REQUIRED: 'أدخل رقم التسجيل الضريبي للمورّد.',
    SUPPLIER_TRN_INVALID: 'صيغة رقم التسجيل الضريبي للمورّد غير صحيحة (15 رقماً يبدأ بـ 100).',
    RECIPIENT_NAME_REQUIRED: 'أدخل اسم العميل.',
    RECIPIENT_ADDRESS_REQUIRED: 'أدخل عنوان العميل.',
    RECIPIENT_TRN_REQUIRED: 'العميل مسجّل: أدخل رقم تسجيله الضريبي.',
    RECIPIENT_TRN_INVALID: 'صيغة رقم التسجيل الضريبي للعميل غير صحيحة.',
    INVOICE_NUMBER_REQUIRED: 'أدخل رقم الفاتورة.',
    INVOICE_NUMBER_NOT_SEQUENTIAL: 'يجب أن ينتهي رقم الفاتورة بأرقام تسلسلية (مثل INV-0001).',
    ISSUE_DATE_REQUIRED: 'أدخل تاريخ الفاتورة.',
    ISSUE_DATE_INVALID: 'تاريخ الفاتورة غير صحيح.',
    SUPPLY_DATE_INVALID: 'تاريخ التوريد غير صحيح.',
    LINES_REQUIRED: 'أضف بنداً واحداً على الأقل.',
    LINE_DESCRIPTION_REQUIRED: 'أدخل الوصف.',
    LINE_QTY_INVALID: 'الكمية يجب أن تكون رقماً أكبر من صفر.',
    LINE_UNIT_PRICE_INVALID: 'سعر الوحدة يجب أن يكون رقماً موجباً.',
    LINE_DISCOUNT_INVALID: 'الخصم يجب أن يكون رقماً موجباً.',
    LINE_DISCOUNT_EXCEEDS_AMOUNT: 'الخصم أكبر من قيمة البند.',
    AMOUNT_TOO_LARGE: 'الإجمالي أكبر من الحد المسموح (تريليون درهم).',
    SIMPLIFIED_NOT_ALLOWED:
      'العميل مسجّل والإجمالي يتجاوز 10,000 درهم: استخدم فاتورة ضريبية كاملة.',
  } satisfies Record<UaeInvoiceIssueCode, string>,
  faqTitle: 'أسئلة شائعة عن الفاتورة الضريبية في الإمارات',
  faq: [
    {
      question: 'ما الذي يجب أن تتضمنه الفاتورة الضريبية في الإمارات؟',
      answer:
        'حسب المادة 59 من اللائحة التنفيذية: عبارة «فاتورة ضريبية»، واسم المورّد وعنوانه ورقم تسجيله الضريبي، واسم العميل وعنوانه ورقم تسجيله الضريبي إن كان مسجّلاً، ورقم تسلسلي، وتاريخ الفاتورة، تاريخ التوريد إن اختلف، ولكل بند الوصف والكمية وسعر الوحدة ونسبة الضريبة ومبلغها، مع أي خصم، والإجمالي والضريبة بالدرهم. تحقّق من الهيئة الاتحادية للضرائب قبل الاعتماد عليها.',
    },
    {
      question: 'متى أستخدم الفاتورة الضريبية المبسطة؟',
      answer:
        'تجوز إذا كان العميل غير مسجّل، أو كان مسجّلاً وقيمة التوريد لا تتجاوز 10,000 درهم شاملة الضريبة. وتحتاج حقولاً أقل: عبارة «فاتورة ضريبية»، وبيانات المورّد ورقم تسجيله الضريبي، التاريخ، الوصف، والإجمالي والضريبة. تنبيه: بموجب البند 16 من المادة 59 المعدّل بقرار مجلس الوزراء رقم 100 لسنة 2025، لا تنطبق الفاتورة المبسطة متى أصدرت فواتيرك الضريبية إلكترونياً، إلزامياً أو اختيارياً، فتصدر حينها فواتير ضريبية كاملة (إلكترونية).',
    },
    {
      question: 'هل هذه فاتورة إلكترونية متوافقة مع Peppol؟',
      answer:
        'لا. الأداة تُنشئ فاتورة ضريبية بصيغة PDF. الفوترة الإلكترونية الإلزامية في الإمارات (ابتداءً من 2027 حسب إرشادات وزارة المالية) تتم بصيغة PINT AE عبر مزوّد خدمة معتمد.',
    },
    {
      question: 'هل يمكنني إصدار الفاتورة بالعربي والإنجليزي معاً؟',
      answer:
        'نعم. اختر «عربي + English» لتظهر العناوين باللغتين جنباً إلى جنب، مع أرقام لاتينية للمبالغ.',
    },
    {
      question: 'هل تُرسل بياناتي إلى قافتر؟',
      answer:
        'لا. الفاتورة تُنشأ في متصفحك، والمسودة تُحفظ في هذا المتصفح فقط. لا نرسل شيئاً لأي خادم.',
    },
    {
      question: 'هل يمكنني إضافة بنود بنسبة صفر أو معفاة؟',
      answer:
        'نعم. اختر لكل بند فئته: النسبة الأساسية 5٪، أو نسبة الصفر، أو معفاة. وتأكد من تصنيف توريدك وفق أحكام الهيئة الاتحادية للضرائب.',
    },
  ],
  howTo: {
    name: 'كيف تُنشئ فاتورة ضريبية إماراتية مجاناً',
    steps: [
      { name: 'اختر النوع واللغة', text: 'اختر فاتورة ضريبية كاملة أو مبسطة، ولغة الفاتورة: العربية أو الإنجليزية أو اللغتين.' },
      { name: 'أدخل بيانات شركتك', text: 'اكتب اسم شركتك وعنوانها ورقم تسجيلها الضريبي (15 رقماً يبدأ بـ 100).' },
      { name: 'أدخل بيانات العميل', text: 'اكتب اسم العميل وعنوانه، ورقم تسجيله الضريبي إن كان مسجّلاً.' },
      { name: 'أضف البنود', text: 'أدخل الوصف والكمية والسعر والخصم وفئة الضريبة لكل بند — نحسب 5٪ بدقة الفلس.' },
      { name: 'نزّل PDF', text: 'راجع المعاينة ثم نزّل الفاتورة PDF.' },
    ],
  },
}

export type AeInvoiceCopy = typeof ar

const en: AeInvoiceCopy = {
  title: 'Free UAE tax invoice for your business',
  subtitle:
    'Create a UAE tax invoice in AED with 5% VAT right in your browser — in Arabic, English or both side by side — and download it as a PDF. No signup, and your data never leaves your device.',
  badge: 'UAE · AED · 5%',
  formTitle: 'Invoice details',
  settingsTitle: 'Invoice type and language',
  typeLabel: 'Invoice type',
  typeFull: 'Tax invoice',
  typeSimplified: 'Simplified tax invoice',
  simplifiedRule:
    'A simplified tax invoice is allowed when the customer is not VAT-registered, or is registered and the supply is not more than AED 10,000 including VAT (Article 59 of the VAT Executive Regulation). Under Article 59(16), as amended by Cabinet Decision No. 100 of 2025, the simplified invoice rules stop applying once you issue tax invoices as e-invoices, whether mandatory or voluntary, so you then issue full tax invoices.',
  outputLangLabel: 'Invoice language',
  outputAr: 'عربي',
  outputEn: 'English',
  outputBilingual: 'عربي + English',
  supplierTitle: 'Supplier (your business)',
  recipientTitle: 'Customer (recipient)',
  recipientOptional: 'Optional on a simplified invoice.',
  name: 'Name',
  address: 'Address',
  trn: 'TRN (Tax Registration Number)',
  trnHint: '15 digits starting with 100.',
  recipientRegistered: 'Customer is VAT-registered',
  detailsTitle: 'Number and dates',
  invoiceNumber: 'Invoice number',
  invoiceNumberHint: 'Sequential, e.g. INV-0001.',
  issueDate: 'Invoice date',
  supplyDate: 'Date of supply (if different)',
  supplyDateAfterIssue:
    'The date of supply is after the invoice date. That is fine for an invoice issued in advance (e.g. on a deposit); otherwise, check the date.',
  linesTitle: 'Line items',
  lineLabel: (n: number) => `Line ${n}`,
  description: 'Description',
  qty: 'Qty',
  unitPrice: 'Unit price (AED)',
  discount: 'Discount (AED)',
  vatCategory: 'VAT category',
  categories: { standard: 'Standard 5%', zero: 'Zero-rated 0%', exempt: 'Exempt' },
  addLine: 'Add line',
  removeLine: (n: number) => `Remove line ${n}`,
  notes: 'Notes (optional)',
  summaryTitle: 'Summary',
  actionsBarLabel: 'Invoice actions',
  totalExclVat: 'Total excluding VAT',
  totalVat: 'VAT',
  totalPayable: 'Total payable',
  previewTitle: 'Invoice preview',
  previewFrameTitle: 'Tax invoice preview',
  download: 'Download PDF invoice',
  generating: 'Creating PDF…',
  pdfFailed: 'Could not create the PDF. Please try again.',
  downloaded: 'Invoice downloaded.',
  issuesTitle: 'Fix these before downloading:',
  nextInvoice: 'Start next invoice',
  clearForm: 'Clear form',
  draftNote: 'Your draft is saved in this browser only.',
  notEInvoiceTitle: 'A PDF invoice, not an e-invoice',
  notEInvoice:
    'This tool creates a PDF tax invoice. It is not a Peppol / PINT AE e-invoice and is not sent anywhere. Mandatory UAE e-invoicing runs through an accredited service provider (ASP).',
  readinessLink: 'Check your e-invoicing deadline',
  guideLink: 'Read the UAE e-invoicing 2027 guide',
  lineIssue: (n: number, message: string) => `Line ${n}: ${message}`,
  issues: {
    TITLE_MISSING_TAX_INVOICE: 'The invoice must show the words “Tax Invoice”.',
    SUPPLIER_NAME_REQUIRED: 'Enter the supplier name.',
    SUPPLIER_ADDRESS_REQUIRED: 'Enter the supplier address.',
    SUPPLIER_TRN_REQUIRED: 'Enter the supplier TRN.',
    SUPPLIER_TRN_INVALID: 'The supplier TRN format is not valid (15 digits starting with 100).',
    RECIPIENT_NAME_REQUIRED: 'Enter the customer name.',
    RECIPIENT_ADDRESS_REQUIRED: 'Enter the customer address.',
    RECIPIENT_TRN_REQUIRED: 'The customer is registered: enter their TRN.',
    RECIPIENT_TRN_INVALID: 'The customer TRN format is not valid.',
    INVOICE_NUMBER_REQUIRED: 'Enter an invoice number.',
    INVOICE_NUMBER_NOT_SEQUENTIAL: 'The invoice number must end in sequential digits (e.g. INV-0001).',
    ISSUE_DATE_REQUIRED: 'Enter the invoice date.',
    ISSUE_DATE_INVALID: 'The invoice date is not valid.',
    SUPPLY_DATE_INVALID: 'The date of supply is not valid.',
    LINES_REQUIRED: 'Add at least one line item.',
    LINE_DESCRIPTION_REQUIRED: 'Enter a description.',
    LINE_QTY_INVALID: 'Quantity must be a number above zero.',
    LINE_UNIT_PRICE_INVALID: 'Unit price must be a positive number.',
    LINE_DISCOUNT_INVALID: 'Discount must be a positive number.',
    LINE_DISCOUNT_EXCEEDS_AMOUNT: 'Discount is more than the line amount.',
    AMOUNT_TOO_LARGE: 'The total is above the limit (AED 1 trillion).',
    SIMPLIFIED_NOT_ALLOWED:
      'The customer is registered and the total is above AED 10,000: use a full tax invoice.',
  },
  faqTitle: 'UAE tax invoice FAQ',
  faq: [
    {
      question: 'What must a UAE tax invoice include?',
      answer:
        'Per Article 59 of the VAT Executive Regulation: the words “Tax Invoice”; supplier name, address and TRN; customer name, address and TRN if registered; a sequential number; issue date; date of supply if different; for each line the description, quantity, unit price, VAT rate and VAT amount; any discount; and the total and VAT in AED. Verify with the FTA before relying on it.',
    },
    {
      question: 'When can I issue a simplified tax invoice?',
      answer:
        'When the customer is not VAT-registered, or is registered and the supply is not more than AED 10,000 including VAT. It needs fewer fields: “Tax Invoice”, your name, address and TRN, the date, a description, and the total and VAT. Note: under Article 59(16), as amended by Cabinet Decision No. 100 of 2025, simplified invoices stop applying once you issue tax invoices as e-invoices under e-invoicing (mandatory or voluntary), so you then issue full tax invoices (as e-invoices).',
    },
    {
      question: 'Is this a Peppol e-invoice?',
      answer:
        'No. This tool creates a PDF tax invoice. Mandatory UAE e-invoicing (from 2027 per MoF guidance) uses the PINT AE format through an accredited service provider.',
    },
    {
      question: 'Can I issue the invoice in Arabic and English?',
      answer:
        'Yes. Choose “عربي + English” to show the labels in both languages side by side, with Latin digits for amounts.',
    },
    {
      question: 'Is my data sent to Qaftr?',
      answer:
        'No. The invoice is generated in your browser and the draft is stored in this browser only. Nothing is sent to a server.',
    },
    {
      question: 'Can I add zero-rated or exempt lines?',
      answer:
        'Yes. Pick a category per line: standard 5%, zero-rated or exempt. Check how your supply is classified under FTA rules.',
    },
  ],
  howTo: {
    name: 'How to create a UAE tax invoice for free',
    steps: [
      { name: 'Choose type and language', text: 'Pick a full or simplified tax invoice, and Arabic, English or both.' },
      { name: 'Add your business details', text: 'Enter your business name, address and TRN (15 digits starting with 100).' },
      { name: 'Add the customer', text: 'Enter the customer name and address, and their TRN if they are VAT-registered.' },
      { name: 'Add line items', text: 'Enter description, quantity, price, discount and VAT category — 5% VAT is calculated to the fils.' },
      { name: 'Download the PDF', text: 'Check the preview, then download the invoice as a PDF.' },
    ],
  },
}

export function getAeInvoiceCopy(lang: MarketingLang): AeInvoiceCopy {
  return lang === 'en' ? en : ar
}
