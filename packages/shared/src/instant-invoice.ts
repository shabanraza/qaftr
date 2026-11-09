import { parseLocaleDecimal } from "./numbers";
import { computeInvoiceTotals, type LineItemForTotals } from "./invoice-totals";
import {
  DEFAULT_SAUDI_INVOICE_TYPE,
  buyerVatError,
  draftInvoiceType,
  isIsoCalendarDate,
  type SaudiInvoiceType,
} from "./saudi-invoice-type";
import { normalizeSaudiVatNumber, validateSaudiVatNumber } from "./trn-analyzer";

export { normalizeSaudiVatNumber, validateSaudiVatNumber };

export interface InstantLineItem {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
}

export interface InstantInvoiceDraft {
  sellerName: string;
  sellerVat: string;
  sellerAddress: string;
  clientName: string;
  clientVat: string;
  notes: string;
  lineItems: InstantLineItem[];
  /** Missing on older stored drafts and on the server: treated as simplified. */
  invoiceType?: SaudiInvoiceType;
  /** Buyer address (required for a standard tax invoice). Client-side only. */
  clientAddress?: string;
  /** Supply date (تاريخ التوريد), YYYY-MM-DD; optional. Client-side only. */
  supplyDate?: string;
}

export type InstantInvoiceFieldErrors = Partial<
  Record<
    | "sellerName"
    | "sellerVat"
    | "sellerAddress"
    | "clientName"
    | "clientAddress"
    | "clientVat"
    | "supplyDate"
    | "lineItems"
    | `lineItems.${number}.description`
    | `lineItems.${number}.unitPrice`
    | `lineItems.${number}.qty`,
    string
  >
>;

export const INSTANT_INVOICE_DRAFT_KEY = "qaftr:instant-invoice-draft";

export function toTotalsInput(items: InstantLineItem[]): LineItemForTotals[] {
  return items
    .filter((item) => item.description.trim() && parseLocaleDecimal(item.unitPrice))
    .map((item, index) => ({
      description: item.description.trim(),
      qty: item.qty || "1",
      unitPrice: item.unitPrice,
      sortOrder: index,
    }));
}

export function validateInstantInvoiceDraft(
  draft: InstantInvoiceDraft,
): { ok: true } | { ok: false; errors: InstantInvoiceFieldErrors } {
  const errors: InstantInvoiceFieldErrors = {};

  if (!draft.sellerName.trim()) {
    errors.sellerName = "SELLER_NAME_REQUIRED";
  }

  const vat = normalizeSaudiVatNumber(draft.sellerVat);
  if (!vat) {
    errors.sellerVat = "SELLER_VAT_REQUIRED";
  } else if (!validateSaudiVatNumber(vat)) {
    errors.sellerVat = "SELLER_VAT_INVALID";
  }

  // Art. 53(8): supplier name, address and VAT number on every invoice.
  if (!draft.sellerAddress.trim()) errors.sellerAddress = "SELLER_ADDRESS_REQUIRED";

  // Standard tax invoice (B2B): buyer name, address and VAT number are
  // mandatory (Art. 53(5)). Simplified (B2C): buyer details are optional.
  const standard = draftInvoiceType(draft) === "standard";
  if (standard) {
    if (!draft.clientName.trim()) errors.clientName = "CLIENT_NAME_REQUIRED";
    if (!(draft.clientAddress ?? "").trim()) errors.clientAddress = "CLIENT_ADDRESS_REQUIRED";
  }

  const clientVatError = buyerVatError(draft.clientVat, standard);
  if (clientVatError) errors.clientVat = clientVatError;

  const supplyDate = (draft.supplyDate ?? "").trim();
  if (supplyDate && !isIsoCalendarDate(supplyDate)) errors.supplyDate = "SUPPLY_DATE_INVALID";

  let hasCompleteLine = false;
  draft.lineItems.forEach((item, index) => {
    if (!item.description.trim() && !item.unitPrice.trim()) {
      return;
    }
    if (!item.description.trim()) {
      errors[`lineItems.${index}.description`] = "LINE_DESCRIPTION_REQUIRED";
    }
    if (!parseLocaleDecimal(item.unitPrice)) {
      errors[`lineItems.${index}.unitPrice`] = "LINE_PRICE_REQUIRED";
    }
    const qty = parseLocaleDecimal(item.qty || "0");
    if (item.description.trim() && parseLocaleDecimal(item.unitPrice) && (!qty || qty <= 0)) {
      errors[`lineItems.${index}.qty`] = "LINE_QTY_INVALID";
    }
    if (item.description.trim() && parseLocaleDecimal(item.unitPrice) && qty > 0) {
      hasCompleteLine = true;
    }
  });

  if (!hasCompleteLine) {
    errors.lineItems = "LINE_ITEMS_REQUIRED";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const totalsInput = toTotalsInput(draft.lineItems);
  if (totalsInput.length === 0) {
    return { ok: false, errors: { lineItems: "LINE_ITEMS_REQUIRED" } };
  }

  return { ok: true };
}

export function computeDraftTotals(draft: InstantInvoiceDraft) {
  return computeInvoiceTotals(toTotalsInput(draft.lineItems));
}

export function createEmptyDraft(
  invoiceType: SaudiInvoiceType = DEFAULT_SAUDI_INVOICE_TYPE,
): InstantInvoiceDraft {
  return {
    invoiceType,
    sellerName: "",
    sellerVat: "",
    sellerAddress: "",
    clientName: "",
    clientVat: "",
    clientAddress: "",
    supplyDate: "",
    notes: "",
    lineItems: [{ id: crypto.randomUUID(), description: "", qty: "1", unitPrice: "" }],
  };
}
