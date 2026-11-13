import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AE_PAGE_PATHS } from './pages'

const read = (rel: string) =>
  readFileSync(resolve(process.cwd(), 'public', rel), 'utf-8')

const SITE = 'https://qaftr.com'

describe('UAE pages are discoverable', () => {
  it('lists every /ae page (Arabic and English) in sitemap.xml with hreflang alternates', () => {
    const xml = read('sitemap.xml')
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    for (const path of Object.values(AE_PAGE_PATHS)) {
      expect(xml).toContain(`<loc>${SITE}${path}</loc>`)
      expect(xml).toContain(`<loc>${SITE}${path}?lang=en</loc>`)
      expect(xml).toContain(`hreflang="ar-AE" href="${SITE}${path}"`)
      expect(xml).toContain(`hreflang="en-AE" href="${SITE}${path}?lang=en"`)
    }
    // still well-formed: one urlset, balanced url tags
    expect(xml.match(/<url>/g)?.length).toBe(xml.match(/<\/url>/g)?.length)
  })

  it('gives every Saudi URL a reciprocal ?lang=en entry and ar-SA/en-SA/x-default alternates', () => {
    const xml = read('sitemap.xml')
    const blocks = xml.split('<url>').slice(1)
    const saudi = blocks
      .map((b) => /<loc>([^<]+)<\/loc>/.exec(b)![1])
      .filter((loc) => !loc.includes('/ae') && !loc.includes('?'))
    expect(saudi.length).toBeGreaterThan(5)
    for (const ar of saudi) {
      const en = `${ar}?lang=en`
      for (const loc of [ar, en]) {
        const block = blocks.find((b) => b.includes(`<loc>${loc}</loc>`))
        expect(block, loc).toBeDefined()
        expect(block).toContain(`hreflang="ar-SA" href="${ar}"`)
        expect(block).toContain(`hreflang="en-SA" href="${en}"`)
        expect(block).toContain(`hreflang="x-default" href="${ar}"`)
      }
    }
  })

  it('lists every /ae page in llms.txt', () => {
    const txt = read('llms.txt')
    for (const path of Object.values(AE_PAGE_PATHS)) {
      expect(txt).toContain(`${SITE}${path}`)
    }
    expect(txt).toMatch(/not affiliated with the FTA/i)
  })
})
