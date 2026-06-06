import { TRPCError } from "@trpc/server";

/** Safe error codes exposed to clients (mobile maps these to i18n). */
export const CLIENT_ERROR_CODES = new Set([
  "FREE_INVOICE_LIMIT",
  "INVOICE_NOT_FOUND",
  "CLIENT_NOT_FOUND",
  "LOGO_TOO_LARGE",
  "BUSINESS_REQUIRED",
  "INVOICES_LOAD_FAILED",
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

export function sanitizeClientMessage(message: string): string {
  const code = toClientErrorCode(message);
  if (code !== "INTERNAL_ERROR") return code;
  if (isTechnicalErrorMessage(message)) return "INTERNAL_ERROR";
  // Unknown non-technical messages are still hidden from clients.
  return "INTERNAL_ERROR";
}

export function throwNotFound(code: "INVOICE_NOT_FOUND" | "CLIENT_NOT_FOUND"): never {
  throw new TRPCError({ code: "NOT_FOUND", message: code });
}
