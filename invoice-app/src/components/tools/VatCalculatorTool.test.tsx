import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { VatCalculatorTool } from './VatCalculatorTool'

async function setup(lang: 'ar' | 'en') {
  renderWithRouter(<VatCalculatorTool lang={lang} />)
  const input = await screen.findByRole('textbox')
  return (value: string) => fireEvent.change(input, { target: { value } })
}

describe('Saudi VatCalculatorTool', () => {
  it('shows a localised "too large" hint above the 1 trillion cap (English)', async () => {
    const type = await setup('en')
    type('2000000000000')
    expect(screen.getByTestId('vat-too-large').textContent).toMatch(/too large/i)
    expect(screen.queryByText('Enter an amount to calculate.')).toBeNull()
  })

  it('shows the Arabic "too large" hint', async () => {
    const type = await setup('ar')
    type('2000000000000')
    expect(screen.getByTestId('vat-too-large').textContent).toMatch(/كبير جداً/)
  })

  it('still shows the empty hint for blank input', async () => {
    await setup('en')
    expect(screen.getByText('Enter an amount to calculate.')).toBeTruthy()
  })

  it('accepts Arabic-Indic digits and separators (١٬٠٠٠٫٥٠)', async () => {
    const type = await setup('ar')
    type('١٬٠٠٠٫٥٠')
    expect(screen.queryByTestId('vat-empty')).toBeNull()
    // 1000.50 + 15% = 1150.58 (rounded)
    expect(document.body.textContent).toMatch(/١٬١٥٠٫٥٨/)
  })

  it('Arabic rate chip and amounts use Arabic-Indic digits and ر.س', async () => {
    const type = await setup('ar')
    type('100')
    const text = document.body.textContent
    expect(text).toContain('١٥٪')
    expect(text).not.toMatch(/15%/)
    expect(text).toContain('ر.س')
    expect(text).not.toContain('SAR')
  })

  it('English keeps 15% and SAR', async () => {
    const type = await setup('en')
    type('100')
    const text = document.body.textContent
    expect(text).toContain('15%')
    expect(text).toContain('SAR')
  })
})
