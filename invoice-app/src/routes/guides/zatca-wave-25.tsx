import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { SaWaveGuide } from '#/components/tools/SaWaveGuide'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildSaPageHead } from '#/lib/sa/pages'

export const Route = createFileRoute('/guides/zatca-wave-25')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildSaPageHead('zatca-wave-25', resolveLang(match.search)),
  component: WaveGuidePage,
})

function WaveGuidePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  return (
    <MarketingLayout lang={lang}>
      <SaWaveGuide lang={lang} />
    </MarketingLayout>
  )
}
