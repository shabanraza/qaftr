import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { NonTaxInvoiceTool } from '#/components/documents/NonTaxInvoiceTool'
import { ToolBreadcrumb } from '#/components/tools/ToolBreadcrumb'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { getDocumentCopy } from '#/lib/documents/copy'
import { buildDocumentPageHead } from '#/lib/documents/pages'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/tools/non-tax-invoice')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildDocumentPageHead('non-tax-invoice', resolveLang(match.search)),
  component: NonTaxInvoicePage,
})

function NonTaxInvoicePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const all = getDocumentCopy(lang)
  const copy = all['non-tax-invoice']

  return (
    <MarketingLayout lang={lang} deadline>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-4 pt-10 md:px-8">
        <ToolBreadcrumb lang={lang} current={copy.title} />
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-balance text-foreground md:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{copy.subtitle}</p>
      </div>
      <NonTaxInvoiceTool lang={lang} />
      <ToolFaqSection title={all.common.faqTitle} items={copy.faq} />
    </MarketingLayout>
  )
}
