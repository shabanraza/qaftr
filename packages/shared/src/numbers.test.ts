import { describe, expect, test } from "bun:test";
import { parseLocaleDecimal } from "./numbers";
import { computeInvoiceTotals } from "./invoice-totals";
import { createEmptyDraft, validateInstantInvoiceDraft } from "./instant-invoice";
import { getInstantInvoiceChecklist } from "./saudi-invoice-type";

describe("parseLocaleDecimal", () => {
  test.each([
    ["1000", 1000],
    ["١٠٠٠", 1000],
    ["١٠٠٠٫٥٠", 1000.5],
    ["١٬٠٠٠٫٥", 1000.5],
    ["۲۵", 25],
    ["1,250.75", 1250.75],
    [" 2 000 ", 2000],
    ["٢", 2],
    [".5", 0.5],
  ])("%p → %p", (raw, expected) => {
    expect(parseLocaleDecimal(raw)).toBe(expected);
  });

  test.each(["", "  ", "abc", "1.2.3", "12abc", "-"])("%p → NaN", (raw) => {
    expect(parseLocaleDecimal(raw)).toBeNaN();
  });
});

describe("Saudi invoice accepts Arabic-Indic quantities and prices", () => {
  test("totals", () => {
    const totals = computeInvoiceTotals([{ description: "x", qty: "٢", unitPrice: "١٠٠٠٫٥٠" }]);
    expect(totals.lineItems[0]).toMatchObject({ qty: "2.000", unitPrice: "1000.50", lineTotal: "2001.00" });
    expect(totals.total).toBe("2301.15");
  });

  test("validation and checklist", () => {
    const draft = {
      ...createEmptyDraft(),
      sellerName: "Qaftr",
      sellerVat: "300000000000003",
      sellerAddress: "Riyadh",
      lineItems: [{ id: "1", description: "Logo", qty: "٢", unitPrice: "١٬٠٠٠" }],
    };
    expect(validateInstantInvoiceDraft(draft)).toEqual({ ok: true });
    expect(getInstantInvoiceChecklist(draft).find((c) => c.key === "lineItems")?.ok).toBe(true);
  });
});
