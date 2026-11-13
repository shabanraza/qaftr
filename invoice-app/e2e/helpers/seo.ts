import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export type SeoExpectation = {
  lang: string
  dir: 'rtl' | 'ltr'
  canonical: string
  /** hreflang → href, must include x-default. */
  hreflang: Record<string, string>
  robots?: string
}

/** Asserts the document head/SEO contract for one page in one language. */
export async function expectSeoHead(page: Page, want: SeoExpectation) {
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', want.lang)
  await expect(html).toHaveAttribute('dir', want.dir)

  const canonical = page.locator('head link[rel="canonical"]')
  await expect(canonical).toHaveCount(1)
  await expect(canonical).toHaveAttribute('href', want.canonical)

  // hreflang alternates: exactly the expected set, once each.
  const alternates = await page
    .locator('head link[rel="alternate"][hreflang]')
    .evaluateAll((els) =>
      els.map((el) => [el.getAttribute('hreflang') ?? '', el.getAttribute('href') ?? '']),
    )
  expect(alternates.map(([l]) => l).sort(), 'hreflang set').toEqual(
    Object.keys(want.hreflang).sort(),
  )
  expect(Object.fromEntries(alternates), 'hreflang hrefs').toEqual(want.hreflang)
  expect(want.hreflang['x-default'], 'x-default expected').toBeTruthy()

  if (want.robots) {
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
      'content',
      want.robots,
    )
  }

  await expect(page.locator('h1')).toHaveCount(1)
  expect((await page.title()).trim(), 'title').not.toBe('')

  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()
  expect(blocks.length, 'at least one JSON-LD block').toBeGreaterThan(0)
  for (const block of blocks) {
    expect(() => JSON.parse(block), `JSON-LD parses: ${block.slice(0, 80)}`).not.toThrow()
  }
}
