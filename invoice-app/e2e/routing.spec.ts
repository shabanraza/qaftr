import { test, expect, open } from './fixtures'
import { PAGES, SITE_URL, pageUrl } from './pages'

test.describe('routing', () => {
  // HTTP-level checks: desktop only (the mobile project ignores this file).

  for (const bad of ['EN', 'fr', '']) {
    test(`invalid ?lang=${bad || '(empty)'} redirects then 200`, async ({ request, baseURL }) => {
      const res = await request.get(`/tools?lang=${bad}`, { maxRedirects: 0 })
      expect([307, 308]).toContain(res.status())
      const location = res.headers()['location']
      expect(location).toBeTruthy()
      const target = new URL(location, baseURL)
      expect(target.pathname).toBe('/tools')
      expect(target.searchParams.get('lang')).toBe(bad === 'EN' ? 'en' : null)
      const followed = await request.get(target.toString(), { maxRedirects: 0 })
      expect(followed.status()).toBe(200)
    })
  }

  test.describe('404', () => {
    test.use({ allowedErrors: [/response 404 GET .*\/no-such-page/] })

    for (const lang of ['ar', 'en'] as const) {
      test(`unknown path returns a localised 404 [${lang}]`, async ({ page }) => {
        const res = await open(page, pageUrl('/no-such-page', lang))
        expect(res?.status()).toBe(404)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          lang === 'ar' ? 'الصفحة غير موجودة' : 'Page not found',
        )
        await expect(page.locator('html')).toHaveAttribute('lang', lang === 'ar' ? 'ar-SA' : 'en')
        await expect(
          page.getByRole('main').getByRole('link', { name: lang === 'ar' ? 'الرئيسية' : 'Home' }),
        ).toHaveAttribute('href', lang === 'ar' ? '/' : '/?lang=en')
      })
    }
  })

  for (const path of ['/workspace', '/invoices']) {
    test(`${path} is noindex`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)
      const html = await res.text()
      expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/)
      expect(html).not.toMatch(/rel="canonical"/)
    })

    for (const lang of ['ar', 'en'] as const) {
      test(`${path} logged out redirects home keeping lang [${lang}]`, async ({ page }) => {
        await page.goto(pageUrl(path, lang), { waitUntil: 'domcontentloaded' })
        await expect(page).toHaveURL(
          lang === 'en' ? /\/\?lang=en#invoice-tool$/ : /\/#invoice-tool$/,
          { timeout: 15_000 },
        )
        await expect(page.locator('html')).toHaveAttribute('lang', lang === 'en' ? 'en' : 'ar-SA')
      })
    }
  }

  test('sitemap.xml parses, every URL is 200, alternates are reciprocal', async ({
    request,
    baseURL,
  }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const xml = await res.text()
    expect(xml).toMatch(/^<\?xml/)
    expect(xml).toContain('</urlset>')

    const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => {
      const loc = body.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? ''
      const alternates = Object.fromEntries(
        [...body.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)].map(([, l, h]) => [l, h]),
      )
      return { loc: loc.replace(/&amp;/g, '&'), alternates }
    })
    expect(blocks.length).toBeGreaterThan(10)
    const byLoc = new Map(blocks.map((b) => [b.loc, b]))
    expect(byLoc.size, 'no duplicate <loc>').toBe(blocks.length)

    // Reciprocity: every alternate is itself listed, with the same alternate set.
    for (const block of blocks) {
      expect(block.alternates['x-default'], `${block.loc} has x-default`).toBeTruthy()
      for (const href of Object.values(block.alternates)) {
        const other = byLoc.get(href)
        expect(other, `${block.loc} → alternate ${href} is listed`).toBeTruthy()
        expect(other!.alternates, `${href} alternates match ${block.loc}`).toEqual(
          block.alternates,
        )
      }
    }

    // Every page the suite covers is in the sitemap, in both languages.
    for (const page of PAGES) {
      for (const lang of ['ar', 'en'] as const) {
        expect(byLoc.has(`${SITE_URL}${pageUrl(page.path, lang)}`), `${page.path} [${lang}]`).toBe(
          true,
        )
      }
    }

    // Every sitemap URL resolves on this server.
    const statuses = await Promise.all(
      blocks.map(async ({ loc }) => {
        const url = loc.replace(SITE_URL, baseURL!.replace(/\/$/, ''))
        const r = await request.get(url, { maxRedirects: 0 })
        return `${r.status()} ${loc}`
      }),
    )
    expect(statuses.filter((s) => !s.startsWith('200 '))).toEqual([])
  })

  test('robots.txt disallows private paths and points to the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    for (const path of ['/workspace', '/invoices', '/api/']) {
      expect(body).toMatch(new RegExp(`^Disallow: ${path.replace(/\//g, '\\/')}$`, 'm'))
    }
    expect(body).toMatch(/^Sitemap: https:\/\/qaftr\.com\/sitemap\.xml$/m)
  })

  test('llms.txt is served', async ({ request }) => {
    const res = await request.get('/llms.txt')
    expect(res.status()).toBe(200)
    expect((await res.text()).length).toBeGreaterThan(100)
  })
})
