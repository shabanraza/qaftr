/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits → ASCII, for Arabic keyboards. */
function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) =>
    String(d.charCodeAt(0) & 0xf),
  );
}

export function normalizeSaudiVatNumber(vat: string): string {
  return toAsciiDigits(vat).replace(/\D/g, "");
}

/** Saudi VAT number (الرقم الضريبي): 15 digits, starts and ends with 3. */
export function validateSaudiVatNumber(vat: string): boolean {
  const digits = normalizeSaudiVatNumber(vat);
  return digits.length === 15 && digits.startsWith("3") && digits.endsWith("3");
}

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
