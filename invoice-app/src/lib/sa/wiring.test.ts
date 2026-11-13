import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TOOL_DEFINITIONS } from '#/lib/tools/copy'
import { SA_PAGE_PATHS } from './pages'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf-8')
const SITE = 'https://qaftr.com'

describe('Saudi wave pages are discoverable', () => {
  it('lists every page in sitemap.xml with ar-SA/en-SA/x-default alternates', () => {
    const xml = read('public/sitemap.xml')
    const blocks = xml.split('<url>').slice(1)
    for (const path of Object.values(SA_PAGE_PATHS)) {
      const ar = `${SITE}${path}`
      for (const loc of [ar, `${ar}?lang=en`]) {
        const block = blocks.find((b) => b.includes(`<loc>${loc}</loc>`))
        expect(block, loc).toBeDefined()
        expect(block).toContain(`hreflang="ar-SA" href="${ar}"`)
        expect(block).toContain(`hreflang="en-SA" href="${ar}?lang=en"`)
        expect(block).toContain(`hreflang="x-default" href="${ar}"`)
      }
    }
  })

  it('lists every page in llms.txt', () => {
    const txt = read('public/llms.txt')
    for (const path of Object.values(SA_PAGE_PATHS)) expect(txt).toContain(`${SITE}${path}`)
  })

  it('adds the wave checker to the tools hub', () => {
    expect(TOOL_DEFINITIONS.map((t) => t.href)).toContain('/tools/zatca-wave-checker')
  })
})
