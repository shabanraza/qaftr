import {
  BarChart3,
  Briefcase,
  FileText,
  House,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react'
import type { MarketingLang } from '#/lib/marketing/lang'

export type WorkspaceSection = 'home' | 'invoices' | 'quotes' | 'customers' | 'reports' | 'firm' | 'settings'

export type WorkspaceNavPath =
  | '/workspace'
  | '/workspace/invoices'
  | '/workspace/quotes'
  | '/workspace/clients'
  | '/workspace/accountant'
  | '/workspace/firm'
  | '/workspace/business'

export type WorkspaceNavItem = {
  id: WorkspaceSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  to: WorkspaceNavPath
}

const LABELS: Record<MarketingLang, Record<WorkspaceSection, string>> = {
  ar: {
    home: 'الرئيسية',
    invoices: 'الفواتير',
    quotes: 'عروض الأسعار',
    customers: 'العملاء',
    reports: 'التقارير',
    firm: 'دفاتر العملاء',
    settings: 'الإعدادات',
  },
  en: {
    home: 'Home',
    invoices: 'Invoices',
    quotes: 'Quotes',
    customers: 'Customers',
    reports: 'Reports',
    firm: 'Client books',
    settings: 'Settings',
  },
}

const ITEMS: { id: WorkspaceSection; icon: WorkspaceNavItem['icon']; to: WorkspaceNavPath }[] = [
  { id: 'home', icon: House, to: '/workspace' },
  { id: 'invoices', icon: ReceiptText, to: '/workspace/invoices' },
  { id: 'quotes', icon: FileText, to: '/workspace/quotes' },
  { id: 'customers', icon: Users, to: '/workspace/clients' },
  { id: 'reports', icon: BarChart3, to: '/workspace/accountant' },
  { id: 'settings', icon: Settings, to: '/workspace/business' },
]

const FIRM_ITEM = { id: 'firm', icon: Briefcase, to: '/workspace/firm' } as const

/**
 * Sidebar items. "Client books" only appears for accountants who were given
 * access to at least one business (`firm: true`).
 */
export function getWorkspaceNav(lang: MarketingLang, opts: { firm?: boolean } = {}): WorkspaceNavItem[] {
  const items = opts.firm ? [...ITEMS.slice(0, 5), FIRM_ITEM, ITEMS[5]!] : ITEMS
  return items.map((item) => ({ ...item, label: LABELS[lang][item.id] }))
}

/** Which sidebar item is active for a pathname (sub-pages map to their section). */
export function workspaceSectionForPath(pathname: string): WorkspaceSection {
  const rest = pathname.replace(/^\/workspace\/?/, '').split('/')[0]
  switch (rest) {
    case 'invoices':
    case 'new-invoice':
      return 'invoices'
    case 'quotes':
      return 'quotes'
    case 'clients':
      return 'customers'
    case 'accountant':
      return 'reports'
    case 'firm':
      return 'firm'
    case 'business':
      return 'settings'
    default:
      return 'home'
  }
}
