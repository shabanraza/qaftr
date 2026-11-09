import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { UaeVatCalculatorTool } from './UaeVatCalculatorTool'

async function setup(lang: 'ar' | 'en' = 'en') {
  renderWithRouter(<UaeVatCalculatorTool lang={lang} />)
  const input = await screen.findByLabelText(/Amount|المبلغ/, {
    selector: 'input',
  })
  const type = (value: string) => fireEvent.change(input, { target: { value } })
  const out = (id: string) => screen.queryByTestId(id)?.textContent ?? null
  return { type, out }
}

describe('UaeVatCalculatorTool', () => {
  it('adds 5% VAT in AED by default', async () => {
    const { type, out } = await setup()
    type('1000')
    expect(out('vat-subtotal')).toBe('1,000.00 AED')
    expect(out('vat-amount')).toBe('50.00 AED')
    expect(out('vat-total')).toBe('1,050.00 AED')
  })

  it('extracts VAT from a VAT-inclusive total', async () => {
    const { type, out } = await setup()
    fireEvent.click(screen.getByRole('radio', { name: /includes VAT/i }))
    type('1,050')
    expect(out('vat-subtotal')).toBe('1,000.00 AED')
    expect(out('vat-amount')).toBe('50.00 AED')
  })

  it('shows the empty hint for invalid or negative input', async () => {
    const { type, out } = await setup()
    type('abc')
    expect(out('vat-total')).toBeNull()
    expect(screen.getByTestId('vat-empty')).toBeTruthy()
    type('-5')
    expect(out('vat-total')).toBeNull()
  })

  it('uses dirhams in Arabic', async () => {
    const { type, out } = await setup('ar')
    type('200')
    expect(out('vat-total')).toBe('210.00 درهم')
  })

  it('links to the free UAE tax invoice generator', async () => {
    await setup()
    const cta = screen.getByRole('link', { name: /invoice/i })
    expect(cta.getAttribute('href')).toBe('/ae/tools/invoice-generator?lang=en')
    expect(document.body.textContent).not.toMatch(/Saudi/)
  })
  it('shows a hint for amounts above the 1 trillion cap', async () => {
    const { type, out } = await setup()
    type('2000000000000')
    expect(out('vat-total')).toBeNull()
    expect(screen.getByTestId('vat-too-large')).toBeTruthy()
  })

  it('keeps fils on very large amounts', async () => {
    const { type, out } = await setup()
    type('12345678901.23')
    expect(out('vat-total')).toBe('12,962,962,846.29 AED')
  })

  it('localises the badge in Arabic and mirrors the arrow icon in RTL', async () => {
    await setup('ar')
    expect(document.body.textContent).not.toMatch(/5% VAT · AED/)
    const icon = document.querySelector('a svg.lucide-arrow-up-right')
    expect(icon?.getAttribute('class')).toContain('rtl:-scale-x-100')
  })
})
