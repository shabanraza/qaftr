import { createFileRoute } from '@tanstack/react-router'
import { GuideArticle } from '#/components/marketing/GuideArticle'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { buildGuideHead } from '#/lib/guides/head'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/guides/saudi-tax-invoice-requirements')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildGuideHead('saudi-tax-invoice-requirements', resolveLang(match.search)),
  component: GuidePage,
})

function GuidePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  return (
    <MarketingLayout lang={lang}>
      <GuideArticle slug="saudi-tax-invoice-requirements" lang={lang} />
    </MarketingLayout>
  )
}
