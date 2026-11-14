import { useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ChevronDown, Download, Plus, Trash2 } from 'lucide-react'
import { downloadInvoicePdf } from '#/lib/instant-invoice/invoice-pdf'
import { formatMoney, getInstantInvoiceCopy } from '#/lib/instant-invoice/copy'
import {
  buildCreateInvoiceInput,
  buildEditorPdfInvoice,
  computeEditorTotals,
  deriveInvoiceType,
  editorIssues,
  type EditorBusiness,
  type EditorClient,
  type EditorLine,
} from '#/lib/workspace/invoice-editor'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { InvoicePagePreview } from './InvoicePagePreview'

export type CreateInvoiceInput = ReturnType<typeof buildCreateInvoiceInput>

type Props = {
  lang: MarketingLang
  business: EditorBusiness | null
  clients: EditorClient[]
  /** Next invoice number, for the preview only (the server assigns the real one). */
  nextSeq: number
  zatcaConnected: boolean
  onSave: (input: CreateInvoiceInput, opts: { sendToZatca: boolean }) => Promise<void>
}

const CASH = '__cash__'

function getCopy(lang: MarketingLang) {
  return lang === 'ar'
    ? {
        customer: 'العميل',
        cash: 'عميل نقدي (بدون بيانات)',
        addCustomer: 'إضافة عميل جديد',
        typeStandard: 'فاتورة ضريبية',
        typeSimplified: 'فاتورة ضريبية مبسطة',
        whyStandard: 'لأن العميل لديه رقم ضريبي',
        whySimplified: 'للأفراد والبيع النقدي',
        buyerIncomplete: 'عنوان العميل غير مكتمل، وهو مطلوب في الفاتورة الضريبية.',
        completeCustomer: 'أكمل بيانات العميل',
        noBusiness: 'أكمل ملف المنشأة أولاً لتظهر بياناتك على الفاتورة.',
        openSettings: 'فتح الإعدادات',
        seller: 'من',
        editSeller: 'تعديل',
        items: 'البنود',
        description: 'الوصف',
        qty: 'الكمية',
        price: 'السعر',
        lineTotal: 'الإجمالي',
        descriptionPh: 'مثال: تصميم شعار',
        addLine: 'إضافة بند',
        removeLine: 'حذف البند',
        more: 'خيارات إضافية',
        dueDate: 'تاريخ الاستحقاق',
        supplyDate: 'تاريخ التوريد',
        supplyHint: 'اتركه فارغاً إذا كان التوريد في تاريخ الفاتورة.',
        notes: 'ملاحظات',
        subtotal: 'المجموع قبل الضريبة',
        vat: 'ضريبة القيمة المضافة 15%',
        total: 'الإجمالي شامل الضريبة',
        saveDraft: 'حفظ كمسودة',
        save: 'حفظ الفاتورة',
        saveAndSend: 'حفظ وإرسال إلى زاتكا',
        pdf: 'تحميل PDF',
        edit: 'تعديل',
        preview: 'معاينة',
        previewTitle: 'معاينة الفاتورة كما ستُطبع',
        livePreview: 'معاينة مباشرة — نفس ملف PDF',
        noLines: 'أضف بنداً واحداً على الأقل بسعر.',
        saveFailed: 'تعذر حفظ الفاتورة. حاول مرة أخرى.',
      }
    : {
        customer: 'Customer',
        cash: 'Cash customer (no details)',
        addCustomer: 'Add a new customer',
        typeStandard: 'Tax invoice',
        typeSimplified: 'Simplified tax invoice',
        whyStandard: 'because the customer has a VAT number',
        whySimplified: 'for individuals and cash sales',
        buyerIncomplete: "The customer's address is incomplete. A tax invoice needs it.",
        completeCustomer: 'Complete customer details',
        noBusiness: 'Complete your business profile first so your details appear on the invoice.',
        openSettings: 'Open settings',
        seller: 'From',
        editSeller: 'Edit',
        items: 'Items',
        description: 'Description',
        qty: 'Qty',
        price: 'Price',
        lineTotal: 'Total',
        descriptionPh: 'Logo design',
        addLine: 'Add item',
        removeLine: 'Remove item',
        more: 'More options',
        dueDate: 'Due date',
        supplyDate: 'Supply date',
        supplyHint: 'Leave empty if supply happens on the invoice date.',
        notes: 'Notes',
        subtotal: 'Subtotal',
        vat: 'VAT 15%',
        total: 'Total incl. VAT',
        saveDraft: 'Save draft',
        save: 'Save invoice',
        saveAndSend: 'Save and send to ZATCA',
        pdf: 'Download PDF',
        edit: 'Edit',
        preview: 'Preview',
        previewTitle: 'Invoice preview as it will print',
        livePreview: 'Live preview — same as the PDF',
        noLines: 'Add at least one item with a price.',
        saveFailed: "Couldn't save the invoice. Try again.",
      }
}

let lineCounter = 0
function newLine(): EditorLine {
  lineCounter += 1
  return { id: `line-${lineCounter}-${Date.now()}`, description: '', qty: '1', unitPrice: '' }
}

export function WorkspaceInvoiceEditor({ lang, business, clients, nextSeq, zatcaConnected, onSave }: Props) {
  const copy = getCopy(lang)
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const [clientId, setClientId] = useState<string>(CASH)
  const [lines, setLines] = useState<EditorLine[]>(() => [newLine()])
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [supplyDate, setSupplyDate] = useState('')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [busy, setBusy] = useState<null | 'draft' | 'save' | 'pdf'>(null)
  const [error, setError] = useState<string | null>(null)
  const [issueDate] = useState(() => new Date())
  const tableRef = useRef<HTMLDivElement>(null)

  const client = clients.find((c) => c.id === clientId) ?? null
  const invoiceType = deriveInvoiceType(client)
  const totals = useMemo(() => computeEditorTotals(lines), [lines])
  const issues = editorIssues({ business, client, lines })
  const pdfInvoice = useMemo(
    () =>
      buildEditorPdfInvoice({
        business,
        client,
        lines,
        notes,
        supplyDate,
        issueDate,
        seqNumber: nextSeq,
        cashCustomerName: lang === 'ar' ? 'عميل نقدي' : 'Cash customer',
      }),
    [business, client, lines, notes, supplyDate, issueDate, nextSeq, lang],
  )

  function updateLine(id: string, patch: Partial<EditorLine>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)))
    setError(null)
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()])
    requestAnimationFrame(() => {
      const inputs = tableRef.current?.querySelectorAll<HTMLInputElement>('input[data-field="description"]')
      inputs?.[inputs.length - 1]?.focus()
    })
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length === 1 ? [newLine()] : prev.filter((line) => line.id !== id)))
  }

  async function save(status: 'draft' | 'unpaid') {
    if (!business) return
    if (issues.includes('NO_LINES')) {
      setError(copy.noLines)
      return
    }
    setBusy(status === 'draft' ? 'draft' : 'save')
    setError(null)
    try {
      const input = buildCreateInvoiceInput({ business, client, lines, notes, supplyDate, dueDate, issueDate: new Date(), status })
      await onSave(input, { sendToZatca: status === 'unpaid' && zatcaConnected && !issues.includes('BUYER_INCOMPLETE') })
    } catch (err) {
      // Server error codes (e.g. FREE_INVOICE_LIMIT) have their own message.
      const code = err instanceof Error ? err.message : ''
      setError(getInstantInvoiceCopy(lang).errors[code] ?? copy.saveFailed)
    } finally {
      setBusy(null)
    }
  }

  async function downloadPdf() {
    setBusy('pdf')
    try {
      await downloadInvoicePdf(pdfInvoice, lang)
    } finally {
      setBusy(null)
    }
  }

  const sellerName = business ? (lang === 'en' && business.nameEn ? business.nameEn : business.nameAr) : null
  const canSave = Boolean(business) && busy === null

  const form = (
    <div className="flex flex-col gap-5">
      {!business ? (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {copy.noBusiness}
            <Link to="/workspace/business" search={search} className="font-medium text-primary underline">
              {copy.openSettings}
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {copy.seller}: <span className="font-medium text-foreground">{sellerName}</span>
          </span>
          <Link to="/workspace/business" search={search} className="text-xs text-primary">
            {copy.editSeller}
          </Link>
        </div>
      )}

      <section className="flex flex-col gap-2">
        <label htmlFor="invoice-customer" className="text-sm font-semibold text-foreground">
          {copy.customer}
        </label>
        <div className="flex gap-2">
          <select
            id="invoice-customer"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={CASH}>{copy.cash}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button asChild variant="outline" size="icon" className="size-10 shrink-0" aria-label={copy.addCustomer} title={copy.addCustomer}>
            <Link to="/workspace/clients" search={search} hash="create-client-form">
              <Plus className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" data-testid="invoice-type">
          <span
            className={cn(
              'rounded-md px-2 py-0.5 font-medium',
              invoiceType === 'standard' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground',
            )}
          >
            {invoiceType === 'standard' ? copy.typeStandard : copy.typeSimplified}
          </span>
          {invoiceType === 'standard' ? copy.whyStandard : copy.whySimplified}
        </p>
        {issues.includes('BUYER_INCOMPLETE') ? (
          <p className="flex flex-wrap items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <AlertTriangle className="size-3.5" />
            {copy.buyerIncomplete}
            <Link to="/workspace/clients" search={search} className="font-medium underline">
              {copy.completeCustomer}
            </Link>
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2" ref={tableRef}>
        <h2 className="text-sm font-semibold text-foreground">{copy.items}</h2>
        <ul className="flex flex-col gap-2">
          {lines.map((line, index) => {
            const computed = computeEditorTotals([line]).lineItems[0]
            return (
              <li
                key={line.id}
                className="grid grid-cols-[80px_112px_minmax(0,1fr)_32px] items-center gap-2 rounded-md border border-border p-2"
              >
                <Input
                  data-field="description"
                  aria-label={`${copy.description} ${index + 1}`}
                  placeholder={copy.descriptionPh}
                  value={line.description}
                  onChange={(e) => updateLine(line.id, { description: e.target.value })}
                  className="col-span-4"
                />
                <Input
                  aria-label={`${copy.qty} ${index + 1}`}
                  title={copy.qty}
                  inputMode="decimal"
                  dir="ltr"
                  value={line.qty}
                  onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                />
                <Input
                  aria-label={`${copy.price} ${index + 1}`}
                  inputMode="decimal"
                  dir="ltr"
                  placeholder={copy.price}
                  title={copy.price}
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.id, { unitPrice: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && index === lines.length - 1) {
                      e.preventDefault()
                      addLine()
                    }
                  }}
                />
                <span className="text-end text-sm tabular-nums text-foreground" dir="ltr">
                  {computed ? formatMoney(computed.lineTotal, lang) : '—'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 justify-self-end text-muted-foreground"
                  aria-label={`${copy.removeLine} ${index + 1}`}
                  onClick={() => removeLine(line.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            )
          })}
        </ul>
        <Button type="button" variant="outline" size="sm" className="self-start gap-1.5" onClick={addLine}>
          <Plus className="size-3.5" />
          {copy.addLine}
        </Button>
      </section>

      <details className="group rounded-md border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium">
          {copy.more}
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-4 border-t border-border p-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            {copy.dueDate}
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {copy.supplyDate}
            <Input type="date" value={supplyDate} onChange={(e) => setSupplyDate(e.target.value)} />
            <span className="text-xs text-muted-foreground">{copy.supplyHint}</span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            {copy.notes}
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
      </details>
    </div>
  )

  const renderSummary = (compact: boolean) => (
    <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3')}>
      <dl className="flex flex-col gap-1.5 text-sm" data-testid="invoice-totals">
        <div className={cn('flex justify-between text-muted-foreground', compact && 'hidden')}>
          <dt>{copy.subtotal}</dt>
          <dd className="tabular-nums">{formatMoney(totals.subtotal, lang)}</dd>
        </div>
        <div className={cn('flex justify-between text-muted-foreground', compact && 'hidden')}>
          <dt>{copy.vat}</dt>
          <dd className="tabular-nums">{formatMoney(totals.vatAmount, lang)}</dd>
        </div>
        <div className={cn('flex justify-between text-base font-semibold', !compact && 'border-t border-border pt-1.5')}>
          <dt>{copy.total}</dt>
          <dd className="tabular-nums">{formatMoney(totals.total, lang)}</dd>
        </div>
      </dl>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button className="qaftr-btn-primary flex-1" disabled={!canSave} onClick={() => void save('unpaid')}>
          {busy === 'save' ? <Spinner className="size-4" /> : null}
          {zatcaConnected && !issues.includes('BUYER_INCOMPLETE') ? copy.saveAndSend : copy.save}
        </Button>
        <Button variant="outline" disabled={!canSave} onClick={() => void save('draft')}>
          {busy === 'draft' ? <Spinner className="size-4" /> : null}
          {copy.saveDraft}
        </Button>
      </div>
    </div>
  )

  const preview = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{copy.livePreview}</span>
        <Button variant="ghost" size="sm" className="gap-1.5" disabled={busy !== null || totals.lineItems.length === 0} onClick={() => void downloadPdf()}>
          {busy === 'pdf' ? <Spinner className="size-3.5" /> : <Download className="size-3.5" />}
          {copy.pdf}
        </Button>
      </div>
      <InvoicePagePreview invoice={pdfInvoice} lang={lang} title={copy.previewTitle} includeQr={totals.lineItems.length > 0 && Boolean(business?.vatNumber)} />
    </div>
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex gap-1 border-b border-border bg-card p-2 lg:hidden" role="tablist">
        {(['edit', 'preview'] as const).map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 rounded-md py-2 text-sm font-medium',
              tab === id ? 'bg-accent text-foreground' : 'text-muted-foreground',
            )}
          >
            {id === 'edit' ? copy.edit : copy.preview}
          </button>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]">
        <div className={cn('flex flex-col gap-6 p-5', tab === 'preview' && 'hidden lg:flex')}>
          {form}
          <div className="hidden lg:block">{renderSummary(false)}</div>
        </div>
        <div className={cn('border-border bg-muted/30 p-5 lg:border-s', tab === 'edit' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-5">{preview}</div>
        </div>
      </div>
      <div className="sticky bottom-0 border-t border-border bg-card p-3 lg:hidden">{renderSummary(true)}</div>
    </div>
  )
}
