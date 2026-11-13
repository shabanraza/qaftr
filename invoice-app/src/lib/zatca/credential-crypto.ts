/**
 * Envelope encryption for ZATCA EGS credentials (zatca_credentials table).
 * Server-only: keys never reach the browser or the mobile app.
 *
 * - Each credential row gets a random 256-bit data key (DEK).
 * - The private key, binarySecurityToken and secret are each sealed with the
 *   DEK using AES-256-GCM, a fresh 12-byte IV, and associated data that binds
 *   the ciphertext to its credential id and column (no swapping fields/rows).
 * - The DEK is wrapped with a key-encryption key (KEK) held as a Workers
 *   secret, ZATCA_KEK_V{n}. ZATCA_KEK_CURRENT selects the KEK for new seals.
 * - Rotation: add ZATCA_KEK_V{n+1}, set CURRENT, run rewrapCredential on each
 *   row. Field ciphertexts are untouched; retire the old KEK afterwards.
 *
 * Encoded values are "v1.<iv base64>.<ciphertext base64>".
 */

export interface CredentialSecrets {
  privateKeyPem: string
  binarySecurityToken: string
  secret: string
}

/** Columns of zatca_credentials written by this module. */
export interface SealedCredentialSecrets {
  privateKeyEnc: string
  binarySecurityTokenEnc: string
  secretEnc: string
  dataKeyWrapped: string
  kekVersion: number
}

export interface KeyRing {
  /** KEK version used for new seals and rewraps. */
  current: number
  /** Base64 256-bit KEKs by version. */
  keks: Record<number, string>
}

export class CredentialCryptoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CredentialCryptoError'
  }
}

const FORMAT = 'v1'
const FIELDS = {
  privateKeyPem: 'privateKeyEnc',
  binarySecurityToken: 'binarySecurityTokenEnc',
  secret: 'secretEnc',
} as const satisfies Record<keyof CredentialSecrets, keyof SealedCredentialSecrets>

const FIELD_ENTRIES = Object.entries(FIELDS) as [keyof CredentialSecrets, (typeof FIELDS)[keyof CredentialSecrets]][]

const te = new TextEncoder()
const td = new TextDecoder()

function toB64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(input: string): Uint8Array<ArrayBuffer> {
  const s = atob(input)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(n))
}

function decodeKek(version: number, b64: string): Uint8Array<ArrayBuffer> {
  let bytes: Uint8Array<ArrayBuffer>
  try {
    bytes = fromB64(b64.trim())
  } catch {
    throw new CredentialCryptoError(`ZATCA_KEK_V${version} is not valid base64; it must be 32 bytes (256-bit), base64-encoded`)
  }
  if (bytes.length !== 32) throw new CredentialCryptoError(`ZATCA_KEK_V${version} must be 32 bytes (256-bit), base64-encoded`)
  return bytes
}

function aesKey(raw: Uint8Array<ArrayBuffer>, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usages)
}

function kekFor(ring: KeyRing, version: number, usages: KeyUsage[]): Promise<CryptoKey> {
  const b64 = ring.keks[version]
  if (!b64) throw new CredentialCryptoError(`KEK version ${version} is not configured (ZATCA_KEK_V${version})`)
  return aesKey(decodeKek(version, b64), usages)
}

async function seal(key: CryptoKey, plaintext: Uint8Array<ArrayBuffer>, aad: string): Promise<string> {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode(aad) }, key, plaintext)
  return `${FORMAT}.${toB64(iv)}.${toB64(new Uint8Array(ct))}`
}

async function open(key: CryptoKey, encoded: string, aad: string): Promise<Uint8Array<ArrayBuffer>> {
  const parts = encoded.split('.')
  if (parts.length !== 3 || parts[0] !== FORMAT) throw new CredentialCryptoError('Unrecognised ciphertext format')
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(parts[1]!), additionalData: te.encode(aad) },
      key,
      fromB64(parts[2]!),
    )
    return new Uint8Array(pt)
  } catch {
    throw new CredentialCryptoError('Decryption failed: wrong key, wrong credential/field, or tampered data')
  }
}

const dekAad = (version: number) => `qaftr:zatca:dek:kek-v${version}`
const fieldAad = (credentialId: string, column: string) => `qaftr:zatca:${credentialId}:${column}`

async function unwrapDek(sealed: Pick<SealedCredentialSecrets, 'dataKeyWrapped' | 'kekVersion'>, ring: KeyRing) {
  const kek = await kekFor(ring, sealed.kekVersion, ['decrypt'])
  return open(kek, sealed.dataKeyWrapped, dekAad(sealed.kekVersion))
}

export async function sealCredentialSecrets(
  credentialId: string,
  secrets: CredentialSecrets,
  ring: KeyRing,
): Promise<SealedCredentialSecrets> {
  const dekBytes = randomBytes(32)
  const dek = await aesKey(dekBytes, ['encrypt'])
  const kek = await kekFor(ring, ring.current, ['encrypt'])
  const out = {
    dataKeyWrapped: await seal(kek, dekBytes, dekAad(ring.current)),
    kekVersion: ring.current,
  } as SealedCredentialSecrets
  for (const [field, column] of FIELD_ENTRIES) {
    out[column] = await seal(dek, te.encode(secrets[field]), fieldAad(credentialId, column))
  }
  dekBytes.fill(0)
  return out
}

export async function openCredentialSecrets(
  credentialId: string,
  sealed: SealedCredentialSecrets,
  ring: KeyRing,
): Promise<CredentialSecrets> {
  const dekBytes = await unwrapDek(sealed, ring)
  const dek = await aesKey(dekBytes, ['decrypt'])
  dekBytes.fill(0)
  const out = {} as CredentialSecrets
  for (const [field, column] of FIELD_ENTRIES) {
    out[field] = td.decode(await open(dek, sealed[column], fieldAad(credentialId, column)))
  }
  return out
}

/** KEK rotation: re-wrap the data key under ring.current. Field ciphertexts are unchanged. */
export async function rewrapCredential(
  sealed: Pick<SealedCredentialSecrets, 'dataKeyWrapped' | 'kekVersion'>,
  ring: KeyRing,
): Promise<Pick<SealedCredentialSecrets, 'dataKeyWrapped' | 'kekVersion'>> {
  const dekBytes = await unwrapDek(sealed, ring)
  const kek = await kekFor(ring, ring.current, ['encrypt'])
  const dataKeyWrapped = await seal(kek, dekBytes, dekAad(ring.current))
  dekBytes.fill(0)
  return { dataKeyWrapped, kekVersion: ring.current }
}

/** Build the key ring from ZATCA_KEK_V{n} and ZATCA_KEK_CURRENT. Validates every key. */
export function loadKeyRing(env: Record<string, string | undefined>): KeyRing {
  const currentRaw = env.ZATCA_KEK_CURRENT
  const current = Number(currentRaw)
  if (!currentRaw || !Number.isInteger(current) || current < 1) {
    throw new CredentialCryptoError('ZATCA_KEK_CURRENT must be set to a positive integer KEK version')
  }
  const keks: Record<number, string> = {}
  for (const [name, value] of Object.entries(env)) {
    const m = /^ZATCA_KEK_V(\d+)$/.exec(name)
    if (!m || !value) continue
    const version = Number(m[1])
    decodeKek(version, value)
    keks[version] = value.trim()
  }
  if (!keks[current]) throw new CredentialCryptoError(`ZATCA_KEK_V${current} is missing (selected by ZATCA_KEK_CURRENT)`)
  return { current, keks }
}

/** A new random 256-bit KEK, base64. Use once to create a Workers secret. */
export function generateKekBase64(): string {
  return toB64(randomBytes(32))
}

/** Key ring from the Worker's secrets (nodejs_compat exposes them on process.env). */
export function keyRingFromProcessEnv(): KeyRing {
  return loadKeyRing(process.env)
}
