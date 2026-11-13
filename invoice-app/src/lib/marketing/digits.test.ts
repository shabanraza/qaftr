import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getAeCopy } from '#/lib/ae/copy'
import { getAeInvoiceCopy } from '#/lib/ae/invoice-copy'

/**
 * Digit convention per region (QA item 11):
 * - Saudi Arabic copy uses Arabic-Indic digits (١٥٪).
 * - UAE Arabic copy uses Latin digits (5٪), as on UAE invoices.
 * Invoice amounts and input examples are out of scope.
 */
const SAUDI_FILES = [
  'src/lib/marketing/i18n.ts',
  'src/lib/tools/copy.ts',
  'src/lib/instant-invoice/copy.ts',
  'src/lib/marketing/seo-landing-pages.ts',
  'src/routes/index.tsx',
  'src/routes/tools/index.tsx',
  'src/routes/tools/fatora.tsx',
  'src/routes/tools/trn-checker.tsx',
  'src/routes/tools/vat-calculator.tsx',
  'src/routes/tools/zatca-wave-checker.tsx',
  'src/lib/tools/fatora-faq.ts',
  'src/lib/sa/wave-copy.ts',
  'src/lib/sa/wave-guide-content.ts',
  'src/lib/documents/copy.ts',
  'src/routes/tools/receipt-voucher.tsx',
  'src/routes/tools/quotation.tsx',
  'src/routes/tools/credit-note.tsx',
  'src/routes/tools/non-tax-invoice.tsx',
  'src/routes/tools/zatca-qr.tsx',
  'src/routes/tools/zatca-xml-validator.tsx',
  'src/components/documents/DocumentShell.tsx',
]
// Allowed Latin digits in Saudi Arabic strings: typed-input examples only.
const ALLOWED = [/amountPlaceholder/]

const ARABIC = /[؀-ۿ]/
const STRING = /'(?:[^'\\n]|\.)*'|"(?:[^"\\n]|\.)*"/g

function arabicStringsWithLatinDigits(file: string) {
  const src = readFileSync(resolve(process.cwd(), file), 'utf-8')
  const hits: string[] = []
  src.split('\n').forEach((line, i) => {
    if (ALLOWED.some((re) => re.test(line))) return
    for (const lit of line.match(STRING) ?? []) {
      // technical format names keep their Latin version number
      const text = lit.replace(/UBL 2\.1/g, '')
      if (ARABIC.test(text) && /[0-9]/.test(text)) hits.push(`${file}:${i + 1} ${lit.slice(0, 80)}`)
    }
  })
  return hits
}

function collect(v: unknown, out: string[]) {
  if (typeof v === 'string') out.push(v)
  else if (typeof v === 'function') out.push(String((v as (n: number, m?: string) => string)(3, '')))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, out))
  return out
}

describe('digit conventions', () => {
  it('uses Arabic-Indic digits in the Arabic home hero invoice mockup', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/routes/index.tsx'), 'utf-8')
    // mock amounts are chosen per language, never hard-coded Latin for both
    expect(src).not.toMatch(/>1,500</)
    expect(src).not.toMatch(/>225</)
    expect(src).toContain('١٬٧٢٥ ر.س')
  })

  it('uses Arabic-Indic digits in Saudi Arabic copy', () => {
    expect(SAUDI_FILES.flatMap(arabicStringsWithLatinDigits)).toEqual([])
  })

  it('uses Latin digits in UAE Arabic copy', () => {
    const strings = collect([getAeCopy('ar'), getAeInvoiceCopy('ar')], [])
    // the TRN hint deliberately shows that Arabic-Indic input (١٢٣) is accepted
    const prose = strings.filter((s) => !s.includes('الأرقام العربية'))
    expect(prose.filter((s) => /[٠-٩]/.test(s))).toEqual([])
  })
})
