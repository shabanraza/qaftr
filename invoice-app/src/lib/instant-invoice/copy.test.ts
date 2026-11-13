import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('instant invoice copy', () => {
  it('has no mixed-script typos in the ZATCA name', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/lib/instant-invoice/copy.ts'),
      'utf-8',
    )
    expect(src).not.toMatch(/[\u0600-\u06FF][a-zA-Z]/)
    expect(src).toContain('هيئة الزكاة والضريبة والجمارك')
    expect(src).not.toContain('الهيئة العامة للزكاة')
  })
})
