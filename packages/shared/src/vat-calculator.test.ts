import { describe, expect, it } from "vitest";
import { MAX_VAT_AMOUNT, SAUDI_VAT_RATE, UAE_VAT_RATE, calculateVat } from "./index";

describe("calculateVat with a custom rate (UAE 5%)", () => {
  it("exposes the UAE and Saudi rates", () => {
    expect(UAE_VAT_RATE).toBe(0.05);
    expect(SAUDI_VAT_RATE).toBe(0.15);
  });

  it("adds 5% to an exclusive amount", () => {
    expect(calculateVat(1000, "exclusive", UAE_VAT_RATE)).toEqual({
      mode: "exclusive",
      inputAmount: "1000.00",
      subtotal: "1000.00",
      vatAmount: "50.00",
      total: "1050.00",
    });
  });

  it("extracts 5% from an inclusive amount", () => {
    expect(calculateVat(1050, "inclusive", UAE_VAT_RATE)).toEqual({
      mode: "inclusive",
      inputAmount: "1050.00",
      subtotal: "1000.00",
      vatAmount: "50.00",
      total: "1050.00",
    });
  });

  it("rounds inclusive splits to fils and keeps subtotal + VAT = total", () => {
    const result = calculateVat(1000, "inclusive", UAE_VAT_RATE)!;
    expect(result.subtotal).toBe("952.38");
    expect(result.vatAmount).toBe("47.62");
    expect(Number(result.subtotal) + Number(result.vatAmount)).toBeCloseTo(1000, 10);
  });

  it("rounds half a fils up despite floating-point error", () => {
    // 0.70 * 0.05 is 0.034999999... in binary floating point
    expect(calculateVat(0.7, "exclusive", UAE_VAT_RATE)?.vatAmount).toBe("0.04");
    expect(calculateVat(0.7, "exclusive", UAE_VAT_RATE)?.total).toBe("0.74");
    expect(calculateVat(50.3, "exclusive", UAE_VAT_RATE)?.vatAmount).toBe("2.52");
  });

  it("supports a zero rate", () => {
    expect(calculateVat(100, "inclusive", 0)?.vatAmount).toBe("0.00");
  });

  it("returns null for an invalid rate", () => {
    expect(calculateVat(100, "exclusive", -0.05)).toBeNull();
    expect(calculateVat(100, "exclusive", Number.NaN)).toBeNull();
    expect(calculateVat(100, "exclusive", 1.5)).toBeNull();
  });
});

describe("calculateVat", () => {
  it("adds 15% VAT to exclusive amount", () => {
    const result = calculateVat(1000, "exclusive");
    expect(result).toEqual({
      mode: "exclusive",
      inputAmount: "1000.00",
      subtotal: "1000.00",
      vatAmount: "150.00",
      total: "1150.00",
    });
  });

  it("extracts VAT from inclusive amount", () => {
    const result = calculateVat(1150, "inclusive");
    expect(result).toEqual({
      mode: "inclusive",
      inputAmount: "1150.00",
      subtotal: "1000.00",
      vatAmount: "150.00",
      total: "1150.00",
    });
  });

  it("returns null for invalid amounts", () => {
    expect(calculateVat(-1, "exclusive")).toBeNull();
    expect(calculateVat(Number.NaN, "inclusive")).toBeNull();
  });
});

describe("calculateVat precision for large amounts", () => {
  const sumsUp = (r: { subtotal: string; vatAmount: string; total: string }) =>
    Math.round((Number(r.subtotal) + Number(r.vatAmount)) * 100) ===
    Math.round(Number(r.total) * 100);

  it("keeps fils on 12,345,678,901.23 AED", () => {
    const r = calculateVat(12345678901.23, "exclusive", UAE_VAT_RATE)!;
    expect(r.subtotal).toBe("12345678901.23");
    expect(r.vatAmount).toBe("617283945.06");
    expect(r.total).toBe("12962962846.29");
    expect(sumsUp(r)).toBe(true);
  });

  it("keeps fils on 10,000,000,000.05 AED", () => {
    const r = calculateVat(10000000000.05, "exclusive", UAE_VAT_RATE)!;
    expect(r.subtotal).toBe("10000000000.05");
    expect(r.vatAmount).toBe("500000000.00");
    expect(r.total).toBe("10500000000.05");
    const inc = calculateVat(10000000000.05, "inclusive", UAE_VAT_RATE)!;
    expect(inc.total).toBe("10000000000.05");
    expect(sumsUp(inc)).toBe(true);
  });

  it("still rounds 0.70 at 5% to 0.04 and 1.005 to 1.01", () => {
    expect(calculateVat(0.7, "exclusive", UAE_VAT_RATE)?.vatAmount).toBe("0.04");
    expect(calculateVat(1.005, "exclusive", 0)?.subtotal).toBe("1.01");
  });

  it("rejects amounts above the cap", () => {
    expect(MAX_VAT_AMOUNT).toBe(1e12);
    expect(calculateVat(1e12, "exclusive", UAE_VAT_RATE)).not.toBeNull();
    expect(calculateVat(1e12 + 1, "exclusive", UAE_VAT_RATE)).toBeNull();
  });
});
