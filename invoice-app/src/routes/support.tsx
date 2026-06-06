import { createFileRoute } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { t, seoCopy } from '#/lib/marketing/i18n'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { SUPPORT_EMAIL, BRAND } from '#/lib/marketing/constants'

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
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-[#0E1C16] md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-lg text-[#3E5A4A]">{copy.subtitle}</p>
        </header>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mb-12 flex flex-col items-center gap-3 rounded-2xl border border-[#E4EBE7] bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md no-underline md:flex-row md:text-start"
        >
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-[#0A3D2E]"
            style={{ backgroundColor: `${BRAND.green}12` }}
          >
            <Mail className="size-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#8AA396]">{copy.emailLabel}</p>
            <p className="mt-1 text-xl font-bold text-[#0A3D2E]">{SUPPORT_EMAIL}</p>
            <p className="mt-1 text-sm text-[#3E5A4A]">{copy.emailHint}</p>
          </div>
        </a>

        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {copy.topics.map((topic) => (
            <div
              key={topic.title}
              className="rounded-xl border border-[#E4EBE7] bg-white/80 p-5"
            >
              <h2 className="font-bold text-[#0A3D2E]">{topic.title}</h2>
              <p className="mt-2 text-sm text-[#3E5A4A]">{topic.body}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-6 font-[family-name:var(--font-qaftr-display)] text-xl font-bold text-[#0E1C16]">
            {copy.faqTitle}
          </h2>
          <div className="flex flex-col gap-4">
            {copy.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-[#E4EBE7] bg-white p-5 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-[#0A3D2E] marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#3E5A4A]">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
