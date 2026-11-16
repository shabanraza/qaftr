import { useMemo } from 'react'
import { Briefcase, Download } from 'lucide-react'
import { documentNumber } from '#/lib/zatca/document-kind'
import { csvAmounts, documentBadge, groupByMonth, overallTotals as computeOverallTotals } from '#/lib/workspace/money-totals'
import { formatMoney } from '#/lib/instant-invoice/copy'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import type { MarketingLang } from '#/lib/marketing/lang'

type PacketInvoice = Parameters<typeof documentBadge>[0] &
  Parameters<typeof csvAmounts>[0] & { seqNumber: number; zatcaKind?: string | null; issueDate: string | Date }

type Props = {
  lang: MarketingLang
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rows come straight from the invoices table
  invoices: any[]
  isLoading: boolean
  /** Prefix of the downloaded CSV file name. */
  filePrefix?: string
}

/**
 * Monthly statements and CSV export. Used for a business's own invoices
 * (/workspace/accountant) and for a client's invoices (/workspace/firm/$id).
 */
export function AccountantPacketView({ lang, invoices, isLoading, filePrefix = 'Qaftr_Accountant_Packet' }: Props) {
  const isArabic = lang === 'ar'
  const rows = invoices as PacketInvoice[]

  // Credit notes count against sales and VAT (lib/workspace/money-totals).
  const monthlyGroups = useMemo(() => groupByMonth(invoices), [invoices])
  const overallTotals = useMemo(() => computeOverallTotals(invoices), [invoices])

  const handleExportCsv = (monthKey: string, monthInvoices: PacketInvoice[]) => {
    const headers = isArabic
      ? ['الرقم التسلسلي', 'تاريخ الإصدار', 'الإجمالي قبل الضريبة', 'قيمة الضريبة 15%', 'الإجمالي شامل الضريبة', 'الحالة']
      : ['Invoice Number', 'Issue Date', 'Subtotal', 'VAT Amount 15%', 'Total Amount', 'Status']

    const csvRows = monthInvoices.map((inv) => [
      documentNumber(inv.seqNumber, inv.zatcaKind),
      new Date(inv.issueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US'),
      ...csvAmounts(inv),
      documentBadge(inv, lang).label,
    ])

    // Prepend UTF-8 BOM so Excel decodes Arabic text correctly
    const csvContent = '﻿' + [headers.join(','), ...csvRows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filePrefix}_${monthKey}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format month name (e.g. 2026-06 -> يونيو 2026 or June 2026)
  const formatMonthName = (monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-')
    const date = new Date(parseInt(yearStr!), parseInt(monthStr!) - 1, 1)
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })
  }

  const copy = isArabic
    ? {
        salesCount: 'عدد المبيعات',
        totalVat: 'إجمالي ضريبة المبيعات',
        totalSales: 'إجمالي المبيعات (شامل الضريبة)',
        monthsTitle: 'التقارير الشهرية',
        month: 'الشهر',
        count: 'الفواتير',
        subtotal: 'الإجمالي قبل الضريبة',
        vat: 'قيمة الضريبة',
        total: 'الإجمالي شامل الضريبة',
        actions: 'تصدير البيانات',
        exportCsv: 'تصدير CSV',
        empty: 'لا توجد فواتير بعد.',
        emptyHint: 'قم بإنشاء وحفظ فواتير مبيعات أولاً لتظهر التقارير والضريبة هنا.',
        hint: 'كافة المبالغ بالريال السعودي (SAR) وتشمل ضريبة القيمة المضافة بنسبة 15% طبقاً للهيئة العامة للزكاة والضريبة والجمارك.',
      }
    : {
        salesCount: 'Sales Count',
        totalVat: 'Total VAT Collected',
        totalSales: 'Total Sales (incl. VAT)',
        monthsTitle: 'Monthly Statements',
        month: 'Month',
        count: 'Invoices',
        subtotal: 'Subtotal (excl. VAT)',
        vat: 'VAT Collected',
        total: 'Total (incl. VAT)',
        actions: 'Export',
        exportCsv: 'Export CSV',
        empty: 'No invoices found.',
        emptyHint: 'Create and save some sales invoices first to generate accountant packets.',
        hint: 'All amounts are in Saudi Riyals (SAR) and reflect the 15% VAT rate in accordance with ZATCA regulations.',
      }

  if (isLoading) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="max-w-4xl p-5">
        <Card className="border-border/60 p-8 text-center shadow-none">
          <CardHeader className="flex flex-col items-center">
            <Briefcase className="mb-3 size-10 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">{copy.empty}</CardTitle>
            <CardDescription>{copy.emptyHint}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6 p-5">
      {/* Top Overall Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-muted/10 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{copy.salesCount}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{overallTotals.salesCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/10 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{copy.totalVat}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{formatMoney(overallTotals.totalVat, lang)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/10 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{copy.totalSales}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{formatMoney(overallTotals.totalSales, lang)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card className="border-border/60 shadow-none">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-sm font-semibold text-foreground">{copy.monthsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-border bg-background/50 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-start">{copy.month}</th>
                  <th className="px-5 py-3 text-start">{copy.count}</th>
                  <th className="px-5 py-3 text-start">{copy.subtotal}</th>
                  <th className="px-5 py-3 text-start">{copy.vat}</th>
                  <th className="px-5 py-3 text-start">{copy.total}</th>
                  <th className="px-5 py-3 text-start">{copy.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyGroups.map((group) => (
                  <tr key={group.monthKey} className="hover:bg-background/30">
                    <td className="px-5 py-4 font-bold text-foreground">{formatMonthName(group.monthKey)}</td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">{group.count}</td>
                    <td className="px-5 py-4 tabular-nums text-muted-foreground">{formatMoney(group.subtotal, lang)}</td>
                    <td className="px-5 py-4 font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(group.vatAmount, lang)}
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-foreground">{formatMoney(group.total, lang)}</td>
                    <td className="px-5 py-4">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="gap-1.5 border-border font-medium hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleExportCsv(group.monthKey, group.invoices as PacketInvoice[])}
                      >
                        <Download className="size-3.5" />
                        {copy.exportCsv}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="rounded-md border border-border/60 bg-muted/10 p-3 text-xs leading-relaxed text-muted-foreground">{copy.hint}</p>
    </div>
  )
}
