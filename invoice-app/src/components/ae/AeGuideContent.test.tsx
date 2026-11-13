import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { AeGuideContent } from './AeGuideContent'

describe('AeGuideContent', () => {
  it('renders one h1, the timeline table and links to every UAE tool', async () => {
    renderWithRouter(<AeGuideContent lang="en" />)
    expect(await screen.findAllByRole('heading', { level: 1 })).toHaveLength(1)
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row').length).toBe(5)
    expect(within(table).getByText('1 Jan 2027')).toBeTruthy()
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/ae/tools/e-invoicing-readiness?lang=en',
        '/ae/tools/trn-checker?lang=en',
        '/ae/tools/vat-calculator?lang=en',
      ]),
    )
  })

  it('shows the last-updated date and a table of contents in Arabic', async () => {
    renderWithRouter(<AeGuideContent lang="ar" />)
    await screen.findByRole('heading', { level: 1 })
    expect(document.body.textContent).toMatch(/آخر تحديث/)
    const toc = screen.getByRole('navigation', { name: /المحتويات/ })
    expect(within(toc).getAllByRole('link').length).toBeGreaterThanOrEqual(7)
  })
})
