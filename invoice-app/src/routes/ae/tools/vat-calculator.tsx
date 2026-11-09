import { createFileRoute } from '@tanstack/react-router'
import { AeToolShell } from '#/components/ae/AeToolShell'
import { UaeVatCalculatorTool } from '#/components/ae/UaeVatCalculatorTool'
import { getAeCopy } from '#/lib/ae/copy'
import { buildAePageHead } from '#/lib/ae/pages'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/ae/tools/vat-calculator')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) =>
    buildAePageHead('vat-calculator', resolveLang(match.search)),
  component: AeVatCalculatorPage,
})

function AeVatCalculatorPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = getAeCopy(lang)

  return (
    <AeToolShell
      lang={lang}
      crumb={copy.pageNames['vat-calculator']}
      title={copy.vat.title}
      subtitle={copy.vat.subtitle}
      faqTitle={copy.vat.faqTitle}
      faq={copy.vat.faq}
    >
      <UaeVatCalculatorTool lang={lang} />
    </AeToolShell>
  )
}
