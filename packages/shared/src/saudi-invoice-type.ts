import { parseLocaleDecimal } from "./numbers";
import type { InstantInvoiceDraft } from "./instant-invoice";
import { VAT_RATE } from "./invoice-totals";
import type { ComputedLineItem } from "./invoice-totals";
import { analyzeSaudiVatNumber, validateSaudiVatNumber } from "./trn-analyzer";

/**
 * ZATCA invoice types for the free Saudi tool (Phase 1 / generation phase).
 * - standard   = فاتورة ضريبية (B2B): buyer name, address and VAT number shown.
 * - simplified = فاتورة ضريبية مبسطة (B2C): buyer details optional; QR mandatory.
 * Sources: zatca.gov.sa "How to prepare" (Phase 1) and VAT Implementing
 * Regulations Art. 53.
 */
export type SaudiInvoiceType = "standard" | "simplified";

export const SAUDI_INVOICE_TYPES: readonly SaudiInvoiceType[] = ["simplified", "standard"];

/** First-visit default. A remembered choice (see resolveSaudiInvoiceType) wins. */
export const DEFAULT_SAUDI_INVOICE_TYPE: SaudiInvoiceType = "simplified";

export const SAUDI_INVOICE_TYPE_STORAGE_KEY = "qaftr:sa-invoice-type";

export function isSaudiInvoiceType(value: unknown): value is SaudiInvoiceType {
  return value === "standard" || value === "simplified";
}

export function resolveSaudiInvoiceType(remembered: string | null | undefined): SaudiInvoiceType {
  return isSaudiInvoiceType(remembered) ? remembered : DEFAULT_SAUDI_INVOICE_TYPE;
}

export function getSaudiInvoiceTitle(type: SaudiInvoiceType): { ar: string; en: string } {
  return type === "standard"
    ? { ar: "فاتورة ضريبية", en: "Tax Invoice" }
    : { ar: "فاتورة ضريبية مبسطة", en: "Simplified Tax Invoice" };
}

export function draftInvoiceType(draft: Pick<InstantInvoiceDraft, "invoiceType">): SaudiInvoiceType {
  return isSaudiInvoiceType(draft.invoiceType) ? draft.invoiceType : DEFAULT_SAUDI_INVOICE_TYPE;
}

export type BuyerVatErrorCode =
  | "CLIENT_VAT_REQUIRED"
  | "CLIENT_VAT_INVALID_LENGTH"
  | "CLIENT_VAT_INVALID_START"
  | "CLIENT_VAT_INVALID_END";

/** Buyer VAT number check reusing the Saudi VAT-number analyser. */
export function buyerVatError(vat: string, required: boolean): BuyerVatErrorCode | undefined {
  const analysis = analyzeSaudiVatNumber(vat);
  if (analysis.issues.includes("EMPTY")) return required ? "CLIENT_VAT_REQUIRED" : undefined;
  if (analysis.issues.includes("INVALID_LENGTH")) return "CLIENT_VAT_INVALID_LENGTH";
  if (analysis.issues.includes("INVALID_START")) return "CLIENT_VAT_INVALID_START";
  if (analysis.issues.includes("INVALID_END")) return "CLIENT_VAT_INVALID_END";
  return undefined;
}

/** A simplified draft whose buyer has a valid VAT number is probably B2B. */
export function shouldSuggestStandardInvoice(draft: InstantInvoiceDraft): boolean {
  return draftInvoiceType(draft) === "simplified" && validateSaudiVatNumber(draft.clientVat);
}

export type InstantInvoiceCheckKey =
  | "sellerName"
  | "sellerVat"
  | "sellerAddress"
  | "clientName"
  | "clientAddress"
  | "clientVat"
  | "lineItems";

export type InstantInvoiceCheck = { key: InstantInvoiceCheckKey; ok: boolean };

/** Export-readiness checklist, in form order, for the draft's invoice type. */
export function getInstantInvoiceChecklist(draft: InstantInvoiceDraft): InstantInvoiceCheck[] {
  const standard = draftInvoiceType(draft) === "standard";
  const lineItems = draft.lineItems.some(
    (item) =>
      item.description.trim() && parseLocaleDecimal(item.unitPrice) > 0 && parseLocaleDecimal(item.qty || "0") > 0,
  );
  const checks: InstantInvoiceCheck[] = [
    { key: "sellerName", ok: !!draft.sellerName.trim() },
    { key: "sellerVat", ok: validateSaudiVatNumber(draft.sellerVat) },
  ];
  // Art. 53(8): the supplier's address is on simplified invoices too.
  checks.push({ key: "sellerAddress", ok: !!draft.sellerAddress.trim() });
  if (standard) {
    checks.push(
      { key: "clientName", ok: !!draft.clientName.trim() },
      { key: "clientAddress", ok: !!(draft.clientAddress ?? "").trim() },
      { key: "clientVat", ok: validateSaudiVatNumber(draft.clientVat) },
    );
  }
  checks.push({ key: "lineItems", ok: lineItems });
  return checks;
}

/** Calendar day in Saudi Arabia (UTC+3, no DST) as YYYY-MM-DD. */
export function saudiCalendarDay(date: Date): string {
  return new Date(date.getTime() + 3 * 3_600_000).toISOString().slice(0, 10);
}

/** A real calendar date written as YYYY-MM-DD (what <input type="date"> gives). */
export function isIsoCalendarDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/**
 * Supply date (تاريخ التوريد) to print: Art. 53 asks for it only when it
 * differs from the issue date. Null when empty, invalid or the same day.
 */
export function supplyDateToShow(supplyDate: string | undefined, issueDate: Date): string | null {
  const value = (supplyDate ?? "").trim();
  if (!isIsoCalendarDate(value)) return null;
  return value === saudiCalendarDay(issueDate) ? null : value;
}

export type SupplyDateHint = "SUPPLY_AFTER_ISSUE";

/** Non-blocking hint: a supply after the issue date is unusual (an advance invoice). */
export function supplyDateHint(supplyDate: string | undefined, issueDate: Date): SupplyDateHint | null {
  const value = (supplyDate ?? "").trim();
  if (!isIsoCalendarDate(value)) return null;
  return value > saudiCalendarDay(issueDate) ? "SUPPLY_AFTER_ISSUE" : null;
}

export interface LineVat {
  /** Percentage, e.g. "15". */
  vatRate: string;
  vatAmount: string;
  totalWithVat: string;
}

/**
 * Per-line VAT for the tax invoice (rate, VAT amount, line total incl. VAT).
 * Each line is rounded half-up to the halala; the invoice VAT total stays
 * computed on the subtotal, so the line VATs can differ from it by a halala.
 */
export function computeLineVat(lineItems: Pick<ComputedLineItem, "lineTotal">[]): LineVat[] {
  const ratePct = Math.round(VAT_RATE * 100);
  return lineItems.map((item) => {
    const net = Math.round(parseFloat(item.lineTotal) * 100);
    const vat = Math.floor((net * ratePct + 50) / 100);
    return {
      vatRate: String(ratePct),
      vatAmount: (vat / 100).toFixed(2),
      totalWithVat: ((net + vat) / 100).toFixed(2),
    };
  });
}
