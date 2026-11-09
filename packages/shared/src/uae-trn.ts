export type UaeTrnIssue =
  | "EMPTY"
  | "INVALID_LENGTH"
  | "INVALID_PREFIX"
  | "INVALID_CHARACTERS";

export interface UaeTrnAnalysis {
  normalized: string;
  valid: boolean;
  issues: UaeTrnIssue[];
  digitCount: number;
  /** Always true: this checks the TRN pattern only, never FTA registration status. */
  formatOnly: true;
}

export const UAE_TRN_LENGTH = 15;
export const UAE_TRN_PREFIX = "100";

const ARABIC_INDIC_ZERO = 0x0660; // ٠
const PERSIAN_ZERO = 0x06f0; // ۰

/** Converts Arabic-Indic / Persian digits to ASCII and strips spaces, dashes and dots. */
export function normalizeUaeTrn(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - PERSIAN_ZERO))
    .replace(/[\s.\-‐-―−]/g, "");
}

/** Format-only check for a UAE Tax Registration Number (15 digits starting with 100). */
export function analyzeUaeTrn(input: string): UaeTrnAnalysis {
  const normalized = normalizeUaeTrn(input);
  const digitCount = normalized.replace(/\D/g, "").length;

  if (!normalized) {
    return { normalized, valid: false, issues: ["EMPTY"], digitCount: 0, formatOnly: true };
  }

  const issues: UaeTrnIssue[] = [];
  if (/\D/.test(normalized)) issues.push("INVALID_CHARACTERS");
  if (digitCount !== UAE_TRN_LENGTH) issues.push("INVALID_LENGTH");
  if (!normalized.startsWith(UAE_TRN_PREFIX)) issues.push("INVALID_PREFIX");

  return { normalized, valid: issues.length === 0, issues, digitCount, formatOnly: true };
}
