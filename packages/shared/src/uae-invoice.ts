import { analyzeUaeTrn } from "./uae-trn";
import { MAX_VAT_AMOUNT } from "./vat-calculator";

/**
 * UAE tax invoice helpers. Field rules follow the UAE VAT Executive
 * Regulation (Article 59) as publicly documented; verify with the FTA
 * before relying on them. Amounts are computed in integer fils.
 */

export type UaeVatCategory = "standard" | "zero" | "exempt";
export type UaeInvoiceType = "full" | "simplified";
export type UaeInvoiceOutputLang = "ar" | "en" | "bilingual";

export interface UaeInvoiceLineInput {
  description: string;
  qty: string | number;
  unitPrice: string | number;
  /** Discount in AED for the whole line (not per unit). Blank means none. */
  discount?: string | number;
  vatCategory: UaeVatCategory;
}

export interface UaeInvoiceLineTotals {
  /** 0-based index in the original input (blank lines are skipped). */
  index: number;
  description: string;
  qty: string;
  unitPrice: string;
  gross: string;
  discount: string;
  net: string;
  vatCategory: UaeVatCategory;
  /** 5, 0, or null for exempt supplies. */
  vatRatePercent: number | null;
  vatAmount: string;
  total: string;
}

export interface UaeInvoiceTotals {
  lines: UaeInvoiceLineTotals[];
  totalDiscount: string;
  totalExclVat: string;
  totalVat: string;
  totalPayable: string;
  byCategory: Record<UaeVatCategory, { net: string; vat: string }>;
}

/** Standard UAE VAT rate in basis points (5%). */
const UAE_STANDARD_RATE_BP = 500n;
const BP = 10_000n;
const QTY_SCALE = 1000n;

/** A registered recipient may get a simplified tax invoice up to this total (AED). */
export const UAE_SIMPLIFIED_INVOICE_LIMIT_AED = 10_000;

/** Parses a user-entered non-negative decimal ("1,000.50", "١٫٥") into a scaled integer. */
function parseScaled(value: string | number | undefined, decimals: number): bigint | null {
  if (value === undefined) return null;
  const raw = String(value)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[,\s٬]/g, "")
    .replace(/٫/g, ".");
  const match = /^(\d*)(?:\.(\d*))?$/.exec(raw);
  if (!match || !/\d/.test(raw)) return null;
  const whole = match[1] || "0";
  const fraction = match[2] ?? "";
  const kept = fraction.slice(0, decimals).padEnd(decimals, "0");
  let scaled = BigInt(whole + kept);
  // half-up on the first dropped digit
  if (fraction.length > decimals && Number(fraction[decimals]) >= 5) scaled += 1n;
  return scaled;
}

function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

function fils(cents: bigint): string {
  const sign = cents < 0n ? "-" : "";
  const abs = cents < 0n ? -cents : cents;
  return `${sign}${abs / 100n}.${(abs % 100n).toString().padStart(2, "0")}`;
}

function isBlankLine(line: UaeInvoiceLineInput) {
  return (
    !line.description.trim() &&
    !String(line.unitPrice).trim() &&
    !String(line.discount ?? "").trim()
  );
}

interface ComputedLine {
  index: number;
  input: UaeInvoiceLineInput;
  qty: bigint | null;
  price: bigint | null;
  discountRaw: bigint | null;
  gross: bigint;
  discount: bigint;
  net: bigint;
  vat: bigint;
}

function computeLines(lines: UaeInvoiceLineInput[]): ComputedLine[] {
  const out: ComputedLine[] = [];
  lines.forEach((input, index) => {
    if (isBlankLine(input)) return;
    const qty = parseScaled(input.qty, 3);
    const price = parseScaled(input.unitPrice, 2);
    const discountText = String(input.discount ?? "").trim();
    const discountRaw = discountText ? parseScaled(discountText, 2) : 0n;
    const gross = qty !== null && price !== null ? divRoundHalfUp(qty * price, QTY_SCALE) : 0n;
    const discount = discountRaw !== null && discountRaw <= gross ? discountRaw : 0n;
    const net = gross - discount;
    const vat = input.vatCategory === "standard" ? divRoundHalfUp(net * UAE_STANDARD_RATE_BP, BP) : 0n;
    out.push({ index, input, qty, price, discountRaw, gross, discount, net, vat });
  });
  return out;
}

/** Line and invoice totals in AED (5% standard, 0% zero-rated, exempt), fils-exact. */
export function buildUaeInvoiceTotals(lines: UaeInvoiceLineInput[]): UaeInvoiceTotals {
  const computed = computeLines(lines);
  const sum = (pick: (l: ComputedLine) => bigint, filter: (l: ComputedLine) => boolean = () => true) =>
    computed.filter(filter).reduce((acc, l) => acc + pick(l), 0n);
  const byCat = (cat: UaeVatCategory) => ({
    net: fils(sum((l) => l.net, (l) => l.input.vatCategory === cat)),
    vat: fils(sum((l) => l.vat, (l) => l.input.vatCategory === cat)),
  });
  const totalNet = sum((l) => l.net);
  const totalVat = sum((l) => l.vat);

  return {
    lines: computed.map((l) => ({
      index: l.index,
      description: l.input.description.trim(),
      qty: l.qty === null ? "0" : formatQty(l.qty),
      unitPrice: fils(l.price ?? 0n),
      gross: fils(l.gross),
      discount: fils(l.discount),
      net: fils(l.net),
      vatCategory: l.input.vatCategory,
      vatRatePercent:
        l.input.vatCategory === "standard" ? 5 : l.input.vatCategory === "zero" ? 0 : null,
      vatAmount: fils(l.vat),
      total: fils(l.net + l.vat),
    })),
    totalDiscount: fils(sum((l) => l.discount)),
    totalExclVat: fils(totalNet),
    totalVat: fils(totalVat),
    totalPayable: fils(totalNet + totalVat),
    byCategory: { standard: byCat("standard"), zero: byCat("zero"), exempt: byCat("exempt") },
  };
}

function formatQty(qty: bigint): string {
  const whole = qty / QTY_SCALE;
  const fraction = (qty % QTY_SCALE).toString().padStart(3, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export interface UaeTaxInvoiceInput {
  type: UaeInvoiceType;
  /** Heading printed on the invoice; must contain "Tax Invoice" or «فاتورة ضريبية». */
  title: string;
  invoiceNumber: string;
  /** YYYY-MM-DD */
  issueDate: string;
  /** YYYY-MM-DD, only when different from the issue date. */
  supplyDate?: string;
  supplier: { name: string; address: string; trn: string };
  recipient: { name: string; address: string; trn: string; vatRegistered: boolean };
  lines: UaeInvoiceLineInput[];
}

export type UaeInvoiceIssueCode =
  | "TITLE_MISSING_TAX_INVOICE"
  | "SUPPLIER_NAME_REQUIRED"
  | "SUPPLIER_ADDRESS_REQUIRED"
  | "SUPPLIER_TRN_REQUIRED"
  | "SUPPLIER_TRN_INVALID"
  | "RECIPIENT_NAME_REQUIRED"
  | "RECIPIENT_ADDRESS_REQUIRED"
  | "RECIPIENT_TRN_REQUIRED"
  | "RECIPIENT_TRN_INVALID"
  | "INVOICE_NUMBER_REQUIRED"
  | "INVOICE_NUMBER_NOT_SEQUENTIAL"
  | "ISSUE_DATE_REQUIRED"
  | "ISSUE_DATE_INVALID"
  | "SUPPLY_DATE_INVALID"
  | "LINES_REQUIRED"
  | "LINE_DESCRIPTION_REQUIRED"
  | "LINE_QTY_INVALID"
  | "LINE_UNIT_PRICE_INVALID"
  | "LINE_DISCOUNT_INVALID"
  | "LINE_DISCOUNT_EXCEEDS_AMOUNT"
  | "AMOUNT_TOO_LARGE"
  | "SIMPLIFIED_NOT_ALLOWED";

export interface UaeInvoiceIssue {
  code: UaeInvoiceIssueCode;
  /** 0-based line index for line-level issues. */
  line?: number;
}

function isValidIsoDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

export type UaeInvoiceWarningCode = "SUPPLY_DATE_AFTER_ISSUE";

/**
 * Non-blocking checks. A supply date after the issue date is legal (e.g. an
 * invoice issued on advance payment) but is often a typo, so the UI asks the
 * user to double-check instead of refusing the invoice.
 */
export function getUaeInvoiceWarnings(input: {
  issueDate: string;
  supplyDate?: string;
}): UaeInvoiceWarningCode[] {
  const supply = input.supplyDate?.trim() ?? "";
  if (!supply || !isValidIsoDate(input.issueDate) || !isValidIsoDate(supply)) return [];
  // ISO YYYY-MM-DD strings compare chronologically.
  return supply > input.issueDate ? ["SUPPLY_DATE_AFTER_ISSUE"] : [];
}

/**
 * Checks a UAE tax invoice (full or simplified) for the fields the FTA
 * requires. Returns issue codes so the UI can localise messages.
 */
export function validateUaeTaxInvoice(input: UaeTaxInvoiceInput): {
  valid: boolean;
  issues: UaeInvoiceIssue[];
} {
  const issues: UaeInvoiceIssue[] = [];
  const add = (code: UaeInvoiceIssueCode, line?: number) =>
    issues.push(line === undefined ? { code } : { code, line });
  const full = input.type === "full";

  if (!/tax invoice/i.test(input.title) && !input.title.includes("فاتورة ضريبية")) {
    add("TITLE_MISSING_TAX_INVOICE");
  }

  const { supplier, recipient } = input;
  if (!supplier.name.trim()) add("SUPPLIER_NAME_REQUIRED");
  if (!supplier.address.trim()) add("SUPPLIER_ADDRESS_REQUIRED");
  if (!supplier.trn.trim()) add("SUPPLIER_TRN_REQUIRED");
  else if (!analyzeUaeTrn(supplier.trn).valid) add("SUPPLIER_TRN_INVALID");

  if (full) {
    if (!recipient.name.trim()) add("RECIPIENT_NAME_REQUIRED");
    if (!recipient.address.trim()) add("RECIPIENT_ADDRESS_REQUIRED");
  }
  if (recipient.trn.trim()) {
    if (!analyzeUaeTrn(recipient.trn).valid) add("RECIPIENT_TRN_INVALID");
  } else if (full && recipient.vatRegistered) {
    add("RECIPIENT_TRN_REQUIRED");
  }

  if (full) {
    if (!input.invoiceNumber.trim()) add("INVOICE_NUMBER_REQUIRED");
    else if (!/\d+$/.test(input.invoiceNumber.trim())) add("INVOICE_NUMBER_NOT_SEQUENTIAL");
  }

  if (!input.issueDate.trim()) add("ISSUE_DATE_REQUIRED");
  else if (!isValidIsoDate(input.issueDate)) add("ISSUE_DATE_INVALID");
  if (full && input.supplyDate?.trim() && !isValidIsoDate(input.supplyDate)) {
    add("SUPPLY_DATE_INVALID");
  }

  const computed = computeLines(input.lines);
  if (computed.length === 0) add("LINES_REQUIRED");
  for (const l of computed) {
    if (!l.input.description.trim()) add("LINE_DESCRIPTION_REQUIRED", l.index);
    if (!full) continue;
    if (l.qty === null || l.qty === 0n) add("LINE_QTY_INVALID", l.index);
    if (l.price === null) add("LINE_UNIT_PRICE_INVALID", l.index);
    if (l.discountRaw === null) add("LINE_DISCOUNT_INVALID", l.index);
    else if (l.discountRaw > l.gross && l.qty !== null && l.price !== null) {
      add("LINE_DISCOUNT_EXCEEDS_AMOUNT", l.index);
    }
  }

  const payable = computed.reduce((acc, l) => acc + l.net + l.vat, 0n);
  if (payable > BigInt(MAX_VAT_AMOUNT) * 100n) add("AMOUNT_TOO_LARGE");
  if (
    !full &&
    recipient.vatRegistered &&
    payable > BigInt(UAE_SIMPLIFIED_INVOICE_LIMIT_AED) * 100n
  ) {
    add("SIMPLIFIED_NOT_ALLOWED");
  }

  return { valid: issues.length === 0, issues };
}

const TITLES: Record<UaeInvoiceType, { ar: string; en: string }> = {
  full: { ar: "فاتورة ضريبية", en: "Tax Invoice" },
  simplified: { ar: "فاتورة ضريبية مبسطة", en: "Simplified Tax Invoice" },
};

export function getUaeInvoiceTitle(type: UaeInvoiceType, lang: UaeInvoiceOutputLang): string {
  const t = TITLES[type];
  if (lang === "bilingual") return `${t.ar} | ${t.en}`;
  return t[lang];
}

/** "INV-0009" -> "INV-0010"; keeps zero padding; starts at INV-0001. */
export function nextUaeInvoiceNumber(previous: string): string {
  const value = previous.trim();
  if (!value) return "INV-0001";
  const match = /^(.*?)(\d+)$/.exec(value);
  if (!match) return `${value}-0001`;
  const next = String(BigInt(match[2]) + 1n).padStart(match[2].length, "0");
  return `${match[1]}${next}`;
}
