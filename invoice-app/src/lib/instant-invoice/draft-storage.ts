import {
  INSTANT_INVOICE_DRAFT_KEY,
  createEmptyDraft,
  type InstantInvoiceDraft,
} from "@zatca/shared";

export function loadDraft(): InstantInvoiceDraft {
  if (typeof window === "undefined") return createEmptyDraft();
  try {
    const raw = sessionStorage.getItem(INSTANT_INVOICE_DRAFT_KEY);
    if (!raw) return createEmptyDraft();
    return JSON.parse(raw) as InstantInvoiceDraft;
  } catch {
    return createEmptyDraft();
  }
}

export function saveDraft(draft: InstantInvoiceDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INSTANT_INVOICE_DRAFT_KEY, JSON.stringify(draft));
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
