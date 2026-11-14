import { sellerZatcaReadiness } from '@zatca/shared'
import type { PartyProfileInput } from '@zatca/shared'
import { ZATCA_SANDBOX_OTP } from '@zatca/shared/zatca-phase2'
import { onboardingGate } from './egs-records'
import type { OnboardingEnv } from './onboarding'

export type StatusBusiness = Omit<PartyProfileInput, 'name' | 'country' | 'idScheme' | 'idValue'> & { nameAr: string }

/** What the Settings page and invoice screens need to know about the ZATCA connection. */
export function buildZatcaStatus<Unit>(p: {
  env: OnboardingEnv | null
  business: StatusBusiness | undefined
  entitlement: { plan: string; status: string } | undefined
  unit: Unit | undefined
}) {
  return {
    env: p.env,
    gate: onboardingGate({ env: p.env, entitlement: p.entitlement }),
    hasBusiness: Boolean(p.business),
    sellerReady: p.business ? sellerZatcaReadiness({ ...p.business, name: p.business.nameAr }).ready : false,
    sandboxOtp: p.env === 'sandbox' ? ZATCA_SANDBOX_OTP : null,
    unit: p.env && p.business ? (p.unit ?? null) : null,
  }
}
