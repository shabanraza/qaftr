import { describe, expect, it } from "vitest";
import { analyzeUaeTrn } from "./index";

describe("analyzeUaeTrn", () => {
  it("accepts a 15-digit TRN that starts with 100", () => {
    expect(analyzeUaeTrn("100123456700003")).toEqual({
      normalized: "100123456700003",
      valid: true,
      issues: [],
      digitCount: 15,
      formatOnly: true,
    });
  });

  it("normalizes spaces and dashes", () => {
    const result = analyzeUaeTrn(" 100-1234-5670 0003 ");
    expect(result.normalized).toBe("100123456700003");
    expect(result.valid).toBe(true);
  });

  it("normalizes Arabic-Indic and Persian digits", () => {
    expect(analyzeUaeTrn("١٠٠١٢٣٤٥٦٧٠٠٠٠٣").normalized).toBe("100123456700003");
    expect(analyzeUaeTrn("۱۰۰۱۲۳۴۵۶۷۰۰۰۰۳").valid).toBe(true);
  });

  it("reports EMPTY for blank input", () => {
    expect(analyzeUaeTrn("  - ")).toEqual({
      normalized: "",
      valid: false,
      issues: ["EMPTY"],
      digitCount: 0,
      formatOnly: true,
    });
  });

  it("reports INVALID_LENGTH for too short or too long", () => {
    expect(analyzeUaeTrn("10012345").issues).toEqual(["INVALID_LENGTH"]);
    expect(analyzeUaeTrn("1001234567000031").issues).toEqual(["INVALID_LENGTH"]);
  });

  it("reports INVALID_PREFIX when it does not start with 100", () => {
    const result = analyzeUaeTrn("300123456700003");
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(["INVALID_PREFIX"]);
  });

  it("can report several issues at once", () => {
    expect(analyzeUaeTrn("2001").issues).toEqual(["INVALID_LENGTH", "INVALID_PREFIX"]);
  });

  it("rejects letters and other symbols instead of silently dropping them", () => {
    const result = analyzeUaeTrn("10012345670000A");
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("INVALID_CHARACTERS");
  });

  it("does not treat a Saudi VAT number as a UAE TRN", () => {
    expect(analyzeUaeTrn("310123456700003").valid).toBe(false);
  });

  it("counts digits, not characters, for the length rule", () => {
    const result = analyzeUaeTrn("10012345670000A");
    expect(result.digitCount).toBe(14);
    expect(result.issues).toEqual(["INVALID_CHARACTERS", "INVALID_LENGTH"]);
  });

  it("accepts dots as separators", () => {
    expect(analyzeUaeTrn("100.1234.5670.0003").valid).toBe(true);
  });
});
