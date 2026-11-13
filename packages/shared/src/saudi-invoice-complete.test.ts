import { describe, expect, test } from "bun:test";
import { createEmptyDraft, validateInstantInvoiceDraft } from "./instant-invoice";
import type { InstantInvoiceDraft } from "./instant-invoice";
import { computeInvoiceTotals } from "./invoice-totals";
import {
  computeLineVat,
  getInstantInvoiceChecklist,
  saudiCalendarDay,
  supplyDateHint,
  supplyDateToShow,
} from "./saudi-invoice-type";

function draft(patch: Partial<InstantInvoiceDraft> = {}): InstantInvoiceDraft {
  return {
    ...createEmptyDraft("simplified"),
    sellerName: "Qaftr",
    sellerVat: "300000000000003",
    sellerAddress: "Riyadh",
    lineItems: [{ id: "1", description: "Logo", qty: "1", unitPrice: "100" }],
    ...patch,
  };
}

describe("seller address (Art. 53(8): supplier name, address and VAT number on simplified invoices too)", () => {
  test("simplified invoice without seller address is blocked", () => {
    const result = validateInstantInvoiceDraft(draft({ sellerAddress: "  " }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.sellerAddress).toBe("SELLER_ADDRESS_REQUIRED");
  });

  test("checklist lists the seller address for both types", () => {
    for (const invoiceType of ["simplified", "standard"] as const) {
      const keys = getInstantInvoiceChecklist(draft({ invoiceType })).map((c) => c.key);
      expect(keys.slice(0, 3)).toEqual(["sellerName", "sellerVat", "sellerAddress"]);
    }
  });
});

describe("supply date (تاريخ التوريد)", () => {
  // 9 Nov 2026 22:30 UTC is already 10 Nov in Riyadh (UTC+3).
  const issue = new Date("2026-11-09T22:30:00Z");

  test("Saudi calendar day", () => {
    expect(saudiCalendarDay(issue)).toBe("2026-11-10");
  });

  test("shown only when set, valid and different from the issue day", () => {
    expect(supplyDateToShow(undefined, issue)).toBeNull();
    expect(supplyDateToShow("", issue)).toBeNull();
    expect(supplyDateToShow("2026-11-10", issue)).toBeNull();
    expect(supplyDateToShow("2026-02-30", issue)).toBeNull();
    expect(supplyDateToShow("2026-11-01", issue)).toBe("2026-11-01");
  });

  test("non-blocking hint when the supply date is after the issue date", () => {
    expect(supplyDateHint("2026-11-11", issue)).toBe("SUPPLY_AFTER_ISSUE");
    expect(supplyDateHint("2026-11-10", issue)).toBeNull();
    expect(supplyDateHint("2026-11-01", issue)).toBeNull();
    expect(validateInstantInvoiceDraft(draft({ supplyDate: "2099-01-01" }))).toEqual({ ok: true });
  });

  test("a malformed supply date is an error on the field", () => {
    const result = validateInstantInvoiceDraft(draft({ supplyDate: "2026-13-01" }));
    expect(!result.ok && result.errors.supplyDate).toBe("SUPPLY_DATE_INVALID");
  });

  test("new drafts start without a supply date", () => {
    expect(createEmptyDraft().supplyDate).toBe("");
  });
});

describe("per-line VAT (tax invoice)", () => {
  test("rate, VAT amount and line total incl. VAT for each line", () => {
    const totals = computeInvoiceTotals([
      { description: "a", qty: "2", unitPrice: "1000.50" },
      { description: "b", qty: "1", unitPrice: "80" },
    ]);
    expect(computeLineVat(totals.lineItems)).toEqual([
      { vatRate: "15", vatAmount: "300.15", totalWithVat: "2301.15" },
      { vatRate: "15", vatAmount: "12.00", totalWithVat: "92.00" },
    ]);
  });
});
