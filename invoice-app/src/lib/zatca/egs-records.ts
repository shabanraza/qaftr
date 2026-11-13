/**
 * Glue between EGS onboarding and storage: which ZATCA environment this
 * deployment talks to, who may onboard, and the rows to insert (secrets
 * sealed with envelope encryption before they leave this module).
 */
import { FIRST_INVOICE_PIH } from '@zatca/shared/zatca-phase2'
import { sealCredentialSecrets } from './credential-crypto'
import type { KeyRing, SealedCredentialSecrets } from './credential-crypto'
import type { IssuedCredential, OnboardingEnv, OnboardingResult } from './onboarding'

const ENVS: readonly OnboardingEnv[] = ['sandbox', 'simulation', 'production']

/** ZATCA_ENV unset or unknown = e-invoicing integration disabled. */
export function resolveZatcaEnv(env: Record<string, string | undefined>): OnboardingEnv | null {
  const v = env.ZATCA_ENV?.trim().toLowerCase()
  return ENVS.find((e) => e === v) ?? null
}

export type OnboardingGateCode = 'ZATCA_DISABLED' | 'ZATCA_PRO_REQUIRED'

export function onboardingGate(p: {
  env: OnboardingEnv | null
  entitlement: { plan: string; status: string } | undefined
}): OnboardingGateCode | null {
  if (!p.env) return 'ZATCA_DISABLED'
  if (p.env === 'sandbox') return null
  return p.entitlement?.plan === 'pro' && p.entitlement.status === 'active' ? null : 'ZATCA_PRO_REQUIRED'
}

export interface EgsUnitRow {
  id: string
  businessId: string
  env: OnboardingEnv
  commonName: string
  branchName: string
  egsSerial: string
  invoiceTypeFlags: string
  location: string
  industry: string
  status: 'active'
  lastIcv: number
  lastPih: string
  activeCredentialId: string
  certNotAfter: Date
}

export interface CredentialRow extends SealedCredentialSecrets {
  id: string
  egsUnitId: string
  kind: 'compliance' | 'production'
  requestId: string
  certificateB64: string
  publicKeyMatches: boolean
  issuedAt: Date
  notAfter: Date
}

export async function toEgsRecords(p: {
  businessId: string
  result: OnboardingResult
  ring: KeyRing
  newId?: () => string
}): Promise<{ unit: EgsUnitRow; credentials: [CredentialRow, CredentialRow] }> {
  const newId = p.newId ?? (() => crypto.randomUUID())
  const unitId = newId()
  const seal = async (kind: CredentialRow['kind'], c: IssuedCredential): Promise<CredentialRow> => {
    const id = newId()
    const sealed = await sealCredentialSecrets(
      id,
      { privateKeyPem: p.result.privateKeyPem, binarySecurityToken: c.binarySecurityToken, secret: c.secret },
      p.ring,
    )
    return {
      id,
      egsUnitId: unitId,
      kind,
      requestId: c.requestId,
      certificateB64: c.certificateB64,
      publicKeyMatches: c.publicKeyMatches,
      issuedAt: c.issuedAt,
      notAfter: c.notAfter,
      ...sealed,
    }
  }
  const compliance = await seal('compliance', p.result.compliance)
  const production = await seal('production', p.result.production)
  const u = p.result.unit
  return {
    unit: {
      id: unitId,
      businessId: p.businessId,
      env: u.env,
      commonName: u.commonName,
      branchName: u.branchName,
      egsSerial: u.egsSerial,
      invoiceTypeFlags: u.invoiceTypeFlags,
      location: u.location,
      industry: u.industry,
      status: 'active',
      // Compliance samples do not advance the production ICV/PIH chain.
      lastIcv: 0,
      lastPih: FIRST_INVOICE_PIH,
      activeCredentialId: production.id,
      certNotAfter: p.result.production.notAfter,
    },
    credentials: [compliance, production],
  }
}
