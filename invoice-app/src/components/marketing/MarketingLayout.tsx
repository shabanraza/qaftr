import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import { BRAND } from '#/lib/marketing/constants'
import {
  langDir,
  toggleLang,
  type MarketingLang,
} from '#/lib/marketing/lang'
import { t } from '#/lib/marketing/i18n'

type MarketingLayoutProps = {
  lang: MarketingLang
  children: React.ReactNode
}

export function MarketingLayout({ lang, children }: MarketingLayoutProps) {
  const dir = langDir(lang)
  const copy = t(lang)

  return (
    <div
      dir={dir}
      lang={lang}
      className="qaftr-marketing min-h-screen bg-[#F6F6F3] text-[#0E1C16] font-[family-name:var(--font-qaftr-body)]"
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

      <header className="relative z-10 border-b border-[#E4EBE7]/80 bg-[#F6F6F3]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            to="/"
            search={lang === 'en' ? { lang: 'en' } : {}}
            className="group flex items-center gap-2 no-underline"
            aria-label={lang === 'ar' ? 'قافتر — الرئيسية' : 'Qaftr — Home'}
          >
            <span
              className="flex size-9 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: BRAND.green }}
            >
              ق
            </span>
            <span className="text-xl font-bold tracking-tight text-[#0A3D2E]">
              {lang === 'ar' ? 'قافتر' : 'Qaftr'}
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#3E5A4A] md:flex">
            <a href="#features" className="qaftr-nav-link hover:text-[#0A3D2E]">
              {copy.nav.features}
            </a>
            <a href="#pricing" className="qaftr-nav-link hover:text-[#0A3D2E]">
              {copy.nav.pricing}
            </a>
            <Link
              to="/support"
              search={lang === 'en' ? { lang: 'en' } : {}}
              className="qaftr-nav-link hover:text-[#0A3D2E] no-underline"
            >
              {copy.nav.support}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitch lang={lang} />
            <span
              className="hidden rounded-full px-4 py-2 text-xs font-bold text-white sm:inline-flex"
              style={{ backgroundColor: BRAND.green }}
            >
              {copy.cta.comingSoon}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 mt-20 border-t border-[#E4EBE7] bg-white/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-10 text-center md:flex-row md:justify-between md:text-start">
          <div>
            <p className="text-lg font-bold text-[#0A3D2E]">
              {lang === 'ar' ? 'قافتر' : 'Qaftr'}
            </p>
            <p className="mt-1 text-sm text-[#3E5A4A]">{copy.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#3E5A4A]">
            <Link
              to="/privacy"
              search={lang === 'en' ? { lang: 'en' } : {}}
              className="hover:text-[#0A3D2E] no-underline"
            >
              {copy.footer.privacy}
            </Link>
            <Link
              to="/support"
              search={lang === 'en' ? { lang: 'en' } : {}}
              className="hover:text-[#0A3D2E] no-underline"
            >
              {copy.footer.support}
            </Link>
            <span className="text-[#8AA396]">
              © {new Date().getFullYear()} {lang === 'ar' ? 'قافتر' : 'Qaftr'} · {copy.footer.rights}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function LanguageSwitch({ lang }: { lang: MarketingLang }) {
  const router = useRouterState()
  const pathname = router.location.pathname
  const nextSearch = toggleLang(lang)

  return (
    <Link
      to={pathname as '/'}
      search={nextSearch}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[#E4EBE7] bg-white p-0.5 text-xs font-semibold no-underline shadow-sm',
      )}
      aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <span
        className={cn(
          'rounded-full px-2.5 py-1 transition-colors',
          lang === 'ar' ? 'bg-[#0A3D2E] text-white' : 'text-[#3E5A4A]',
        )}
      >
        AR
      </span>
      <span
        className={cn(
          'rounded-full px-2.5 py-1 transition-colors',
          lang === 'en' ? 'bg-[#0A3D2E] text-white' : 'text-[#3E5A4A]',
        )}
      >
        EN
      </span>
    </Link>
  )
}
