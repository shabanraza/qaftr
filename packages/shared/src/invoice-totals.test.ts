import { describe, expect, it } from "bun:test";
import { computeInvoiceTotals, totalsMatch } from "./invoice-totals";

describe("computeInvoiceTotals", () => {
  it("computes subtotal, VAT, and line totals from qty × unit price", () => {
    const result = computeInvoiceTotals([
      { description: "Consulting", qty: "2", unitPrice: "100.00" },
      { description: "Setup", qty: "1", unitPrice: "50.00" },
    ]);

    expect(result.subtotal).toBe("250.00");
    expect(result.vatAmount).toBe("37.50");
    expect(result.total).toBe("287.50");
    expect(result.lineItems[0]?.lineTotal).toBe("200.00");
    expect(result.lineItems[1]?.lineTotal).toBe("50.00");
  });

  it("rounds money to two decimal places", () => {
    const result = computeInvoiceTotals([
      { description: "Item", qty: "3", unitPrice: "10.005" },
    ]);

    expect(result.subtotal).toBe("30.02");
    expect(result.vatAmount).toBe("4.50");
    expect(result.total).toBe("34.52");
  });
});

describe("totalsMatch", () => {
  it("returns true when submitted totals match computed values", () => {
    const computed = computeInvoiceTotals([
      { description: "Item", qty: "1", unitPrice: "100.00" },
    ]);

    expect(
      totalsMatch(computed, {
        subtotal: "100.00",
        vatAmount: "15.00",
        total: "115.00",
      }),
    ).toBe(true);
  });

  it("returns false when client totals are tampered", () => {
    const computed = computeInvoiceTotals([
      { description: "Item", qty: "1", unitPrice: "100.00" },
    ]);

    expect(
      totalsMatch(computed, {
        subtotal: "1.00",
        vatAmount: "0.15",
        total: "1.15",
      }),
    ).toBe(false);
  });
});
