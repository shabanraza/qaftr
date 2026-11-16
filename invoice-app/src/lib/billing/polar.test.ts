import { describe, expect, it } from 'vitest'
import {
  POLAR_API_BASE,
  buildCheckoutBody,
  combinedPlan,
  polarApiBase,
  shouldApplyPolarChange,
  resolvePolarEntitlement,
  verifyPolarWebhook,
} from './polar'

const SECRET = 'polar_whs_test_secret_value'

async function sign(id: string, timestamp: string, body: string, secret = SECRET) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))
  return 'v1,' + btoa(String.fromCharCode(...new Uint8Array(mac)))
}

function headers(id: string, timestamp: string, signature: string) {
  return new Headers({ 'webhook-id': id, 'webhook-timestamp': timestamp, 'webhook-signature': signature })
}

describe('verifyPolarWebhook (Standard Webhooks)', () => {
  const now = 1_800_000_000
  const body = JSON.stringify({ type: 'subscription.active', data: {} })

  it('accepts a correctly signed, fresh event', async () => {
    const sig = await sign('msg_1', String(now), body)
    expect(await verifyPolarWebhook(body, headers('msg_1', String(now), sig), SECRET, now)).toBe(true)
  })

  it('accepts when one of several signatures matches (secret rotation)', async () => {
    const sig = await sign('msg_1', String(now), body)
    expect(await verifyPolarWebhook(body, headers('msg_1', String(now), `v1,AAAA ${sig}`), SECRET, now)).toBe(true)
  })

  it('rejects a tampered body', async () => {
    const sig = await sign('msg_1', String(now), body)
    expect(await verifyPolarWebhook(body + ' ', headers('msg_1', String(now), sig), SECRET, now)).toBe(false)
  })

  it('rejects the wrong secret', async () => {
    const sig = await sign('msg_1', String(now), body, 'another_secret')
    expect(await verifyPolarWebhook(body, headers('msg_1', String(now), sig), SECRET, now)).toBe(false)
  })

  it('rejects events older or newer than 5 minutes (replay)', async () => {
    const old = String(now - 301)
    expect(await verifyPolarWebhook(body, headers('msg_1', old, await sign('msg_1', old, body)), SECRET, now)).toBe(false)
    const future = String(now + 301)
    expect(await verifyPolarWebhook(body, headers('msg_1', future, await sign('msg_1', future, body)), SECRET, now)).toBe(false)
  })

  it('rejects missing headers', async () => {
    expect(await verifyPolarWebhook(body, new Headers(), SECRET, now)).toBe(false)
  })
})

function subEvent(type: string, data: Record<string, unknown>) {
  return {
    type,
    data: {
      id: 'sub_1',
      status: 'active',
      customer_id: 'cus_1',
      current_period_end: '2026-12-17T00:00:00Z',
      modified_at: '2026-11-17T10:00:00Z',
      customer: { id: 'cus_1', external_id: 'user_1' },
      metadata: {},
      ...data,
    },
  }
}

describe('resolvePolarEntitlement product filter', () => {
  it('only grants Pro for the configured Pro products', () => {
    const allowed = ['prod_m', 'prod_y']
    expect(resolvePolarEntitlement(subEvent('subscription.active', { product_id: 'prod_m' }), allowed)).toMatchObject({ plan: 'pro' })
    expect(resolvePolarEntitlement(subEvent('subscription.active', { product_id: 'prod_other' }), allowed)).toBeNull()
    expect(resolvePolarEntitlement(subEvent('subscription.active', {}), allowed)).toBeNull()
  })
})

describe('combinedPlan (web and app store subscriptions on one row)', () => {
  it('is Pro while either source is active', () => {
    expect(combinedPlan({ polarPro: true, storePro: false })).toEqual({ plan: 'pro', status: 'active' })
    expect(combinedPlan({ polarPro: false, storePro: true })).toEqual({ plan: 'pro', status: 'active' })
    expect(combinedPlan({ polarPro: true, storePro: true })).toEqual({ plan: 'pro', status: 'active' })
  })

  it('is Free only when both have ended', () => {
    expect(combinedPlan({ polarPro: false, storePro: false })).toEqual({ plan: 'free', status: 'expired' })
  })
})

describe('resolvePolarEntitlement', () => {
  it('grants Pro on an active subscription, keyed by our user id', () => {
    expect(resolvePolarEntitlement(subEvent('subscription.active', {}))).toEqual({
      userId: 'user_1',
      plan: 'pro',
      status: 'active',
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
      currentPeriodEnd: new Date('2026-12-17T00:00:00Z'),
      changedAt: new Date('2026-11-17T10:00:00Z'),
    })
  })

  it('keeps Pro after cancel until the period ends (still active, cancel at period end)', () => {
    const r = resolvePolarEntitlement(subEvent('subscription.canceled', { cancel_at_period_end: true }))
    expect(r).toMatchObject({ plan: 'pro', status: 'active' })
  })

  it('removes Pro when the subscription is revoked', () => {
    const r = resolvePolarEntitlement(subEvent('subscription.revoked', { status: 'canceled' }))
    expect(r).toMatchObject({ plan: 'free', status: 'expired' })
  })

  it('removes Pro for unpaid or ended subscriptions', () => {
    expect(resolvePolarEntitlement(subEvent('subscription.updated', { status: 'unpaid' }))).toMatchObject({ plan: 'free' })
    expect(resolvePolarEntitlement(subEvent('subscription.updated', { status: 'canceled' }))).toMatchObject({ plan: 'free' })
  })

  it('keeps Pro while a renewal payment is being retried (past_due)', () => {
    expect(resolvePolarEntitlement(subEvent('subscription.updated', { status: 'past_due' }))).toMatchObject({ plan: 'pro', status: 'active' })
  })

  it('falls back to metadata.userId when there is no external customer id', () => {
    const r = resolvePolarEntitlement(subEvent('subscription.active', { customer: { id: 'cus_1', external_id: null }, metadata: { userId: 'user_9' } }))
    expect(r?.userId).toBe('user_9')
  })

  it('ignores events with no user id, and non-subscription events', () => {
    expect(resolvePolarEntitlement(subEvent('subscription.active', { customer: { id: 'cus_1' }, metadata: {} }))).toBeNull()
    expect(resolvePolarEntitlement({ type: 'order.paid', data: { id: 'ord_1' } })).toBeNull()
    expect(resolvePolarEntitlement({ type: 'checkout.updated', data: {} })).toBeNull()
  })

  it('ignores incomplete subscriptions (checkout not paid yet)', () => {
    expect(resolvePolarEntitlement(subEvent('subscription.created', { status: 'incomplete' }))).toBeNull()
  })
})

describe('Polar API helpers', () => {
  it('uses the sandbox API unless production is set', () => {
    expect(polarApiBase('production')).toBe(POLAR_API_BASE.production)
    expect(polarApiBase('sandbox')).toBe(POLAR_API_BASE.sandbox)
    expect(polarApiBase(undefined)).toBe(POLAR_API_BASE.sandbox)
    expect(POLAR_API_BASE.production).toBe('https://api.polar.sh')
    expect(POLAR_API_BASE.sandbox).toBe('https://sandbox-api.polar.sh')
  })

  it('builds a checkout tied to our user id, with the success URL', () => {
    expect(
      buildCheckoutBody({ productId: 'prod_1', userId: 'user_1', email: 'a@b.co', successUrl: 'https://qaftr.com/workspace/billing?checkout=success' }),
    ).toEqual({
      products: ['prod_1'],
      external_customer_id: 'user_1',
      customer_email: 'a@b.co',
      success_url: 'https://qaftr.com/workspace/billing?checkout=success',
      metadata: { userId: 'user_1' },
    })
  })

  it('forwards the buyer IP so Polar picks the local currency (SAR)', () => {
    expect(buildCheckoutBody({ productId: 'p', userId: 'u', email: null, successUrl: 'https://x', customerIp: '1.2.3.4' })).toMatchObject({
      customer_ip_address: '1.2.3.4',
    })
  })

  it('omits the email when unknown', () => {
    expect(buildCheckoutBody({ productId: 'p', userId: 'u', email: null, successUrl: 'https://x' })).not.toHaveProperty('customer_email')
  })
})

describe('shouldApplyPolarChange', () => {
  const change = { plan: 'pro' as const, subscriptionId: 'sub_2', changedAt: new Date('2026-11-17T10:00:00Z') }

  it('applies when there is no row yet', () => {
    expect(shouldApplyPolarChange(null, change)).toBe(true)
  })

  it('ignores an event older than the last one applied (out of order delivery)', () => {
    expect(shouldApplyPolarChange({ polarSubscriptionId: 'sub_2', polarChangedAt: new Date('2026-11-17T11:00:00Z') }, change)).toBe(false)
  })

  it('applies a newer event', () => {
    expect(shouldApplyPolarChange({ polarSubscriptionId: 'sub_2', polarChangedAt: new Date('2026-11-17T09:00:00Z') }, change)).toBe(true)
  })

  it('does not let an old subscription ending remove Pro from a newer one', () => {
    expect(
      shouldApplyPolarChange({ polarSubscriptionId: 'sub_2', polarChangedAt: null }, { plan: 'free', subscriptionId: 'sub_1', changedAt: null }),
    ).toBe(false)
  })

  it('lets a new subscription replace an old one', () => {
    expect(shouldApplyPolarChange({ polarSubscriptionId: 'sub_1', polarChangedAt: new Date('2026-11-18T00:00:00Z') }, change)).toBe(true)
  })
})
