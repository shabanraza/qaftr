import { useState } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { computeInvoiceTotals } from '@zatca/shared'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { formatMoney } from '#/lib/instant-invoice/copy'
import type { MarketingLang } from '#/lib/marketing/lang'
import { cn } from '#/lib/utils'

export interface NoteLine {
  description: string
  qty: string
  unitPrice: string
}

export interface NoteInput {
  kind: 'credit-note' | 'debit-note'
  reason: string
  /** Omitted for a credit note that cancels the whole invoice. */
  lines?: NoteLine[]
}

const TEXT = {
  ar: {
    credit: 'إشعار دائن',
    creditSub: 'يخفض مبلغ الفاتورة (مرتجع، خصم، إلغاء)',
    debit: 'إشعار مدين',
    debitSub: 'يضيف مبلغًا على الفاتورة',
    whole: 'الفاتورة كاملة',
    part: 'جزء من الفاتورة',
    description: 'الوصف',
    qty: 'الكمية',
    unitPrice: 'سعر الوحدة',
    remove: 'حذف البند',
    addLine: 'إضافة بند',
    total: 'إجمالي الإشعار شامل الضريبة',
    reason: 'سبب الإشعار',
    reasonRequired: 'اكتب سبب الإشعار.',
    linesInvalid: 'كل بند يحتاج وصفًا وكمية وسعرًا أكبر من صفر.',
    issueCredit: 'إصدار إشعار دائن',
    issueDebit: 'إصدار إشعار مدين',
    sending: 'جارٍ التوقيع والإرسال…',
    hint: 'يُرسل الإشعار إلى هيئة الزكاة فور إصداره ولا يمكن التراجع عنه.',
    cancel: 'إلغاء',
  },
  en: {
    credit: 'Credit note',
    creditSub: 'Reduces the invoice (return, discount, cancellation)',
    debit: 'Debit note',
    debitSub: 'Adds an amount to the invoice',
    whole: 'Whole invoice',
    part: 'Part of the invoice',
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit price',
    remove: 'Remove line',
    addLine: 'Add line',
    total: 'Note total incl. VAT',
    reason: 'Reason for the note',
    reasonRequired: 'Enter a reason.',
    linesInvalid: 'Each line needs a description, and a quantity and price above zero.',
    issueCredit: 'Issue credit note',
    issueDebit: 'Issue debit note',
    sending: 'Signing and sending…',
    hint: 'The note is sent to ZATCA as soon as it is issued and cannot be undone.',
    cancel: 'Cancel',
  },
}

const blank = (): NoteLine => ({ description: '', qty: '1', unitPrice: '' })
/** Stored decimals come back as "2.000"; show them as typed ("2"). */
const tidy = (v: string) => (Number.isFinite(Number(v)) && v.trim() !== '' ? String(Number(v)) : v)
const prefill = (ls: NoteLine[]) => ls.map((l) => ({ ...l, qty: tidy(l.qty), unitPrice: tidy(l.unitPrice) }))
const positive = (v: string) => Number(v.replace(',', '.')) > 0

function Choice({ name, checked, label, sub, onChange }: { name: string; checked: boolean; label: string; sub?: string; onChange: () => void }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm',
        checked ? 'border-primary bg-background' : 'border-border/80',
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 accent-[var(--primary)]" />
      <span>
        <span className="font-medium text-foreground">{label}</span>
        {sub ? <span className="block text-xs text-muted-foreground">{sub}</span> : null}
      </span>
    </label>
  )
}

export function ZatcaNoteForm({
  lang,
  originalLines,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  lang: MarketingLang
  originalLines: NoteLine[]
  pending: boolean
  error: string | null
  onSubmit: (input: NoteInput) => void
  onCancel: () => void
}) {
  const t = TEXT[lang]
  const [kind, setKind] = useState<NoteInput['kind']>('credit-note')
  const [whole, setWhole] = useState(true)
  const [lines, setLines] = useState<NoteLine[]>(() => prefill(originalLines))
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [linesError, setLinesError] = useState<string | null>(null)

  const usesLines = kind === 'debit-note' || !whole
  const total = computeInvoiceTotals(usesLines ? lines : originalLines).total

  function chooseKind(next: NoteInput['kind']) {
    setKind(next)
    setLinesError(null)
    setLines(next === 'debit-note' ? [blank()] : prefill(originalLines))
  }

  function update(i: number, patch: Partial<NoteLine>) {
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  }

  function submit() {
    const reasonOk = Boolean(reason.trim())
    const linesOk = !usesLines || (lines.length > 0 && lines.every((l) => l.description.trim() && positive(l.qty) && positive(l.unitPrice)))
    setReasonError(reasonOk ? null : t.reasonRequired)
    setLinesError(linesOk ? null : t.linesInvalid)
    if (!reasonOk || !linesOk) return
    onSubmit({
      kind,
      reason: reason.trim(),
      ...(usesLines ? { lines: lines.map((l) => ({ description: l.description.trim(), qty: l.qty, unitPrice: l.unitPrice })) } : {}),
    })
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg bg-muted/60 p-3" data-testid="zatca-note-form">
      <div className="grid gap-2 sm:grid-cols-2">
        <Choice name="note-kind" checked={kind === 'credit-note'} label={t.credit} sub={t.creditSub} onChange={() => chooseKind('credit-note')} />
        <Choice name="note-kind" checked={kind === 'debit-note'} label={t.debit} sub={t.debitSub} onChange={() => chooseKind('debit-note')} />
      </div>

      {kind === 'credit-note' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice name="note-scope" checked={whole} label={t.whole} onChange={() => setWhole(true)} />
          <Choice name="note-scope" checked={!whole} label={t.part} onChange={() => setWhole(false)} />
        </div>
      ) : null}

      {usesLines ? (
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} data-testid="note-line" className="grid grid-cols-[1fr_4.5rem_6rem_auto] items-end gap-2">
              <Field>
                <FieldLabel htmlFor={`note-desc-${i}`} className={cn(i > 0 && 'sr-only')}>
                  {t.description}
                </FieldLabel>
                <Input id={`note-desc-${i}`} value={line.description} maxLength={500} onChange={(e) => update(i, { description: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`note-qty-${i}`} className={cn(i > 0 && 'sr-only')}>
                  {t.qty}
                </FieldLabel>
                <Input id={`note-qty-${i}`} dir="ltr" inputMode="decimal" value={line.qty} onChange={(e) => update(i, { qty: e.target.value })} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`note-price-${i}`} className={cn(i > 0 && 'sr-only')}>
                  {t.unitPrice}
                </FieldLabel>
                <Input id={`note-price-${i}`} dir="ltr" inputMode="decimal" value={line.unitPrice} onChange={(e) => update(i, { unitPrice: e.target.value })} />
              </Field>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={t.remove}
                disabled={lines.length === 1}
                onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
              >
                <Trash2Icon className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => setLines((ls) => [...ls, blank()])}>
            <PlusIcon className="size-3.5" aria-hidden />
            {t.addLine}
          </Button>
          {linesError ? <p className="text-sm text-destructive">{linesError}</p> : null}
        </div>
      ) : null}

      <p className="flex items-center justify-between text-sm" data-testid="note-total">
        <span className="text-muted-foreground">{t.total}</span>
        <span className="font-semibold tabular-nums text-foreground">{formatMoney(total, lang)}</span>
      </p>

      <Field data-invalid={Boolean(reasonError)}>
        <FieldLabel htmlFor="note-reason">{t.reason}</FieldLabel>
        <Input id="note-reason" value={reason} maxLength={500} aria-invalid={Boolean(reasonError)} onChange={(e) => setReason(e.target.value)} />
        {reasonError ? <FieldError>{reasonError}</FieldError> : null}
      </Field>

      <p className="text-xs text-muted-foreground">{t.hint}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant={kind === 'credit-note' ? 'destructive' : 'default'} disabled={pending} onClick={submit}>
          {pending ? t.sending : kind === 'credit-note' ? t.issueCredit : t.issueDebit}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onCancel}>
          {t.cancel}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
