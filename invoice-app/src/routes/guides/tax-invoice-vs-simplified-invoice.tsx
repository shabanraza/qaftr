import { createFileRoute } from '@tanstack/react-router'
import { GuideArticle } from '#/components/marketing/GuideArticle'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { buildGuideHead } from '#/lib/guides/head'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/guides/tax-invoice-vs-simplified-invoice')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildGuideHead('tax-invoice-vs-simplified-invoice', resolveLang(match.search)),
  component: GuidePage,
})

function GuidePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  return (
    <MarketingLayout lang={lang}>
      <GuideArticle slug="tax-invoice-vs-simplified-invoice" lang={lang} />
    </MarketingLayout>
  )
}
