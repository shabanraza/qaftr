import { test, expect } from './fixtures'
import { expectSeoHead } from './helpers/seo'
import { PAGES, expectedSeo, pageUrl } from './pages'
import type { Lang } from './pages'

/**
 * The server-rendered head, i.e. what crawlers index (many, like Bing and LLM
 * bots, do not run JS). JavaScript is off, which makes this sweep ~3x cheaper;
 * the console-clean guard still fails on any 4xx/5xx.
 *
 * The same expectSeoHead() also runs on the *hydrated* page, with console
 * errors checked, in layout.spec (desktop project), so every page × language
 * is covered both ways without loading it twice per viewport.
 */
test.use({ javaScriptEnabled: false, reuseContext: true })

// Viewport- and browser-independent: only the desktop project runs this file
// (see playwright.config.ts).

const LANGS: Lang[] = ['ar', 'en']

for (const page of PAGES) {
  for (const lang of LANGS) {
    const tag = page.tags?.length ? ` ${page.tags.join(' ')}` : ''
    test(`seo ${page.path} [${lang}]${tag}`, async ({ page: p }) => {
      // Only the HTML document matters here: skip CSS, fonts and images.
      await p.route('**/*', (route) =>
        route.request().resourceType() === 'document'
          ? route.fallback()
          : route.fulfill({ status: 204, body: '' }),
      )
      const res = await p.goto(pageUrl(page.path, lang), { waitUntil: 'domcontentloaded' })
      expect(res?.status()).toBe(200)
      await expectSeoHead(p, expectedSeo(page, lang))
    })
  }
}
