import { Link, useRouterState } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { Button } from '#/components/ui/button'
import { marketingSearchSchema, regionFromPath, resolveLang } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'

/** Reads ?lang= safely from the current location (works outside a matched route). */
function useLangFromLocation(): MarketingLang {
  const search = useRouterState({ select: (state) => state.location.search })
  return resolveLang(marketingSearchSchema.parse(search))
}

function StatusShell({
  lang,
  code,
  title,
  body,
  children,
}: {
  lang: MarketingLang
  code: string
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <MarketingLayout lang={lang}>
      <section className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center md:px-8">
        <p className="font-[family-name:var(--font-qaftr-display)] text-6xl font-bold text-[var(--qaftr-gold)]">
          {code}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      </section>
    </MarketingLayout>
  )
}

/** Root 404 page. TanStack Start keeps the 404 status for unmatched routes. */
export function MarketingNotFound() {
  const lang = useLangFromLocation()
  const ar = lang === 'ar'
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  if (regionFromPath(pathname) === 'ae') {
    return (
      <StatusShell
        lang={lang}
        code="404"
        title={ar ? 'الصفحة غير موجودة' : 'Page not found'}
        body={
          ar
            ? 'الرابط الذي فتحته غير موجود أو نُقل إلى مكان آخر. جرّب أدوات الإمارات المجانية.'
            : 'The page you opened does not exist or has moved. Try our free UAE tools.'
        }
      >
        <Button asChild size="lg" className="qaftr-btn-primary">
          <Link to="/ae" search={search} className="no-underline">
            {ar ? 'أدوات الإمارات' : 'UAE tools'}
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/ae/tools/invoice-generator" search={search} className="no-underline">
            {ar ? 'مولّد الفاتورة الضريبية' : 'Tax invoice generator'}
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/ae/tools/e-invoicing-readiness" search={search} className="no-underline">
            {ar ? 'جاهزية الفوترة الإلكترونية' : 'E-invoicing readiness'}
          </Link>
        </Button>
      </StatusShell>
    )
  }

  return (
    <StatusShell
      lang={lang}
      code="404"
      title={ar ? 'الصفحة غير موجودة' : 'Page not found'}
      body={
        ar
          ? 'الرابط الذي فتحته غير موجود أو نُقل إلى مكان آخر. جرّب الصفحة الرئيسية أو الأدوات المجانية.'
          : 'The page you opened does not exist or has moved. Try the home page or our free tools.'
      }
    >
      <Button asChild size="lg" className="qaftr-btn-primary">
        <Link to="/" search={search} className="no-underline">
          {ar ? 'الرئيسية' : 'Home'}
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link to="/tools" search={search} className="no-underline">
          {ar ? 'الأدوات المجانية' : 'Free tools'}
        </Link>
      </Button>
    </StatusShell>
  )
}

/** Root error boundary: friendly, localised, never shows the raw error. */
export function MarketingError({
  reset,
}: Pick<ErrorComponentProps, 'reset'> & { error?: unknown }) {
  const lang = useLangFromLocation()
  const ar = lang === 'ar'
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  return (
    <StatusShell
      lang={lang}
      code="!"
      title={ar ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
      body={
        ar
          ? 'نعتذر، تعذّر عرض هذه الصفحة. حاول مرة أخرى أو عُد إلى الصفحة الرئيسية.'
          : 'Sorry, we could not show this page. Please try again or go back home.'
      }
    >
      <Button size="lg" className="qaftr-btn-primary" onClick={() => reset()}>
        {ar ? 'حاول مرة أخرى' : 'Try again'}
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link to="/" search={search} className="no-underline">
          {ar ? 'الرئيسية' : 'Home'}
        </Link>
      </Button>
    </StatusShell>
  )
}
