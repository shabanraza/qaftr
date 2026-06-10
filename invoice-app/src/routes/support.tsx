import { createFileRoute } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { t, seoCopy } from '#/lib/marketing/i18n'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { SUPPORT_EMAIL } from '#/lib/marketing/constants'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/support')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const seo = seoCopy(lang).support
    return buildMarketingHead({ ...seo, path: '/support', lang })
  },
  component: SupportPage,
})

function SupportPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = t(lang).support

  return (
    <MarketingLayout lang={lang}>
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
        <header className="mb-10 text-center md:text-start">
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{copy.subtitle}</p>
        </header>

        <Card className="mb-12 shadow-sm transition-shadow hover:shadow-md">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex flex-col items-center gap-3 p-8 text-center no-underline md:flex-row md:text-start"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
              <Mail strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{copy.emailLabel}</p>
              <p className="mt-1 text-xl font-bold text-primary">{SUPPORT_EMAIL}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy.emailHint}</p>
            </div>
          </a>
        </Card>

        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {copy.topics.map((topic) => (
            <Card key={topic.title} className="gap-2 py-5 shadow-none">
              <CardHeader className="px-5 pb-0">
                <CardTitle className="text-base text-primary">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-5">
                <p className="text-sm text-muted-foreground">{topic.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section>
          <h2 className="mb-6 font-[family-name:var(--font-qaftr-display)] text-xl font-bold text-foreground">
            {copy.faqTitle}
          </h2>
          <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-5">
            {copy.faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-primary hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </MarketingLayout>
  )
}
