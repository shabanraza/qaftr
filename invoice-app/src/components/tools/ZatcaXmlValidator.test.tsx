import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderWithRouter } from '#/test/render-with-router'

const spies = vi.hoisted(() => ({ track: vi.fn() }))
vi.mock('#/lib/analytics/track', () => ({ track: spies.track }))

const { ZatcaXmlValidator } = await import('./ZatcaXmlValidator')

const FIXTURES = resolve(process.cwd(), '../packages/shared/src/zatca-phase2/__fixtures__')
const VALID = readFileSync(resolve(FIXTURES, 'sandbox-compliance-simplified.xml'), 'utf-8')
const BROKEN = VALID.replace(/<cac:PartyTaxScheme><cbc:CompanyID>399999999900003<\/cbc:CompanyID>/, '<cac:PartyTaxScheme>').replace(
  '>115.00</cbc:PayableAmount>',
  '>120.00</cbc:PayableAmount>',
)

const paste = async (value: string) =>
  fireEvent.change(await screen.findByLabelText(/^Invoice XML$|^نص ملف XML$/), { target: { value } })

beforeEach(() => spies.track.mockClear())

describe('ZatcaXmlValidator', () => {
  it('passes the sandbox-accepted simplified invoice and verifies its signature', async () => {
    renderWithRouter(<ZatcaXmlValidator lang="en" />)
    await paste(VALID)
    expect((await screen.findByTestId('xml-status')).textContent).toMatch(/No issues found/)
    expect(screen.getByTestId('xml-type').textContent).toMatch(/Simplified tax invoice/)
    expect(screen.getByText('Qaftr Spike Test LLC')).toBeTruthy()
    expect(screen.getByTestId('xml-signature').textContent).toMatch(/Signature checks out/)
    expect(screen.getByTestId('xml-qr').textContent).toMatch(/Phase 2/)
  })

  it('lists missing fields, totals and signature problems on a broken file (Arabic)', async () => {
    renderWithRouter(<ZatcaXmlValidator lang="ar" />)
    await paste(BROKEN)
    expect((await screen.findByTestId('xml-status')).textContent).toMatch(/مشكل/)
    expect(screen.getByTestId('xml-missing').textContent).toMatch(/الرقم الضريبي للبائع/)
    expect(screen.getByTestId('xml-totals').textContent).toMatch(/المبلغ المستحق/)
    expect(screen.getByTestId('xml-signature').textContent).toMatch(/لا يطابق/)
  })

  it('explains text that is not XML or not an invoice', async () => {
    renderWithRouter(<ZatcaXmlValidator lang="en" />)
    await paste('hello')
    expect((await screen.findByRole('alert')).textContent).toMatch(/not valid XML/)
    await paste('<Order/>')
    expect((await screen.findByRole('alert')).textContent).toMatch(/not a UBL invoice/)
  })

  it('loads a sample when asked', async () => {
    renderWithRouter(<ZatcaXmlValidator lang="en" />)
    fireEvent.click(await screen.findByRole('button', { name: /Try a sample/ }))
    expect((await screen.findByTestId('xml-status', {}, { timeout: 5000 })).textContent).toMatch(/No issues found/)
    expect((screen.getByLabelText(/^Invoice XML$/) as HTMLTextAreaElement).value).toContain('<Invoice')
  })

  it('reads an uploaded XML file', async () => {
    renderWithRouter(<ZatcaXmlValidator lang="en" />)
    const input = (await screen.findByLabelText(/Upload an XML file/)) as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([VALID], 'invoice.xml', { type: 'text/xml' })] } })
    expect((await screen.findByTestId('xml-status')).textContent).toMatch(/No issues found/)
  })

  it('tracks the outcome only', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderWithRouter(<ZatcaXmlValidator lang="en" />)
    await paste(BROKEN)
    await screen.findByTestId('xml-status')
    await vi.advanceTimersByTimeAsync(2000)
    await waitFor(() =>
      expect(spies.track).toHaveBeenCalledWith('tool_used', { tool: 'zatca_xml_validator', result: 'simplified_issues' }),
    )
    vi.useRealTimers()
  })
})
