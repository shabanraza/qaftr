import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import {
  langDir,
  type MarketingLang,
} from '#/lib/marketing/lang'
import { t } from '#/lib/marketing/i18n'
import { AuthGateDialog } from '#/components/instant-invoice/AuthGateDialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { MarketingLanguageToggle } from '#/components/marketing/MarketingLanguageToggle'

type MarketingLayoutProps = {
  lang: MarketingLang
  children: React.ReactNode
}

export function MarketingLayout({ lang, children }: MarketingLayoutProps) {
  const dir = langDir(lang)
  const copy = t(lang)
  const { data: session } = authClient.useSession()
  const homeSearch = lang === 'en' ? { lang: 'en' as const } : {}
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')

  return (
    <div
      dir={dir}
      lang={lang}
      className="qaftr-marketing min-h-screen bg-background font-[family-name:var(--font-qaftr-body)] text-foreground"
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 10%, rgba(200, 151, 58, 0.08), transparent 40%),
            radial-gradient(circle at 85% 20%, rgba(10, 61, 46, 0.06), transparent 45%),
            repeating-linear-gradient(
              -12deg,
              transparent,
              transparent 48px,
              rgba(10, 61, 46, 0.018) 48px,
              rgba(10, 61, 46, 0.018) 49px
            )
          `,
        }}
      />

      <header className="relative z-10 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            to="/"
            search={lang === 'en' ? { lang: 'en' } : {}}
            className="group flex items-center gap-2 no-underline"
            aria-label={lang === 'ar' ? 'قافتر — الرئيسية' : 'Qaftr — Home'}
          >
            <img
              src="/logo192.png"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-xl shadow-sm"
              aria-hidden
            />
            <span className="text-xl font-bold tracking-tight text-primary">
              {lang === 'ar' ? 'قافتر' : 'Qaftr'}
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <Link
              to="/tools"
              search={homeSearch}
              className="qaftr-nav-link no-underline hover:text-primary"
            >
              {lang === 'ar' ? 'أدوات مجانية' : 'Free tools'}
            </Link>
            <Link
              to="/"
              search={homeSearch}
              hash="features"
              className="qaftr-nav-link no-underline hover:text-primary"
            >
              {copy.nav.features}
            </Link>
            <Link
              to="/"
              search={homeSearch}
              hash="pricing"
              className="qaftr-nav-link no-underline hover:text-primary"
            >
              {copy.nav.pricing}
            </Link>
            <Link
              to="/support"
              search={homeSearch}
              className="qaftr-nav-link no-underline hover:text-primary"
            >
              {copy.nav.support}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user ? (
              <>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
                  <Link
                    to="/workspace"
                    search={lang === 'en' ? { lang: 'en' } : {}}
                    className="no-underline"
                  >
                    {lang === 'ar' ? 'مكتب المال' : 'Money desk'}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => {
                    void authClient.signOut()
                  }}
                >
                  {lang === 'ar' ? 'خروج' : 'Sign out'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="inline-flex"
                  onClick={() => {
                    setAuthMode('signin')
                    setAuthOpen(true)
                  }}
                >
                  <span className="sm:hidden">{lang === 'ar' ? 'دخول' : 'Sign in'}</span>
                  <span className="hidden sm:inline">{lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</span>
                </Button>
                <Button
                  size="sm"
                  className="hidden sm:inline-flex qaftr-btn-primary"
                  onClick={() => {
                    setAuthMode('signup')
                    setAuthOpen(true)
                  }}
                >
                  {lang === 'ar' ? 'إنشاء حساب' : 'Create account'}
                </Button>
              </>
            )}
            <MarketingLanguageToggle lang={lang} />
            <Badge className="hidden sm:inline-flex">{copy.cta.comingSoon}</Badge>
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      {!session?.user ? (
        <AuthGateDialog
          lang={lang}
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false)
            void authClient.getSession()
          }}
          initialMode={authMode}
          context="general"
        />
      ) : null}

      <footer className="relative z-10 mt-20 border-t border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-10 text-center md:flex-row md:justify-between md:text-start">
          <div>
            <p className="text-lg font-bold text-primary">
              {lang === 'ar' ? 'قافتر' : 'Qaftr'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/privacy"
              search={lang === 'en' ? { lang: 'en' } : {}}
              className="no-underline hover:text-primary"
            >
              {copy.footer.privacy}
            </Link>
            <Link
              to="/support"
              search={lang === 'en' ? { lang: 'en' } : {}}
              className="no-underline hover:text-primary"
            >
              {copy.footer.support}
            </Link>
            <span className="text-muted-foreground/70">
              © {new Date().getFullYear()} {lang === 'ar' ? 'قافتر' : 'Qaftr'} · {copy.footer.rights}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
