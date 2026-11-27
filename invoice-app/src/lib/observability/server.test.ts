// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureException = vi.hoisted(() => vi.fn())
vi.mock('@sentry/cloudflare', () => ({
  captureException,
  dedupeIntegration: () => ({ name: 'Dedupe' }),
  eventFiltersIntegration: () => ({ name: 'EventFilters' }),
  functionToStringIntegration: () => ({ name: 'FunctionToString' }),
  linkedErrorsIntegration: () => ({ name: 'LinkedErrors' }),
  requestDataIntegration: () => ({ name: 'RequestData' }),
}))

const { captureRouteErrors, captureTrpcError, reportRequestErrors, reportServerFnErrors, serverSentryOptions } =
  await import('./server')

const DSN = 'https://abc@o1.ingest.de.sentry.io/2'
const build = { isDev: false, mode: 'production', release: 'r1' }

beforeEach(() => captureException.mockClear())

describe('serverSentryOptions', () => {
  it('is explicitly disabled without a DSN', () => {
    expect(serverSentryOptions({}, build)).toEqual({ enabled: false })
  })

  it('is disabled in dev even with a runtime DSN', () => {
    expect(serverSentryOptions({ SENTRY_DSN: DSN }, { ...build, isDev: true })).toEqual({
      enabled: false,
    })
  })

  it('prefers Worker variables over the build-time values', () => {
    const options = serverSentryOptions(
      { SENTRY_DSN: DSN, SENTRY_ENVIRONMENT: 'preview' },
      { ...build, dsn: 'https://old@o1.ingest.de.sentry.io/9', environment: 'production' },
    )
    expect(options).toMatchObject({ dsn: DSN, environment: 'preview', release: 'r1' })
  })

  it('falls back to the build-time DSN and loads no collecting integrations', () => {
    const options = serverSentryOptions({}, { ...build, dsn: DSN })
    expect(options).toMatchObject({ dsn: DSN, environment: 'production', tracesSampleRate: 0 })
    const names = (options as { integrations: Array<{ name: string }> }).integrations.map((i) => i.name)
    expect(names).toEqual(['Dedupe', 'EventFilters', 'FunctionToString', 'LinkedErrors', 'RequestData'])
  })
})

describe('captureTrpcError', () => {
  const failure = (code: string, message: string, cause?: unknown) => ({
    error: { code, message, cause },
    path: 'invoices.create',
  })

  it('reports unexpected server errors with the procedure name only', () => {
    const cause = new Error('db down')
    captureTrpcError(failure('INTERNAL_SERVER_ERROR', 'db down', cause))
    expect(captureException).toHaveBeenCalledWith(cause, {
      tags: { source: 'trpc', trpc_path: 'invoices.create' },
    })
  })

  it('reports known failure codes', () => {
    captureTrpcError(failure('INTERNAL_SERVER_ERROR', 'INVOICE_CREATE_FAILED'))
    expect(captureException).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['UNAUTHORIZED', 'UNAUTHORIZED'],
    ['NOT_FOUND', 'INVOICE_NOT_FOUND'],
    ['BAD_REQUEST', 'bad input'],
    ['INTERNAL_SERVER_ERROR', 'FREE_INVOICE_LIMIT'],
    ['INTERNAL_SERVER_ERROR', 'INVALID_PROFILE:vatNumber:INVALID_VAT'],
  ])('ignores expected %s %s', (code, message) => {
    captureTrpcError(failure(code, message))
    expect(captureException).not.toHaveBeenCalled()
  })
})

describe('captureRouteErrors', () => {
  it('reports server-rendered loader errors', () => {
    const error = new Error('loader failed')
    captureRouteErrors([
      { status: 'success' },
      { status: 'error', error },
      { status: 'notFound', error: { isNotFound: true } },
    ])
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(captureException).toHaveBeenCalledWith(error, { tags: { source: 'ssr' } })
  })
})

describe('reportRequestErrors', () => {
  const respond = (status: number) => async () => ({ response: new Response('x', { status }) })

  it('reports a thrown error and rethrows it', async () => {
    const error = new Error('db down')
    const run = reportRequestErrors('/api/webhooks/polar', async () => {
      throw error
    })
    await expect(run).rejects.toBe(error)
    expect(captureException).toHaveBeenCalledWith(error, { tags: { source: 'request' } })
  })

  it('does not report a thrown redirect', async () => {
    const redirect = new Response(null, { status: 307 })
    await expect(
      reportRequestErrors('/workspace', async () => {
        throw redirect
      }),
    ).rejects.toBe(redirect)
    expect(captureException).not.toHaveBeenCalled()
  })

  // Better Auth turns its own failures into a 500.
  it('reports a 5xx from an API route', async () => {
    const result = await reportRequestErrors('/api/auth/sign-in/email', respond(500))
    expect(result.response.status).toBe(500)
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(captureException.mock.calls[0]![0].message).toBe('/api/auth responded 500')
    expect(captureException.mock.calls[0]![1]).toEqual({ tags: { source: 'request' } })
  })

  it.each([
    ['/api/auth/get-session', 401],
    ['/api/trpc/invoices.list', 500],
    ['/workspace', 500],
    // Server functions report the original error themselves.
    ['/_serverFn/abc', 500],
  ])('leaves %s %s alone', async (path, status) => {
    await reportRequestErrors(path, respond(status))
    expect(captureException).not.toHaveBeenCalled()
  })
})

describe('reportServerFnErrors', () => {
  it('reports the original error and rethrows it', async () => {
    const error = new Error('lookup failed')
    await expect(
      reportServerFnErrors(async () => {
        throw error
      }),
    ).rejects.toBe(error)
    expect(captureException).toHaveBeenCalledWith(error, { tags: { source: 'server_fn' } })
  })

  it.each([
    ['redirect', new Response(null, { status: 307 })],
    ['not found', { isNotFound: true }],
  ])('does not report a thrown %s', async (_label, thrown) => {
    await expect(
      reportServerFnErrors(async () => {
        throw thrown
      }),
    ).rejects.toBe(thrown)
    expect(captureException).not.toHaveBeenCalled()
  })

  it('returns the result', async () => {
    await expect(reportServerFnErrors(async () => 'ok')).resolves.toBe('ok')
  })
})
