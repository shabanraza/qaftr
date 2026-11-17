import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('#/db', () => ({ db: {} }))

const { createPolarCheckout } = await import('./polar-server')

const config = { apiBase: 'https://sandbox-api.polar.sh', accessToken: 'test-token', products: { monthly: 'prod_m', yearly: 'prod_y' } }
const input = { interval: 'monthly' as const, userId: 'user_1', email: 'someone@bad-domain.invalid', successUrl: 'http://localhost/ok' }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('createPolarCheckout', () => {
  it('pre-fills the email and returns the checkout url', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(201, { url: 'https://sandbox.polar.sh/checkout/abc' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await createPolarCheckout(config, input)).toBe('https://sandbox.polar.sh/checkout/abc')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.customer_email).toBe(input.email)
    expect(body.products).toEqual(['prod_m'])
  })

  it('retries without the email when Polar rejects it, so the buyer types one at checkout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(422, { error: 'RequestValidationError', detail: [{ loc: ['body', 'customer_email'], msg: 'not a valid email address' }] }))
      .mockResolvedValueOnce(json(201, { url: 'https://sandbox.polar.sh/checkout/def' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await createPolarCheckout(config, input)).toBe('https://sandbox.polar.sh/checkout/def')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(retryBody.customer_email).toBeUndefined()
    expect(retryBody.external_customer_id).toBe('user_1')
  })

  it('does not retry other failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn().mockResolvedValue(json(401, { error: 'Unauthorized' }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(createPolarCheckout(config, input)).rejects.toThrow('BILLING_FAILED')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
