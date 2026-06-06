import type { TranslationTree } from "@/i18n/translations";

type TrpcErrorLike = { message: string } | null | undefined;

export function getTrpcErrorMessage(
  error: TrpcErrorLike,
  t: TranslationTree,
  fallback: string,
): string {
  if (!error?.message) return fallback;

  switch (error.message) {
    case "FREE_INVOICE_LIMIT":
      return t.invoiceNew.limitReached;
    case "INVOICE_NOT_FOUND":
      return t.invoiceDetail.loadError;
    case "INVOICES_LOAD_FAILED":
    case "INTERNAL_ERROR":
      return fallback;
    case "CLIENT_NOT_FOUND":
      return t.clients.loadError;
    case "LOGO_TOO_LARGE":
      return t.onboarding.logoTooLarge;
    case "BUSINESS_REQUIRED":
      return t.invoiceNew.businessRequired;
    default:
      return fallback;
  }
}

export function alertTrpcError(
  error: TrpcErrorLike,
  t: TranslationTree,
  fallback: string,
  alert: (title: string, message: string) => void,
) {
  alert(t.common.error, getTrpcErrorMessage(error, t, fallback));
}
