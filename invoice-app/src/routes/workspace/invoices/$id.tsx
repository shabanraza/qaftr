import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { formatMoney, getInstantInvoiceCopy } from '#/lib/instant-invoice/copy'
import { downloadInvoicePdf } from '#/lib/instant-invoice/invoice-pdf'
import type { InvoiceForPdf } from '#/lib/instant-invoice/invoice-pdf'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'
import { invoiceStatusTone, renderInvoiceStatus } from '#/lib/workspace/invoice-status'

export const Route = createFileRoute('/workspace/invoices/$id')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.invoices.get.queryOptions({ id: params.id })),
      context.queryClient.ensureQueryData(context.trpc.invoices.getEvents.queryOptions({ invoiceId: params.id })),
    ])
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'تفاصيل الفاتورة — قافتر' : 'Invoice detail — Qaftr',
      description:
        lang === 'ar'
          ? 'عرض وتحميل فاتورة محفوظة داخل مكتب قافتر.'
          : 'View and download a saved invoice inside the Qaftr workspace.',
      path: '/workspace/invoices',
      lang,
    })
  },
  component: WorkspaceInvoiceDetailPage,
})

function WorkspaceInvoiceDetailPage() {
  const { id } = Route.useParams()
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const toolCopy = getInstantInvoiceCopy(lang)
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const isArabic = lang === 'ar'
  const { data: invoice, isLoading } = useQuery(trpc.invoices.get.queryOptions({ id }))
  const { data: events } = useQuery(trpc.invoices.getEvents.queryOptions({ invoiceId: id }))

  const statusMutation = useMutation({
    ...trpc.invoices.updateStatus.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.invoices.get.queryFilter({ id }))
      void queryClient.invalidateQueries(trpc.invoices.list.queryFilter())
      void queryClient.invalidateQueries(trpc.invoices.getEvents.queryFilter({ invoiceId: id }))
    },
  })

  const logEventMutation = useMutation({
    ...trpc.invoices.logEvent.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.invoices.getEvents.queryFilter({ invoiceId: id }))
    },
  })

  const copy =
    lang === 'ar'
      ? {
          title: invoice ? `INV-${String(invoice.seqNumber).padStart(3, '0')}` : 'تفاصيل الفاتورة',
          back: 'الفواتير',
          loading: 'جاري التحميل…',
          markPaid: 'تعليم كمدفوعة',
          markUnpaid: 'إلغاء الدفع',
          taxInvoice: 'فاتورة ضريبية',
          items: 'البنود',
          subtotal: 'الإجمالي قبل الضريبة',
          vat: 'ضريبة 15٪',
          total: 'الإجمالي',
          whatsapp: 'مشاركة عبر واتساب',
          timeline: 'سجل العمليات التاريخي',
          created: 'تم إنشاء الفاتورة في النظام',
          reminder_sent: 'تم إرسال تذكير السداد',
          status_changed: 'تم تحديث حالة الفاتورة',
        }
      : {
          title: invoice ? `INV-${String(invoice.seqNumber).padStart(3, '0')}` : 'Invoice detail',
          back: 'Invoices',
          loading: 'Loading…',
          markPaid: 'Mark as paid',
          markUnpaid: 'Mark as unpaid',
          taxInvoice: 'Tax invoice',
          items: 'Line items',
          subtotal: 'Subtotal',
          vat: 'VAT 15%',
          total: 'Total',
          whatsapp: 'Share via WhatsApp',
          timeline: 'Invoice History & Timeline',
          created: 'Invoice created in system',
          reminder_sent: 'Payment reminder sent',
          status_changed: 'Payment status updated',
        }

  async function handleWhatsAppShare() {
    if (!invoice) return
    const invoiceNum = `INV-${String(invoice.seqNumber).padStart(3, '0')}`
    const formattedAmount = formatMoney(invoice.total, lang)
    const clientName = invoice.client?.name ?? (isArabic ? 'العميل' : 'Client')
    const phone = invoice.client?.phone ?? ''
    const messageText = isArabic
      ? `مرحباً ${clientName}، يرجى مراجعة الفاتورة ${invoiceNum} بمبلغ ${formattedAmount}.`
      : `Hi ${clientName}, please find invoice ${invoiceNum} for ${formattedAmount} attached.`

    try {
      await logEventMutation.mutateAsync({
        invoiceId: id,
        type: 'reminder_sent',
        channel: 'whatsapp',
        notes: `WhatsApp reminder shared with ${clientName} (${phone || 'no phone'}).`,
      })
    } catch (err) {
      console.error('Failed to log reminder event:', err)
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleDownload() {
    if (!invoice) return
    setDownloadError(null)
    setDownloading(true)
    const pdfData: InvoiceForPdf = {
      seqNumber: invoice.seqNumber,
      issueDate: invoice.issueDate,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes,
      business: invoice.business,
      client: invoice.client,
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    }
    try {
      await downloadInvoicePdf(pdfData, lang)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'PDF_EXPORT_FAILED'
      setDownloadError(
        toolCopy.errors[code as keyof typeof toolCopy.errors] ?? toolCopy.errors.PDF_EXPORT_FAILED,
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <WorkspaceShell
      lang={lang}
      active="invoices"
      title={copy.title}
          actions={
            <>
              <Button asChild size="sm" variant="outline">
                <Link to="/workspace/invoices" search={search}>
                  {copy.back}
                </Link>
              </Button>
              {invoice ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => void handleWhatsAppShare()}
                  >
                    {copy.whatsapp}
                  </Button>
                  <Button type="button" size="sm" disabled={downloading} onClick={() => void handleDownload()}>
                    {downloading ? copy.loading : toolCopy.downloadPdf}
                  </Button>
                </>
              ) : null}
            </>
          }
        >
          {isLoading || !invoice ? (
            <div className="p-5">
              <Skeleton className="h-12 w-full max-w-xl rounded-md" />
              <Skeleton className="mt-4 h-64 w-full rounded-md" />
            </div>
          ) : (
            <div className="p-5">
              {downloadError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{downloadError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="max-w-4xl border border-border bg-background/35">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{copy.taxInvoice}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoice.business?.nameAr} → {invoice.client?.name ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {formatMoney(invoice.total, lang)}
                    </p>
                    <Badge
                      className={cn('border', invoiceStatusTone[invoice.status] ?? invoiceStatusTone.draft)}
                      variant="outline"
                    >
                      {renderInvoiceStatus(invoice.status, lang)}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <p className="mb-3 text-sm font-semibold text-foreground">{copy.items}</p>
                  <ul className="divide-y divide-border border-y border-border">
                    {invoice.lineItems.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                        <span className="text-muted-foreground">{item.description}</span>
                        <span className="shrink-0 font-medium tabular-nums text-foreground">
                          {formatMoney(item.lineTotal, lang, '')}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="ms-auto mt-5 w-full max-w-sm space-y-3 text-sm">
                    <TotalRow label={copy.subtotal} value={formatMoney(invoice.subtotal, lang)} />
                    <TotalRow label={copy.vat} value={formatMoney(invoice.vatAmount, lang)} />
                    <Separator />
                    <TotalRow label={copy.total} value={formatMoney(invoice.total, lang)} strong />
                  </div>

                  {invoice.status !== 'paid' ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5"
                      onClick={() => statusMutation.mutate({ id: invoice.id, status: 'paid' })}
                    >
                      {copy.markPaid}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-5 text-muted-foreground"
                      onClick={() => statusMutation.mutate({ id: invoice.id, status: 'unpaid' })}
                    >
                      {copy.markUnpaid}
                    </Button>
                  )}
                </div>
              </div>

              {/* Event Timeline / History Section */}
              <div className="mt-8 max-w-4xl border border-border bg-card/65 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-5">{copy.timeline}</h3>
                {!events || events.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No history logs recorded yet.</p>
                ) : (
                  <div className="relative border-s border-border/80 ms-2 pl-4 space-y-5">
                    {events.map((evt) => {
                      const eventDate = new Date(evt.createdAt).toLocaleString(
                        isArabic ? 'ar-SA' : 'en-SA',
                        { dateStyle: 'medium', timeStyle: 'short' }
                      )
                      let iconColor = 'bg-primary'
                      let eventLabel = evt.notes
                      if (evt.type === 'created') {
                        iconColor = 'bg-green-500'
                        eventLabel = isArabic ? copy.created : copy.created
                      } else if (evt.type === 'reminder_sent') {
                        iconColor = 'bg-primary'
                        eventLabel = isArabic ? copy.reminder_sent : copy.reminder_sent
                      } else if (evt.type === 'status_changed') {
                        iconColor = 'bg-yellow-500'
                        eventLabel = isArabic ? `${copy.status_changed}` : `${copy.status_changed}`
                      }

                      return (
                        <div key={evt.id} className="relative">
                          {/* Dot indicator */}
                          <div className={cn("absolute -start-[21px] top-1.5 size-2.5 rounded-full ring-4 ring-background", iconColor)} />
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 text-xs">
                            <span className="font-semibold text-foreground">{eventLabel}</span>
                            <span className="text-muted-foreground/85 tabular-nums">{eventDate}</span>
                          </div>
                          {evt.notes && evt.type !== 'created' && (
                            <p className="mt-1 text-xs text-muted-foreground font-mono">{evt.notes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </WorkspaceShell>
  )
}


function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'font-semibold tabular-nums text-foreground' : 'font-medium tabular-nums text-foreground'}>
        {value}
      </span>
    </div>
  )
}
