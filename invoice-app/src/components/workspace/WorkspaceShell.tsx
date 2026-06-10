import { Link, useRouterState } from '@tanstack/react-router'
import {
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircleMore,
  Plus,
  Users,
} from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type WorkspaceSection = 'overview' | 'invoices' | 'quotes' | 'clients' | 'whatsapp' | 'accountant'
type WorkspaceNavItem = {
  id: WorkspaceSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  to?: '/workspace' | '/workspace/invoices' | '/workspace/quotes' | '/workspace/clients' | '/workspace/whatsapp' | '/workspace/accountant'
  soon?: boolean
}

type WorkspaceShellProps = {
  lang: MarketingLang
  active: WorkspaceSection
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function WorkspaceShell({
  lang,
  active,
  title,
  subtitle,
  actions,
  children,
}: WorkspaceShellProps) {
  const routerState = useRouterState()
  const isNavigating = routerState.status === 'pending'
  const isArabic = lang === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const copy = isArabic
    ? {
        brand: 'قافتر',
        title: 'مكتب المال',
        subtitle: 'الفواتير، العملاء، والتحصيل في لوحة واحدة.',
        newInvoice: 'فاتورة جديدة',
        soon: 'قريباً',
        signOut: 'خروج',
        home: 'الرئيسية',
        nav: [
          { id: 'overview' as const, label: 'لوحة العمل', icon: LayoutDashboard, to: '/workspace' as const },
          { id: 'invoices' as const, label: 'الفواتير', icon: FileText, to: '/workspace/invoices' as const },
          { id: 'quotes' as const, label: 'عروض الأسعار', icon: FileText, to: '/workspace/quotes' as const },
          { id: 'clients' as const, label: 'العملاء', icon: Users, to: '/workspace/clients' as const },
          { id: 'whatsapp' as const, label: 'واتساب', icon: MessageCircleMore, to: '/workspace/whatsapp' as const },
          { id: 'accountant' as const, label: 'ملف المحاسب', icon: FileSpreadsheet, to: '/workspace/accountant' as const },
        ] satisfies WorkspaceNavItem[],
      }
    : {
        brand: 'Qaftr',
        title: 'Money desk',
        subtitle: 'Invoices, clients, and collections in one workspace.',
        newInvoice: 'New invoice',
        soon: 'Soon',
        signOut: 'Sign out',
        home: 'Home',
        nav: [
          { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard, to: '/workspace' as const },
          { id: 'invoices' as const, label: 'Invoices', icon: FileText, to: '/workspace/invoices' as const },
          { id: 'quotes' as const, label: 'Quotes', icon: FileText, to: '/workspace/quotes' as const },
          { id: 'clients' as const, label: 'Clients', icon: Users, to: '/workspace/clients' as const },
          { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircleMore, to: '/workspace/whatsapp' as const },
          { id: 'accountant' as const, label: 'Accountant packet', icon: FileSpreadsheet, to: '/workspace/accountant' as const },
        ] satisfies WorkspaceNavItem[],
      }

  return (
    <div
      dir={dir}
      lang={lang}
      className="qaftr-marketing relative flex h-screen flex-col overflow-hidden bg-background font-[family-name:var(--font-qaftr-body)] text-foreground"
    >
      {/* YouTube/GitHub style global pending indicator loading bar */}
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
          <div className="h-full w-full bg-primary origin-left qaftr-loading-bar" />
        </div>
      )}
      {/* ── Slim top bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm">
        {/* Logo */}
        <Link
          to="/"
          search={lang === 'en' ? { lang: 'en' } : {}}
          className="flex items-center gap-2 no-underline"
          aria-label={isArabic ? 'قافتر — الرئيسية' : 'Qaftr — Home'}
        >
          <img
            src="/logo192.png"
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-lg shadow-sm"
            aria-hidden
          />
          <span className="text-base font-bold tracking-tight text-primary">{copy.brand}</span>
        </Link>

        {/* Top-bar actions */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="hidden gap-1.5 sm:inline-flex qaftr-btn-primary"
          >
            <Link to="/workspace/new-invoice" search={search}>
              <Plus className="size-3.5" />
              {copy.newInvoice}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => void authClient.signOut()}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{copy.signOut}</span>
          </Button>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[220px_1fr]">

        {/* ── Sidebar ── */}
        <aside className="flex flex-col border-b border-border bg-background/60 lg:border-b-0 lg:border-inline-end lg:overflow-y-auto">
          {/* Workspace label — desktop only */}
          <div className="hidden px-4 pb-3 pt-5 lg:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {copy.title}
            </p>
          </div>

          {/* Nav */}
          <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-2">
            {copy.nav.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              const className = cn(
                'inline-flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium !text-muted-foreground transition-colors lg:w-full',
                'hover:bg-accent hover:!text-foreground',
                isActive &&
                  'bg-primary !text-primary-foreground hover:bg-primary hover:!text-primary-foreground [&_svg]:!text-primary-foreground',
              )

              return (
                <Link
                  key={item.id}
                  to={item.to}
                  search={search}
                  className={className}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Mobile "New invoice" pill at bottom of nav row */}
          <div className="block px-3 pb-2 lg:hidden">
            <Button asChild size="sm" className="w-full gap-1.5 qaftr-btn-primary">
              <Link to="/workspace/new-invoice" search={search}>
                <Plus className="size-3.5" />
                {copy.newInvoice}
              </Link>
            </Button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex min-w-0 flex-col overflow-y-auto bg-card">
          {/* Page header bar */}
          <div className="flex min-h-14 shrink-0 flex-col gap-3 border-b border-border px-5 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-sm font-semibold text-foreground">{title}</h1>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap gap-2">{actions}</div>
            ) : null}
          </div>

          {/* Page body */}
          {children}
        </main>
      </div>
    </div>
  )
}
