import { describe, expect, it } from 'vitest'
import { getWorkspaceNav, workspaceSectionForPath } from './workspace-nav'

describe('workspaceSectionForPath', () => {
  it.each([
    ['/workspace', 'home'],
    ['/workspace/', 'home'],
    ['/workspace/invoices', 'invoices'],
    ['/workspace/invoices/abc', 'invoices'],
    ['/workspace/new-invoice', 'invoices'],
    ['/workspace/quotes/new', 'quotes'],
    ['/workspace/clients', 'customers'],
    ['/workspace/accountant', 'reports'],
    ['/workspace/business', 'settings'],
  ])('%s -> %s', (path, section) => {
    expect(workspaceSectionForPath(path)).toBe(section)
  })
})

describe('getWorkspaceNav', () => {
  it('has six sections in order, without a WhatsApp page', () => {
    expect(getWorkspaceNav('en').map((item) => item.label)).toEqual([
      'Home',
      'Invoices',
      'Quotes',
      'Customers',
      'Reports',
      'Settings',
    ])
  })

  it('has Arabic labels', () => {
    expect(getWorkspaceNav('ar').map((item) => item.label)).toEqual([
      'الرئيسية',
      'الفواتير',
      'عروض الأسعار',
      'العملاء',
      'التقارير',
      'الإعدادات',
    ])
  })
})
