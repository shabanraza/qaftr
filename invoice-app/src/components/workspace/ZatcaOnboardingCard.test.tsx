import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ZatcaOnboardingCard } from './ZatcaOnboardingCard'
import type { ZatcaOnboardingStatus } from './ZatcaOnboardingCard'

const READY: ZatcaOnboardingStatus = {
  env: 'sandbox',
  gate: null,
  hasBusiness: true,
  sellerReady: true,
  sandboxOtp: '123345',
  unit: null,
}

describe('ZatcaOnboardingCard', () => {
  it('renders nothing when the integration is disabled on this deployment', () => {
    const { container } = render(<ZatcaOnboardingCard lang="en" status={{ ...READY, env: null, gate: 'ZATCA_DISABLED' }} onOnboard={vi.fn()} />)
    expect(container.textContent).toBe('')
  })

  it('asks for a complete profile before onboarding', () => {
    render(<ZatcaOnboardingCard lang="en" status={{ ...READY, sellerReady: false }} onOnboard={vi.fn()} />)
    expect(screen.getByText(/Complete the business profile above/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Connect to ZATCA/ }).hasAttribute('disabled')).toBe(true)
  })

  it('in the sandbox uses the test OTP and sends the industry and branch', async () => {
    const onOnboard = vi.fn(async (_v: unknown) => undefined)
    render(<ZatcaOnboardingCard lang="en" status={READY} onOnboard={onOnboard} />)
    expect(screen.getByText(/ZATCA test environment/)).toBeTruthy()
    expect(screen.queryByLabelText(/One-time password/)).toBeNull()
    fireEvent.change(screen.getByLabelText(/Business activity/), { target: { value: 'Retail' } })
    fireEvent.change(screen.getByLabelText(/Branch name/), { target: { value: 'Riyadh branch' } })
    fireEvent.click(screen.getByRole('button', { name: /Connect to ZATCA/ }))
    await waitFor(() => expect(onOnboard).toHaveBeenCalledWith({ industry: 'Retail', branchName: 'Riyadh branch' }))
  })

  it('asks for the Fatoora OTP outside the sandbox and validates it', async () => {
    const onOnboard = vi.fn(async (_v: unknown) => undefined)
    render(<ZatcaOnboardingCard lang="en" status={{ ...READY, env: 'production', sandboxOtp: null }} onOnboard={onOnboard} />)
    fireEvent.change(screen.getByLabelText(/Business activity/), { target: { value: 'Retail' } })
    fireEvent.change(screen.getByLabelText(/One-time password/), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: /Connect to ZATCA/ }))
    expect(await screen.findByText(/6 digits/)).toBeTruthy()
    expect(onOnboard).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/One-time password/), { target: { value: '٦٥٤٣٢١' } })
    fireEvent.click(screen.getByRole('button', { name: /Connect to ZATCA/ }))
    await waitFor(() => expect(onOnboard).toHaveBeenCalledWith({ industry: 'Retail', otp: '654321' }))
  })

  it('explains server errors in plain words', async () => {
    const onOnboard = vi.fn(async () => {
      throw new Error('OTP_REJECTED')
    })
    render(<ZatcaOnboardingCard lang="ar" status={{ ...READY, env: 'production', sandboxOtp: null }} onOnboard={onOnboard} />)
    fireEvent.change(screen.getByLabelText(/النشاط التجاري/), { target: { value: 'تجزئة' } })
    fireEvent.change(screen.getByLabelText(/رمز التحقق/), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /الربط مع هيئة الزكاة/ }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/رمز التحقق غير صحيح أو منتهي/)
  })

  it('shows the Pro requirement for real environments on the free plan', () => {
    render(<ZatcaOnboardingCard lang="en" status={{ ...READY, env: 'production', gate: 'ZATCA_PRO_REQUIRED' }} onOnboard={vi.fn()} />)
    expect(screen.getByText(/needs the Pro plan/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Connect to ZATCA/ })).toBeNull()
  })

  it('shows the connected device once onboarded', () => {
    render(
      <ZatcaOnboardingCard
        lang="en"
        status={{
          ...READY,
          unit: {
            id: 'u1',
            status: 'active',
            commonName: 'Qaftr-EGS-abcd1234',
            egsSerial: '1-Qaftr|2-Web|3-x',
            certNotAfter: new Date('2031-11-13T00:00:00Z'),
            createdAt: new Date('2026-11-13T00:00:00Z'),
          },
        }}
        onOnboard={vi.fn()}
      />,
    )
    expect(screen.getByText(/Connected to ZATCA/)).toBeTruthy()
    expect(screen.getByText('Qaftr-EGS-abcd1234')).toBeTruthy()
    expect(screen.getByText(/2031/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Connect to ZATCA/ })).toBeNull()
  })
})
