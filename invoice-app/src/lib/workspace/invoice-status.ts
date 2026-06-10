/**
 * Shared status badge color tokens for invoice status badges.
 * Used consistently across workspace list views and detail pages.
 */
export const invoiceStatusTone: Record<string, string> = {
  draft: 'border-border bg-background text-muted-foreground',
  unpaid: 'border-[var(--qaftr-gold)]/40 bg-[var(--qaftr-gold)]/10 text-primary',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  overdue: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function renderInvoiceStatus(status: string, lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    if (status === 'paid') return 'مدفوعة'
    if (status === 'overdue') return 'متأخرة'
    if (status === 'draft') return 'مسودة'
    return 'غير مدفوعة'
  }
  if (status === 'paid') return 'Paid'
  if (status === 'overdue') return 'Overdue'
  if (status === 'draft') return 'Draft'
  return 'Unpaid'
}
