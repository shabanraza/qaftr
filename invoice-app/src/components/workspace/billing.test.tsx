import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { BillingPlanCard } from './BillingPlanCard'
import { workspaceSectionForPath } from './workspace-nav'
import { isPrivatePath } from '#/lib/marketing/seo'
import { getBillingCopy } from '#/lib/billing/copy'

const free = {
  plan: 'free' as const,
  used: 2,
  limit: 3,
  remaining: 1,
  webSubscription: false,
  currentPeriodEnd: null,
  checkoutAvailable: true,
}
const pro = { ...free, plan: 'pro' as const, limit: null, remaining: null, webSubscription: true, currentPeriodEnd: new Date('2026-12-17T00:00:00Z') }

const base = { lang: 'en' as const, usage: free, isLoading: false, pending: null, error: null, justPaid: false, onUpgrade: vi.fn(), onManage: vi.fn() }

describe('BillingPlanCard', () => {
  it('shows the free plan usage and both Pro prices', async () => {
    renderWithRouter(<BillingPlanCard {...base} />)
    expect(await screen.findByText(/2 of 3 invoices this month/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /39 SAR \/ month/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /349 SAR \/ year/i })).toBeTruthy()
  })

  it('starts a monthly or yearly checkout', async () => {
    const onUpgrade = vi.fn()
    renderWithRouter(<BillingPlanCard {...base} onUpgrade={onUpgrade} />)
    fireEvent.click(await screen.findByRole('button', { name: /349 SAR \/ year/i }))
    fireEvent.click(screen.getByRole('button', { name: /39 SAR \/ month/i }))
    expect(onUpgrade.mock.calls).toEqual([['yearly'], ['monthly']])
  })

  it('disables the buttons while a checkout is opening', async () => {
    renderWithRouter(<BillingPlanCard {...base} pending="yearly" />)
    const buttons = await screen.findAllByRole('button')
    expect(buttons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })

  it('shows Pro with renewal date and a manage button for web subscribers', async () => {
    const onManage = vi.fn()
    renderWithRouter(<BillingPlanCard {...base} usage={pro} onManage={onManage} />)
    expect(await screen.findByText(/unlimited invoices/i)).toBeTruthy()
    expect(screen.getByText(/renews or ends on/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /SAR \/ month/i })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /manage subscription/i }))
    expect(onManage).toHaveBeenCalled()
  })

  it('tells app-store subscribers to manage Pro in the app store', async () => {
    renderWithRouter(<BillingPlanCard {...base} usage={{ ...pro, webSubscription: false, currentPeriodEnd: null }} />)
    expect(await screen.findByText(/App Store or Google Play/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /manage subscription/i })).toBeNull()
  })

  it('after paying, says Pro is being activated until the webhook lands', async () => {
    renderWithRouter(<BillingPlanCard {...base} justPaid />)
    expect(await screen.findByRole('status')).toBeTruthy()
    expect(screen.getByText(/activating pro/i)).toBeTruthy()
  })

  it('shows a clear message for billing errors and when checkout is off', async () => {
    renderWithRouter(<BillingPlanCard {...base} error="BILLING_FAILED" />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    renderWithRouter(<BillingPlanCard {...base} usage={{ ...free, checkoutAvailable: false }} />)
    expect(await screen.findByText(/support@qaftr.com/i)).toBeTruthy()
  })

  it('says how payment works: Polar, cards and Apple Pay, cancel anytime', async () => {
    renderWithRouter(<BillingPlanCard {...base} />)
    expect(await screen.findByText(/Polar/)).toBeTruthy()
    expect(screen.getByText(/cancel anytime/i)).toBeTruthy()
  })

  it('renders Arabic with Arabic-Indic digits', async () => {
    renderWithRouter(<BillingPlanCard {...base} lang="ar" />)
    expect(await screen.findByRole('button', { name: /٣٩/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /٣٤٩/ })).toBeTruthy()
  })
})

describe('billing page wiring', () => {
  it('lives under Settings in the sidebar and is private', () => {
    expect(workspaceSectionForPath('/workspace/billing')).toBe('settings')
    expect(isPrivatePath('/workspace/billing')).toBe(true)
  })

  it('never claims ZATCA approval or Phase 2 in billing copy', () => {
    const text = JSON.stringify([getBillingCopy('ar'), getBillingCopy('en')])
    expect(text).not.toMatch(/approved|certified|compliant|معتمد/i)
  })
})
