import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { langDir, regionFromPath } from '#/lib/marketing/lang'
import { toArabicIndic } from '#/lib/sa/format'
import type { MarketingLang } from '#/lib/marketing/lang'
import { t } from '#/lib/marketing/i18n'
import { AuthGateDialog } from '#/components/instant-invoice/AuthGateDialog'
import { Button } from '#/components/ui/button'
import { MarketingLanguageToggle } from '#/components/marketing/MarketingLanguageToggle'
import { MarketingMobileMenu } from '#/components/marketing/MarketingMobileMenu'
import {
  RegionLinks,
  RegionPicker,
  RegionSuggestionBanner,
} from '#/components/marketing/RegionSwitcher'
import { getMarketingNavItems } from '#/components/marketing/marketing-nav'
import { DeadlineStrip } from '#/components/marketing/DeadlineStrip'
import { CookieSettingsLink } from '#/components/analytics/CookieSettingsLink'

type MarketingLayoutProps = {
  lang: MarketingLang
  children: React.ReactNode
  /** Show the region's deadline strip under the header. */
  deadline?: boolean
}

export function MarketingLayout({ lang, children, deadline = false }: MarketingLayoutProps) {
  const dir = langDir(lang)
  const copy = t(lang)
  const { data: session } = authClient.useSession()
  const homeSearch = lang === 'en' ? { lang: 'en' as const } : {}
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')
  const navItems = getMarketingNavItems(lang)
  const region = regionFromPath(
    useRouterState({ select: (state) => state.location.pathname }),
  )
  const openAuth = (mode: 'signup' | 'signin') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }
  const signOut = () => {
    void authClient.signOut()
  }

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

      <RegionSuggestionBanner lang={lang} />

      <header className="relative z-10 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            to="/"
            search={lang === 'en' ? { lang: 'en' } : {}}
            className="group flex shrink-0 items-center gap-2 no-underline"
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

          <nav
            aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}
            className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex xl:gap-8"
          >
            {navItems.map((item) => (
              <Link
                key={`${item.to}#${item.hash ?? ''}`}
                to={item.to}
                search={homeSearch}
                hash={item.hash}
                className="qaftr-nav-link whitespace-nowrap no-underline hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {session?.user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:inline-flex"
                  asChild
                >
                  <Link
                    to="/workspace"
                    search={homeSearch}
                    className="no-underline"
                  >
                    {lang === 'ar' ? 'مكتب المال' : 'Money desk'}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:inline-flex"
                  onClick={signOut}
                >
                  {lang === 'ar' ? 'خروج' : 'Sign out'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:inline-flex"
                  onClick={() => openAuth('signin')}
                >
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
                </Button>
                <Button
                  size="sm"
                  className="qaftr-btn-primary hidden lg:inline-flex"
                  onClick={() => openAuth('signup')}
                >
                  {lang === 'ar' ? 'إنشاء حساب' : 'Create account'}
                </Button>
              </>
            )}
            <RegionPicker lang={lang} className="hidden sm:inline-flex" />
            <MarketingLanguageToggle lang={lang} />
            <MarketingMobileMenu
              lang={lang}
              items={navItems}
              signedIn={Boolean(session?.user)}
              onSignIn={() => openAuth('signin')}
              onSignUp={() => openAuth('signup')}
              onSignOut={signOut}
            />
          </div>
        </div>
      </header>

      {deadline ? <DeadlineStrip lang={lang} region={region} /> : null}

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
            <p className="mt-1 text-sm text-muted-foreground">
              {region === 'ae' ? copy.footer.taglineAe : copy.footer.tagline}
            </p>
            <RegionLinks
              lang={lang}
              className="mt-3 flex justify-center md:justify-start"
              linkClassName="text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/ae"
              search={homeSearch}
              className="no-underline hover:text-primary"
            >
              {lang === 'ar' ? 'الإمارات' : 'UAE'}
            </Link>
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
            <CookieSettingsLink lang={lang} />
            <span className="text-muted-foreground">
              © {region === 'sa' && lang === 'ar' ? toArabicIndic(String(new Date().getFullYear())) : new Date().getFullYear()} {lang === 'ar' ? 'قافتر' : 'Qaftr'} ·{' '}
              {copy.footer.rights}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
