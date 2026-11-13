import { TRPCError } from "@trpc/server";

/** Safe error codes exposed to clients (mobile maps these to i18n). */
export const CLIENT_ERROR_CODES = new Set([
  "FREE_INVOICE_LIMIT",
  "INVOICE_NOT_FOUND",
  "CLIENT_NOT_FOUND",
  "BUSINESS_NOT_FOUND",
  "INVALID_INVOICE_TOTALS",
  "INVALID_INVOICE_DRAFT",
  "SELLER_VAT_INVALID",
  "INVOICE_CREATE_FAILED",
  "LOGO_TOO_LARGE",
  "BUSINESS_REQUIRED",
  "INVOICES_LOAD_FAILED",
  // ZATCA EGS onboarding (lib/zatca/onboarding.ts, egs-records.ts)
  "ZATCA_DISABLED",
  "ZATCA_PRO_REQUIRED",
  "EGS_ALREADY_ACTIVE",
  "SELLER_NOT_READY",
  "OTP_INVALID",
  "INDUSTRY_REQUIRED",
  "OTP_REJECTED",
  "CSR_REJECTED",
  "COMPLIANCE_CHECK_FAILED",
  "PRODUCTION_CSID_FAILED",
  "ZATCA_UNAVAILABLE",
]);

const TECHNICAL_PATTERNS = [
  /^Failed query:/,
  /ECONNREFUSED/,
  /password authentication failed/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /invalid input value for enum/i,
  /syntax error at or near/i,
];

export function isTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

export function toClientErrorCode(message: string): string {
  if (CLIENT_ERROR_CODES.has(message)) return message;
  if (message === "Invoice not found") return "INVOICE_NOT_FOUND";
  if (message === "Client not found") return "CLIENT_NOT_FOUND";
  return "INTERNAL_ERROR";
}

/** Business/client profile fields and issue codes (see @zatca/shared zatca-party). */
const PROFILE_FIELD = "(?:name|nameAr|nameEn|vatNumber|crNumber|country|idScheme|idValue|street|buildingNumber|additionalNumber|district|city|postalCode)";
const PROFILE_CODE = "(?:REQUIRED|VAT_OR_ID_REQUIRED|INVALID_VAT|INVALID_CR|INVALID_BUILDING|INVALID_ADDITIONAL|INVALID_POSTAL|INVALID_SCHEME|INVALID_COUNTRY)";
const PROFILE_ERROR_RE = new RegExp(`^INVALID_PROFILE:${PROFILE_FIELD}:${PROFILE_CODE}(?:,${PROFILE_FIELD}:${PROFILE_CODE})*$`);

export function sanitizeClientMessage(message: string): string {
  if (PROFILE_ERROR_RE.test(message)) return message;
  const code = toClientErrorCode(message);
  if (code !== "INTERNAL_ERROR") return code;
  if (isTechnicalErrorMessage(message)) return "INTERNAL_ERROR";
  // Unknown non-technical messages are still hidden from clients.
  return "INTERNAL_ERROR";
}

export function throwNotFound(
  code: "INVOICE_NOT_FOUND" | "CLIENT_NOT_FOUND" | "BUSINESS_NOT_FOUND",
): never {
  throw new TRPCError({ code: "NOT_FOUND", message: code });
}
