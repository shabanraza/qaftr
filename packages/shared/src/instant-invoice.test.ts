import { describe, expect, it } from "vitest";
import {
  computeDraftTotals,
  createEmptyDraft,
  validateInstantInvoiceDraft,
  validateSaudiVatNumber,
} from "./instant-invoice";

describe("validateSaudiVatNumber", () => {
  it("accepts valid 15-digit TRN", () => {
    expect(validateSaudiVatNumber("300000000000003")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(validateSaudiVatNumber("30000000000000")).toBe(false);
  });
});

describe("validateInstantInvoiceDraft", () => {
  it("requires seller, client, and line items", () => {
    const result = validateInstantInvoiceDraft(createEmptyDraft());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.sellerName).toBeDefined();
      expect(result.errors.sellerVat).toBeDefined();
      expect(result.errors.clientName).toBeDefined();
    }
  });

  it("computes totals for valid draft", () => {
    const draft = {
      ...createEmptyDraft(),
      sellerName: "شركة مثال",
      sellerVat: "300000000000003",
      clientName: "عميل",
      lineItems: [
        { id: "1", description: "خدمة", qty: "1", unitPrice: "1000" },
      ],
    };
    expect(validateInstantInvoiceDraft(draft).ok).toBe(true);
    const totals = computeDraftTotals(draft);
    expect(totals.subtotal).toBe("1000.00");
    expect(totals.vatAmount).toBe("150.00");
    expect(totals.total).toBe("1150.00");
  });
});
