import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { encodeZatcaQr } from '@zatca/shared'
import { renderWithRouter } from '#/test/render-with-router'

const spies = vi.hoisted(() => ({
  track: vi.fn(),
  decodeQrFromImage: vi.fn(async () => null as string | null),
}))
vi.mock('#/lib/analytics/track', () => ({ track: spies.track }))
vi.mock('#/lib/sa/qr-image', () => ({ decodeQrFromImage: spies.decodeQrFromImage }))

const { ZatcaQrDecoder } = await import('./ZatcaQrDecoder')

const VALID = encodeZatcaQr({
  sellerName: 'Qaftr Trading Co.',
  vatNumber: '300000000000003',
  timestamp: '2026-11-13T10:30:00Z',
  invoiceTotal: '1150.00',
  vatTotal: '150.00',
})
const paste = async (value: string) =>
  fireEvent.change(await screen.findByLabelText(/QR text|نص رمز QR/), { target: { value } })

beforeEach(() => {
  spies.track.mockClear()
  spies.decodeQrFromImage.mockReset()
})

describe('ZatcaQrDecoder', () => {
  it('decodes a pasted Phase 1 payload and shows its fields', async () => {
    renderWithRouter(<ZatcaQrDecoder lang="en" />)
    await paste(VALID)
    expect(await screen.findByText('Qaftr Trading Co.')).toBeTruthy()
    expect(screen.getByText('300000000000003')).toBeTruthy()
    expect(screen.getByTestId('qr-status').textContent).toMatch(/No format issues/)
    expect(screen.getByTestId('qr-phase').textContent).toMatch(/Phase 1/)
    expect(screen.getByTestId('qr-total').textContent).toContain('1,150.00')
  })

  it('lists format issues in Arabic', async () => {
    renderWithRouter(<ZatcaQrDecoder lang="ar" />)
    await paste(
      encodeZatcaQr({
        sellerName: 'شركة',
        vatNumber: '300000000000003',
        timestamp: '2026-11-13',
        invoiceTotal: '115.00',
        vatTotal: '15.00',
      }),
    )
    const list = await screen.findByTestId('qr-issues')
    expect(list.textContent).toMatch(/التاريخ فقط/)
    expect(screen.getByTestId('qr-status').textContent).toMatch(/مشكلة/)
  })

  it('explains why a URL or random text is not a ZATCA QR', async () => {
    renderWithRouter(<ZatcaQrDecoder lang="en" />)
    await paste('https://example.com/i/42')
    expect((await screen.findByRole('alert')).textContent).toMatch(/link/i)
    await paste('hello there')
    expect((await screen.findByRole('alert')).textContent).toMatch(/not valid base64|not contain ZATCA/i)
  })

  it('fills a sample when asked', async () => {
    renderWithRouter(<ZatcaQrDecoder lang="en" />)
    fireEvent.click(await screen.findByRole('button', { name: /Try a sample/ }))
    expect(await screen.findByTestId('qr-status')).toBeTruthy()
    expect((screen.getByLabelText(/QR text/) as HTMLTextAreaElement).value.length).toBeGreaterThan(20)
  })

  it('reads a QR from an uploaded image', async () => {
    spies.decodeQrFromImage.mockResolvedValueOnce(VALID)
    renderWithRouter(<ZatcaQrDecoder lang="en" />)
    const input = (await screen.findByLabelText(/Upload a QR image/)) as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'qr.png', { type: 'image/png' })] } })
    expect(await screen.findByText('Qaftr Trading Co.')).toBeTruthy()
  })

  it('says so when no QR is found in the image', async () => {
    spies.decodeQrFromImage.mockResolvedValueOnce(null)
    renderWithRouter(<ZatcaQrDecoder lang="en" />)
    const input = (await screen.findByLabelText(/Upload a QR image/)) as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'qr.png', { type: 'image/png' })] } })
    expect((await screen.findByRole('alert')).textContent).toMatch(/No QR code found/)
  })

  it('tracks a settled result', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderWithRouter(<ZatcaQrDecoder lang="en" />)
    await paste(VALID)
    await vi.advanceTimersByTimeAsync(2000)
    await waitFor(() =>
      expect(spies.track).toHaveBeenCalledWith('tool_used', { tool: 'zatca_qr_decoder', result: 'phase1_ok' }),
    )
    vi.useRealTimers()
  })
})
