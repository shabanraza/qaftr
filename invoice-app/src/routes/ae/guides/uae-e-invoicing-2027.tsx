import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { AeGuideContent } from '#/components/ae/AeGuideContent'
import { buildAePageHead } from '#/lib/ae/pages'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/ae/guides/uae-e-invoicing-2027')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildAePageHead('guide', resolveLang(match.search)),
  component: AeGuidePage,
})

function AeGuidePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })

  return (
    <MarketingLayout lang={lang}>
      <AeGuideContent lang={lang} />
    </MarketingLayout>
  )
}
