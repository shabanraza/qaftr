import { test, expect, open } from './fixtures'
import { expectNoHorizontalOverflow, expectSingleRowNoOverflow } from './helpers/layout'
import { expectSeoHead } from './helpers/seo'
import { PAGES, expectedSeo, pageUrl } from './pages'
import type { Lang } from './pages'
import type { Page } from '@playwright/test'

const LANGS: Lang[] = ['ar', 'en']

/**
 * Widths checked by the page sweep in the desktop project: one page load, then
 * the viewport is resized (CSS media queries re-evaluate; the header picks its
 * breakpoint layout). 1024 is the first width with the full desktop nav (the
 * tightest one-row header); 768 has full header actions but no hamburger yet.
 * The phone width (375, touch + mobile UA) is the `mobile` project.
 */
const DESKTOP_WIDTHS = [1280, 1024, 768] as const

async function nextFrame(p: Page) {
  await p.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  )
}

async function expectPageLayout(p: Page) {
  await expectNoHorizontalOverflow(p)
  // Header: no overflow and no wrapping.
  await expectSingleRowNoOverflow(p.locator('header > div').first())
  expect(
    await p.locator('header').first().evaluate((el) => el.scrollWidth - el.clientWidth),
  ).toBeLessThanOrEqual(1)
}

test.describe('layout @layout', () => {
  // Real web fonts: Arabic glyph widths decide whether things overflow.
  test.use({ webFonts: true, reuseContext: true })

  for (const page of PAGES) {
    const smoke = page.tags?.includes('@smoke') ?? false
    test.describe(() => {
      // WebKit (iPhone Safari) checks the @smoke pages only: the same phone
      // width is swept for every page by the Chromium `mobile` project.
      test.skip(
        ({ browserName }) => browserName === 'webkit' && !smoke,
        'phone width swept by the mobile project',
      )

      for (const lang of LANGS) {
        test(`layout ${page.path} [${lang}]${smoke ? ' @smoke' : ''}`, async ({ page: p }, info) => {
          await open(p, pageUrl(page.path, lang))

          // The "Coming soon to stores" badge was removed; it must not come back.
          // (Body copy like "coming soon to the App Store" in the CTA is fine.)
          await expect(p.getByText(/coming soon to stores|قريباً على المتاجر/i)).toHaveCount(0)

          if (info.project.name !== 'desktop') {
            await expectPageLayout(p)
            return
          }

          // Hydrated head (client-side head management must not break the SSR
          // head). seo.spec checks the server HTML; this checks after React.
          await expectSeoHead(p, expectedSeo(page, lang))

          const height = p.viewportSize()?.height ?? 800
          for (const width of DESKTOP_WIDTHS) {
            await test.step(`${width}px`, async () => {
              await p.setViewportSize({ width, height })
              await nextFrame(p)
              await expectPageLayout(p)
            })
          }
        })
      }
    })
  }
})

test.describe('web font swap', () => {
  // Real Google Fonts: the Arabic swap used to reflow the guide (CLS 0.156).
  test.use({ webFonts: true })

  for (const path of ['/guides/zatca-wave-25', '/tools/fatora']) {
    test(`Arabic font swap keeps CLS under 0.1 on ${path}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'measured once, at 1280')
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: number }
        w.__cls = 0
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
            if (!e.hadRecentInput) w.__cls += e.value
        }).observe({ type: 'layout-shift', buffered: true })
      })
      await open(page, path)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(1500)
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
      expect(cls).toBeLessThan(0.1)
    })
  }
})
