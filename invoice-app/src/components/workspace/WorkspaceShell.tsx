import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import { FileText, LogOut, Plus, ReceiptText, UserPlus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { authClient } from '#/lib/auth-client'
import { clearCachedSession } from '#/lib/session-cache'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { getWorkspaceNav, workspaceSectionForPath } from './workspace-nav'

/**
 * The persistent workspace frame (top bar + sidebar + scrolling main area).
 * Rendered once by the `/workspace` layout route so it stays mounted while
 * the user moves between pages; pages render `WorkspaceShell` for their own
 * header and body inside it.
 */
export function WorkspaceLayout({ lang, children }: { lang: MarketingLang; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isPending = useRouterState({ select: (state) => state.status === 'pending' })
  const [hasMounted, setHasMounted] = useState(false)
  const queryClient = useQueryClient()
  const isArabic = lang === 'ar'
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const active = workspaceSectionForPath(pathname)
  const nav = getWorkspaceNav(lang)
  const copy = isArabic
    ? { brand: 'قافتر', signOut: 'خروج', home: 'قافتر — الرئيسية', menu: 'القائمة' }
    : { brand: 'Qaftr', signOut: 'Sign out', home: 'Qaftr — Home', menu: 'Menu' }

  useEffect(() => {
    setHasMounted(true)
  }, [])

  async function signOut() {
    clearCachedSession(queryClient)
    await authClient.signOut()
    queryClient.clear()
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={lang}
      className="qaftr-marketing relative flex h-screen flex-col overflow-hidden bg-background font-[family-name:var(--font-qaftr-body)] text-foreground"
    >
      {hasMounted && isPending ? (
        <div className="absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20" aria-hidden>
          <div className="qaftr-loading-bar h-full w-full origin-left bg-primary" />
        </div>
      ) : null}

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm">
        <Link to="/" search={search} className="flex items-center gap-2 no-underline" aria-label={copy.home}>
          <img src="/logo192.png" alt="" width={28} height={28} className="size-7 rounded-lg shadow-sm" aria-hidden />
          <span className="text-base font-bold tracking-tight text-primary">{copy.brand}</span>
        </Link>
        <div className="flex items-center gap-2">
          <NewMenu lang={lang} />
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => void signOut()}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{copy.signOut}</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[208px_1fr]">
        <aside className="border-b border-border bg-background/60 lg:overflow-y-auto lg:border-b-0 lg:border-e">
          <nav aria-label={copy.menu} className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible lg:pt-4">
            {nav.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  search={search}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium !text-muted-foreground no-underline transition-colors lg:w-full',
                    'hover:bg-accent hover:!text-foreground',
                    isActive && 'bg-accent !text-foreground [&_svg]:!text-primary',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-card">{children}</main>
      </div>
    </div>
  )
}

function NewMenu({ lang }: { lang: MarketingLang }) {
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const copy =
    lang === 'ar'
      ? { label: 'جديد', invoice: 'فاتورة', quote: 'عرض سعر', customer: 'عميل' }
      : { label: 'New', invoice: 'Invoice', quote: 'Quote', customer: 'Customer' }
  const itemClass =
    'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm !text-foreground no-underline outline-none data-[highlighted]:bg-accent'

  return (
    <DropdownMenuPrimitive.Root dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuPrimitive.Trigger asChild>
        <Button size="sm" className="qaftr-btn-primary gap-1.5">
          <Plus className="size-3.5" />
          {copy.label}
        </Button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <DropdownMenuPrimitive.Item asChild className={itemClass}>
            <Link to="/workspace/new-invoice" search={search}>
              <ReceiptText className="size-4 text-muted-foreground" />
              {copy.invoice}
            </Link>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item asChild className={itemClass}>
            <Link to="/workspace/quotes/new" search={search}>
              <FileText className="size-4 text-muted-foreground" />
              {copy.quote}
            </Link>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item asChild className={itemClass}>
            <Link to="/workspace/clients" search={search} hash="create-client-form">
              <UserPlus className="size-4 text-muted-foreground" />
              {copy.customer}
            </Link>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

type WorkspaceShellProps = {
  lang: MarketingLang
  /** Kept for call-site compatibility; the active nav item comes from the URL. */
  active?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

/** A workspace page: its header bar (title, subtitle, actions) and body. */
export function WorkspaceShell({ title, subtitle, actions, children }: WorkspaceShellProps) {
  return (
    <>
      <div className="flex min-h-14 shrink-0 flex-col gap-3 border-b border-border px-5 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </>
  )
}
