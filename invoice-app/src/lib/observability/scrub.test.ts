import { describe, expect, it } from 'vitest'
import { scrubEvent, scrubText, scrubUrl } from './scrub'

describe('scrubText', () => {
  it.each([
    ['email', 'No user for sara.q@example.co.sa today', 'sara.q@example.co.sa'],
    ['VAT number', 'Bad VAT 300000000000003 supplied', '300000000000003'],
    ['Arabic-Indic digits', 'VAT ٣٠٠٠٠٠٠٠٠٠٠٠٠٠٣ rejected', '٣٠٠٠٠٠٠٠٠٠٠٠٠٠٣'],
    ['spaced phone number', 'SMS to +966 50 123 4567 failed', '123 4567'],
    ['quoted value', 'Client "Al Noor Trading Co" is invalid', 'Al Noor'],
    ['single quoted name', "duplicate name 'Mohammed' found", 'Mohammed'],
    ['Arabic name', 'العميل مؤسسة النور غير موجود', 'النور'],
    ['bearer token', 'got Authorization: Bearer abc.def-123 back', 'abc.def-123'],
    ['API key', 'key polar_oat_Ab12Cd34Ef56Gh78Ij90 rejected', 'Ab12Cd34Ef56'],
    ['URL query', 'GET https://qaftr.com/accept-invite?token=s3cr3t failed', 's3cr3t'],
    ['relative query', 'fetch /api/trpc/invoices.get?input=%7Bsecret failed', 'secret'],
    ['postgres key detail', 'Key (name)=(Noor Trading) already exists.', 'Noor'],
    ['postgres row detail', 'Failing row contains (1, Noor Trading, x).', 'Noor'],
    ['JSON parse snippet', 'Unexpected token J, "Jane Roe"... is not valid JSON', 'Jane'],
    ['Arabic name in a URL', 'fetch https://api.example.com/customers/محمد/x failed', 'محمد'],
    ['phone number in a URL', 'lookup https://wa.me/+966512345678 failed', '966512345678'],
    ['quoted value followed by a letter', 'name: "Mohammed Al Saud"ok', 'Mohammed'],
  ])('removes a %s', (_label, input, secret) => {
    expect(scrubText(input)).not.toContain(secret)
  })

  it('drops the SQL and parameters of a failed query', () => {
    const out = scrubText('Failed query: select * from clients where name = $1\nparams: Noor Trading')
    expect(out).toBe('Failed query: [redacted]')
  })

  it('keeps what is needed to debug', () => {
    expect(scrubText("Cannot read properties of undefined (reading 'vatNumber')")).toBe(
      "Cannot read properties of undefined (reading 'vatNumber')",
    )
    expect(scrubText('ZATCA returned 503')).toBe('ZATCA returned 503')
    expect(scrubText('INVOICE_CREATE_FAILED')).toBe('INVOICE_CREATE_FAILED')
  })

  it('caps very long messages', () => {
    expect(scrubText('a '.repeat(5000)).length).toBeLessThanOrEqual(500)
  })
})

describe('scrubUrl', () => {
  it('removes query strings, hashes and credentials', () => {
    expect(scrubUrl('https://u:p@qaftr.com/workspace?email=a@b.com#x')).toBe(
      'https://qaftr.com/workspace',
    )
    expect(scrubUrl('/accept-invite?token=abc')).toBe('/accept-invite')
  })

  it('replaces id-like path segments', () => {
    expect(scrubUrl('/workspace/invoices/3f2b8c1e-9a4d-4c6e-8f10-2b7a5d9e1c33')).toBe(
      '/workspace/invoices/:id',
    )
    expect(scrubUrl('/x/12345/y/V1StGXR8_Z5jdHi6B-myT')).toBe('/x/:id/y/:id')
    expect(scrubUrl('/u/a%40b.com')).toBe('/u/:id')
  })

  it('leaves page and asset paths alone', () => {
    expect(scrubUrl('/e-invoicing-software-comparison-saudi-arabia')).toBe(
      '/e-invoicing-software-comparison-saudi-arabia',
    )
    expect(scrubUrl('https://qaftr.com/assets/index-Bq3x9_Ab12Cd34Ef.js')).toBe(
      'https://qaftr.com/assets/index-Bq3x9_Ab12Cd34Ef.js',
    )
  })
})

describe('scrubEvent', () => {
  const dirty = {
    event_id: 'e1',
    timestamp: 1,
    platform: 'javascript',
    level: 'error',
    release: 'qaftr-web@abc',
    environment: 'production',
    message: 'mail a@b.com',
    server_name: 'host',
    transaction: '/workspace/invoices/12345',
    user: { email: 'a@b.com', ip_address: '1.2.3.4' },
    extra: { invoice: { buyer: 'Noor' } },
    breadcrumbs: [{ message: 'clicked Noor Trading' }],
    modules: { a: '1' },
    tags: { source: 'trpc', trpc_path: 'invoices.create', customer: 'Noor' },
    contexts: {
      runtime: { name: 'cloudflare' },
      trace: { trace_id: 't', span_id: 's', data: { url: '/?q=Noor' } },
      state: { value: 'Noor' },
    },
    request: {
      method: 'POST',
      url: 'https://qaftr.com/api/trpc/invoices.create?input=Noor',
      query_string: 'input=Noor',
      cookies: { session: 'Noor' },
      headers: { authorization: 'Bearer Noor', cookie: 'Noor' },
      data: { buyer: 'Noor' },
    },
    exception: {
      values: [
        {
          type: 'Error',
          value: 'VAT 300000000000003 invalid',
          mechanism: { type: 'generic', handled: false, data: { target: 'Noor' } },
          stacktrace: {
            frames: [
              {
                filename: 'https://qaftr.com/assets/a.js?v=Noor',
                abs_path: 'https://qaftr.com/assets/a.js?v=Noor',
                function: 'save',
                lineno: 3,
                colno: 9,
                in_app: true,
                vars: { buyer: 'Noor' },
                context_line: 'const buyer = "Noor"',
                pre_context: ['Noor'],
                post_context: ['Noor'],
              },
            ],
          },
        },
      ],
    },
    debug_meta: { images: [{ type: 'sourcemap', code_file: 'https://qaftr.com/assets/a.js?v=Noor', debug_id: 'd' }] },
    somethingNew: 'Noor',
  }

  const clean = scrubEvent(dirty)
  const json = JSON.stringify(clean)

  it('sends no personal or invoice data from any field', () => {
    for (const secret of ['Noor', 'a@b.com', '1.2.3.4', '300000000000003', '12345']) {
      expect(json).not.toContain(secret)
    }
  })

  it('keeps release, environment, tags, route and stack', () => {
    expect(clean).toMatchObject({
      event_id: 'e1',
      release: 'qaftr-web@abc',
      environment: 'production',
      transaction: '/workspace/invoices/:id',
      tags: { source: 'trpc', trpc_path: 'invoices.create' },
      request: { method: 'POST', url: 'https://qaftr.com/api/trpc/invoices.create' },
      debug_meta: { images: [{ type: 'sourcemap', code_file: 'https://qaftr.com/assets/a.js', debug_id: 'd' }] },
    })
    expect(clean.exception?.values?.[0]).toMatchObject({
      type: 'Error',
      mechanism: { type: 'generic', handled: false },
      stacktrace: {
        frames: [{ filename: 'https://qaftr.com/assets/a.js', function: 'save', lineno: 3, colno: 9, in_app: true }],
      },
    })
  })

  it('tells Sentry never to infer the IP address', () => {
    expect(clean.sdk?.settings).toEqual({ infer_ip: 'never' })
  })
})
