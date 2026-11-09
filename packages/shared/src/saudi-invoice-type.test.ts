import { describe, expect, it } from "vitest";
import {
  createEmptyDraft,
  validateInstantInvoiceDraft,
  type InstantInvoiceDraft,
} from "./instant-invoice";
import {
  DEFAULT_SAUDI_INVOICE_TYPE,
  getInstantInvoiceChecklist,
  getSaudiInvoiceTitle,
  resolveSaudiInvoiceType,
  shouldSuggestStandardInvoice,
} from "./saudi-invoice-type";

const VALID_VAT = "300000000000003";
const BUYER_VAT = "310123456700003";

function base(patch: Partial<InstantInvoiceDraft> = {}): InstantInvoiceDraft {
  return {
    ...createEmptyDraft(),
    sellerName: "مؤسسة قافتر",
    sellerVat: VALID_VAT,
    sellerAddress: "الرياض، حي العليا",
    lineItems: [{ id: "1", description: "توريد", qty: "1", unitPrice: "100" }],
    ...patch,
  };
}

describe("getSaudiInvoiceTitle", () => {
  it("uses ZATCA titles for each type", () => {
    expect(getSaudiInvoiceTitle("standard")).toEqual({ ar: "فاتورة ضريبية", en: "Tax Invoice" });
    expect(getSaudiInvoiceTitle("simplified")).toEqual({
      ar: "فاتورة ضريبية مبسطة",
      en: "Simplified Tax Invoice",
    });
  });
});

describe("resolveSaudiInvoiceType", () => {
  it("defaults to simplified when nothing was remembered", () => {
    expect(DEFAULT_SAUDI_INVOICE_TYPE).toBe("simplified");
    expect(resolveSaudiInvoiceType(null)).toBe("simplified");
    expect(resolveSaudiInvoiceType("garbage")).toBe("simplified");
  });

  it("keeps a remembered valid choice", () => {
    expect(resolveSaudiInvoiceType("standard")).toBe("standard");
    expect(resolveSaudiInvoiceType("simplified")).toBe("simplified");
  });
});

describe("createEmptyDraft", () => {
  it("starts as a simplified invoice with an empty buyer address", () => {
    const draft = createEmptyDraft();
    expect(draft.invoiceType).toBe("simplified");
    expect(draft.clientAddress).toBe("");
  });

  it("accepts a starting type", () => {
    expect(createEmptyDraft("standard").invoiceType).toBe("standard");
  });
});

describe("validateInstantInvoiceDraft — simplified (B2C)", () => {
  it("does not require any buyer details", () => {
    const result = validateInstantInvoiceDraft(base({ invoiceType: "simplified", clientName: "", clientVat: "", clientAddress: "" }));
    expect(result).toEqual({ ok: true });
  });

  it("treats a draft without invoiceType (older drafts, server) as simplified", () => {
    const draft = base();
    delete (draft as Partial<InstantInvoiceDraft>).invoiceType;
    expect(validateInstantInvoiceDraft(draft).ok).toBe(true);
  });

  it("still rejects a malformed optional buyer VAT number", () => {
    const result = validateInstantInvoiceDraft(base({ clientVat: "12345" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.clientVat).toBe("CLIENT_VAT_INVALID_LENGTH");
  });
});

describe("validateInstantInvoiceDraft — standard (B2B)", () => {
  const standard = (patch: Partial<InstantInvoiceDraft> = {}) =>
    base({ invoiceType: "standard", ...patch });

  it("requires buyer name, buyer address and buyer VAT number", () => {
    const result = validateInstantInvoiceDraft(standard());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.clientName).toBe("CLIENT_NAME_REQUIRED");
      expect(result.errors.clientAddress).toBe("CLIENT_ADDRESS_REQUIRED");
      expect(result.errors.clientVat).toBe("CLIENT_VAT_REQUIRED");
    }
  });

  it("requires the seller address", () => {
    const result = validateInstantInvoiceDraft(
      standard({ sellerAddress: " ", clientName: "شركة", clientAddress: "جدة", clientVat: BUYER_VAT }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.sellerAddress).toBe("SELLER_ADDRESS_REQUIRED");
  });

  it("reports the specific VAT-number rule the buyer number breaks", () => {
    const fill = { clientName: "شركة", clientAddress: "جدة" };
    const start = validateInstantInvoiceDraft(standard({ ...fill, clientVat: "210000000000003" }));
    const end = validateInstantInvoiceDraft(standard({ ...fill, clientVat: "300000000000002" }));
    expect(!start.ok && start.errors.clientVat).toBe("CLIENT_VAT_INVALID_START");
    expect(!end.ok && end.errors.clientVat).toBe("CLIENT_VAT_INVALID_END");
  });

  it("passes with all buyer details", () => {
    const result = validateInstantInvoiceDraft(
      standard({ clientName: "شركة الأفق", clientAddress: "جدة", clientVat: "310 1234 5670 0003" }),
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("shouldSuggestStandardInvoice", () => {
  it("suggests a tax invoice when a simplified draft has a valid buyer VAT number", () => {
    expect(shouldSuggestStandardInvoice(base({ clientVat: BUYER_VAT }))).toBe(true);
  });

  it("does not suggest it without a valid buyer VAT number or when already standard", () => {
    expect(shouldSuggestStandardInvoice(base({ clientVat: "" }))).toBe(false);
    expect(shouldSuggestStandardInvoice(base({ clientVat: "3001" }))).toBe(false);
    expect(shouldSuggestStandardInvoice(base({ invoiceType: "standard", clientVat: BUYER_VAT }))).toBe(
      false,
    );
  });
});

describe("getInstantInvoiceChecklist", () => {
  it("lists only seller and line checks for simplified invoices", () => {
    const keys = getInstantInvoiceChecklist(base({ invoiceType: "simplified" })).map((c) => c.key);
    expect(keys).toEqual(["sellerName", "sellerVat", "sellerAddress", "lineItems"]);
  });

  it("adds seller address and buyer checks for standard invoices", () => {
    const list = getInstantInvoiceChecklist(
      base({ invoiceType: "standard", clientName: "شركة", clientVat: "123" }),
    );
    expect(list.map((c) => c.key)).toEqual([
      "sellerName",
      "sellerVat",
      "sellerAddress",
      "clientName",
      "clientAddress",
      "clientVat",
      "lineItems",
    ]);
    const byKey = Object.fromEntries(list.map((c) => [c.key, c.ok]));
    expect(byKey).toMatchObject({ sellerAddress: true, clientName: true, clientAddress: false, clientVat: false });
  });
});
