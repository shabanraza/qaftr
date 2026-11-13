import {
  INSTANT_INVOICE_DRAFT_KEY,
  SAUDI_INVOICE_TYPE_STORAGE_KEY,
  createEmptyDraft,
  isSaudiInvoiceType,
  resolveSaudiInvoiceType,
  type InstantInvoiceDraft,
  type SaudiInvoiceType,
} from "@zatca/shared";

/** Last invoice type the visitor chose (per browser; a convenience only). */
export function loadInvoiceTypePreference(): SaudiInvoiceType {
  if (typeof window === "undefined") return resolveSaudiInvoiceType(null);
  try {
    return resolveSaudiInvoiceType(localStorage.getItem(SAUDI_INVOICE_TYPE_STORAGE_KEY));
  } catch {
    return resolveSaudiInvoiceType(null);
  }
}

export function saveInvoiceTypePreference(type: SaudiInvoiceType): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAUDI_INVOICE_TYPE_STORAGE_KEY, type);
  } catch {
    // storage blocked: the choice simply is not remembered
  }
}

export function loadDraft(): InstantInvoiceDraft {
  const preferred = loadInvoiceTypePreference();
  if (typeof window === "undefined") return createEmptyDraft(preferred);
  try {
    const raw = sessionStorage.getItem(INSTANT_INVOICE_DRAFT_KEY);
    if (!raw) return createEmptyDraft(preferred);
    const draft = JSON.parse(raw) as InstantInvoiceDraft;
    return {
      ...draft,
      clientAddress: draft.clientAddress ?? "",
      supplyDate: draft.supplyDate ?? "",
      invoiceType: isSaudiInvoiceType(draft.invoiceType) ? draft.invoiceType : preferred,
    };
  } catch {
    return createEmptyDraft(preferred);
  }
}

export function saveDraft(draft: InstantInvoiceDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INSTANT_INVOICE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // storage blocked or full: the draft just is not restored on reload
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(INSTANT_INVOICE_DRAFT_KEY);
}

export const PENDING_SAVE_KEY = "qaftr:pending-invoice-save";
const EXPORT_SEQ_KEY = "qaftr:instant-invoice-export-seq";

export function markPendingSave(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_SAVE_KEY, "1");
}

export function clearPendingSave(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_SAVE_KEY);
}

export function consumePendingSave(): boolean {
  if (typeof window === "undefined") return false;
  const pending = sessionStorage.getItem(PENDING_SAVE_KEY);
  if (!pending) return false;
  sessionStorage.removeItem(PENDING_SAVE_KEY);
  return true;
}

export function peekExportSeqNumber(): number {
  if (typeof window === "undefined") return 1;
  const current = parseInt(sessionStorage.getItem(EXPORT_SEQ_KEY) ?? "0", 10);
  return Number.isNaN(current) ? 1 : current + 1;
}

export function getNextExportSeqNumber(): number {
  const next = peekExportSeqNumber();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(EXPORT_SEQ_KEY, String(next));
  }
  return next;
}
