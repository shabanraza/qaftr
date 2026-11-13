import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { SaWaveGuide } from './SaWaveGuide'

describe('SaWaveGuide', () => {
  it('renders one h1, a contents list, the wave table and a link to the checker (English)', async () => {
    renderWithRouter(<SaWaveGuide lang="en" />)
    const h1s = await screen.findAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((r) => r.textContent)).toEqual([
      '23750,00031 Mar 2026',
      '24375,00030 Jun 2026',
      '25187,5001 Feb 2027',
    ])
    const nav = screen.getByRole('navigation', { name: 'Contents' })
    expect(within(nav).getAllByRole('link')).toHaveLength(7)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/tools/zatca-wave-checker?lang=en')
    expect(document.body.textContent).toMatch(/not affiliated with ZATCA/)
    expect(screen.getByText(/Last updated/).querySelector('time')?.getAttribute('datetime')).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    )
  })

  it('renders Arabic with Arabic-Indic digits in the table and clean links', async () => {
    renderWithRouter(<SaWaveGuide lang="ar" />)
    const table = await screen.findByRole('table')
    expect(table.textContent).toContain('١٨٧٬٥٠٠')
    expect(table.textContent).toContain('١ فبراير ٢٠٢٧')
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/tools/zatca-wave-checker')
    expect(hrefs.some((h) => h?.includes('lang=en'))).toBe(false)
  })
})
