import { toArabicIndic } from "#/lib/sa/format";
import type { MarketingLang } from "#/lib/marketing/lang";

export type ToolId =
  | "fatora"
  | "vat-calculator"
  | "trn-checker"
  | "zatca-wave-checker"
  | "quotation"
  | "receipt-voucher"
  | "credit-note";

export type ToolDefinition = {
  id: ToolId;
  href: `/tools/${string}`;
  accent: "green" | "gold" | "sage";
  live: boolean;
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { id: "fatora", href: "/tools/fatora", accent: "green", live: true },
  { id: "vat-calculator", href: "/tools/vat-calculator", accent: "gold", live: true },
  { id: "trn-checker", href: "/tools/trn-checker", accent: "sage", live: true },
  { id: "zatca-wave-checker", href: "/tools/zatca-wave-checker", accent: "gold", live: true },
  { id: "quotation", href: "/tools/quotation", accent: "green", live: true },
  { id: "receipt-voucher", href: "/tools/receipt-voucher", accent: "sage", live: true },
  { id: "credit-note", href: "/tools/credit-note", accent: "gold", live: true },
];

type ToolCopyEntry = {
  title: string;
  subtitle: string;
  badge: string;
  keywords: string;
};

type SeoEntry = { title: string; description: string };

type ToolsCopy = {
  /** <title>/meta description for /tools and each Saudi tool page. */
  seo: Record<"hub" | "fatora" | "vat-calculator" | "trn-checker", SeoEntry>;
  hub: {
    title: string;
    subtitle: string;
    breadcrumb: string;
    liveBadge: string;
    cta: string;
  };
  breadcrumbRoot: string;
  tools: Record<ToolId, ToolCopyEntry>;
  vatCalculator: {
    amountLabel: string;
    amountPlaceholder: string;
    modeLabel: string;
    modeExclusive: string;
    modeInclusive: string;
    rateNote: string;
    /** Badge above the calculator. */
    rateChip: string;
    resultsTitle: string;
    subtotal: string;
    vat: string;
    total: string;
    emptyHint: string;
    tooLargeHint: string;
    createInvoice: string;
    faqTitle: string;
    faq: { question: string; answer: string }[];
  };
  trnChecker: {
    inputLabel: string;
    inputPlaceholder: string;
    inputHint: string;
    statusValid: string;
    statusInvalid: string;
    statusEmpty: string;
    normalizedLabel: string;
    rulesTitle: string;
    rules: {
      length: string;
      start: string;
      end: string;
    };
    createInvoice: string;
    faqTitle: string;
    faq: { question: string; answer: string }[];
  };
  disclaimer: string;
};

const toolsCopyAr: ToolsCopy = {
  seo: {
    hub: {
      title: "أدوات فوترة مجانية للمنشآت في السعودية | قافتر",
      description:
        "أدوات مجانية لمنشأتك: حاسبة ضريبة القيمة المضافة ١٥٪، والتحقق من الرقم الضريبي، وإصدار فاتورة ضريبية مبسطة مع رمز QR. بالعربية والإنجليزية، دون تسجيل.",
    },
    fatora: {
      title: "فاتورة ضريبية ومبسطة مجانية مع QR زاتكا | قافتر",
      description:
        "أصدر فاتورة ضريبية أو مبسطة لمنشأتك مع رمز QR وفق المرحلة الأولى من زاتكا، وضريبة ١٥٪، وتنزيل PDF. مجاناً ودون تسجيل.",
    },
    "vat-calculator": {
      title: "حاسبة ضريبة القيمة المضافة ١٥٪ في السعودية | قافتر",
      description:
        "احسب ضريبة القيمة المضافة ١٥٪ بالريال: أضفها إلى المبلغ أو استخرجها من الإجمالي شامل الضريبة. أداة مجانية للفواتير وعروض الأسعار.",
    },
    "trn-checker": {
      title: "التحقق من الرقم الضريبي السعودي | قافتر",
      description:
        "تحقّق مجاناً من صيغة الرقم الضريبي السعودي: ١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣، قبل إصدار الفاتورة الضريبية. فحص للصيغة فقط.",
    },
  },
  hub: {
    title: "أدوات فوترة مجانية للمنشآت في السعودية",
    subtitle:
      "حاسبات وأدوات تحقق سريعة بالعربية لضريبة القيمة المضافة ١٥٪ والفاتورة الضريبية وفق المرحلة الأولى من زاتكا. دون تسجيل.",
    breadcrumb: "أدوات مجانية",
    liveBadge: "متاح الآن",
    cta: "افتح الأداة",
  },
  breadcrumbRoot: "أدوات مجانية",
  tools: {
    fatora: {
      title: "فاتورة ضريبية أو مبسطة مجاناً",
      subtitle:
        "أصدر فاتورة ضريبية للمنشآت أو فاتورة ضريبية مبسطة للأفراد، مع رمز QR وملف PDF، مجاناً ودون حساب.",
      badge: "الأكثر طلباً",
      keywords: "فاتورة ضريبية · QR · PDF",
    },
    "vat-calculator": {
      title: "حاسبة ضريبة القيمة المضافة ١٥٪",
      subtitle: "احسب الضريبة على المبلغ غير شامل الضريبة أو استخرجها من الإجمالي شامل الضريبة.",
      badge: "حاسبة",
      keywords: "ضريبة ١٥٪ · VAT · ريال",
    },
    "trn-checker": {
      title: "التحقق من الرقم الضريبي",
      subtitle: "تأكد أن الرقم الضريبي مكوّن من ١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣ قبل إصدار الفاتورة.",
      badge: "تحقق",
      keywords: "الرقم الضريبي · ضريبة القيمة المضافة · زاتكا",
    },
    "zatca-wave-checker": {
      title: "هل منشأتك ضمن الموجة ٢٥؟",
      subtitle: "قدّر موجتك في المرحلة الثانية (الموجة ٢٣ أو ٢٤ أو ٢٥)، وموعد الربط، والأيام المتبقية.",
      badge: "جديد",
      keywords: "الموجة ٢٥ · المرحلة الثانية · فاتورة",
    },
    quotation: {
      title: "عرض سعر مع الضريبة",
      subtitle: "جهّز عرض سعر بضريبة ١٥٪ وتاريخ صلاحية، ثم حوّله إلى فاتورة ضريبية عند القبول.",
      badge: "جديد",
      keywords: "عرض سعر · نموذج عرض سعر · PDF",
    },
    "receipt-voucher": {
      title: "سند قبض PDF",
      subtitle: "أصدر سند قبض مع المبلغ كتابةً وطريقة الدفع وسطر توقيع المستلم.",
      badge: "جديد",
      keywords: "سند قبض · نموذج سند قبض pdf · المبلغ كتابةً",
    },
    "credit-note": {
      title: "إشعار دائن",
      subtitle: "أصدر إشعاراً دائناً مرتبطاً بالفاتورة الضريبية الأصلية مع سبب الإصدار والضريبة.",
      badge: "جديد",
      keywords: "إشعار دائن · مرتجع · خصم لاحق",
    },
  },
  vatCalculator: {
    amountLabel: "المبلغ (ر.س)",
    amountPlaceholder: "مثال: 5000",
    modeLabel: "طريقة الحساب",
    modeExclusive: "غير شامل الضريبة",
    modeInclusive: "شامل الضريبة",
    rateNote: "النسبة الأساسية لضريبة القيمة المضافة في السعودية ١٥٪.",
    rateChip: "ضريبة ١٥٪",
    resultsTitle: "النتيجة",
    subtotal: "المبلغ غير شامل الضريبة",
    vat: "ضريبة القيمة المضافة ١٥٪",
    total: "الإجمالي شامل الضريبة",
    emptyHint: "أدخل مبلغاً لعرض الحساب.",
    tooLargeHint: "المبلغ كبير جداً، والحد الأقصى تريليون ريال.",
    createInvoice: "أصدر فاتورة بهذا المبلغ",
    faqTitle: "أسئلة شائعة — حاسبة الضريبة",
    faq: [
      {
        question: "ما الفرق بين «غير شامل الضريبة» و«شامل الضريبة»؟",
        answer:
          "«غير شامل الضريبة» يضيف ١٥٪ إلى المبلغ الذي أدخلته. «شامل الضريبة» يعدّ المبلغ متضمناً الضريبة فيستخرج منه الصافي ومبلغ الضريبة.",
      },
      {
        question: "هل هذه الحاسبة رسمية من زاتكا؟",
        answer: "لا. هي أداة مساعدة من قافتر للمنشآت والمستقلين، فراجع محاسبك بشأن التزاماتك الضريبية.",
      },
    ],
  },
  trnChecker: {
    inputLabel: "الرقم الضريبي",
    inputPlaceholder: "300000000000003",
    inputHint: "١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣",
    statusValid: "صيغة الرقم الضريبي صحيحة",
    statusInvalid: "صيغة الرقم الضريبي غير صحيحة",
    statusEmpty: "أدخل الرقم للتحقق",
    normalizedLabel: "الرقم بعد التنسيق",
    rulesTitle: "شروط صيغة الرقم الضريبي في السعودية",
    rules: {
      length: "١٥ رقماً بالضبط",
      start: "يبدأ بالرقم ٣",
      end: "ينتهي بالرقم ٣",
    },
    createInvoice: "أصدر فاتورة بهذا الرقم",
    faqTitle: "أسئلة شائعة عن الرقم الضريبي",
    faq: [
      {
        question: "ما هو الرقم الضريبي في السعودية؟",
        answer:
          "هو رقم التسجيل في ضريبة القيمة المضافة الذي تصدره هيئة الزكاة والضريبة والجمارك للمنشأة المسجلة، ويُكتب على الفاتورة الضريبية. يسمّيه بعضهم TRN، لكن زاتكا تستخدم «الرقم الضريبي» (VAT number).",
      },
      {
        question: "هل يعني التحقق أن الرقم مسجّل فعلاً؟",
        answer: "لا. نتحقق من الصيغة فقط، أما التحقق الرسمي من التسجيل فيتم عبر خدمات زاتكا الإلكترونية أو محاسبك.",
      },
    ],
  },
  disclaimer: "أدوات مساعدة غير تابعة لهيئة الزكاة والضريبة والجمارك. استشر محاسبك بشأن التزاماتك الضريبية.",
};

const toolsCopyEn: ToolsCopy = {
  seo: {
    hub: {
      title: "Free Invoicing Tools for Saudi Businesses | Qaftr",
      description:
        "Free tools for your business: 15% VAT calculator, Saudi VAT number checker and a simplified tax invoice generator with QR code. No signup.",
    },
    fatora: {
      title: "Free Saudi Tax Invoice & Simplified Invoice | Qaftr",
      description:
        "Issue a tax invoice (B2B) or a simplified tax invoice (B2C) with a ZATCA Phase 1 QR code, 15% VAT and PDF download. Free, no signup.",
    },
    "vat-calculator": {
      title: "Saudi 15% VAT Calculator — Add or Remove VAT | Qaftr",
      description:
        "Calculate Saudi 15% VAT in SAR: add VAT to a net amount or extract it from a VAT-inclusive total. A free helper for invoices and quotes.",
    },
    "trn-checker": {
      title: "Saudi VAT Number Checker — 15-Digit Format | Qaftr",
      description:
        "Free check of the Saudi VAT number format: 15 digits, starting and ending with 3, before you issue a tax invoice. Format check only.",
    },
  },
  hub: {
    title: "Free invoicing tools for Saudi businesses",
    subtitle:
      "Fast calculators and checkers for 15% VAT and ZATCA Phase 1 tax invoices. No signup required.",
    breadcrumb: "Free tools",
    liveBadge: "Live now",
    cta: "Open tool",
  },
  breadcrumbRoot: "Free tools",
  tools: {
    fatora: {
      title: "Free tax invoice or simplified invoice",
      subtitle:
        "Issue a tax invoice for businesses (B2B) or a simplified tax invoice for consumers (B2C), with a QR code and PDF, free and without an account.",
      badge: "Most popular",
      keywords: "Tax invoice · QR · PDF",
    },
    "vat-calculator": {
      title: "15% VAT calculator",
      subtitle: "Add VAT to a net amount or extract it from a VAT-inclusive total, for invoices and quotes.",
      badge: "Calculator",
      keywords: "15% VAT · SAR · KSA",
    },
    "trn-checker": {
      title: "VAT number checker",
      subtitle: "Check that a Saudi VAT number has 15 digits and starts and ends with 3 before you invoice.",
      badge: "Checker",
      keywords: "VAT number · ZATCA · KSA",
    },
    "zatca-wave-checker": {
      title: "Is your business in ZATCA Wave 25?",
      subtitle: "Estimate your Phase 2 wave (23, 24 or 25), integration deadline and days remaining.",
      badge: "New",
      keywords: "Wave 25 · Phase 2 · FATOORA",
    },
    quotation: {
      title: "Quotation with VAT",
      subtitle: "Prepare a quotation with 15% VAT and a validity date, then convert it into a tax invoice once accepted.",
      badge: "New",
      keywords: "Quotation · Quote template · PDF",
    },
    "receipt-voucher": {
      title: "Receipt voucher (PDF)",
      subtitle: "Issue a receipt voucher with the amount in words, payment method and a receiver signature line.",
      badge: "New",
      keywords: "Receipt voucher · Amount in words · PDF",
    },
    "credit-note": {
      title: "Credit note",
      subtitle: "Issue a credit note linked to the original tax invoice, with the reason and the VAT adjustment.",
      badge: "New",
      keywords: "Credit note · Returns · Later discount",
    },
  },
  vatCalculator: {
    amountLabel: "Amount (SAR)",
    amountPlaceholder: "e.g. 5000",
    modeLabel: "Calculation mode",
    modeExclusive: "VAT exclusive",
    modeInclusive: "VAT inclusive",
    rateNote: "Saudi Arabia standard VAT rate: 15%",
    rateChip: "15% VAT",
    resultsTitle: "Result",
    subtotal: "Subtotal (excl. VAT)",
    vat: "VAT 15%",
    total: "Total incl. VAT",
    emptyHint: "Enter an amount to calculate.",
    tooLargeHint: "That amount is too large — the maximum is SAR 1 trillion (1,000,000,000,000).",
    createInvoice: "Create an invoice with this amount",
    faqTitle: "FAQ — VAT calculator",
    faq: [
      {
        question: "What is the difference between VAT exclusive and VAT inclusive?",
        answer:
          "VAT exclusive adds 15% on top of your amount. VAT inclusive treats your amount as already including VAT and extracts the net amount and the VAT.",
      },
      {
        question: "Is this an official ZATCA calculator?",
        answer: "No. It is a Qaftr helper tool for businesses and freelancers. Consult your accountant about your tax obligations.",
      },
    ],
  },
  trnChecker: {
    inputLabel: "VAT number",
    inputPlaceholder: "300000000000003",
    inputHint: "15 digits, starting and ending with 3",
    statusValid: "Valid VAT number format",
    statusInvalid: "Invalid VAT number format",
    statusEmpty: "Enter a number to check",
    normalizedLabel: "Normalized number",
    rulesTitle: "Saudi VAT number format",
    rules: {
      length: "Exactly 15 digits",
      start: "Starts with 3",
      end: "Ends with 3",
    },
    createInvoice: "Create an invoice with this VAT number",
    faqTitle: "Saudi VAT number — FAQ",
    faq: [
      {
        question: "What is a Saudi VAT number?",
        answer:
          "The VAT registration number ZATCA issues to a VAT-registered business. It must appear on tax invoices. Some people call it a TRN, but ZATCA uses “VAT number”.",
      },
      {
        question: "Does a valid format mean the number is registered?",
        answer: "No. We only check the format. Confirm registration through ZATCA’s e-services or your accountant.",
      },
    ],
  },
  disclaimer: "Helper tools, not affiliated with ZATCA. Consult your accountant about tax compliance.",
};

export function getToolsCopy(lang: MarketingLang): ToolsCopy {
  return lang === "en" ? toolsCopyEn : toolsCopyAr;
}

/** "1,150.58 SAR" in English; "١٬١٥٠٫٥٨ ر.س" in Saudi Arabic. */
export function formatToolMoney(value: string, lang: MarketingLang) {
  const amount = parseFloat(value);
  if (Number.isNaN(amount)) return value;
  const text = amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return lang === "en" ? `${text} SAR` : `${toArabicIndic(text)} ر.س`;
}
