/**
 * Privacy filter for everything sent to Sentry. Events are rebuilt from an
 * allowlist, so a field added by a future SDK version is dropped by default.
 * Free text (error messages) is then redacted: emails, VAT/CR/phone numbers,
 * tokens, query strings, quoted values and Arabic text (customer names).
 */

const MAX_INPUT = 2000
const MAX_TEXT = 500

const ARABIC = /\p{Script=Arabic}+(?:[\s\p{Script=Arabic}]*\p{Script=Arabic})?/gu
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isIdSegment(segment: string): boolean {
  // '@', percent-encoding and non-ASCII text can all carry a name or an email.
  if (/[@%]|[^\x20-\x7e]/.test(segment)) return true
  // Numbers, including phone numbers (wa.me/+966…).
  if (UUID.test(segment) || /^\d{3,}$|^\+?\d[\d-]{5,}$/.test(segment)) return true
  // Long opaque ids and tokens. Asset files have a dot, page slugs have no digit.
  return segment.length >= 16 && /\d/.test(segment) && /^[\w-]+$/.test(segment)
}

/** Drops credentials, query and hash, and replaces id-like path segments. */
export function scrubUrl(url: string): string {
  if (/^(data|blob):/i.test(url)) return `${url.slice(0, 4)}:[redacted]`
  const bare = url.split(/[?#]/)[0]!
  const [, origin = '', path = ''] = /^([a-z][\w+.-]*:\/\/[^/]*)?(.*)$/is.exec(bare)!
  return (
    origin.replace(/\/\/[^/]*@/, '//') +
    path
      .split('/')
      .map((segment) => (isIdSegment(segment) ? ':id' : segment))
      .join('/')
  )
}

export function scrubText(input: string): string {
  let text = input.slice(0, MAX_INPUT)

  // Drizzle puts the SQL and its bound values (customer data) in the message.
  text = text.replace(/Failed query:[\s\S]*/, 'Failed query: [redacted]')

  // URLs are cleaned first and set aside so later rules do not mangle them.
  const urls: string[] = []
  text = text.replace(/\b[a-z][\w+.-]*:\/\/[^\s"'`<>)]+/gi, (url) => {
    urls.push(scrubUrl(url))
    return `\u0000${urls.length - 1}\u0000`
  })

  text = text
    .replace(/(\/[^\s?#"'`]*)[?#][^\s"'`)]+/g, '$1')
    .replace(/=\(.*\)/g, '=([redacted])')
    .replace(/(Failing row contains )\(.*\)/g, '$1([redacted])')
    .replace(/\b(Bearer|Basic)\s+[^\s"',;]+/gi, '$1 [redacted]')
    .replace(/[^\s@"'`<>(),;:=]+@[^\s@"'`<>(),;:=]+\.[^\s@"'`<>(),;:=]+/g, '[email]')
    // Quoted values; property names in "reading 'x'" are code, not data.
    // A single quote inside a word is an apostrophe, not the start of a value.
    .replace(
      /(\b(?:reading|setting) )?(?:(?<![\p{L}\p{N}])'([^'\n]*)'(?![\p{L}\p{N}])|(["`])(?:(?!\3)[^\n])*\3)/gu,
      (match, access: string | undefined, single: string | undefined, quote = "'") =>
        access && single && /^[A-Za-z_$][\w$]*$/.test(single)
          ? match
          : `${access ?? ''}${quote}[redacted]${quote}`,
    )
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
    .replace(/[\w+=-]{24,}/g, (token) =>
      /\d/.test(token) && /[a-z]/i.test(token) ? '[redacted]' : token,
    )
    // Six or more digits in any script: VAT, CR, ID, phone and account numbers.
    .replace(/\+?\p{Nd}[\p{Nd} ().-]*\p{Nd}/gu, (run) =>
      (run.match(/\p{Nd}/gu)?.length ?? 0) >= 6 ? '[number]' : run,
    )
    .replace(ARABIC, '[text]')
    .replace(/\u0000(\d+)\u0000/g, (_m, index: string) => urls[Number(index)] ?? '')

  return text.slice(0, MAX_TEXT)
}

type Obj = Record<string, unknown>

export interface ScrubbedEvent {
  [key: string]: unknown
  message?: string
  transaction?: string
  tags?: Obj
  contexts?: Obj
  request?: { method?: string; url?: string; headers?: Record<string, string> }
  exception?: { values?: Obj[] }
  debug_meta?: { images: Obj[] }
  sdk?: Obj & { settings?: Obj }
}

const TOP_LEVEL = ['event_id', 'timestamp', 'platform', 'level', 'release', 'environment', 'dist']
const TAGS = ['source', 'trpc_path', 'runtime']
const CONTEXTS = ['runtime', 'browser', 'os']
const MECHANISM = ['type', 'handled', 'source', 'exception_id', 'parent_id', 'is_exception_group']
const FRAME = ['function', 'module', 'lineno', 'colno', 'in_app', 'platform']

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null
const list = (value: unknown): Obj[] => (Array.isArray(value) ? value.filter(isObj) : [])

function pick(source: unknown, keys: string[]): Obj {
  const out: Obj = {}
  if (!isObj(source)) return out
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key]
  return out
}

function scrubFrame(frame: Obj): Obj {
  const out = pick(frame, FRAME)
  for (const key of ['filename', 'abs_path']) {
    const value = frame[key]
    if (typeof value === 'string') out[key] = scrubUrl(value)
  }
  return out
}

function scrubException(value: Obj): Obj {
  const out: Obj = {}
  if (typeof value.type === 'string') out.type = scrubText(value.type)
  if (typeof value.value === 'string') out.value = scrubText(value.value)
  if (isObj(value.mechanism)) out.mechanism = pick(value.mechanism, MECHANISM)
  if (isObj(value.stacktrace)) {
    out.stacktrace = { frames: list(value.stacktrace.frames).map(scrubFrame) }
  }
  return out
}

export function scrubEvent(event: object): ScrubbedEvent {
  const source = event as Obj
  const out: ScrubbedEvent = pick(source, TOP_LEVEL)

  if (typeof source.message === 'string') out.message = scrubText(source.message)
  if (typeof source.transaction === 'string') {
    const [, method = '', path = ''] = /^([A-Z]+ )?([\s\S]*)$/.exec(source.transaction)!
    out.transaction = method + scrubUrl(path)
  }
  if (isObj(source.exception)) {
    out.exception = { values: list(source.exception.values).map(scrubException) }
  }
  if (isObj(source.tags)) {
    const tags = pick(source.tags, TAGS)
    for (const [key, value] of Object.entries(tags)) tags[key] = scrubText(String(value))
    out.tags = tags
  }
  if (isObj(source.contexts)) {
    const contexts: Obj = {}
    for (const key of CONTEXTS) {
      const context = source.contexts[key]
      if (isObj(context)) contexts[key] = pick(context, ['name', 'version'])
    }
    out.contexts = contexts
  }
  if (isObj(source.request)) {
    const { method, url } = source.request
    out.request = {
      ...(typeof method === 'string' ? { method } : {}),
      ...(typeof url === 'string' ? { url: scrubUrl(url) } : {}),
    }
  }
  if (isObj(source.debug_meta)) {
    out.debug_meta = {
      images: list(source.debug_meta.images).map((image) => ({
        ...pick(image, ['type', 'debug_id']),
        ...(typeof image.code_file === 'string' ? { code_file: scrubUrl(image.code_file) } : {}),
      })),
    }
  }
  out.sdk = {
    ...pick(source.sdk, ['name', 'version', 'integrations', 'packages']),
    settings: { infer_ip: 'never' },
  }
  return out
}
