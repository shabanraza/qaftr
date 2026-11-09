import type { MarketingLang } from '#/lib/marketing/lang'
import { buildBreadcrumbSchema, buildJsonLdScript, buildMarketingHead } from '#/lib/marketing/seo'
import { buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { getToolsCopy } from '#/lib/tools/copy'
import { DOCUMENT_PATHS, getDocumentCopy } from './copy'
import type { DocumentKind } from './copy'

/** <head> for a Saudi document generator: SEO tags + breadcrumb, FAQ and HowTo JSON-LD. */
export function buildDocumentPageHead(kind: DocumentKind, lang: MarketingLang) {
  const copy = getDocumentCopy(lang)[kind]
  const path = DOCUMENT_PATHS[kind]
  const suffix = lang === 'en' ? '?lang=en' : ''
  const breadcrumb = buildBreadcrumbSchema([
    { name: lang === 'ar' ? 'قافتر' : 'Qaftr', path: `/${suffix}` },
    { name: getToolsCopy(lang).breadcrumbRoot, path: `/tools${suffix}` },
    { name: copy.title, path: `${path}${suffix}` },
  ])
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: copy.howTo.name,
    inLanguage: lang === 'ar' ? 'ar-SA' : 'en-SA',
    totalTime: 'PT3M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'SAR', value: '0' },
    step: copy.howTo.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  }
  return {
    ...buildMarketingHead({ ...copy.seo, path, lang }),
    scripts: [breadcrumb, buildFaqSchema(copy.faq), howTo].map(buildJsonLdScript),
  }
}
