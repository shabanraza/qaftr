import { describe, expect, it } from 'vitest'
import { buildDocumentPageHead } from './pages'

function schemas(head: ReturnType<typeof buildDocumentPageHead>) {
  return head.scripts.map((s) => JSON.parse(s.children) as Record<string, unknown>)
}

describe('buildDocumentPageHead', () => {
  it('builds Saudi SEO tags with an Arabic canonical', () => {
    const head = buildDocumentPageHead('receipt-voucher', 'ar')
    expect(head.meta[0]).toEqual({ title: expect.stringMatching(/^سند قبض/) })
    expect(head.links).toContainEqual({ rel: 'canonical', href: 'https://qaftr.com/tools/receipt-voucher' })
    expect(head.links).toContainEqual({
      rel: 'alternate',
      hrefLang: 'en-SA',
      href: 'https://qaftr.com/tools/receipt-voucher?lang=en',
    })
  })

  it('emits breadcrumb, FAQ and HowTo JSON-LD', () => {
    const [crumbs, faq, howTo] = schemas(buildDocumentPageHead('credit-note', 'en'))
    expect(crumbs['@type']).toBe('BreadcrumbList')
    const items = crumbs.itemListElement as Array<{ name: string; item: string }>
    expect(items.map((i) => i.item)).toEqual([
      'https://qaftr.com/?lang=en',
      'https://qaftr.com/tools?lang=en',
      'https://qaftr.com/tools/credit-note?lang=en',
    ])
    expect(faq['@type']).toBe('FAQPage')
    expect(howTo['@type']).toBe('HowTo')
    expect(howTo.inLanguage).toBe('en-SA')
    expect((howTo.step as unknown[]).length).toBeGreaterThanOrEqual(3)
  })

  it('uses the quotation path', () => {
    const head = buildDocumentPageHead('quotation', 'ar')
    expect(head.links).toContainEqual({ rel: 'canonical', href: 'https://qaftr.com/tools/quotation' })
  })
})
