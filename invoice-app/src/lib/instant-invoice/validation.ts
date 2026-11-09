import {
  validateInstantInvoiceDraft,
  type InstantInvoiceDraft,
  type InstantInvoiceFieldErrors,
} from "@zatca/shared";
import type { MarketingLang } from "#/lib/marketing/lang";
import { fieldError } from "#/lib/instant-invoice/copy";

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
  sellerAddress: "seller-address",
  clientName: "client-name",
  clientAddress: "client-address",
  clientVat: "client-vat",
  lineItems: "invoice-line-items",
  supplyDate: "supply-date",
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
      el.scrollIntoView?.({ behavior: "smooth", block: "center" });
      // Move keyboard/screen-reader focus to the first field to fix.
      const target = el.matches("input, textarea") ? el : el.querySelector("input, textarea");
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
      break;
    }
  }
}
