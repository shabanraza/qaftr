import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { t, seoCopy } from '#/lib/marketing/i18n'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/privacy')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const seo = seoCopy(lang).privacy
    return buildMarketingHead({ ...seo, path: '/privacy', lang })
  },
  component: PrivacyPage,
})

function PrivacyPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = t(lang).privacy

  return (
    <MarketingLayout lang={lang}>
      <article className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <header className="mb-10 border-b border-[#E4EBE7] pb-8">
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-[#0E1C16] md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm text-[#8AA396]">{copy.updated}</p>
        </header>
        <div className="prose prose-neutral max-w-none flex flex-col gap-8">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-[#0A3D2E]">{section.heading}</h2>
              <p className="mt-3 leading-relaxed text-[#3E5A4A]">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </MarketingLayout>
  )
}
