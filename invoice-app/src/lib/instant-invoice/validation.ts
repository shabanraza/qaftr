import {
  validateInstantInvoiceDraft,
  validateSaudiVatNumber,
  type InstantInvoiceDraft,
  type InstantInvoiceFieldErrors,
} from "@zatca/shared";
import type { MarketingLang } from "#/lib/marketing/lang";
import { fieldError } from "#/lib/instant-invoice/copy";

export type DraftReadiness = {
  sellerName: boolean;
  sellerVat: boolean;
  clientName: boolean;
  lineItems: boolean;
};

export function getDraftReadiness(draft: InstantInvoiceDraft): DraftReadiness {
  return {
    sellerName: !!draft.sellerName.trim(),
    sellerVat: validateSaudiVatNumber(draft.sellerVat),
    clientName: !!draft.clientName.trim(),
    lineItems: draft.lineItems.some(
      (item) =>
        item.description.trim() &&
        parseFloat(item.unitPrice) > 0 &&
        parseFloat(item.qty || "0") > 0,
    ),
  };
}

export function isDraftReady(draft: InstantInvoiceDraft): boolean {
  return validateInstantInvoiceDraft(draft).ok;
}

export function mapValidationErrors(
  lang: MarketingLang,
  errors: InstantInvoiceFieldErrors,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, code] of Object.entries(errors)) {
    if (code) mapped[key] = fieldError(lang, code) ?? code;
  }
  return mapped;
}

const FIELD_ANCHORS: Record<string, string> = {
  sellerName: "seller-name",
  sellerVat: "seller-vat",
  clientName: "client-name",
  clientVat: "client-vat",
  lineItems: "invoice-line-items",
};

export function scrollToFirstValidationError(errors: InstantInvoiceFieldErrors) {
  if (typeof document === "undefined") return;

  for (const key of Object.keys(errors)) {
    const anchor =
      FIELD_ANCHORS[key] ??
      (key.startsWith("lineItems.") ? "invoice-line-items" : undefined);
    if (!anchor) continue;
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      break;
    }
  }
}
