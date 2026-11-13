import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { ToolBreadcrumb } from '#/components/tools/ToolBreadcrumb'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { ZatcaWaveChecker } from '#/components/tools/ZatcaWaveChecker'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildSaPageHead } from '#/lib/sa/pages'
import { getWaveCopy } from '#/lib/sa/wave-copy'

export const Route = createFileRoute('/tools/zatca-wave-checker')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildSaPageHead('zatca-wave-checker', resolveLang(match.search)),
  component: ZatcaWaveCheckerPage,
})

function ZatcaWaveCheckerPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const copy = getWaveCopy(lang)

  return (
    <MarketingLayout lang={lang}>
      <div dir={dir} lang={lang}>
        <div className="mx-auto max-w-6xl px-5 pb-6 pt-10 md:px-8">
          <ToolBreadcrumb lang={lang} current={copy.pageName} />
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-balance text-foreground md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">{copy.subtitle}</p>
        </div>
        <ZatcaWaveChecker lang={lang} />
        <ToolFaqSection title={copy.faqTitle} items={copy.faq} />
      </div>
    </MarketingLayout>
  )
}
