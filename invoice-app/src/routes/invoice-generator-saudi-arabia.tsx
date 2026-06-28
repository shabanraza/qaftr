import { createFileRoute } from '@tanstack/react-router'
import { SeoLandingPage } from '#/components/marketing/SeoLandingPage'
import { buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { getSeoLandingPage } from '#/lib/marketing/seo-landing-pages'
import {
  buildBreadcrumbSchema,
  buildJsonLdScript,
  buildMarketingHead,
} from '#/lib/marketing/seo'

const slug = 'invoice-generator-saudi-arabia'

export const Route = createFileRoute('/invoice-generator-saudi-arabia')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const page = getSeoLandingPage(slug, lang)

    return {
      ...buildMarketingHead({
        title: page.title,
        description: page.description,
        path: `/${slug}`,
        lang,
      }),
      scripts: [
        buildJsonLdScript(buildFaqSchema(page.faq)),
        buildJsonLdScript(
          buildBreadcrumbSchema([
            { name: 'Qaftr', path: '/' },
            { name: page.heading, path: `/${slug}` },
          ]),
        ),
      ],
    }
  },
  component: Page,
})

function Page() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  return <SeoLandingPage slug={slug} lang={lang} />
}
