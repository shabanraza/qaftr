import { toArabicIndic } from "#/lib/sa/format";
import type { MarketingLang } from "#/lib/marketing/lang";
import type {
  InstantInvoiceCheckKey,
  InstantInvoiceDraft,
  SaudiInvoiceType,
} from "@zatca/shared";

type InstantInvoiceCopy = {
  sectionTitle: string;
  sectionSubtitle: string;
  disclaimer: string;
  privacyNote: string;
  sellerTitle: string;
  sellerName: string;
  sellerNamePh: string;
  sellerVat: string;
  sellerVatPh: string;
  sellerAddress: string;
  sellerAddressPh: string;
  clientTitle: string;
  clientName: string;
  clientNameOptional: string;
  clientNamePh: string;
  clientVat: string;
  clientVatRequired: string;
  clientAddress: string;
  clientAddressPh: string;
  cashCustomer: string;
  invoiceTypeLabel: string;
  supplyDate: string;
  supplyDateHelp: string;
  supplyAfterIssue: string;
  /** Labels printed on the invoice preview and PDF. */
  pdf: {
    supplyDate: string;
    /** Column headers; the PDF adds the currency, e.g. "(SAR)". */
    lineNet: string;
    vatRate: string;
    vatAmount: string;
    lineInclVat: string;
    /** Small-screen preview only: the tax invoice table scrolls sideways. */
    scrollHint: string;
  };
  invoiceTypes: Record<SaudiInvoiceType, { title: string; hint: string }>;
  suggestStandard: { body: string; action: string };
  result: { title: string; body: string; cta: string; noCard: string; dismiss: string };
  actionsBarLabel: string;
  totalShort: string;
  itemsTitle: string;
  detailsTitle: string;
  itemDescription: string;
  itemQty: string;
  itemPrice: string;
  itemN: (n: number) => string;
  addItem: string;
  removeItem: string;
  notes: string;
  previewTitle: string;
  taxInvoice: string;
  previewIssueDate: string;
  previewVatTrn: string;
  zatcaPhase1: string;
  qrLabel: string;
  previewTo: string;
  previewEmpty: string;
  previewReady: string;
  previewDraft: string;
  previewIncomplete: string;
  previewChecks: Record<InstantInvoiceCheckKey, string>;
  subtotal: string;
  vat: string;
  total: string;
  downloadPdf: string;
  whatsapp: string;
  save: string;
  heroCta: string;
  freeBadge: string;
  previewLoading: string;
  previewError: string;
  errors: Record<string, string>;
  auth: {
    title: string;
    body: string;
    name: string;
    email: string;
    password: string;
    signUp: string;
    signIn: string;
    haveAccount: string;
    noAccount: string;
    continueWithout: string;
    saving: string;
  };
  saved: {
    title: string;
    view: string;
    list: string;
  };
};

const ar: InstantInvoiceCopy = {
  sectionTitle: "أصدر فاتورتك الضريبية مجاناً",
  sectionSubtitle:
    "فاتورة ضريبية للمنشآت أو مبسطة للأفراد، مع رمز QR وفق المرحلة الأولى من زاتكا · PDF · دون تسجيل",
  disclaimer:
    "قافتر أداة مساعدة للفوترة، وغير تابع لهيئة الزكاة والضريبة والجمارك (زاتكا).",
  privacyNote: "لا نحفظ بياناتك على خوادمنا حتى تنشئ حساباً.",
  sellerTitle: "بيانات البائع (منشأتك)",
  sellerName: "الاسم التجاري",
  sellerNamePh: "مثال: مؤسسة قافتر التجارية",
  sellerVat: "الرقم الضريبي",
  sellerVatPh: "300000000000003",
  sellerAddress: "العنوان",
  sellerAddressPh: "المدينة، الحي، الشارع",
  clientTitle: "بيانات المشتري (العميل)",
  clientName: "اسم المشتري",
  clientNameOptional: "اسم المشتري (اختياري)",
  clientNamePh: "اسم الشركة أو الشخص",
  clientVat: "الرقم الضريبي للمشتري (اختياري)",
  clientVatRequired: "الرقم الضريبي للمشتري",
  clientAddress: "عنوان المشتري",
  clientAddressPh: "المدينة، الحي، الشارع",
  cashCustomer: "عميل نقدي",
  invoiceTypeLabel: "نوع الفاتورة",
  supplyDate: "تاريخ التوريد (اختياري)",
  supplyDateHelp: "اتركه فارغاً إذا كان التوريد في يوم إصدار الفاتورة نفسه.",
  supplyAfterIssue: "تاريخ التوريد بعد تاريخ الإصدار (اليوم). تأكد من صحته.",
  pdf: {
    supplyDate: "تاريخ التوريد",
    lineNet: "غير شامل الضريبة",
    vatRate: "نسبة الضريبة",
    vatAmount: "مبلغ الضريبة",
    lineInclVat: "الإجمالي شامل الضريبة",
    scrollHint: "اسحب الجدول أفقياً لعرض كل الأعمدة ←",
  },
  invoiceTypes: {
    simplified: {
      title: "فاتورة ضريبية مبسطة",
      hint: "للبيع للأفراد. بيانات المشتري اختيارية.",
    },
    standard: {
      title: "فاتورة ضريبية",
      hint: "للبيع لمنشأة مسجلة في الضريبة. يلزم اسم المشتري وعنوانه ورقمه الضريبي.",
    },
  },
  suggestStandard: {
    body: "المشتري مسجّل في ضريبة القيمة المضافة؟ الفاتورة الضريبية هي النوع المناسب للبيع بين المنشآت.",
    action: "التحويل إلى فاتورة ضريبية",
  },
  result: {
    title: "تم تنزيل الفاتورة",
    body: "احفظ عملاءك وأصدر فواتير متتالية من مكان واحد — أنشئ حساباً مجاناً.",
    cta: "أنشئ حساباً مجاناً",
    noCard: "بدون بطاقة ائتمان",
    dismiss: "إخفاء",
  },
  actionsBarLabel: "إجراءات الفاتورة",
  totalShort: "الإجمالي شامل الضريبة",
  itemsTitle: "البنود",
  detailsTitle: "تفاصيل إضافية",
  itemDescription: "الوصف",
  itemQty: "الكمية",
  itemPrice: "سعر الوحدة",
  itemN: (n) => `بند ${toArabicIndic(String(n))}`,
  addItem: "إضافة بند",
  removeItem: "حذف",
  notes: "ملاحظات (اختياري)",
  previewTitle: "معاينة الفاتورة",
  taxInvoice: "فاتورة ضريبية مبسطة",
  previewIssueDate: "تاريخ الإصدار",
  previewVatTrn: "الرقم الضريبي",
  zatcaPhase1: "زاتكا · المرحلة الأولى (الإصدار)",
  qrLabel: "رمز الاستجابة السريعة",
  previewTo: "المشتري:",
  previewEmpty: "أضف بنداً لمعاينة الإجمالي",
  previewReady: "جاهزة للتصدير",
  previewDraft: "مسودة",
  previewIncomplete: "أكمل هذه الحقول لتفعيل التنزيل والمشاركة والحفظ",
  previewChecks: {
    sellerName: "الاسم التجاري",
    sellerVat: "رقم ضريبي صحيح (١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣)",
    sellerAddress: "عنوان البائع",
    clientName: "اسم المشتري",
    clientAddress: "عنوان المشتري",
    clientVat: "الرقم الضريبي للمشتري (١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣)",
    lineItems: "بند واحد على الأقل مع السعر",
  },
  subtotal: "الإجمالي غير شامل الضريبة",
  vat: "ضريبة القيمة المضافة ١٥٪",
  total: "الإجمالي شامل الضريبة",
  downloadPdf: "تنزيل PDF",
  whatsapp: "واتساب",
  save: "حفظ الفاتورة",
  heroCta: "أصدر فاتورتك الأولى مجاناً",
  freeBadge: "مجاناً · دون تسجيل للتنزيل",
  previewLoading: "جارٍ تحميل المعاينة…",
  previewError: "تعذّر تحميل المعاينة",
  errors: {
    SELLER_NAME_REQUIRED: "أدخل الاسم التجاري",
    SELLER_VAT_REQUIRED: "أدخل الرقم الضريبي",
    SELLER_VAT_INVALID: "يجب أن يتكوّن الرقم الضريبي من ١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣",
    CLIENT_NAME_REQUIRED: "أدخل اسم المشتري",
    CLIENT_VAT_INVALID: "الرقم الضريبي للمشتري غير صحيح (١٥ رقماً يبدأ بـ ٣ وينتهي بـ ٣)",
    SELLER_ADDRESS_REQUIRED: "أدخل عنوان البائع",
    SUPPLY_DATE_INVALID: "أدخل تاريخ توريد صحيحاً",
    CLIENT_ADDRESS_REQUIRED: "أدخل عنوان المشتري",
    CLIENT_VAT_REQUIRED: "أدخل الرقم الضريبي للمشتري",
    CLIENT_VAT_INVALID_LENGTH: "يجب أن يتكوّن الرقم الضريبي للمشتري من ١٥ رقماً",
    CLIENT_VAT_INVALID_START: "يجب أن يبدأ الرقم الضريبي للمشتري بالرقم ٣",
    CLIENT_VAT_INVALID_END: "يجب أن ينتهي الرقم الضريبي للمشتري بالرقم ٣",
    LINE_ITEMS_REQUIRED: "أضف بنداً واحداً على الأقل",
    LINE_DESCRIPTION_REQUIRED: "أدخل وصف البند",
    LINE_PRICE_REQUIRED: "أدخل سعر البند",
    LINE_QTY_INVALID: "أدخل كمية أكبر من صفر",
    QR_GENERATION_FAILED: "تعذّر إنشاء رمز QR. تحقّق من الرقم الضريبي",
    PDF_EXPORT_FAILED: "تعذّر تصدير PDF. حاول مرة أخرى",
    PDF_RENDER_EMPTY: "تعذّر تصدير PDF لأن المحتوى فارغ",
    PDF_RENDER_TIMEOUT: "استغرق تصدير PDF وقتاً طويلاً. حاول مرة أخرى",
    FREE_INVOICE_LIMIT: "بلغت حد الخطة المجانية (٣ فواتير شهرياً). رقِّ اشتراكك إلى برو.",
    INTERNAL_ERROR: "حدث خطأ. حاول مرة أخرى",
  },
  auth: {
    title: "أنشئ حساباً مجانياً لحفظ فاتورتك",
    body: "نزّل PDF الآن دون حساب، أو أنشئ حساباً لحفظ عملائك وإدارة فواتير منشأتك.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signUp: "إنشاء حساب",
    signIn: "تسجيل الدخول",
    haveAccount: "لديك حساب؟",
    noAccount: "ليس لديك حساب؟",
    continueWithout: "متابعة بدون حفظ",
    saving: "جارٍ الحفظ…",
  },
  saved: {
    title: "تم حفظ الفاتورة",
    view: "عرض الفاتورة",
    list: "فواتيري",
  },
};

const en: InstantInvoiceCopy = {
  sectionTitle: "Create your tax invoice free",
  sectionSubtitle:
    "Tax invoice for businesses (B2B) or simplified for consumers (B2C), with a ZATCA Phase 1 QR code · PDF · no signup",
  disclaimer:
    "Qaftr is an invoicing helper tool and is not affiliated with ZATCA (Zakat, Tax and Customs Authority).",
  privacyNote: "We do not store your data on our servers until you sign up.",
  sellerTitle: "Seller (your business)",
  sellerName: "Trade name",
  sellerNamePh: "e.g. Qaftr Trading Est.",
  sellerVat: "VAT number",
  sellerVatPh: "300000000000003",
  sellerAddress: "Address",
  sellerAddressPh: "City, district, street",
  clientTitle: "Buyer (customer)",
  clientName: "Buyer name",
  clientNameOptional: "Buyer name (optional)",
  clientNamePh: "Company or person name",
  clientVat: "Buyer VAT number (optional)",
  clientVatRequired: "Buyer VAT number",
  clientAddress: "Buyer address",
  clientAddressPh: "City, district, street",
  cashCustomer: "Cash customer",
  invoiceTypeLabel: "Invoice type",
  supplyDate: "Supply date (optional)",
  supplyDateHelp: "Leave empty if the supply happens on the invoice issue date.",
  supplyAfterIssue: "The supply date is after the issue date (today). Check it is correct.",
  pdf: {
    supplyDate: "Supply date",
    lineNet: "Excl. VAT",
    vatRate: "VAT rate",
    vatAmount: "VAT amount",
    lineInclVat: "Total incl. VAT",
    scrollHint: "Swipe the table to see all columns →",
  },
  invoiceTypes: {
    simplified: {
      title: "Simplified tax invoice",
      hint: "For sales to consumers (B2C). Buyer details are optional.",
    },
    standard: {
      title: "Tax invoice",
      hint: "For sales to a VAT-registered business (B2B). Buyer name, address and VAT number are required.",
    },
  },
  suggestStandard: {
    body: "Is the buyer VAT-registered? A tax invoice is the right type for business-to-business sales.",
    action: "Switch to a tax invoice",
  },
  result: {
    title: "Invoice downloaded",
    body: "Save your customers and issue invoices in sequence from one place — create a free account.",
    cta: "Create a free account",
    noCard: "No credit card",
    dismiss: "Dismiss",
  },
  actionsBarLabel: "Invoice actions",
  totalShort: "Total incl. VAT",
  itemsTitle: "Line items",
  detailsTitle: "Additional details",
  itemDescription: "Description",
  itemQty: "Qty",
  itemPrice: "Unit price",
  itemN: (n) => `Item ${n}`,
  addItem: "Add line item",
  removeItem: "Remove",
  notes: "Notes (optional)",
  previewTitle: "Invoice preview",
  taxInvoice: "Simplified tax invoice",
  previewIssueDate: "Issue date",
  previewVatTrn: "VAT number",
  zatcaPhase1: "ZATCA Phase 1 (Generation)",
  qrLabel: "QR code",
  previewTo: "Buyer:",
  previewEmpty: "Add line items to preview totals",
  previewReady: "Ready to export",
  previewDraft: "Draft",
  previewIncomplete: "Complete these fields to enable download, sharing and saving",
  previewChecks: {
    sellerName: "Trade name",
    sellerVat: "Valid VAT number (15 digits, starts and ends with 3)",
    sellerAddress: "Seller address",
    clientName: "Buyer name",
    clientAddress: "Buyer address",
    clientVat: "Buyer VAT number (15 digits, starts and ends with 3)",
    lineItems: "At least one line item with price",
  },
  subtotal: "Total excl. VAT",
  vat: "VAT 15%",
  total: "Total incl. VAT",
  downloadPdf: "Download PDF",
  whatsapp: "WhatsApp",
  save: "Save invoice",
  heroCta: "Create your first invoice free",
  freeBadge: "Free · no signup to export",
  previewLoading: "Loading preview…",
  previewError: "Could not load preview",
  errors: {
    SELLER_NAME_REQUIRED: "Enter your trade name",
    SELLER_VAT_REQUIRED: "Enter your VAT number",
    SELLER_VAT_INVALID: "The VAT number must be 15 digits, starting and ending with 3",
    CLIENT_NAME_REQUIRED: "Enter the buyer name",
    CLIENT_VAT_INVALID: "The buyer VAT number is not valid (15 digits, starts and ends with 3)",
    SELLER_ADDRESS_REQUIRED: "Enter the seller address",
    SUPPLY_DATE_INVALID: "Enter a valid supply date",
    CLIENT_ADDRESS_REQUIRED: "Enter the buyer address",
    CLIENT_VAT_REQUIRED: "Enter the buyer VAT number",
    CLIENT_VAT_INVALID_LENGTH: "The buyer VAT number must be 15 digits",
    CLIENT_VAT_INVALID_START: "The buyer VAT number must start with 3",
    CLIENT_VAT_INVALID_END: "The buyer VAT number must end with 3",
    LINE_ITEMS_REQUIRED: "Add at least one line item",
    LINE_DESCRIPTION_REQUIRED: "Enter item description",
    LINE_PRICE_REQUIRED: "Enter item price",
    LINE_QTY_INVALID: "Enter a quantity greater than zero",
    QR_GENERATION_FAILED: "Could not generate QR code — check your VAT number",
    PDF_EXPORT_FAILED: "PDF export failed — please try again",
    PDF_RENDER_EMPTY: "PDF export failed — empty content",
    PDF_RENDER_TIMEOUT: "PDF export timed out — please try again",
    FREE_INVOICE_LIMIT: "You have reached the free plan limit (3 invoices a month). Upgrade to Pro.",
    INTERNAL_ERROR: "Something went wrong — please try again",
  },
  auth: {
    title: "Sign up free to save your invoice",
    body: "Download the PDF without an account, or create one to save customers and manage your business invoices.",
    name: "Name",
    email: "Email",
    password: "Password",
    signUp: "Create account",
    signIn: "Sign in",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    continueWithout: "Continue without saving",
    saving: "Saving…",
  },
  saved: {
    title: "Invoice saved",
    view: "View invoice",
    list: "My invoices",
  },
};

export function getInstantInvoiceCopy(lang: MarketingLang): InstantInvoiceCopy {
  return lang === "en" ? en : ar;
}

/** @deprecated use getInstantInvoiceCopy(lang) */
export const instantInvoiceCopy = ar;

export function fieldError(lang: MarketingLang, code: string | undefined): string | undefined {
  if (!code) return undefined;
  const copy = getInstantInvoiceCopy(lang);
  return copy.errors[code] ?? code;
}

export function formatMoney(value: string | number, lang: MarketingLang = "ar", currency?: string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  const curr = currency ?? (lang === "en" ? "SAR" : "ر.س");
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  if (Number.isNaN(n) || n === null || n === undefined) return `0.00 ${curr}`;
  return `${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
}

export type { InstantInvoiceDraft, InstantInvoiceCopy };
