import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE_URL } from './constants'
import { regionFromPath } from './lang'
import { buildHreflangAlternates } from './seo'

const xml = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf-8')

const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
  loc: (/<loc>([^<]+)<\/loc>/.exec(body)?.[1] ?? '').replace(/&amp;/g, '&'),
  alternates: [...body.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)].map(
    ([, hreflang, href]) => [hreflang, href.replace(/&amp;/g, '&')],
  ),
}))

describe('sitemap.xml hreflang matches the page <head>', () => {
  it('has blocks', () => {
    expect(blocks.length).toBeGreaterThan(10)
  })

  it.each(blocks.map((b) => [b.loc, b] as const))('%s', (_loc, block) => {
    const path = block.loc.replace(SITE_URL, '').replace(/\?lang=en$/, '') || '/'
    const want = buildHreflangAlternates(path, regionFromPath(path)).map((a) => [
      a.hrefLang,
      a.href,
    ])
    expect(Object.fromEntries(block.alternates)).toEqual(Object.fromEntries(want))
    expect(block.alternates).toHaveLength(want.length)
  })
})
