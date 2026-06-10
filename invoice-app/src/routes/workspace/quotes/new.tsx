import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Field, FieldLabel, FieldGroup } from '#/components/ui/field'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { formatMoney } from '#/lib/instant-invoice/copy'

type QuoteLineItemDraft = {
  id: string
  description: string
  qty: string
  unitPrice: string
}

export const Route = createFileRoute('/workspace/quotes/new')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.business.get.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.clients.list.queryOptions()),
    ])
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'عرض سعر جديد — قافتر' : 'New Quote — Qaftr',
      description:
        lang === 'ar'
          ? 'أنشئ عرض سعر جديد داخل مكتب قافتر.'
          : 'Create a new quote inside the Qaftr workspace.',
      path: '/workspace/quotes/new',
      lang,
    })
  },
  component: WorkspaceNewQuotePage,
})

function WorkspaceNewQuotePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const isArabic = lang === 'ar'
  const navigate = useNavigate()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  // Load backend data
  const { data: business } = useQuery(trpc.business.get.queryOptions())
  const { data: clients = [] } = useQuery(trpc.clients.list.queryOptions())

  // Local Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('manual')
  const [manualClientName, setManualClientName] = useState('')
  const [manualClientVat, setManualClientVat] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<QuoteLineItemDraft[]>([
    { id: crypto.randomUUID(), description: '', qty: '1', unitPrice: '' },
  ])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-populate manual inputs if client is selected
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedClientId(id)
    if (id !== 'manual') {
      const selected = clients.find((c) => c.id === id)
      if (selected) {
        setManualClientName(selected.name)
        setManualClientVat(selected.vatNumber || '')
      }
    } else {
      setManualClientName('')
      setManualClientVat('')
    }
  }

  // Add/remove line items
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: '', qty: '1', unitPrice: '' },
    ])
  }

  const removeLineItem = (id: string) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev))
  }

  const updateLineItem = (id: string, patch: Partial<QuoteLineItemDraft>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0
    const items = lineItems.map((item, index) => {
      const q = parseFloat(item.qty) || 0
      const p = parseFloat(item.unitPrice) || 0
      const lineTotal = (q * p).toFixed(2)
      subtotal += q * p
      return {
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal,
        sortOrder: index,
      }
    })
    const vatAmount = (subtotal * 0.15).toFixed(2)
    const total = (subtotal * 1.15).toFixed(2)
    return {
      lineItems: items,
      subtotal: subtotal.toFixed(2),
      vatAmount,
      total,
    }
  }, [lineItems])

  const createQuoteMutation = useMutation(trpc.quotes.create.mutationOptions())
  const createClientMutation = useMutation(trpc.clients.create.mutationOptions())

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) {
      setErrorMsg(isArabic ? 'يرجى إكمال بيانات المنشأة أولاً.' : 'Please complete business profile first.')
      return
    }

    if (!manualClientName.trim()) {
      setErrorMsg(isArabic ? 'اسم العميل مطلوب.' : 'Client name is required.')
      return
    }

    const invalidItem = lineItems.find((item) => !item.description.trim() || !item.unitPrice || parseFloat(item.unitPrice) <= 0)
    if (invalidItem) {
      setErrorMsg(isArabic ? 'يرجى ملء البنود وتحديد سعر صحيح أكبر من الصفر.' : 'Please fill all line items with a valid price greater than zero.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      let clientId = selectedClientId === 'manual' ? null : selectedClientId

      // If client is typed manually, create the client in the DB so it is saved for future reuse
      if (selectedClientId === 'manual') {
        const newClient = await createClientMutation.mutateAsync({
          name: manualClientName.trim(),
          vatNumber: manualClientVat.trim() || undefined,
        })
        clientId = newClient.id
      }

      await createQuoteMutation.mutateAsync({
        businessId: business.id,
        clientId: clientId || undefined,
        issueDate: new Date().toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        notes: notes.trim() || undefined,
        currency: 'SAR',
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        lineItems: totals.lineItems,
      })

      void queryClient.invalidateQueries(trpc.quotes.list.queryFilter())
      void navigate({ to: '/workspace/quotes', search })
    } catch (err) {
      console.error(err)
      setErrorMsg(isArabic ? 'حدث خطأ أثناء حفظ عرض السعر.' : 'An error occurred while saving the quote.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copy = isArabic
    ? {
        title: 'عرض سعر جديد',
        subtitle: 'إنشاء وحفظ عروض الأسعار داخل مساحة العمل.',
        back: 'العودة',
        businessTitle: 'بيانات المنشأة (البائع)',
        clientTitle: 'بيانات العميل',
        selectClient: 'اختر عميلاً سابقاً',
        manualClient: 'كتابة بيانات العميل يدوياً',
        clientName: 'اسم العميل',
        clientVat: 'الرقم الضريبي للعميل (اختياري)',
        itemsTitle: 'البنود والخدمات',
        itemN: (n: number) => `البند #${n}`,
        removeItem: 'حذف البند',
        itemDescription: 'وصف البند أو الخدمة',
        itemQty: 'الكمية',
        itemPrice: 'سعر الوحدة',
        addItem: 'إضافة بند جديد',
        validUntil: 'صلاحية العرض حتى تاريخ',
        notes: 'ملاحظات وشروط إضافية',
        save: 'حفظ عرض السعر',
        saving: 'جاري الحفظ…',
        totals: {
          subtotal: 'الإجمالي قبل الضريبة',
          vat: 'الضريبة 15٪',
          total: 'الإجمالي المستحق',
        },
      }
    : {
        title: 'New Quote',
        subtitle: 'Create and save quotes inside the workspace.',
        back: 'Back',
        businessTitle: 'Seller Business Details',
        clientTitle: 'Client Details',
        selectClient: 'Select saved client',
        manualClient: 'Manual entry',
        clientName: 'Client name',
        clientVat: 'Client VAT number (optional)',
        itemsTitle: 'Line Items',
        itemN: (n: number) => `Item #${n}`,
        removeItem: 'Delete item',
        itemDescription: 'Item description or service',
        itemQty: 'Qty',
        itemPrice: 'Unit price',
        addItem: 'Add item',
        validUntil: 'Valid until date',
        notes: 'Additional notes or terms',
        save: 'Save Quote',
        saving: 'Saving…',
        totals: {
          subtotal: 'Subtotal (excl. VAT)',
          vat: 'VAT 15%',
          total: 'Total amount',
        },
      }

  return (
    <WorkspaceShell
      lang={lang}
      active="quotes"
      title={copy.title}
      subtitle={copy.subtitle}
      actions={
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/workspace/quotes" search={search}>
            {isArabic ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
            {copy.back}
          </Link>
        </Button>
      }
    >
      <form onSubmit={handleSave} className="p-5 max-w-4xl space-y-6">
        {errorMsg ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        {/* 1. Business Profile Readonly info */}
        <Card className="border-border/80 bg-muted/20 py-4 shadow-none">
          <CardHeader className="px-5 pb-0 pt-2">
            <CardTitle className="text-sm text-primary">{copy.businessTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pt-3">
            {business ? (
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">{isArabic ? 'الاسم: ' : 'Name: '}</span>
                  <span className="text-foreground">{business.nameAr}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">{isArabic ? 'الرقم الضريبي: ' : 'VAT Number: '}</span>
                  <span className="text-foreground">{business.vatNumber || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-destructive">
                {isArabic ? 'لم يتم العثور على منشأة مفعلة. يرجى تهيئة الملف الشخصي.' : 'No active business setup found.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 2. Client Selection & Details */}
        <Card className="border-border/80 bg-muted/20 py-4 shadow-none">
          <CardHeader className="px-5 pb-0 pt-2">
            <CardTitle className="text-sm text-primary">{copy.clientTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pt-4 space-y-4">
            {clients.length ? (
              <Field>
                <FieldLabel htmlFor="client-select">{copy.selectClient}</FieldLabel>
                <select
                  id="client-select"
                  value={selectedClientId}
                  onChange={handleClientChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="manual">{copy.manualClient}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="client-name">{copy.clientName}</FieldLabel>
                <Input
                  id="client-name"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  disabled={selectedClientId !== 'manual'}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-vat">{copy.clientVat}</FieldLabel>
                <Input
                  id="client-vat"
                  value={manualClientVat}
                  onChange={(e) => setManualClientVat(e.target.value)}
                  disabled={selectedClientId !== 'manual'}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* 3. Line Items */}
        <Card className="border-border/80 bg-muted/20 py-4 shadow-none">
          <CardHeader className="px-5 pb-0 pt-2">
            <CardTitle className="text-sm text-primary">{copy.itemsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pt-4 space-y-4">
            {lineItems.map((item, index) => (
              <Card key={item.id} className="p-4 relative border-border bg-card shadow-none">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground">{copy.itemN(index + 1)}</span>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeLineItem(item.id)}
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      {copy.removeItem}
                    </Button>
                  )}
                </div>
                <FieldGroup className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                      placeholder={copy.itemDescription}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.qty}
                      onChange={(e) => updateLineItem(item.id, { qty: e.target.value })}
                      placeholder={copy.itemQty}
                      type="number"
                      step="any"
                      min="0.001"
                      required
                    />
                    <Input
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, { unitPrice: e.target.value })}
                      placeholder={copy.itemPrice}
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>
                </FieldGroup>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={addLineItem}
            >
              <Plus className="size-4 mr-1.5" />
              {copy.addItem}
            </Button>
          </CardContent>
        </Card>

        {/* 4. Dates & Notes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="valid-until">{copy.validUntil}</FieldLabel>
            <Input
              id="valid-until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="notes">{copy.notes}</FieldLabel>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-10 max-h-32"
            />
          </Field>
        </div>

        {/* 5. Totals Overview & Submit */}
        <Card className="border-border">
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{copy.totals.subtotal}</span>
              <span className="font-semibold tabular-nums">{formatMoney(totals.subtotal, lang)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-border pb-3">
              <span className="text-muted-foreground">{copy.totals.vat}</span>
              <span className="font-semibold tabular-nums">{formatMoney(totals.vatAmount, lang)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-primary">
              <span>{copy.totals.total}</span>
              <span className="tabular-nums">{formatMoney(totals.total, lang)}</span>
            </div>
          </CardContent>
          <CardFooter className="p-5 bg-muted/10 border-t border-border flex justify-end">
            <Button type="submit" disabled={isSubmitting || !business} className="qaftr-btn-primary w-full sm:w-auto">
              {isSubmitting ? copy.saving : copy.save}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </WorkspaceShell>
  )
}
