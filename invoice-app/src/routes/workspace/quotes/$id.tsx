import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Skeleton } from '#/components/ui/skeleton'
import { ArrowLeft, ArrowRight, FileCheck, CheckCircle2, XCircle, Trash2, ArrowUpRight } from 'lucide-react'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { formatMoney } from '#/lib/instant-invoice/copy'
import { quoteStatusTone, renderQuoteStatus } from './index'

export const Route = createFileRoute('/workspace/quotes/$id')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(context.trpc.quotes.get.queryOptions({ id: params.id }))
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'تفاصيل عرض السعر — قافتر' : 'Quote Detail — Qaftr',
      description:
        lang === 'ar'
          ? 'عرض وإدارة عرض السعر المحفوظ.'
          : 'View and manage your saved quote details.',
      path: '/workspace/quotes',
      lang,
    })
  },
  component: WorkspaceQuoteDetailPage,
})

function WorkspaceQuoteDetailPage() {
  const { id } = Route.useParams()
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const isArabic = lang === 'ar'
  const navigate = useNavigate()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  const { data: quote, isLoading } = useQuery(trpc.quotes.get.queryOptions({ id }))

  const statusMutation = useMutation({
    ...trpc.quotes.updateStatus.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.quotes.get.queryFilter({ id }))
      void queryClient.invalidateQueries(trpc.quotes.list.queryFilter())
    },
  })

  const convertMutation = useMutation({
    ...trpc.quotes.convertToInvoice.mutationOptions(),
    onSuccess: (result) => {
      void queryClient.invalidateQueries(trpc.quotes.get.queryFilter({ id }))
      void queryClient.invalidateQueries(trpc.quotes.list.queryFilter())
      void queryClient.invalidateQueries(trpc.invoices.list.queryFilter())
      void navigate({
        to: '/workspace/invoices/$id',
        params: { id: result.id },
        search,
      })
    },
  })

  const deleteMutation = useMutation({
    ...trpc.quotes.delete.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.quotes.list.queryFilter())
      void navigate({ to: '/workspace/quotes', search })
    },
  })

  const handleConvert = async () => {
    setIsConverting(true)
    setErrorMsg(null)
    try {
      await convertMutation.mutateAsync({ id })
    } catch (err) {
      console.error(err)
      setErrorMsg(isArabic ? 'فشل تحويل عرض السعر إلى فاتورة.' : 'Failed to convert quote to invoice.')
    } finally {
      setIsConverting(false)
    }
  }

  const copy = isArabic
    ? {
        title: quote ? `QTE-${String(quote.seqNumber).padStart(3, '0')}` : 'تفاصيل عرض السعر',
        back: 'عروض الأسعار',
        loading: 'جاري التحميل…',
        convert: 'تحويل إلى فاتورة',
        converting: 'جاري التحويل…',
        convertedLink: 'عرض الفاتورة المرتبطة',
        markPending: 'إرسال العرض (معلق)',
        markAccepted: 'قبول العرض',
        markRejected: 'رفض العرض',
        delete: 'حذف العرض',
        seller: 'البائع',
        client: 'العميل',
        issueDate: 'تاريخ الإصدار',
        validUntil: 'صالح حتى',
        notSet: 'غير محدد',
        items: 'البنود والخدمات',
        subtotal: 'الإجمالي قبل الضريبة',
        vat: 'الضريبة 15٪',
        total: 'الإجمالي النهائي',
        notes: 'شروط وملاحظات',
      }
    : {
        title: quote ? `QTE-${String(quote.seqNumber).padStart(3, '0')}` : 'Quote Detail',
        back: 'Quotes',
        loading: 'Loading…',
        convert: 'Convert to Invoice',
        converting: 'Converting…',
        convertedLink: 'View Linked Invoice',
        markPending: 'Send Quote (Pending)',
        markAccepted: 'Accept Quote',
        markRejected: 'Reject Quote',
        delete: 'Delete Quote',
        seller: 'Seller',
        client: 'Client',
        issueDate: 'Issue Date',
        validUntil: 'Valid Until',
        notSet: 'Not set',
        items: 'Line Items',
        subtotal: 'Subtotal (excl. VAT)',
        vat: 'VAT 15%',
        total: 'Total Amount',
        notes: 'Notes & Terms',
      }

  if (isLoading || !quote) {
    return (
      <WorkspaceShell lang={lang} active="quotes" title={copy.loading}>
        <div className="p-5 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </WorkspaceShell>
    )
  }

  return (
    <WorkspaceShell
      lang={lang}
      active="quotes"
      title={copy.title}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/workspace/quotes" search={search}>
              {isArabic ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
              {copy.back}
            </Link>
          </Button>

          {/* Delete action */}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
            onClick={() => deleteMutation.mutate({ id })}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">{copy.delete}</span>
          </Button>
        </div>
      }
    >
      <div className="p-5 max-w-4xl space-y-6">
        {errorMsg ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        {/* Action Header Card: Status controls & Convert to Invoice */}
        <Card className="border-border/80 shadow-none">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{isArabic ? 'حالة العرض:' : 'Quote Status:'}</span>
              <Badge className={quoteStatusTone[quote.status as keyof typeof quoteStatusTone]} variant="outline">
                {renderQuoteStatus(quote.status, lang)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Draft -> Pending */}
              {quote.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => statusMutation.mutate({ id, status: 'pending' })}
                  disabled={statusMutation.isPending}
                >
                  {copy.markPending}
                </Button>
              )}

              {/* Pending -> Accept / Reject */}
              {quote.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 gap-1.5"
                    onClick={() => statusMutation.mutate({ id, status: 'accepted' })}
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle2 className="size-4" />
                    {copy.markAccepted}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10 gap-1.5"
                    onClick={() => statusMutation.mutate({ id, status: 'rejected' })}
                    disabled={statusMutation.isPending}
                  >
                    <XCircle className="size-4" />
                    {copy.markRejected}
                  </Button>
                </>
              )}

              {/* Accept / Pending -> Convert to Invoice */}
              {(quote.status === 'accepted' || quote.status === 'pending' || quote.status === 'draft') && (
                <Button
                  size="sm"
                  className="qaftr-btn-primary gap-1.5"
                  onClick={handleConvert}
                  disabled={isConverting}
                >
                  <FileCheck className="size-4" />
                  {isConverting ? copy.converting : copy.convert}
                </Button>
              )}

              {/* Converted -> Linked invoice button */}
              {quote.status === 'converted' && quote.convertedToInvoiceId && (
                <Button asChild size="sm" variant="secondary" className="gap-1.5">
                  <Link
                    to="/workspace/invoices/$id"
                    params={{ id: quote.convertedToInvoiceId }}
                    search={search}
                  >
                    {copy.convertedLink}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Seller Business */}
          <Card className="border-border/60 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">{copy.seller}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-1.5 text-sm">
              {quote.business ? (
                <>
                  <p className="font-bold text-foreground">{quote.business.nameAr}</p>
                  {quote.business.vatNumber && (
                    <p className="text-muted-foreground">{isArabic ? 'الرقم الضريبي: ' : 'VAT: '} {quote.business.vatNumber}</p>
                  )}
                  {quote.business.address && (
                    <p className="text-muted-foreground text-xs">{quote.business.address}</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-xs">{isArabic ? 'منشأة غير معروفة' : 'Unknown business'}</p>
              )}
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card className="border-border/60 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">{copy.client}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-1.5 text-sm">
              {quote.client ? (
                <>
                  <p className="font-bold text-foreground">{quote.client.name}</p>
                  {quote.client.vatNumber && (
                    <p className="text-muted-foreground">{isArabic ? 'الرقم الضريبي: ' : 'VAT: '} {quote.client.vatNumber}</p>
                  )}
                  {quote.client.email && <p className="text-muted-foreground text-xs">{quote.client.email}</p>}
                  {quote.client.phone && <p className="text-muted-foreground text-xs">{quote.client.phone}</p>}
                </>
              ) : (
                <p className="text-muted-foreground font-bold">{isArabic ? 'عميل يدوي' : 'Manual client'}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dates */}
        <Card className="border-border/60 shadow-none">
          <CardContent className="p-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <span className="font-semibold text-muted-foreground">{copy.issueDate}: </span>
              <span className="text-foreground">
                {new Date(quote.issueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-SA')}
              </span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">{copy.validUntil}: </span>
              <span className="text-foreground">
                {quote.validUntil
                  ? new Date(quote.validUntil).toLocaleDateString(isArabic ? 'ar-SA' : 'en-SA')
                  : copy.notSet}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="border-border/60 shadow-none">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-semibold text-foreground">{copy.items}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-background/50 text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2.5 text-start">{isArabic ? 'البند / الخدمة' : 'Description'}</th>
                    <th className="px-5 py-2.5 text-start">{isArabic ? 'الكمية' : 'Qty'}</th>
                    <th className="px-5 py-2.5 text-start">{isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="px-5 py-2.5 text-start">{isArabic ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quote.lineItems?.map((item) => (
                    <tr key={item.id} className="hover:bg-background/30">
                      <td className="px-5 py-3 text-foreground font-medium">{item.description}</td>
                      <td className="px-5 py-3 text-muted-foreground tabular-nums">{item.qty}</td>
                      <td className="px-5 py-3 text-muted-foreground tabular-nums">
                        {formatMoney(item.unitPrice, lang)}
                      </td>
                      <td className="px-5 py-3 text-foreground font-semibold tabular-nums">
                        {formatMoney(item.lineTotal, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="p-5 border-t border-border flex justify-end">
              <div className="w-full sm:w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{copy.subtotal}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(quote.subtotal, lang)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">{copy.vat}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(quote.vatAmount, lang)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary text-base">
                  <span>{copy.total}</span>
                  <span className="tabular-nums">{formatMoney(quote.total, lang)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {quote.notes && (
          <Card className="border-border/60 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">{copy.notes}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed">
              {quote.notes}
            </CardContent>
          </Card>
        )}
      </div>
    </WorkspaceShell>
  )
}
