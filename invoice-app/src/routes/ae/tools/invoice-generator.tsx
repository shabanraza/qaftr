import { createFileRoute } from '@tanstack/react-router'
import { AeToolShell } from '#/components/ae/AeToolShell'
import { UaeInvoiceGenerator } from '#/components/ae/UaeInvoiceGenerator'
import { getAeCopy } from '#/lib/ae/copy'
import { getAeInvoiceCopy } from '#/lib/ae/invoice-copy'
import { buildAePageHead } from '#/lib/ae/pages'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/ae/tools/invoice-generator')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) =>
    buildAePageHead('invoice-generator', resolveLang(match.search)),
  component: AeInvoiceGeneratorPage,
})

function AeInvoiceGeneratorPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = getAeInvoiceCopy(lang)

  return (
    <AeToolShell
      lang={lang}
      crumb={getAeCopy(lang).pageNames['invoice-generator']}
      title={copy.title}
      subtitle={copy.subtitle}
      faqTitle={copy.faqTitle}
      faq={copy.faq}
    >
      <UaeInvoiceGenerator lang={lang} />
    </AeToolShell>
  )
}
