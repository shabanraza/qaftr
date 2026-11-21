import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const xml = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf-8')
const blocks = xml.split('<url>').slice(1)

describe('sitemap lastmod', () => {
  it('has one valid, non-future lastmod date on every URL', () => {
    expect(blocks.length).toBeGreaterThan(20)
    const today = new Date().toISOString().slice(0, 10)
    for (const block of blocks) {
      const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1]
      const dates = [...block.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]!)
      expect(dates, `lastmod for ${loc}`).toHaveLength(1)
      expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(dates[0]! <= today).toBe(true)
    }
  })

  it('gives the Arabic and English version of a page the same date', () => {
    const byPath = new Map<string, string>()
    for (const block of blocks) {
      const loc = /<loc>([^<]+)<\/loc>/.exec(block)![1]!
      const path = loc.replace('https://qaftr.com', '').replace('?lang=en', '') || '/'
      const date = /<lastmod>([^<]+)<\/lastmod>/.exec(block)![1]!
      if (byPath.has(path)) expect(date).toBe(byPath.get(path))
      byPath.set(path, date)
    }
  })
})
