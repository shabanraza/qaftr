import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { formatMoney } from '#/lib/instant-invoice/copy'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '#/components/ui/empty'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'
import { invoiceStatusTone, renderInvoiceStatus } from '#/lib/workspace/invoice-status'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { MessageSquare, Send, AlertTriangle, Landmark } from 'lucide-react'

export const Route = createFileRoute('/workspace/whatsapp')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.invoices.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.clients.list.queryOptions()),
    ])
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'تحصيل واتساب — قافتر' : 'WhatsApp Collections — Qaftr',
      description:
        lang === 'ar'
          ? 'متابعة الفواتير المستحقة وإرسال تذكيرات الدفع عبر واتساب.'
          : 'Follow up on outstanding invoices and send payment reminders via WhatsApp.',
      path: '/workspace/whatsapp',
      lang,
    })
  },
  component: WhatsAppCollectionsPage,
})

type TemplateType = 'formal' | 'short'

function WhatsAppCollectionsPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const isArabic = lang === 'ar'
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: invoices, isLoading: loadingInvoices } = useQuery(trpc.invoices.list.queryOptions())
  const { data: clients, isLoading: loadingClients } = useQuery(trpc.clients.list.queryOptions())

  const logEventMutation = useMutation(trpc.invoices.logEvent.mutationOptions())

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('formal')

  const isLoading = loadingInvoices || loadingClients

  const copy = isArabic
    ? {
        title: 'تحصيل واتساب',
        subtitle: 'أرسل تذكيرات الدفع لعملائك بنقرة واحدة وتابع سجل التنبيهات.',
        outstanding: 'المبالغ المستحقة للتحصيل',
        overdueCount: 'فواتير متأخرة السداد',
        unpaidCount: 'فواتير غير مدفوعة',
        invoice: 'الفاتورة',
        client: 'العميل',
        dueDate: 'تاريخ الاستحقاق',
        amount: 'المبلغ',
        status: 'الحالة',
        actions: 'إجراءات',
        sendReminder: 'أرسل تذكير',
        noClient: 'غير محدد',
        empty: 'لا توجد فواتير معلقة حالياً!',
        emptyDesc: 'جميع فواتيرك مدفوعة أو لم يتم حفظ أي فواتير بعد.',
        templateTitle: 'قالب رسالة التذكير',
        formal: 'قالب رسمي',
        short: 'قالب مختصر',
        preview: 'معاينة الرسالة',
        loggedSuccess: 'تم تسجيل التذكير في سجل الفاتورة بنجاح',
      }
    : {
        title: 'WhatsApp Collections',
        subtitle: 'Send payment reminders to clients with one click and track logs.',
        outstanding: 'Total Outstanding Balance',
        overdueCount: 'Overdue Invoices',
        unpaidCount: 'Unpaid Invoices',
        invoice: 'Invoice',
        client: 'Client',
        dueDate: 'Due date',
        amount: 'Amount',
        status: 'Status',
        actions: 'Actions',
        sendReminder: 'Send reminder',
        noClient: 'Unnamed client',
        empty: 'No outstanding invoices found!',
        emptyDesc: 'All your invoices are paid or you haven\'t saved any invoices yet.',
        templateTitle: 'Reminder Template',
        formal: 'Formal template',
        short: 'Short template',
        preview: 'Message Preview',
        loggedSuccess: 'Reminder logged in history successfully',
      }

  if (isLoading) {
    return (
      <WorkspaceShell lang={lang} active="whatsapp" title={copy.title} subtitle={copy.subtitle}>
        <div className="p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </WorkspaceShell>
    )
  }

  const clientsById = new Map(clients?.map((c) => [c.id, c]) ?? [])

  // Filter outstanding invoices (unpaid or overdue)
  const outstandingInvoices = (invoices ?? []).filter(
    (inv) => inv.status === 'unpaid' || inv.status === 'overdue'
  )

  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
  const overdueInvoices = outstandingInvoices.filter((inv) => inv.status === 'overdue')

  // Generate templates
  const getMessageText = (invoiceNumber: string, clientName: string, amount: string, template: TemplateType) => {
    if (template === 'formal') {
      return isArabic
        ? `مرحباً ${clientName}،\n\nنود تذكيركم بلطف بأن الفاتورة رقم ${invoiceNumber} بمبلغ ${amount} مستحقة الدفع حالياً.\n\nيرجى تسوية المبلغ في أقرب وقت. شاكرين ومقدرين لتعاونكم.\n\nقافتر (بوابة الفواتير)`
        : `Hi ${clientName},\n\nThis is a friendly reminder that invoice ${invoiceNumber} for ${amount} is currently outstanding.\n\nWe would appreciate it if you could settle the amount at your earliest convenience. Thank you!\n\nSent via Qaftr`
    } else {
      return isArabic
        ? `تذكير دفع: الفاتورة رقم ${invoiceNumber} بمبلغ ${amount} مستحقة السداد لـ ${clientName}.`
        : `Payment Reminder: Invoice ${invoiceNumber} for ${amount} is outstanding for ${clientName}.`
    }
  }

  // Handle reminder action
  const handleSendReminder = async (invoiceId: string, seqNumber: number, clientId: string | null, total: string) => {
    const client = clientId ? clientsById.get(clientId) : null
    const clientName = client?.name ?? (isArabic ? copy.noClient : copy.noClient)
    const phone = client?.phone ?? ''
    const invoiceNum = `INV-${String(seqNumber).padStart(3, '0')}`
    const formattedAmount = formatMoney(total, lang)

    const messageText = getMessageText(invoiceNum, clientName, formattedAmount, activeTemplate)

    // 1. Log event on database
    try {
      await logEventMutation.mutateAsync({
        invoiceId,
        type: 'reminder_sent',
        channel: 'whatsapp',
        notes: `WhatsApp reminder sent to ${clientName} (${phone || 'no phone'}). Message: "${messageText.substring(0, 80)}..."`,
      })
      void queryClient.invalidateQueries(trpc.invoices.list.queryFilter())
    } catch (err) {
      console.error('Failed to log event:', err)
    }

    // 2. Open WhatsApp Web/API
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <WorkspaceShell lang={lang} active="whatsapp" title={copy.title} subtitle={copy.subtitle}>
      <div className="p-5 space-y-6">
        {/* Metric widgets */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border bg-card/65 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Landmark className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{copy.outstanding}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                  {formatMoney(totalOutstanding, lang)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/65 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{copy.overdueCount}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                  {overdueInvoices.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/65 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-600">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{copy.unpaidCount}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                  {outstandingInvoices.length - overdueInvoices.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Selector & Message Preview */}
        <Card className="border-border bg-card/65 shadow-none">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              {copy.templateTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col md:grid md:grid-cols-[240px_1fr] gap-6">
            <div className="flex flex-row md:flex-col gap-2">
              <Button
                variant={activeTemplate === 'formal' ? 'default' : 'outline'}
                className="flex-1 md:flex-none md:w-full justify-start text-xs font-medium md:h-10"
                size="sm"
                onClick={() => setActiveTemplate('formal')}
              >
                {copy.formal}
              </Button>
              <Button
                variant={activeTemplate === 'short' ? 'default' : 'outline'}
                className="flex-1 md:flex-none md:w-full justify-start text-xs font-medium md:h-10"
                size="sm"
                onClick={() => setActiveTemplate('short')}
              >
                {copy.short}
              </Button>
            </div>
            
            <div className="bg-background border border-border rounded-lg p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{copy.preview}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                  {getMessageText(
                    'INV-001',
                    isArabic ? 'عميل افتراضي' : 'Demo Client',
                    formatMoney(5000, lang),
                    activeTemplate
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Invoices List */}
        {!outstandingInvoices.length ? (
          <Empty className="border-border bg-background/50 py-10">
            <EmptyHeader>
              <EmptyTitle>{copy.empty}</EmptyTitle>
              <EmptyDescription>{copy.emptyDesc}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card className="border-border bg-card/65 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border bg-background/50 text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-start">{copy.invoice}</th>
                    <th className="px-5 py-3 text-start">{copy.client}</th>
                    <th className="px-5 py-3 text-start">{copy.dueDate}</th>
                    <th className="px-5 py-3 text-start">{copy.amount}</th>
                    <th className="px-5 py-3 text-start">{copy.status}</th>
                    <th className="px-5 py-3 text-start">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {outstandingInvoices.map((invoice) => {
                    const client = invoice.clientId ? clientsById.get(invoice.clientId) : null
                    const clientName = client?.name ?? (isArabic ? copy.noClient : copy.noClient)
                    return (
                      <tr key={invoice.id} className="hover:bg-background/50">
                        <td className="px-5 py-4">
                          <Link
                            to="/workspace/invoices/$id"
                            params={{ id: invoice.id }}
                            search={search}
                            className="font-medium !text-primary hover:underline"
                          >
                            INV-{String(invoice.seqNumber).padStart(3, '0')}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-foreground">{clientName}</span>
                          {client?.phone ? (
                            <span className="block text-xs text-muted-foreground dir-ltr text-start mt-0.5">
                              {client.phone}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-SA')
                            : '—'}
                        </td>
                        <td className="px-5 py-4 font-semibold tabular-nums text-foreground">
                          {formatMoney(invoice.total, lang)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            className={cn('border', invoiceStatusTone[invoice.status] ?? invoiceStatusTone.draft)}
                            variant="outline"
                          >
                            {renderInvoiceStatus(invoice.status, lang)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1.5 qaftr-btn-primary"
                            onClick={() =>
                              void handleSendReminder(
                                invoice.id,
                                invoice.seqNumber,
                                invoice.clientId,
                                invoice.total
                              )
                            }
                          >
                            <Send className="size-3.5" />
                            {copy.sendReminder}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </WorkspaceShell>
  )
}
