import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { InstantInvoiceTool } from '#/components/instant-invoice/InstantInvoiceTool'
import { ToolBreadcrumb } from '#/components/tools/ToolBreadcrumb'
import { ToolFaqSection, buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { getToolsCopy } from '#/lib/tools/copy'
import { getFatoraFaq } from '#/lib/tools/fatora-faq'

export const Route = createFileRoute('/tools/fatora')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const seo = getToolsCopy(lang).seo.fatora

    return {
      ...buildMarketingHead({
        ...seo,
        path: '/tools/fatora',
        lang,
      }),
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildFaqSchema(getFatoraFaq(lang))),
        },
      ],
    }
  },
  component: FatoraToolPage,
})

function FatoraToolPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const toolsCopy = getToolsCopy(lang)
  const tool = toolsCopy.tools.fatora
  const faqItems = getFatoraFaq(lang)

  return (
    <MarketingLayout lang={lang} deadline>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-4 pt-10 md:px-8">
        <ToolBreadcrumb lang={lang} current={tool.title} />
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-balance text-foreground md:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{tool.subtitle}</p>
      </div>
      <InstantInvoiceTool lang={lang} showIntro={false} />
      <ToolFaqSection
        title={lang === 'ar' ? 'أسئلة شائعة' : 'Frequently asked questions'}
        items={faqItems}
      />
    </MarketingLayout>
  )
}
