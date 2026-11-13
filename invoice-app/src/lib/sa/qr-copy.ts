import type { ZatcaQrDecodeError, ZatcaQrIssueCode } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'

/**
 * Copy for /tools/zatca-qr. Facts checked against ZATCA "Detailed Guidelines
 * for E-Invoicing" v2 (May 2023): Phase 1 QR required on simplified invoices
 * only (§ comparison table); Phase 2 simplified invoices carry a 9-tag TLV
 * base64 QR made by the taxpayer's solution; for B2B tax invoices ZATCA
 * generates the QR string at clearance (FAQ); customers verify invoices with
 * ZATCA's VAT app (§11). See docs/REGULATORY_CLAIMS_2026-11-13.md.
 */
export type QrCopy = {
  seo: { title: string; description: string }
  pageName: string
  title: string
  subtitle: string
  inputLabel: string
  inputHint: string
  sample: string
  upload: string
  uploadHint: string
  reading: string
  noQrInImage: string
  clear: string
  resultTitle: string
  statusOk: string
  statusIssues: (n: number) => string
  phase1: string
  phase2: string
  phase1Note: string
  phase2Note: string
  fields: {
    sellerName: string
    vatNumber: string
    timestamp: string
    total: string
    vatTotal: string
    invoiceHash: string
    signature: string
    publicKey: string
    certificateSignature: string
    bytes: (n: number) => string
    tags: string
  }
  issuesTitle: string
  warning: string
  issues: Record<ZatcaQrIssueCode, string>
  errors: Record<ZatcaQrDecodeError, string>
  formatOnlyNote: string
  privacyNote: string
  ctaTitle: string
  ctaBody: string
  ctaLink: string
  faqTitle: string
  faq: { question: string; answer: string }[]
}

const ar: QrCopy = {
  seo: {
    title: 'قارئ رمز QR للفاتورة الإلكترونية — فك وفحص مجاني | قافتر',
    description:
      'الصق نص رمز QR أو ارفع صورته لقراءة بيانات الفاتورة الإلكترونية السعودية: البائع والرقم الضريبي والتاريخ والإجمالي والضريبة، وفحص صيغتها. مجاناً.',
  },
  pageName: 'قارئ رمز QR للفاتورة',
  title: 'قارئ رمز QR للفاتورة الإلكترونية السعودية',
  subtitle:
    'اقرأ بيانات رمز QR في فاتورة المرحلة الأولى أو الثانية، وافحص صيغة الحقول قبل إرسال الفاتورة لعميلك أو قبولها من مورّدك.',
  inputLabel: 'نص رمز QR',
  inputHint: 'الصق النص المشفّر بصيغة Base64 الذي يظهر عند مسح الرمز.',
  sample: 'جرّب مثالاً',
  upload: 'ارفع صورة رمز QR',
  uploadHint: 'صورة واضحة للرمز من الفاتورة أو لقطة شاشة.',
  reading: 'جارٍ قراءة الصورة…',
  noQrInImage: 'لم نعثر على رمز QR في الصورة. جرّب صورة أوضح أو قصّ الصورة حول الرمز.',
  clear: 'مسح',
  resultTitle: 'نتيجة القراءة',
  statusOk: 'لا توجد مشكلات في الصيغة',
  statusIssues: (n) => (n === 1 ? 'توجد مشكلة واحدة' : `توجد ${toIndic(n)} مشكلات`),
  phase1: 'المرحلة الأولى',
  phase2: 'المرحلة الثانية',
  phase1Note:
    'يحتوي الرمز على الحقول الخمسة للمرحلة الأولى. فواتير المرحلة الثانية المبسطة تتضمن ٩ حقول تشمل الختم التشفيري.',
  phase2Note:
    'يحتوي الرمز على حقول المرحلة الثانية: بصمة الفاتورة والتوقيع والمفتاح العام. لا يمكن التحقق من التوقيع دون ملف XML الموقّع.',
  fields: {
    sellerName: 'اسم البائع',
    vatNumber: 'الرقم الضريبي',
    timestamp: 'تاريخ ووقت الإصدار',
    total: 'الإجمالي شامل الضريبة',
    vatTotal: 'مبلغ الضريبة',
    invoiceHash: 'بصمة الفاتورة',
    signature: 'التوقيع الرقمي',
    publicKey: 'المفتاح العام',
    certificateSignature: 'توقيع الشهادة',
    bytes: (n) => `${toIndic(n)} بايت`,
    tags: 'الحقول الموجودة',
  },
  issuesTitle: 'ملاحظات الفحص',
  warning: 'تنبيه',
  issues: {
    SELLER_NAME_MISSING: 'اسم البائع (الحقل ١) غير موجود.',
    VAT_NUMBER_MISSING: 'الرقم الضريبي (الحقل ٢) غير موجود.',
    VAT_NUMBER_INVALID: 'الرقم الضريبي يجب أن يكون ١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣.',
    TIMESTAMP_MISSING: 'تاريخ الإصدار (الحقل ٣) غير موجود.',
    TIMESTAMP_DATE_ONLY: 'يحتوي حقل الإصدار على التاريخ فقط دون الوقت؛ المطلوب تاريخ ووقت.',
    TIMESTAMP_INVALID: 'صيغة تاريخ ووقت الإصدار غير صحيحة.',
    TOTAL_MISSING: 'إجمالي الفاتورة (الحقل ٤) غير موجود.',
    TOTAL_INVALID: 'إجمالي الفاتورة يجب أن يكون رقماً فقط، دون عملة أو فواصل آلاف.',
    VAT_TOTAL_MISSING: 'مبلغ الضريبة (الحقل ٥) غير موجود.',
    VAT_TOTAL_INVALID: 'مبلغ الضريبة يجب أن يكون رقماً فقط، دون عملة أو فواصل آلاف.',
    VAT_EXCEEDS_TOTAL: 'مبلغ الضريبة أكبر من إجمالي الفاتورة.',
    VAT_NOT_15:
      'مبلغ الضريبة لا يساوي ١٥٪ من المبلغ قبل الضريبة. قد يكون ذلك صحيحاً إذا تضمنت الفاتورة بنوداً معفاة أو بنسبة صفر.',
    TEXT_NOT_UTF8: 'بعض الحقول ليست نصاً بترميز UTF-8.',
    PHASE2_INCOMPLETE: 'يحتوي الرمز على بعض حقول المرحلة الثانية فقط؛ يجب وجود البصمة والتوقيع والمفتاح العام معاً.',
  },
  errors: {
    EMPTY: 'الصق نص رمز QR أو ارفع صورته.',
    IS_URL: 'هذا رابط وليس رمز QR للفاتورة الإلكترونية. رمز فاتورة زاتكا يحتوي نصاً مشفّراً بصيغة Base64.',
    NOT_BASE64: 'النص ليس بصيغة Base64 صحيحة، لذلك ليس رمز QR لفاتورة إلكترونية.',
    TLV_TRUNCATED: 'النص مقطوع أو ناقص. تأكد من نسخه كاملاً.',
    NOT_ZATCA: 'هذا الرمز لا يحتوي حقول فاتورة زاتكا.',
  },
  formatOnlyNote:
    'تفحص هذه الأداة صيغة الرمز وحقوله فقط، ولا تؤكد أن الفاتورة مسجلة لدى هيئة الزكاة والضريبة والجمارك. للتحقق الرسمي امسح الرمز بتطبيق الهيئة للضريبة (VAT app).',
  privacyNote: 'تتم القراءة داخل متصفحك، ولا تُرسل الصورة أو النص إلى خوادمنا.',
  ctaTitle: 'تحتاج فاتورة برمز QR صحيح؟',
  ctaBody: 'أنشئ فاتورة ضريبية مبسطة أو قياسية برمز QR متوافق مع المرحلة الأولى مجاناً.',
  ctaLink: 'أنشئ فاتورة ضريبية',
  faqTitle: 'أسئلة شائعة عن رمز QR في الفاتورة',
  faq: [
    {
      question: 'ما الذي يحتويه رمز QR في الفاتورة الإلكترونية؟',
      answer:
        'في المرحلة الأولى يحتوي الرمز خمسة حقول: اسم البائع، والرقم الضريبي، وتاريخ ووقت الإصدار، والإجمالي شامل الضريبة، ومبلغ الضريبة. في المرحلة الثانية تتضمن الفاتورة المبسطة ٩ حقول تضيف بصمة الفاتورة والتوقيع الرقمي والمفتاح العام وتوقيع الشهادة.',
    },
    {
      question: 'هل رمز QR إلزامي على كل الفواتير؟',
      answer:
        'في المرحلة الأولى يلزم الرمز على الفاتورة الضريبية المبسطة، ولا يلزم على الفاتورة الضريبية القياسية. في المرحلة الثانية يُنشئ نظام الفوترة لدى المنشأة رمز الفاتورة المبسطة، أما الفاتورة الضريبية بين المنشآت فتُنشئ الهيئة نص رمزها عند اعتمادها (التخليص).',
    },
    {
      question: 'هل تتحقق الأداة من أن الفاتورة مسجلة لدى الهيئة؟',
      answer:
        'لا. الأداة تقرأ الرمز وتفحص صيغة حقوله فقط. للتحقق من الفاتورة استخدم تطبيق الهيئة للضريبة (VAT app) الذي يمسح الرمز ويعرض نتيجة التحقق.',
    },
    {
      question: 'لماذا يظهر تنبيه نسبة الضريبة؟',
      answer:
        'تحسب الأداة ١٥٪ من المبلغ قبل الضريبة وتقارنها بمبلغ الضريبة في الرمز. إذا تضمنت الفاتورة بنوداً معفاة أو بنسبة صفر فقد يختلف المبلغ وتكون الفاتورة صحيحة.',
    },
    {
      question: 'هل تُرفع بيانات فاتورتي إلى خوادم قافتر؟',
      answer: 'لا. تتم قراءة الصورة وفك الرمز داخل متصفحك فقط.',
    },
  ],
}

const en: QrCopy = {
  seo: {
    title: 'ZATCA QR Code Decoder — Read & Check E-Invoice QR | Qaftr',
    description:
      'Paste the QR text or upload a photo to read a Saudi e-invoice QR: seller, VAT number, date, total and VAT, with format checks. Free, runs in your browser.',
  },
  pageName: 'ZATCA QR decoder',
  title: 'ZATCA e-invoice QR code decoder',
  subtitle:
    'Read the QR code on a Phase 1 or Phase 2 Saudi invoice and check its fields before you send an invoice to a customer or accept one from a supplier.',
  inputLabel: 'QR text',
  inputHint: 'Paste the Base64 text you get when you scan the code.',
  sample: 'Try a sample',
  upload: 'Upload a QR image',
  uploadHint: 'A clear photo or screenshot of the code on the invoice.',
  reading: 'Reading the image…',
  noQrInImage: 'No QR code found in the image. Try a sharper photo or crop it around the code.',
  clear: 'Clear',
  resultTitle: 'Result',
  statusOk: 'No format issues found',
  statusIssues: (n) => (n === 1 ? '1 issue found' : `${n} issues found`),
  phase1: 'Phase 1',
  phase2: 'Phase 2',
  phase1Note:
    'The code has the five Phase 1 fields. Phase 2 simplified invoices carry 9 fields, including the cryptographic stamp.',
  phase2Note:
    'The code has the Phase 2 fields: invoice hash, signature and public key. The signature cannot be verified without the signed XML.',
  fields: {
    sellerName: 'Seller name',
    vatNumber: 'VAT number',
    timestamp: 'Issue date and time',
    total: 'Total incl. VAT',
    vatTotal: 'VAT amount',
    invoiceHash: 'Invoice hash',
    signature: 'Digital signature',
    publicKey: 'Public key',
    certificateSignature: 'Certificate signature',
    bytes: (n) => `${n} bytes`,
    tags: 'Fields present',
  },
  issuesTitle: 'Check results',
  warning: 'Warning',
  issues: {
    SELLER_NAME_MISSING: 'Seller name (field 1) is missing.',
    VAT_NUMBER_MISSING: 'VAT number (field 2) is missing.',
    VAT_NUMBER_INVALID: 'The VAT number must be 15 digits, starting and ending with 3.',
    TIMESTAMP_MISSING: 'Issue date (field 3) is missing.',
    TIMESTAMP_DATE_ONLY: 'The issue field has a date only, without the time; a date and time are required.',
    TIMESTAMP_INVALID: 'The issue date and time are not in a valid format.',
    TOTAL_MISSING: 'Invoice total (field 4) is missing.',
    TOTAL_INVALID: 'The invoice total must be a plain number, without a currency or thousands separators.',
    VAT_TOTAL_MISSING: 'VAT amount (field 5) is missing.',
    VAT_TOTAL_INVALID: 'The VAT amount must be a plain number, without a currency or thousands separators.',
    VAT_EXCEEDS_TOTAL: 'The VAT amount is larger than the invoice total.',
    VAT_NOT_15:
      'The VAT amount is not 15% of the net amount. This can be correct if the invoice has exempt or zero-rated items.',
    TEXT_NOT_UTF8: 'Some fields are not UTF-8 text.',
    PHASE2_INCOMPLETE: 'The code has only some Phase 2 fields; the hash, signature and public key must all be present.',
  },
  errors: {
    EMPTY: 'Paste the QR text or upload an image of the code.',
    IS_URL: 'This is a link, not an e-invoice QR code. A ZATCA invoice QR holds Base64 text.',
    NOT_BASE64: 'The text is not valid Base64, so it is not an e-invoice QR code.',
    TLV_TRUNCATED: 'The text is cut off or incomplete. Make sure you copied all of it.',
    NOT_ZATCA: 'This code does not contain ZATCA invoice fields.',
  },
  formatOnlyNote:
    "This tool checks the code's format and fields only. It does not confirm that the invoice is registered with ZATCA. For official verification, scan the code with ZATCA's VAT app.",
  privacyNote: 'Decoding happens in your browser. The image and text are not sent to our servers.',
  ctaTitle: 'Need an invoice with a correct QR code?',
  ctaBody: 'Create a simplified or standard tax invoice with a Phase 1 compliant QR code for free.',
  ctaLink: 'Create a tax invoice',
  faqTitle: 'E-invoice QR code FAQ',
  faq: [
    {
      question: 'What is inside a Saudi e-invoice QR code?',
      answer:
        'In Phase 1 the code holds five fields: seller name, VAT number, issue date and time, total including VAT, and VAT amount. In Phase 2 a simplified invoice carries 9 fields, adding the invoice hash, digital signature, public key and certificate signature.',
    },
    {
      question: 'Is a QR code required on every invoice?',
      answer:
        "In Phase 1 the QR code is required on simplified tax invoices and not on standard tax invoices. In Phase 2 the business's e-invoicing solution generates the QR for simplified invoices, while for B2B tax invoices ZATCA generates the QR string at clearance.",
    },
    {
      question: 'Does this tool confirm the invoice is registered with ZATCA?',
      answer:
        "No. It reads the code and checks the format of its fields. To verify an invoice, use ZATCA's VAT app, which scans the code and shows the verification result.",
    },
    {
      question: 'Why do I see a VAT rate warning?',
      answer:
        'The tool works out 15% of the net amount and compares it with the VAT in the code. If the invoice has exempt or zero-rated items the amounts can differ and the invoice can still be correct.',
    },
    {
      question: 'Is my invoice data uploaded to Qaftr?',
      answer: 'No. The image is read and the code decoded in your browser only.',
    },
  ],
}

/** Arabic-Indic digits for numbers inside Saudi Arabic copy. */
function toIndic(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)))
}

export function getQrCopy(lang: MarketingLang): QrCopy {
  return lang === 'en' ? en : ar
}
