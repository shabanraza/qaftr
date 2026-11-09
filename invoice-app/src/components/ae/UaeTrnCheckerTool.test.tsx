import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { UaeTrnCheckerTool } from './UaeTrnCheckerTool'

async function setup(lang: 'ar' | 'en' = 'en') {
  renderWithRouter(<UaeTrnCheckerTool lang={lang} />)
  const input = await screen.findByLabelText<HTMLInputElement>(
    /TRN|الرقم الضريبي/,
    { selector: 'input' },
  )
  const type = (value: string) => fireEvent.change(input, { target: { value } })
  const status = () => screen.getByTestId('trn-status').textContent
  return { input, type, status }
}

describe('UaeTrnCheckerTool', () => {
  it('starts in an empty state', async () => {
    const { status } = await setup()
    expect(status()).toMatch(/Enter/i)
  })

  it('accepts a correctly formatted TRN and says it is format-only', async () => {
    const { type, status } = await setup()
    type('100-1234-5670-0003')
    expect(status()).toBe('Valid format')
    expect(screen.getByTestId('trn-normalized').textContent).toBe(
      '100123456700003',
    )
    expect(document.body.textContent).toMatch(/format only/i)
  })

  it('flags a wrong prefix and wrong length', async () => {
    const { type, status } = await setup()
    type('300123')
    expect(status()).toMatch(/Invalid format/i)
    expect(screen.getByTestId('rule-length').getAttribute('data-ok')).toBe(
      'false',
    )
    expect(screen.getByTestId('rule-prefix').getAttribute('data-ok')).toBe(
      'false',
    )
  })

  it('flags letters', async () => {
    const { type } = await setup()
    type('10012345670000A')
    expect(screen.getByTestId('rule-characters').getAttribute('data-ok')).toBe(
      'false',
    )
  })

  it('accepts Arabic-Indic digits in Arabic', async () => {
    const { type, status } = await setup('ar')
    type('١٠٠١٢٣٤٥٦٧٠٠٠٠٣')
    expect(status()).toMatch(/صيغة صحيحة/)
  })

  it('links to the FTA website for registration status, opening safely', async () => {
    await setup()
    const link = screen.getByRole('link', { name: /FTA/ })
    expect(link.getAttribute('href')).toBe('https://tax.gov.ae/')
    expect(link.getAttribute('rel')).toContain('noopener')
  })
  it('flags 15 characters with only 14 digits as the wrong length', async () => {
    const { type } = await setup()
    type('10012345670000A')
    expect(screen.getByTestId('rule-length').getAttribute('data-ok')).toBe(
      'false',
    )
  })

  it('does not truncate over-long input; it flags it', async () => {
    const { input, type, status } = await setup()
    expect(input.hasAttribute('maxlength')).toBe(false)
    const long = '1'.repeat(40)
    type(long)
    expect(input.value).toBe(long)
    expect(status()).toMatch(/Invalid format/i)
    expect(screen.getByTestId('rule-length').getAttribute('data-ok')).toBe(
      'false',
    )
  })

  it('accepts dots as separators', async () => {
    const { type, status } = await setup()
    type('100.1234.5670.0003')
    expect(status()).toBe('Valid format')
  })

  it('localises the badge in Arabic and mirrors the arrow icon in RTL', async () => {
    await setup('ar')
    expect(document.body.textContent).not.toMatch(/UAE · TRN/)
    const icon = document.querySelector('a svg.lucide-arrow-up-right')
    expect(icon?.getAttribute('class')).toContain('rtl:-scale-x-100')
  })
})
