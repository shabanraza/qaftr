import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { ToolBreadcrumb } from '#/components/tools/ToolBreadcrumb'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { ZatcaQrDecoder } from '#/components/tools/ZatcaQrDecoder'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildSaPageHead } from '#/lib/sa/pages'
import { getQrCopy } from '#/lib/sa/qr-copy'

export const Route = createFileRoute('/tools/zatca-qr')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildSaPageHead('zatca-qr', resolveLang(match.search)),
  component: ZatcaQrPage,
})

function ZatcaQrPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const copy = getQrCopy(lang)

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
        <ZatcaQrDecoder lang={lang} />
        <ToolFaqSection title={copy.faqTitle} items={copy.faq} />
      </div>
    </MarketingLayout>
  )
}
