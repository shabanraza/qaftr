import { describe, expect, it } from "vitest";
import {
  UAE_SIMPLIFIED_INVOICE_LIMIT_AED,
  buildUaeInvoiceTotals,
  getUaeInvoiceTitle,
  getUaeInvoiceWarnings,
  nextUaeInvoiceNumber,
  validateUaeTaxInvoice,
} from "./index";
import type { UaeTaxInvoiceInput } from "./index";

const line = (over: Record<string, unknown> = {}) => ({
  description: "Design work",
  qty: "1",
  unitPrice: "1000",
  discount: "",
  vatCategory: "standard" as const,
  ...over,
});

describe("buildUaeInvoiceTotals", () => {
  it("adds 5% VAT to a standard-rated line", () => {
    const t = buildUaeInvoiceTotals([line()]);
    expect(t.lines[0]).toMatchObject({
      gross: "1000.00",
      discount: "0.00",
      net: "1000.00",
      vatRatePercent: 5,
      vatAmount: "50.00",
      total: "1050.00",
    });
    expect(t).toMatchObject({
      totalDiscount: "0.00",
      totalExclVat: "1000.00",
      totalVat: "50.00",
      totalPayable: "1050.00",
    });
  });

  it("applies line discounts before VAT", () => {
    const t = buildUaeInvoiceTotals([line({ qty: "2", unitPrice: "500", discount: "100" })]);
    expect(t.lines[0]).toMatchObject({ gross: "1000.00", discount: "100.00", net: "900.00", vatAmount: "45.00" });
    expect(t.totalDiscount).toBe("100.00");
    expect(t.totalPayable).toBe("945.00");
  });

  it("charges no VAT on zero-rated and exempt lines but keeps them separate", () => {
    const t = buildUaeInvoiceTotals([
      line(),
      line({ unitPrice: "200", vatCategory: "zero" }),
      line({ unitPrice: "300", vatCategory: "exempt" }),
    ]);
    expect(t.lines[1]).toMatchObject({ vatRatePercent: 0, vatAmount: "0.00" });
    expect(t.lines[2]).toMatchObject({ vatRatePercent: null, vatAmount: "0.00" });
    expect(t.byCategory).toEqual({
      standard: { net: "1000.00", vat: "50.00" },
      zero: { net: "200.00", vat: "0.00" },
      exempt: { net: "300.00", vat: "0.00" },
    });
    expect(t.totalExclVat).toBe("1500.00");
    expect(t.totalPayable).toBe("1550.00");
  });

  it("is fils-exact with decimal quantities and half-up rounding", () => {
    // 1.5 h x 33.33 = 49.995 -> 50.00; VAT 2.50
    const t = buildUaeInvoiceTotals([line({ qty: "1.5", unitPrice: "33.33" })]);
    expect(t.lines[0].gross).toBe("50.00");
    expect(t.lines[0].vatAmount).toBe("2.50");
    // 0.70 x 5% = 0.035 -> 0.04
    expect(buildUaeInvoiceTotals([line({ unitPrice: "0.70" })]).totalVat).toBe("0.04");
  });

  it("keeps fils on very large amounts and sums exactly", () => {
    const t = buildUaeInvoiceTotals([
      line({ unitPrice: "12345678901.23" }),
      line({ unitPrice: "0.01", qty: "3" }),
    ]);
    expect(t.totalExclVat).toBe("12345678901.26");
    expect(t.totalVat).toBe("617283945.06");
    expect(t.totalPayable).toBe("12962962846.32");
  });

  it("accepts grouped and Arabic-Indic numbers, ignores blank lines", () => {
    const t = buildUaeInvoiceTotals([
      line({ unitPrice: "1,000", qty: "١" }),
      { description: "", qty: "", unitPrice: "", discount: "", vatCategory: "standard" },
    ]);
    expect(t.lines).toHaveLength(1);
    expect(t.totalPayable).toBe("1050.00");
  });

  it("treats invalid numbers as zero (validation reports them)", () => {
    const t = buildUaeInvoiceTotals([line({ unitPrice: "abc" })]);
    expect(t.totalPayable).toBe("0.00");
  });
});

const valid = (over: Partial<UaeTaxInvoiceInput> = {}): UaeTaxInvoiceInput => ({
  type: "full",
  title: "Tax Invoice",
  invoiceNumber: "INV-0001",
  issueDate: "2026-11-08",
  supplyDate: "",
  supplier: { name: "Noor Design FZ-LLC", address: "Dubai, UAE", trn: "100123456700003" },
  recipient: {
    name: "Gulf Trading LLC",
    address: "Abu Dhabi, UAE",
    trn: "100987654300003",
    vatRegistered: true,
  },
  lines: [line()],
  ...over,
});

const codes = (input: UaeTaxInvoiceInput) => validateUaeTaxInvoice(input).issues.map((i) => i.code);

describe("validateUaeTaxInvoice — full tax invoice", () => {
  it("accepts a complete invoice", () => {
    expect(validateUaeTaxInvoice(valid())).toEqual({ valid: true, issues: [] });
  });

  it("requires the words Tax Invoice or فاتورة ضريبية", () => {
    expect(codes(valid({ title: "Invoice" }))).toContain("TITLE_MISSING_TAX_INVOICE");
    expect(codes(valid({ title: "فاتورة ضريبية | Tax Invoice" }))).toEqual([]);
  });

  it("requires supplier name, address and a valid TRN", () => {
    const c = codes(valid({ supplier: { name: " ", address: "", trn: "" } }));
    expect(c).toEqual(
      expect.arrayContaining(["SUPPLIER_NAME_REQUIRED", "SUPPLIER_ADDRESS_REQUIRED", "SUPPLIER_TRN_REQUIRED"]),
    );
    expect(codes(valid({ supplier: { name: "A", address: "B", trn: "300123456700003" } }))).toEqual([
      "SUPPLIER_TRN_INVALID",
    ]);
  });

  it("requires recipient name and address, and TRN only when registered", () => {
    expect(
      codes(valid({ recipient: { name: "", address: "", trn: "", vatRegistered: true } })),
    ).toEqual(["RECIPIENT_NAME_REQUIRED", "RECIPIENT_ADDRESS_REQUIRED", "RECIPIENT_TRN_REQUIRED"]);
    expect(
      codes(valid({ recipient: { name: "Ali", address: "Sharjah", trn: "", vatRegistered: false } })),
    ).toEqual([]);
    expect(
      codes(valid({ recipient: { name: "Ali", address: "Sharjah", trn: "123", vatRegistered: false } })),
    ).toEqual(["RECIPIENT_TRN_INVALID"]);
  });

  it("requires a sequential invoice number and valid dates", () => {
    expect(codes(valid({ invoiceNumber: "" }))).toContain("INVOICE_NUMBER_REQUIRED");
    expect(codes(valid({ invoiceNumber: "ABC" }))).toContain("INVOICE_NUMBER_NOT_SEQUENTIAL");
    expect(codes(valid({ issueDate: "" }))).toContain("ISSUE_DATE_REQUIRED");
    expect(codes(valid({ issueDate: "2026-02-30" }))).toContain("ISSUE_DATE_INVALID");
    expect(codes(valid({ supplyDate: "2026-11-01" }))).toEqual([]);
    expect(codes(valid({ supplyDate: "nope" }))).toContain("SUPPLY_DATE_INVALID");
  });

  it("checks every line", () => {
    expect(codes(valid({ lines: [] }))).toContain("LINES_REQUIRED");
    const result = validateUaeTaxInvoice(
      valid({
        lines: [
          line(),
          line({ description: "", qty: "0", unitPrice: "-1", discount: "x" }),
          line({ unitPrice: "100", discount: "150" }),
        ],
      }),
    );
    expect(result.issues).toEqual([
      { code: "LINE_DESCRIPTION_REQUIRED", line: 1 },
      { code: "LINE_QTY_INVALID", line: 1 },
      { code: "LINE_UNIT_PRICE_INVALID", line: 1 },
      { code: "LINE_DISCOUNT_INVALID", line: 1 },
      { code: "LINE_DISCOUNT_EXCEEDS_AMOUNT", line: 2 },
    ]);
  });

  it("rejects totals above the AED 1 trillion cap", () => {
    expect(codes(valid({ lines: [line({ unitPrice: "2000000000000" })] }))).toContain(
      "AMOUNT_TOO_LARGE",
    );
  });
});

describe("validateUaeTaxInvoice — simplified tax invoice", () => {
  const simplified = (over: Partial<UaeTaxInvoiceInput> = {}) =>
    valid({ type: "simplified", title: "Simplified Tax Invoice", ...over });

  it("exposes the AED 10,000 limit for registered recipients", () => {
    expect(UAE_SIMPLIFIED_INVOICE_LIMIT_AED).toBe(10000);
  });

  it("is allowed for unregistered recipients at any amount, without recipient details", () => {
    expect(
      codes(
        simplified({
          invoiceNumber: "",
          recipient: { name: "", address: "", trn: "", vatRegistered: false },
          lines: [line({ unitPrice: "50000" })],
        }),
      ),
    ).toEqual([]);
  });

  it("is allowed for a registered recipient up to AED 10,000 total", () => {
    // 9,523.81 + 5% = 10,000.00
    expect(codes(simplified({ lines: [line({ unitPrice: "9523.81" })] }))).toEqual([]);
  });

  it("is not allowed for a registered recipient above AED 10,000", () => {
    expect(codes(simplified({ lines: [line({ unitPrice: "9523.82" })] }))).toEqual([
      "SIMPLIFIED_NOT_ALLOWED",
    ]);
  });

  it("still needs the supplier details, issue date and line descriptions", () => {
    const c = codes(
      simplified({
        supplier: { name: "", address: "", trn: "" },
        issueDate: "",
        lines: [line({ description: "" })],
        recipient: { name: "", address: "", trn: "", vatRegistered: false },
      }),
    );
    expect(c).toEqual([
      "SUPPLIER_NAME_REQUIRED",
      "SUPPLIER_ADDRESS_REQUIRED",
      "SUPPLIER_TRN_REQUIRED",
      "ISSUE_DATE_REQUIRED",
      "LINE_DESCRIPTION_REQUIRED",
    ]);
  });
});

describe("invoice helpers", () => {
  it("returns the required titles", () => {
    expect(getUaeInvoiceTitle("full", "en")).toBe("Tax Invoice");
    expect(getUaeInvoiceTitle("full", "ar")).toBe("فاتورة ضريبية");
    expect(getUaeInvoiceTitle("simplified", "en")).toBe("Simplified Tax Invoice");
    expect(getUaeInvoiceTitle("simplified", "ar")).toBe("فاتورة ضريبية مبسطة");
    expect(getUaeInvoiceTitle("full", "bilingual")).toBe("فاتورة ضريبية | Tax Invoice");
  });

  it("increments invoice numbers keeping the padding", () => {
    expect(nextUaeInvoiceNumber("INV-0009")).toBe("INV-0010");
    expect(nextUaeInvoiceNumber("2026/099")).toBe("2026/100");
    expect(nextUaeInvoiceNumber("")).toBe("INV-0001");
    expect(nextUaeInvoiceNumber("ABC")).toBe("ABC-0001");
  });
});

describe("getUaeInvoiceWarnings", () => {
  it("warns (without blocking) when the supply date is after the issue date", () => {
    expect(getUaeInvoiceWarnings({ issueDate: "2026-11-09", supplyDate: "2027-05-01" })).toEqual([
      "SUPPLY_DATE_AFTER_ISSUE",
    ]);
  });

  it("does not warn for same-day, earlier or missing supply dates", () => {
    expect(getUaeInvoiceWarnings({ issueDate: "2026-11-09", supplyDate: "2026-11-09" })).toEqual([]);
    expect(getUaeInvoiceWarnings({ issueDate: "2026-11-09", supplyDate: "2026-11-01" })).toEqual([]);
    expect(getUaeInvoiceWarnings({ issueDate: "2026-11-09", supplyDate: "" })).toEqual([]);
    expect(getUaeInvoiceWarnings({ issueDate: "2026-11-09" })).toEqual([]);
  });

  it("ignores invalid dates (validation reports those)", () => {
    expect(getUaeInvoiceWarnings({ issueDate: "bad", supplyDate: "2027-01-01" })).toEqual([]);
    expect(getUaeInvoiceWarnings({ issueDate: "2026-11-09", supplyDate: "2027-02-30" })).toEqual([]);
  });
});
