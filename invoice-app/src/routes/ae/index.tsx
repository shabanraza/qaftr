import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { AeHubContent } from '#/components/ae/AeHubContent'
import { buildAePageHead } from '#/lib/ae/pages'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/ae/')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildAePageHead('hub', resolveLang(match.search)),
  component: AeHubPage,
})

function AeHubPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })

  return (
    <MarketingLayout lang={lang}>
      <AeHubContent lang={lang} />
    </MarketingLayout>
  )
}
