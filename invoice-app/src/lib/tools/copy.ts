import type { MarketingLang } from "#/lib/marketing/lang";

export type ToolId = "fatora" | "vat-calculator" | "trn-checker";

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
];

type ToolCopyEntry = {
  title: string;
  subtitle: string;
  badge: string;
  keywords: string;
};

type ToolsCopy = {
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
    resultsTitle: string;
    subtotal: string;
    vat: string;
    total: string;
    emptyHint: string;
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
  hub: {
    title: "أدوات مجانية للفوترة السعودية",
    subtitle:
      "حاسبات ومدققات سريعة بالعربية — متوافقة مع ضريبة 15٪ ومتطلبات زاتكا المرحلة الأولى. بدون تسجيل.",
    breadcrumb: "أدوات مجانية",
    liveBadge: "متاح الآن",
    cta: "افتح الأداة",
  },
  breadcrumbRoot: "أدوات مجانية",
  tools: {
    fatora: {
      title: "فاتورة ضريبية مبسطة",
      subtitle: "أنشئ فاتورة مع QR زاتكا وPDF — مجاناً بدون حساب.",
      badge: "الأكثر طلباً",
      keywords: "فاتورة ضريبية · QR · PDF",
    },
    "vat-calculator": {
      title: "حاسبة ضريبة 15٪",
      subtitle: "احسب ضريبة القيمة المضافة قبل أو بعد الإجمالي — للفواتير السعودية.",
      badge: "حاسبة",
      keywords: "ضريبة 15٪ · VAT · SAR",
    },
    "trn-checker": {
      title: "التحقق من الرقم الضريبي",
      subtitle: "تأكد أن TRN مكوّن من 15 رقمًا ويبدأ وينتهي بـ 3 قبل إصدار الفاتورة.",
      badge: "مدقق",
      keywords: "TRN · الرقم الضريبي · زاتكا",
    },
  },
  vatCalculator: {
    amountLabel: "المبلغ (SAR)",
    amountPlaceholder: "مثال: 5000",
    modeLabel: "طريقة الحساب",
    modeExclusive: "قبل الضريبة",
    modeInclusive: "شامل الضريبة",
    rateNote: "نسبة ضريبة القيمة المضافة في السعودية: 15٪",
    resultsTitle: "النتيجة",
    subtotal: "المبلغ قبل الضريبة",
    vat: "ضريبة 15٪",
    total: "الإجمالي",
    emptyHint: "أدخل مبلغاً لعرض الحساب.",
    createInvoice: "أنشئ فاتورة بهذا المبلغ",
    faqTitle: "أسئلة شائعة — حاسبة الضريبة",
    faq: [
      {
        question: "ما الفرق بين قبل الضريبة وشامل الضريبة؟",
        answer:
          "«قبل الضريبة» يضيف 15٪ فوق المبلغ. «شامل الضريبة» يفترض أن المبلغ الذي أدخلته يحتوي الضريبة ويستخرجها.",
      },
      {
        question: "هل هذه الحاسبة رسمية من زاتكا؟",
        answer: "لا — أداة مساعدة من قافتر للمستقلين. راجع محاسبك للالتزامات الضريبية.",
      },
    ],
  },
  trnChecker: {
    inputLabel: "الرقم الضريبي (TRN)",
    inputPlaceholder: "300000000000003",
    inputHint: "15 رقمًا — يبدأ وينتهي بـ 3",
    statusValid: "رقم ضريبي صالح",
    statusInvalid: "رقم غير صالح",
    statusEmpty: "أدخل الرقم للتحقق",
    normalizedLabel: "الصيغة المعيارية",
    rulesTitle: "قواعد TRN في السعودية",
    rules: {
      length: "15 رقمًا بالضبط",
      start: "يبدأ بالرقم 3",
      end: "ينتهي بالرقم 3",
    },
    createInvoice: "أنشئ فاتورة بهذا الرقم",
    faqTitle: "أسئلة شائعة — TRN",
    faq: [
      {
        question: "ما هو TRN؟",
        answer:
          "الرقم الضريبي (Tax Registration Number) للمنشأة المسجلة في ضريبة القيمة المضافة بالسعودية.",
      },
      {
        question: "هل التحقق يعني أن الرقم مسجل فعلاً؟",
        answer: "لا — نتحقق من الشكل فقط. التحقق الرسمي يتم عبر بوابات زاتكا أو محاسبك.",
      },
    ],
  },
  disclaimer: "أدوات مساعدة — غير تابعة لزاتكا. استشر محاسبك للالتزامات الضريبية.",
};

const toolsCopyEn: ToolsCopy = {
  hub: {
    title: "Free Saudi invoicing tools",
    subtitle:
      "Fast calculators and checkers for 15% VAT and ZATCA Phase 1 workflows. No signup required.",
    breadcrumb: "Free tools",
    liveBadge: "Live now",
    cta: "Open tool",
  },
  breadcrumbRoot: "Free tools",
  tools: {
    fatora: {
      title: "Simplified tax invoice",
      subtitle: "Create a ZATCA QR invoice with PDF export — free, no account.",
      badge: "Most popular",
      keywords: "Tax invoice · QR · PDF",
    },
    "vat-calculator": {
      title: "15% VAT calculator",
      subtitle: "Compute Saudi VAT before or after total — for invoices and quotes.",
      badge: "Calculator",
      keywords: "15% VAT · SAR · KSA",
    },
    "trn-checker": {
      title: "TRN format checker",
      subtitle: "Verify a 15-digit VAT number starts and ends with 3 before invoicing.",
      badge: "Checker",
      keywords: "TRN · VAT number · ZATCA",
    },
  },
  vatCalculator: {
    amountLabel: "Amount (SAR)",
    amountPlaceholder: "e.g. 5000",
    modeLabel: "Calculation mode",
    modeExclusive: "Before VAT",
    modeInclusive: "VAT inclusive",
    rateNote: "Saudi Arabia standard VAT rate: 15%",
    resultsTitle: "Result",
    subtotal: "Subtotal (excl. VAT)",
    vat: "VAT 15%",
    total: "Total",
    emptyHint: "Enter an amount to calculate.",
    createInvoice: "Create an invoice with this amount",
    faqTitle: "FAQ — VAT calculator",
    faq: [
      {
        question: "What is the difference between before VAT and VAT inclusive?",
        answer:
          "Before VAT adds 15% on top. VAT inclusive assumes your amount already includes tax and extracts the net and VAT portions.",
      },
      {
        question: "Is this an official ZATCA calculator?",
        answer: "No — a Qaftr helper tool for freelancers. Consult your accountant for tax obligations.",
      },
    ],
  },
  trnChecker: {
    inputLabel: "VAT registration (TRN)",
    inputPlaceholder: "300000000000003",
    inputHint: "15 digits — starts and ends with 3",
    statusValid: "Valid TRN format",
    statusInvalid: "Invalid TRN format",
    statusEmpty: "Enter a number to validate",
    normalizedLabel: "Normalized format",
    rulesTitle: "Saudi TRN rules",
    rules: {
      length: "Exactly 15 digits",
      start: "Starts with 3",
      end: "Ends with 3",
    },
    createInvoice: "Create an invoice with this TRN",
    faqTitle: "FAQ — TRN checker",
    faq: [
      {
        question: "What is a TRN?",
        answer:
          "Tax Registration Number for a business registered for VAT in Saudi Arabia.",
      },
      {
        question: "Does format validation mean the number is registered?",
        answer: "No — we only check format. Official verification is via ZATCA or your accountant.",
      },
    ],
  },
  disclaimer: "Helper tools — not affiliated with ZATCA. Consult your accountant for tax compliance.",
};

export function getToolsCopy(lang: MarketingLang): ToolsCopy {
  return lang === "en" ? toolsCopyEn : toolsCopyAr;
}

export function formatToolMoney(value: string, lang: MarketingLang, currency = "SAR") {
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  const amount = parseFloat(value);
  if (Number.isNaN(amount)) return value;
  return `${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
