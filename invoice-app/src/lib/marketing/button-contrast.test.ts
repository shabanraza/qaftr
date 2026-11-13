import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Unlayered `a { color }` in styles.css beats Tailwind's layered text-* utilities,
// so link-buttons need explicit colour rules. Verified in the browser with
// computed colours (gold secondary + qaftr green text ≈ 4.7:1).
const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf-8')

describe('marketing link-button colours', () => {
  it('gives secondary (gold) link-buttons the dark green text colour', () => {
    expect(css).toMatch(
      /\.qaftr-marketing a\[data-slot='button'\]\[data-variant='secondary'\][^{]*\{\s*color:\s*var\(--qaftr-green\)/,
    )
  })

  it('gives outline / ghost link-buttons the brand green, not the teal link colour', () => {
    expect(css).toMatch(
      /\.qaftr-marketing a\[data-slot='button'\]\[data-variant='outline'\],[^{]*\{\s*color:\s*var\(--primary\)/,
    )
  })
})

describe('marketing theme accessibility rules', () => {
  it('defines an AA-contrast gold for text on light surfaces', () => {
    expect(css).toMatch(/--qaftr-gold-ink:\s*#8a6420/)
  })

  it('turns off entrance animations for reduced-motion users', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.qaftr-rise/)
  })

  it('resets letter-spacing on Arabic (RTL) marketing pages', () => {
    expect(css).toMatch(/\.qaftr-marketing\[dir='rtl'\] \*\s*\{\s*letter-spacing:\s*normal !important/)
  })
})
