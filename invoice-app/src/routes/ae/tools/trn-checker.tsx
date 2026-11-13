import { createFileRoute } from '@tanstack/react-router'
import { AeToolShell } from '#/components/ae/AeToolShell'
import { UaeTrnCheckerTool } from '#/components/ae/UaeTrnCheckerTool'
import { getAeCopy } from '#/lib/ae/copy'
import { buildAePageHead } from '#/lib/ae/pages'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/ae/tools/trn-checker')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) =>
    buildAePageHead('trn-checker', resolveLang(match.search)),
  component: AeTrnCheckerPage,
})

function AeTrnCheckerPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = getAeCopy(lang)

  return (
    <AeToolShell
      lang={lang}
      crumb={copy.pageNames['trn-checker']}
      title={copy.trn.title}
      subtitle={copy.trn.subtitle}
      faqTitle={copy.trn.faqTitle}
      faq={copy.trn.faq}
    >
      <UaeTrnCheckerTool lang={lang} />
    </AeToolShell>
  )
}
