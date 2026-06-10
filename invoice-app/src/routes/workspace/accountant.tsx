import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { formatMoney } from '#/lib/instant-invoice/copy'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Download, Briefcase } from 'lucide-react'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { useMemo } from 'react'

export const Route = createFileRoute('/workspace/accountant')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.invoices.list.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'ملف المحاسب — قافتر' : 'Accountant Packet — Qaftr',
      description:
        lang === 'ar'
          ? 'تصدير ملخصات الضريبة والدخل الشهرية للمحاسب.'
          : 'Export monthly VAT and income summaries for your accountant.',
      path: '/workspace/accountant',
      lang,
    })
  },
  component: WorkspaceAccountantPage,
})

function WorkspaceAccountantPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const isArabic = lang === 'ar'
  const trpc = useTRPC()

  const { data: invoices = [], isLoading } = useQuery(trpc.invoices.list.queryOptions())

  // Group invoices by Month/Year
  const monthlyGroups = useMemo(() => {
    const groups: Record<string, typeof invoices> = {}
    
    invoices.forEach((inv) => {
      const date = new Date(inv.issueDate)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const key = `${year}-${month}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(inv)
    })

    return Object.entries(groups)
      .map(([monthKey, items]) => {
        let subtotal = 0
        let vatAmount = 0
        let total = 0
        let paidTotal = 0
        
        items.forEach((item) => {
          const sub = parseFloat(item.subtotal) || 0
          const vat = parseFloat(item.vatAmount) || 0
          const tot = parseFloat(item.total) || 0
          
          subtotal += sub
          vatAmount += vat
          total += tot
          if (item.status === 'paid') {
            paidTotal += tot
          }
        })

        return {
          monthKey,
          invoices: items,
          count: items.length,
          subtotal: subtotal.toFixed(2),
          vatAmount: vatAmount.toFixed(2),
          total: total.toFixed(2),
          paidTotal: paidTotal.toFixed(2),
        }
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
  }, [invoices])

  // Overall sums
  const overallTotals = useMemo(() => {
    let salesCount = invoices.length
    let totalVat = 0
    let totalSales = 0
    invoices.forEach((inv) => {
      totalVat += parseFloat(inv.vatAmount) || 0
      totalSales += parseFloat(inv.total) || 0
    })
    return {
      salesCount,
      totalVat: totalVat.toFixed(2),
      totalSales: totalSales.toFixed(2),
    }
  }, [invoices])

  // CSV Export Action
  const handleExportCsv = (monthKey: string, monthInvoices: typeof invoices) => {
    const headers = isArabic
      ? ["الرقم التسلسلي", "تاريخ الإصدار", "الإجمالي قبل الضريبة", "قيمة الضريبة 15%", "الإجمالي شامل الضريبة", "الحالة"]
      : ["Invoice Number", "Issue Date", "Subtotal", "VAT Amount 15%", "Total Amount", "Status"]

    const rows = monthInvoices.map((inv) => [
      `INV-${String(inv.seqNumber).padStart(3, '0')}`,
      new Date(inv.issueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US'),
      inv.subtotal,
      inv.vatAmount,
      inv.total,
      inv.status,
    ])

    // Prepend UTF-8 BOM so Excel decodes Arabic text correctly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Qaftr_Accountant_Packet_${monthKey}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Format month name (e.g. 2026-06 -> يونيو 2026 or June 2026)
  const formatMonthName = (monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-')
    const year = parseInt(yearStr!)
    const month = parseInt(monthStr!) - 1
    const date = new Date(year, month, 1)
    return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })
  }

  const copy = isArabic
    ? {
        title: 'ملف المحاسب',
        subtitle: 'تصدير الكشوفات الضريبية والدخل ومشاركتها مع المحاسب المالي.',
        loading: 'جاري التحميل…',
        overviewTitle: 'ملخص الحسابات الإجمالي',
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
        title: 'Accountant Packet',
        subtitle: 'Export tax summaries, VAT collected, and sales statements for your accountant.',
        loading: 'Loading…',
        overviewTitle: 'Overall Financial Summary',
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

  return (
    <WorkspaceShell
      lang={lang}
      active="accountant"
      title={copy.title}
      subtitle={copy.subtitle}
    >
      {isLoading ? (
        <div className="p-5 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !invoices.length ? (
        <div className="p-5 max-w-4xl">
          <Card className="border-border/60 shadow-none text-center p-8">
            <CardHeader className="flex flex-col items-center">
              <Briefcase className="size-10 text-muted-foreground mb-3" />
              <CardTitle className="text-sm font-semibold">{copy.empty}</CardTitle>
              <CardDescription>{copy.emptyHint}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="p-5 max-w-5xl space-y-6">
          {/* Top Overall Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 shadow-none bg-muted/10">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">{copy.salesCount}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{overallTotals.salesCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-none bg-muted/10">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">{copy.totalVat}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {formatMoney(overallTotals.totalVat, lang)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-none bg-muted/10">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">{copy.totalSales}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {formatMoney(overallTotals.totalSales, lang)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown Table */}
          <Card className="border-border/60 shadow-none">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-sm font-semibold text-foreground">{copy.monthsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <div className="overflow-x-auto">
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
                        <td className="px-5 py-4 font-bold text-foreground">
                          {formatMonthName(group.monthKey)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground tabular-nums">
                          {group.count}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground tabular-nums">
                          {formatMoney(group.subtotal, lang)}
                        </td>
                        <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                          {formatMoney(group.vatAmount, lang)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-foreground tabular-nums">
                          {formatMoney(group.total, lang)}
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="gap-1.5 border-border hover:bg-accent hover:text-accent-foreground font-medium"
                            onClick={() => handleExportCsv(group.monthKey, group.invoices)}
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

          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/10 p-3 rounded-md border border-border/60">
            {copy.hint}
          </p>
        </div>
      )}
    </WorkspaceShell>
  )
}
