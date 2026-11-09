import { useEffect, useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { MenuIcon, XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Button } from '#/components/ui/button'
import type { MarketingNavItem } from '#/components/marketing/marketing-nav'
import { RegionLinks } from '#/components/marketing/RegionSwitcher'

type MarketingMobileMenuProps = {
  lang: MarketingLang
  items: MarketingNavItem[]
  signedIn: boolean
  onSignIn: () => void
  onSignUp: () => void
  onSignOut: () => void
}

/**
 * Below `lg` the header nav collapses into this side sheet. Built on Radix
 * Dialog, so it traps focus, closes on Escape, restores focus to the trigger,
 * and is announced as a labelled dialog. It closes on any navigation.
 */
export function MarketingMobileMenu({
  lang,
  items,
  signedIn,
  onSignIn,
  onSignUp,
  onSignOut,
}: MarketingMobileMenuProps) {
  const [open, setOpen] = useState(false)
  // Section to scroll to once the dialog has released its scroll lock.
  const pendingHash = useRef<string | null>(null)
  const ar = lang === 'ar'
  const location = useRouterState({ select: (state) => state.location.href })
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  // Close whenever the URL changes (link click, back/forward, hash jump).
  useEffect(() => {
    setOpen(false)
  }, [location])

  // Radix restores focus to the trigger and unlocks body scroll on close,
  // which races the browser's hash jump. Scroll explicitly once it has closed,
  // retrying for a few frames in case the target page is still rendering.
  const scrollToPendingHash = () => {
    const id = pendingHash.current
    pendingHash.current = null
    if (!id) return
    let tries = 0
    const attempt = () => {
      const target = document.getElementById(id)
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (tries++ < 30) {
        requestAnimationFrame(attempt)
      }
    }
    requestAnimationFrame(attempt)
  }

  const runAndClose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label={ar ? 'فتح القائمة' : 'Open menu'}
        >
          <MenuIcon aria-hidden />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(event) => {
            if (pendingHash.current) {
              event.preventDefault()
              scrollToPendingHash()
            }
          }}
          dir={langDir(lang)}
          lang={lang}
          className="qaftr-marketing fixed inset-y-0 end-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-6 border-s border-border bg-background p-5 font-[family-name:var(--font-qaftr-body)] text-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <div className="flex items-center justify-between gap-3">
            <DialogPrimitive.Title className="text-lg font-bold text-primary">
              {ar ? 'القائمة' : 'Menu'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={ar ? 'إغلاق القائمة' : 'Close menu'}
              >
                <XIcon aria-hidden />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            {ar ? 'روابط الموقع والحساب' : 'Site and account links'}
          </DialogPrimitive.Description>
          <nav aria-label={ar ? 'القائمة الرئيسية' : 'Main menu'}>
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={`${item.to}#${item.hash ?? ''}`}>
                  <Link
                    to={item.to}
                    search={search}
                    hash={item.hash}
                    onClick={() => {
                      pendingHash.current = item.hash ?? null
                      setOpen(false)
                    }}
                    className="block rounded-lg px-3 py-2.5 text-base font-medium text-foreground no-underline hover:bg-accent hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <RegionLinks lang={lang} onNavigate={() => setOpen(false)} />
          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-5">
            {signedIn ? (
              <>
                <Button asChild>
                  <Link
                    to="/workspace"
                    search={search}
                    className="no-underline"
                  >
                    {ar ? 'مكتب المال' : 'Money desk'}
                  </Link>
                </Button>
                <Button variant="outline" onClick={runAndClose(onSignOut)}>
                  {ar ? 'خروج' : 'Sign out'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="qaftr-btn-primary"
                  onClick={runAndClose(onSignUp)}
                >
                  {ar ? 'إنشاء حساب' : 'Create account'}
                </Button>
                <Button variant="outline" onClick={runAndClose(onSignIn)}>
                  {ar ? 'تسجيل الدخول' : 'Sign in'}
                </Button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
