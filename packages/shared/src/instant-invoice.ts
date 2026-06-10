import { computeInvoiceTotals, type LineItemForTotals } from "./invoice-totals";

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
}

export type InstantInvoiceFieldErrors = Partial<
  Record<
    | "sellerName"
    | "sellerVat"
    | "clientName"
    | "clientVat"
    | "lineItems"
    | `lineItems.${number}.description`
    | `lineItems.${number}.unitPrice`
    | `lineItems.${number}.qty`,
    string
  >
>;

export const INSTANT_INVOICE_DRAFT_KEY = "qaftr:instant-invoice-draft";

/** Saudi VAT registration (TRN): 15 digits, starts and ends with 3. */
export function validateSaudiVatNumber(vat: string): boolean {
  const digits = vat.replace(/\D/g, "");
  return digits.length === 15 && digits.startsWith("3") && digits.endsWith("3");
}

export function normalizeSaudiVatNumber(vat: string): string {
  return vat.replace(/\D/g, "");
}

export function toTotalsInput(items: InstantLineItem[]): LineItemForTotals[] {
  return items
    .filter((item) => item.description.trim() && parseFloat(item.unitPrice))
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

  if (!draft.clientName.trim()) {
    errors.clientName = "CLIENT_NAME_REQUIRED";
  }

  if (draft.clientVat.trim()) {
    const clientVat = normalizeSaudiVatNumber(draft.clientVat);
    if (!validateSaudiVatNumber(clientVat)) {
      errors.clientVat = "CLIENT_VAT_INVALID";
    }
  }

  let hasCompleteLine = false;
  draft.lineItems.forEach((item, index) => {
    if (!item.description.trim() && !item.unitPrice.trim()) {
      return;
    }
    if (!item.description.trim()) {
      errors[`lineItems.${index}.description`] = "LINE_DESCRIPTION_REQUIRED";
    }
    if (!parseFloat(item.unitPrice)) {
      errors[`lineItems.${index}.unitPrice`] = "LINE_PRICE_REQUIRED";
    }
    const qty = parseFloat(item.qty || "0");
    if (item.description.trim() && parseFloat(item.unitPrice) && (!qty || qty <= 0)) {
      errors[`lineItems.${index}.qty`] = "LINE_QTY_INVALID";
    }
    if (item.description.trim() && parseFloat(item.unitPrice) && qty > 0) {
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

export function createEmptyDraft(): InstantInvoiceDraft {
  return {
    sellerName: "",
    sellerVat: "",
    sellerAddress: "",
    clientName: "",
    clientVat: "",
    notes: "",
    lineItems: [{ id: crypto.randomUUID(), description: "", qty: "1", unitPrice: "" }],
  };
}
