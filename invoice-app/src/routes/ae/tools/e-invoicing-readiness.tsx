import { createFileRoute } from '@tanstack/react-router'
import { AeToolShell } from '#/components/ae/AeToolShell'
import { UaeReadinessQuiz } from '#/components/ae/UaeReadinessQuiz'
import { getAeCopy } from '#/lib/ae/copy'
import { buildAePageHead } from '#/lib/ae/pages'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/ae/tools/e-invoicing-readiness')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) =>
    buildAePageHead('e-invoicing-readiness', resolveLang(match.search)),
  component: AeReadinessPage,
})

function AeReadinessPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = getAeCopy(lang)

  return (
    <AeToolShell
      deadline={false}
      lang={lang}
      crumb={copy.pageNames['e-invoicing-readiness']}
      title={copy.readiness.title}
      subtitle={copy.readiness.subtitle}
      faqTitle={copy.readiness.faqTitle}
      faq={copy.readiness.faq}
    >
      <UaeReadinessQuiz lang={lang} />
    </AeToolShell>
  )
}
