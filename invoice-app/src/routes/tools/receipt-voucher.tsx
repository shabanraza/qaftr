import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { ReceiptVoucherTool } from '#/components/documents/ReceiptVoucherTool'
import { ToolBreadcrumb } from '#/components/tools/ToolBreadcrumb'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { getDocumentCopy } from '#/lib/documents/copy'
import { buildDocumentPageHead } from '#/lib/documents/pages'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/tools/receipt-voucher')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildDocumentPageHead('receipt-voucher', resolveLang(match.search)),
  component: ReceiptVoucherPage,
})

function ReceiptVoucherPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const all = getDocumentCopy(lang)
  const copy = all['receipt-voucher']

  return (
    <MarketingLayout lang={lang} deadline>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-4 pt-10 md:px-8">
        <ToolBreadcrumb lang={lang} current={copy.title} />
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-balance text-foreground md:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{copy.subtitle}</p>
      </div>
      <ReceiptVoucherTool lang={lang} />
      <ToolFaqSection title={all.common.faqTitle} items={copy.faq} />
    </MarketingLayout>
  )
}
