import type { MarketingLang } from "#/lib/marketing/lang";
import type { InstantInvoiceDraft } from "@zatca/shared";

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
  clientTitle: string;
  clientName: string;
  clientNamePh: string;
  clientVat: string;
  itemsTitle: string;
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
  previewIncomplete: string;
  previewChecks: {
    sellerName: string;
    sellerVat: string;
    clientName: string;
    lineItems: string;
  };
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
  sectionTitle: "أنشئ فاتورة ضريبية مبسطة مجاناً",
  sectionSubtitle: "برنامج فواتير مجاني — QR زاتكا · PDF · بدون تسجيل",
  disclaimer:
    "قافتر أداة مساعدة للفوترة — غير تابع لزاتكا (الهيئة العامة للزakat والضريبة والجمارك).",
  privacyNote: "لا نحفظ بياناتك على الخادم حتى تسجّل.",
  sellerTitle: "بيانات نشاطك",
  sellerName: "اسم النشاط",
  sellerNamePh: "مثال: قافتر للتصميم",
  sellerVat: "الرقم الضريبي",
  sellerVatPh: "300000000000003",
  sellerAddress: "العنوان (اختياري)",
  clientTitle: "بيانات العميل",
  clientName: "اسم العميل",
  clientNamePh: "اسم العميل أو الشركة",
  clientVat: "رقم ضريبي للعميل (اختياري)",
  itemsTitle: "البنود",
  itemDescription: "الوصف",
  itemQty: "الكمية",
  itemPrice: "سعر الوحدة",
  itemN: (n) => `بند ${n}`,
  addItem: "إضافة بند",
  removeItem: "حذف",
  notes: "ملاحظات (اختياري)",
  previewTitle: "معاينة الفاتورة",
  taxInvoice: "فاتورة ضريبية مبسطة",
  previewIssueDate: "تاريخ الإصدار",
  previewVatTrn: "الرقم الضريبي",
  zatcaPhase1: "زاتكا — المرحلة الأولى",
  qrLabel: "رمز الاستجابة السريعة",
  previewTo: "إلى:",
  previewEmpty: "أضف بنوداً لمعاينة الإجمالي",
  previewReady: "جاهزة للتصدير",
  previewIncomplete: "أكمل الحقول التالية لتفعيل PDF وواتساب والحفظ",
  previewChecks: {
    sellerName: "اسم النشاط",
    sellerVat: "رقم ضريبي صحيح (15 رقمًا، يبدأ وينتهي بـ 3)",
    clientName: "اسم العميل",
    lineItems: "بند واحد على الأقل مع السعر",
  },
  subtotal: "المجموع قبل الضريبة",
  vat: "ضريبة 15%",
  total: "الإجمالي",
  downloadPdf: "تحميل PDF",
  whatsapp: "واتساب",
  save: "حفظ الفاتورة",
  heroCta: "أنشئ فاتورة الآن",
  freeBadge: "مجاني · بدون تسجيل للتصدير",
  previewLoading: "جاري تحميل المعاينة…",
  previewError: "تعذّر تحميل المعاينة",
  errors: {
    SELLER_NAME_REQUIRED: "أدخل اسم النشاط",
    SELLER_VAT_REQUIRED: "أدخل الرقم الضريبي",
    SELLER_VAT_INVALID: "الرقم الضريبي يجب أن يكون 15 رقمًا ويبدأ وينتهي بـ 3",
    CLIENT_NAME_REQUIRED: "أدخل اسم العميل",
    CLIENT_VAT_INVALID: "رقم ضريبي العميل غير صحيح (15 رقمًا، يبدأ وينتهي بـ 3)",
    LINE_ITEMS_REQUIRED: "أضف بندًا واحدًا على الأقل",
    LINE_DESCRIPTION_REQUIRED: "أدخل وصف البند",
    LINE_PRICE_REQUIRED: "أدخل سعر البند",
    LINE_QTY_INVALID: "أدخل كمية أكبر من صفر",
    QR_GENERATION_FAILED: "تعذّر إنشاء رمز QR — تحقق من الرقم الضريبي",
    PDF_EXPORT_FAILED: "تعذّر تصدير PDF — حاول مرة أخرى",
    PDF_RENDER_EMPTY: "تعذّر تصدير PDF — المحتوى فارغ",
    PDF_RENDER_TIMEOUT: "استغرق تصدير PDF وقتاً طويلاً — حاول مرة أخرى",
    FREE_INVOICE_LIMIT: "وصلت للحد المجاني — ٣ فواتير شهرياً. ترقّ للبرو.",
    INTERNAL_ERROR: "حدث خطأ — حاول مرة أخرى",
  },
  auth: {
    title: "سجّل مجاناً لحفظ فاتورتك",
    body: "حمّل PDF الآن بدون حساب — أو أنشئ حساباً لإدارة فواتيرك.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signUp: "إنشاء حساب",
    signIn: "تسجيل الدخول",
    haveAccount: "لديك حساب؟",
    noAccount: "ليس لديك حساب؟",
    continueWithout: "متابعة بدون حفظ",
    saving: "جاري الحفظ…",
  },
  saved: {
    title: "تم حفظ الفاتورة",
    view: "عرض الفاتورة",
    list: "فواتيري",
  },
};

const en: InstantInvoiceCopy = {
  sectionTitle: "Create a simplified tax invoice for free",
  sectionSubtitle: "Free invoicing tool — ZATCA QR · PDF · no signup required",
  disclaimer:
    "Qaftr is a helper tool for invoicing — not affiliated with ZATCA (Zakat, Tax and Customs Authority).",
  privacyNote: "We do not store your data on our servers until you sign up.",
  sellerTitle: "Your business",
  sellerName: "Business name",
  sellerNamePh: "e.g. Qaftr Design",
  sellerVat: "VAT number (TRN)",
  sellerVatPh: "300000000000003",
  sellerAddress: "Address (optional)",
  clientTitle: "Client",
  clientName: "Client name",
  clientNamePh: "Client or company name",
  clientVat: "Client VAT (optional)",
  itemsTitle: "Line items",
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
  previewVatTrn: "VAT registration (TRN)",
  zatcaPhase1: "ZATCA Phase 1",
  qrLabel: "QR code",
  previewTo: "To:",
  previewEmpty: "Add line items to preview totals",
  previewReady: "Ready to export",
  previewIncomplete: "Complete the checks below to enable PDF, WhatsApp, and save",
  previewChecks: {
    sellerName: "Business name",
    sellerVat: "Valid VAT (15 digits, starts & ends with 3)",
    clientName: "Client name",
    lineItems: "At least one line item with price",
  },
  subtotal: "Subtotal",
  vat: "VAT 15%",
  total: "Total",
  downloadPdf: "Download PDF",
  whatsapp: "WhatsApp",
  save: "Save invoice",
  heroCta: "Create invoice now",
  freeBadge: "Free · no signup to export",
  previewLoading: "Loading preview…",
  previewError: "Could not load preview",
  errors: {
    SELLER_NAME_REQUIRED: "Enter your business name",
    SELLER_VAT_REQUIRED: "Enter your VAT number",
    SELLER_VAT_INVALID: "VAT must be 15 digits, starting and ending with 3",
    CLIENT_NAME_REQUIRED: "Enter client name",
    CLIENT_VAT_INVALID: "Client VAT is invalid (15 digits, starts & ends with 3)",
    LINE_ITEMS_REQUIRED: "Add at least one line item",
    LINE_DESCRIPTION_REQUIRED: "Enter item description",
    LINE_PRICE_REQUIRED: "Enter item price",
    LINE_QTY_INVALID: "Enter a quantity greater than zero",
    QR_GENERATION_FAILED: "Could not generate QR code — check your VAT number",
    PDF_EXPORT_FAILED: "PDF export failed — please try again",
    PDF_RENDER_EMPTY: "PDF export failed — empty content",
    PDF_RENDER_TIMEOUT: "PDF export timed out — please try again",
    FREE_INVOICE_LIMIT: "Free limit reached — 3 invoices/month. Upgrade to Pro.",
    INTERNAL_ERROR: "Something went wrong — please try again",
  },
  auth: {
    title: "Sign up free to save your invoice",
    body: "Download PDF without an account — or create one to manage invoices.",
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
