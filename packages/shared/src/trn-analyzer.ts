import { normalizeSaudiVatNumber, validateSaudiVatNumber } from "./instant-invoice";

export type TrnValidationIssue =
  | "EMPTY"
  | "INVALID_LENGTH"
  | "INVALID_START"
  | "INVALID_END";

export interface TrnAnalysis {
  normalized: string;
  valid: boolean;
  issues: TrnValidationIssue[];
  digitCount: number;
}

export function analyzeSaudiVatNumber(vat: string): TrnAnalysis {
  const normalized = normalizeSaudiVatNumber(vat);
  const issues: TrnValidationIssue[] = [];

  if (!normalized) {
    return { normalized, valid: false, issues: ["EMPTY"], digitCount: 0 };
  }

  if (normalized.length !== 15) {
    issues.push("INVALID_LENGTH");
  }
  if (!normalized.startsWith("3")) {
    issues.push("INVALID_START");
  }
  if (!normalized.endsWith("3")) {
    issues.push("INVALID_END");
  }

  return {
    normalized,
    valid: validateSaudiVatNumber(normalized),
    issues,
    digitCount: normalized.length,
  };
}
