import { describe, expect, it } from "vitest";
import { analyzeSaudiVatNumber } from "./trn-analyzer";

describe("analyzeSaudiVatNumber", () => {
  it("accepts a valid TRN", () => {
    const result = analyzeSaudiVatNumber("300000000000003");
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.digitCount).toBe(15);
  });

  it("flags length and digit rules", () => {
    const result = analyzeSaudiVatNumber("210000000000002");
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("INVALID_START");
    expect(result.issues).toContain("INVALID_END");
  });

  it("strips non-digits before analysis", () => {
    const result = analyzeSaudiVatNumber("300-000-000-000-003");
    expect(result.normalized).toBe("300000000000003");
    expect(result.valid).toBe(true);
  });
});
