import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { t, seoCopy } from '#/lib/marketing/i18n'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { Separator } from '#/components/ui/separator'

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
        <header className="mb-10">
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{copy.updated}</p>
          <Separator className="mt-8" />
        </header>
        <div className="prose prose-neutral flex max-w-none flex-col gap-8">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-primary">{section.heading}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </MarketingLayout>
  )
}
