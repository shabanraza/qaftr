// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  CredentialCryptoError,
  generateKekBase64,
  loadKeyRing,
  openCredentialSecrets,
  rewrapCredential,
  sealCredentialSecrets,
} from './credential-crypto'

const SECRETS = {
  privateKeyPem: '-----BEGIN EC PRIVATE KEY-----\nMHQCAQEE...\n-----END EC PRIVATE KEY-----',
  binarySecurityToken: 'TUlJQ...base64-cert-token',
  secret: 'Dehvg1fc8GF6Jwt5bOxXwC6ensJTd2x8ICp8jZpXhN8=',
}

const ring = (current: number, ...versions: number[]) => {
  const keks: Record<number, string> = {}
  for (const v of versions) keks[v] = KEKS[v]!
  return { current, keks }
}
const KEKS: Record<number, string> = { 1: generateKekBase64(), 2: generateKekBase64() }

describe('sealCredentialSecrets / openCredentialSecrets', () => {
  it('round-trips the private key, token and secret', async () => {
    const sealed = await sealCredentialSecrets('cred_1', SECRETS, ring(1, 1))
    expect(sealed.kekVersion).toBe(1)
    expect(await openCredentialSecrets('cred_1', sealed, ring(1, 1))).toEqual(SECRETS)
  })

  it('never stores plaintext and uses a fresh IV for every field and every seal', async () => {
    const a = await sealCredentialSecrets('cred_1', SECRETS, ring(1, 1))
    const b = await sealCredentialSecrets('cred_1', SECRETS, ring(1, 1))
    const blob = JSON.stringify(a)
    for (const value of Object.values(SECRETS)) expect(blob).not.toContain(value)
    expect(a.secretEnc).not.toBe(b.secretEnc)
    expect(a.dataKeyWrapped).not.toBe(b.dataKeyWrapped)
    expect(new Set([a.privateKeyEnc, a.binarySecurityTokenEnc, a.secretEnc].map((c) => c.split('.')[1])).size).toBe(3)
  })

  it('refuses to decrypt a field moved to another column or another credential', async () => {
    const sealed = await sealCredentialSecrets('cred_1', SECRETS, ring(1, 1))
    await expect(
      openCredentialSecrets('cred_1', { ...sealed, secretEnc: sealed.privateKeyEnc }, ring(1, 1)),
    ).rejects.toBeInstanceOf(CredentialCryptoError)
    await expect(openCredentialSecrets('cred_2', sealed, ring(1, 1))).rejects.toBeInstanceOf(CredentialCryptoError)
  })

  it('detects tampered ciphertext', async () => {
    const sealed = await sealCredentialSecrets('cred_1', SECRETS, ring(1, 1))
    const [v, iv, ct] = sealed.secretEnc.split('.')
    const flipped = ct!.startsWith('A') ? `B${ct!.slice(1)}` : `A${ct!.slice(1)}`
    await expect(
      openCredentialSecrets('cred_1', { ...sealed, secretEnc: [v, iv, flipped].join('.') }, ring(1, 1)),
    ).rejects.toBeInstanceOf(CredentialCryptoError)
  })

  it('fails clearly when the KEK version is not configured', async () => {
    const sealed = await sealCredentialSecrets('cred_1', SECRETS, ring(1, 1))
    await expect(openCredentialSecrets('cred_1', sealed, ring(2, 2))).rejects.toThrow(/KEK version 1/)
  })
})

describe('rewrapCredential (KEK rotation)', () => {
  it('re-wraps only the data key; field ciphertexts stay the same', async () => {
    const sealed = await sealCredentialSecrets('cred_1', SECRETS, ring(1, 1))
    const rotated = await rewrapCredential(sealed, ring(2, 1, 2))
    expect(rotated.kekVersion).toBe(2)
    expect(rotated.dataKeyWrapped).not.toBe(sealed.dataKeyWrapped)
    const next = { ...sealed, ...rotated }
    expect(next.secretEnc).toBe(sealed.secretEnc)
    // Old KEK can be retired after rotation.
    expect(await openCredentialSecrets('cred_1', next, ring(2, 2))).toEqual(SECRETS)
  })
})

describe('loadKeyRing', () => {
  it('reads ZATCA_KEK_V{n} and ZATCA_KEK_CURRENT from the environment', () => {
    const r = loadKeyRing({ ZATCA_KEK_V1: KEKS[1], ZATCA_KEK_V2: KEKS[2], ZATCA_KEK_CURRENT: '2', OTHER: 'x' })
    expect(r.current).toBe(2)
    expect(Object.keys(r.keks).sort()).toEqual(['1', '2'])
  })

  it('rejects a missing current key and keys that are not 256-bit base64', () => {
    expect(() => loadKeyRing({ ZATCA_KEK_V1: KEKS[1], ZATCA_KEK_CURRENT: '2' })).toThrow(/ZATCA_KEK_V2/)
    expect(() => loadKeyRing({ ZATCA_KEK_V1: 'too-short', ZATCA_KEK_CURRENT: '1' })).toThrow(/32 bytes/)
    expect(() => loadKeyRing({})).toThrow(/ZATCA_KEK_CURRENT/)
  })
})
