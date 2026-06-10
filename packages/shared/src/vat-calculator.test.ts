import { describe, expect, it } from "vitest";
import { calculateVat } from "./vat-calculator";

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
