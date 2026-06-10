import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Clock3,
  Users,
  Wallet,
  Send,
} from 'lucide-react'
import type { MarketingLang } from '#/lib/marketing/lang'
import { formatMoney } from '#/lib/instant-invoice/copy'
import { invoiceStatusTone, renderInvoiceStatus } from '#/lib/workspace/invoice-status'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { cn } from '#/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'

type InvoiceSummary = {
  id: string
  seqNumber: number
  status: 'draft' | 'unpaid' | 'paid' | 'overdue'
  issueDate: Date
  dueDate: Date | null
  total: string
  clientName: string | null
}

type MoneyDeskDashboardProps = {
  lang: MarketingLang
  invoices: InvoiceSummary[]
  clientCount: number
}

type MetricItem = {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  accent?: 'gold' | 'sage'
}


export function MoneyDeskDashboard({ lang, invoices, clientCount }: MoneyDeskDashboardProps) {
  const isArabic = lang === 'ar'
  const now = new Date()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const logEventMutation = useMutation(trpc.invoices.logEvent.mutationOptions())

  const handleQuickReminder = async (invoice: InvoiceSummary) => {
    const invoiceNum = `INV-${String(invoice.seqNumber).padStart(3, '0')}`
    const formattedAmount = formatMoney(invoice.total, lang)
    const clientName = invoice.clientName ?? (isArabic ? 'العميل' : 'Client')
    const messageText = isArabic
      ? `مرحباً ${clientName}، يرجى مراجعة الفاتورة ${invoiceNum} بمبلغ ${formattedAmount}.`
      : `Hi ${clientName}, please find invoice ${invoiceNum} for ${formattedAmount} attached.`

    try {
      await logEventMutation.mutateAsync({
        invoiceId: invoice.id,
        type: 'reminder_sent',
        channel: 'whatsapp',
        notes: `WhatsApp reminder shared from Dashboard with ${clientName}.`,
      })
      void queryClient.invalidateQueries(trpc.invoices.list.queryFilter())
    } catch (err) {
      console.error('Failed to log reminder event:', err)
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthInvoices = invoices.filter((invoice) => invoice.issueDate >= monthStart)
  const unpaidInvoices = invoices.filter((invoice) => invoice.status === 'unpaid')
  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'overdue')
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid')
  const followUps = [...overdueInvoices, ...unpaidInvoices]
    .filter((invoice) => !invoice.dueDate || invoice.dueDate <= addDays(now, 3))
    .slice(0, 6)
  const recentInvoices = [...invoices]
    .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())
    .slice(0, 5)

  const monthTotal = sumAmounts(monthInvoices.map((invoice) => invoice.total))
  const unpaidTotal = sumAmounts(
    invoices
      .filter((invoice) => invoice.status === 'unpaid' || invoice.status === 'overdue')
      .map((invoice) => invoice.total),
  )
  const paidTotal = sumAmounts(paidInvoices.map((invoice) => invoice.total))

  const copy = isArabic
    ? {
        title: 'مكتب المال',
        subtitle: 'الفواتير، العملاء، والتحصيل في لوحة واحدة.',
        overview: 'نظرة عامة',
        followUps: 'المتابعة اليوم',
        recentInvoices: 'آخر الفواتير',
        invoice: 'الفاتورة',
        client: 'العميل',
        date: 'التاريخ',
        due: 'الاستحقاق',
        amount: 'المبلغ',
        status: 'الحالة',
        noFollowUps: 'لا توجد فواتير تحتاج متابعة الآن.',
        unnamed: 'عميل بدون اسم',
        metrics: {
          monthTotal: 'إجمالي هذا الشهر',
          unpaid: 'بانتظار التحصيل',
          paid: 'تم تحصيله',
          clients: 'العملاء',
          monthHint: `${monthInvoices.length} فاتورة`,
          unpaidHint: `${unpaidInvoices.length + overdueInvoices.length} متابعة`,
          paidHint: `${paidInvoices.length} مدفوعة`,
          clientsHint: 'محفوظون',
        },
      }
    : {
        title: 'Money desk',
        subtitle: 'Invoices, clients, and collections in one workspace.',
        overview: 'Overview',
        followUps: 'Follow up today',
        recentInvoices: 'Recent invoices',
        invoice: 'Invoice',
        client: 'Client',
        date: 'Date',
        due: 'Due',
        amount: 'Amount',
        status: 'Status',
        noFollowUps: 'Nothing needs follow-up right now.',
        unnamed: 'Unnamed client',
        metrics: {
          monthTotal: 'This month',
          unpaid: 'Awaiting collection',
          paid: 'Collected',
          clients: 'Clients',
          monthHint: `${monthInvoices.length} invoices`,
          unpaidHint: `${unpaidInvoices.length + overdueInvoices.length} follow-ups`,
          paidHint: `${paidInvoices.length} paid`,
          clientsHint: 'saved',
        },
      }

  const metrics: MetricItem[] = [
    {
      label: copy.metrics.monthTotal,
      value: formatMoney(monthTotal, lang),
      hint: copy.metrics.monthHint,
      icon: Wallet,
    },
    {
      label: copy.metrics.unpaid,
      value: formatMoney(unpaidTotal, lang),
      hint: copy.metrics.unpaidHint,
      icon: Clock3,
      accent: 'gold',
    },
    {
      label: copy.metrics.paid,
      value: formatMoney(paidTotal, lang),
      hint: copy.metrics.paidHint,
      icon: ArrowUpRight,
      accent: 'sage',
    },
    {
      label: copy.metrics.clients,
      value: String(clientCount),
      hint: copy.metrics.clientsHint,
      icon: Users,
    },
  ]

  return (
    <WorkspaceShell
      lang={lang}
      active="overview"
      title={copy.overview}
    >
          <section className="grid border-b border-border md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <MetricCell key={metric.label} metric={metric} isLast={index === metrics.length - 1} />
            ))}
          </section>

          <section className="block">
            <div className="min-w-0">
              <SectionHeader title={copy.followUps} />
              {followUps.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="border-b border-border bg-background/50 text-xs font-medium text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-start">{copy.client}</th>
                        <th className="px-5 py-3 text-start">{copy.due}</th>
                        <th className="px-5 py-3 text-start">{copy.amount}</th>
                        <th className="px-5 py-3 text-start">{copy.status}</th>
                        <th className="px-5 py-3 text-start">{isArabic ? 'تذكير' : 'Follow up'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {followUps.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-background/50">
                          <td className="px-5 py-4">
                            <Link
                              to="/workspace/invoices/$id"
                              params={{ id: invoice.id }}
                              search={lang === 'en' ? { lang: 'en' } : {}}
                              className="font-medium !text-primary hover:underline"
                            >
                              INV-{String(invoice.seqNumber).padStart(3, '0')}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {invoice.clientName ?? copy.unnamed}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {invoice.dueDate
                              ? invoice.dueDate.toLocaleDateString(isArabic ? 'ar-SA' : 'en-SA')
                              : isArabic
                                ? 'غير محدد'
                                : 'Not set'}
                          </td>
                          <td className="px-5 py-4 font-medium tabular-nums text-foreground">
                            {formatMoney(invoice.total, lang)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge className={cn('border', invoiceStatusTone[invoice.status])} variant="outline">
                              {renderInvoiceStatus(invoice.status, lang)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Button
                              type="button"
                              size="xs"
                              className="gap-1.5 qaftr-btn-primary"
                              onClick={() => void handleQuickReminder(invoice)}
                            >
                              <Send className="size-3" />
                              {isArabic ? 'واتساب' : 'WhatsApp'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <p className="border-b border-border px-5 py-4 text-sm text-muted-foreground">
                    {copy.noFollowUps}
                  </p>
                  {recentInvoices.length ? (
                    <>
                      <SectionHeader title={copy.recentInvoices} />
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                          <thead className="border-y border-border bg-background/50 text-xs font-medium text-muted-foreground">
                            <tr>
                              <th className="px-5 py-3 text-start">{copy.invoice}</th>
                              <th className="px-5 py-3 text-start">{copy.client}</th>
                              <th className="px-5 py-3 text-start">{copy.date}</th>
                              <th className="px-5 py-3 text-start">{copy.amount}</th>
                              <th className="px-5 py-3 text-start">{copy.status}</th>
                              <th className="px-5 py-3 text-start">{isArabic ? 'تذكير' : 'Remind'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {recentInvoices.map((invoice) => (
                              <tr key={invoice.id} className="hover:bg-background/50">
                                <td className="px-5 py-4">
                                  <Link
                                    to="/workspace/invoices/$id"
                                    params={{ id: invoice.id }}
                                    search={lang === 'en' ? { lang: 'en' } : {}}
                                    className="font-medium !text-primary hover:underline"
                                  >
                                    INV-{String(invoice.seqNumber).padStart(3, '0')}
                                  </Link>
                                </td>
                                <td className="px-5 py-4 text-muted-foreground">
                                  {invoice.clientName ?? copy.unnamed}
                                </td>
                                <td className="px-5 py-4 text-muted-foreground">
                                  {invoice.issueDate.toLocaleDateString(isArabic ? 'ar-SA' : 'en-SA')}
                                </td>
                                <td className="px-5 py-4 font-medium tabular-nums text-foreground">
                                  {formatMoney(invoice.total, lang)}
                                </td>
                                <td className="px-5 py-4">
                                  <Badge className={cn('border', invoiceStatusTone[invoice.status])} variant="outline">
                                    {renderInvoiceStatus(invoice.status, lang)}
                                  </Badge>
                                </td>
                                <td className="px-5 py-4">
                                  {invoice.status !== 'paid' ? (
                                    <Button
                                      type="button"
                                      size="xs"
                                      className="gap-1.5 qaftr-btn-primary"
                                      onClick={() => void handleQuickReminder(invoice)}
                                    >
                                      <Send className="size-3" />
                                      {isArabic ? 'تذكير' : 'Remind'}
                                    </Button>
                                  ) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </section>
    </WorkspaceShell>
  )
}

function MetricCell({ metric, isLast }: { metric: MetricItem; isLast: boolean }) {
  const Icon = metric.icon

  return (
    <div className={cn('min-h-28 p-5', !isLast && 'border-b border-border md:border-inline-end xl:border-b-0')}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-foreground">{metric.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border',
            metric.accent === 'gold' && 'bg-[var(--qaftr-gold)]/10 text-primary',
            metric.accent === 'sage' && 'bg-[var(--qaftr-sage)]/20 text-primary',
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex h-14 items-center px-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  )
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function sumAmounts(values: string[]): string {
  return values.reduce((total, value) => total + Number(value || 0), 0).toFixed(2)
}
