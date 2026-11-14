import { checkBuyerFormat, checkSellerFormat, normalizePartyInput } from '@zatca/shared'
import type { PartyIssue } from '@zatca/shared'

type Prepared<T> = { ok: true; values: T } | { ok: false; issues: PartyIssue[] }

/** Columns: undefined = not sent (leave as is), null = cleared, string = new value. */
type Columns<K extends string> = Partial<Record<K, string | null>>

function toColumns<K extends string>(input: Partial<Record<K, string | null | undefined>>): Columns<K> {
  const normalized = normalizePartyInput(input as Record<string, string | null | undefined>)
  const out: Columns<K> = {}
  for (const key of Object.keys(input) as K[]) {
    if (input[key] === undefined) continue
    out[key] = (normalized as Record<string, string | undefined>)[key] ?? null
  }
  return out
}

export type BusinessProfileField =
  | 'nameAr'
  | 'nameEn'
  | 'vatNumber'
  | 'crNumber'
  | 'street'
  | 'buildingNumber'
  | 'additionalNumber'
  | 'district'
  | 'city'
  | 'postalCode'

export function prepareBusinessProfile(
  input: Partial<Record<BusinessProfileField, string | null | undefined>>,
): Prepared<Columns<BusinessProfileField>> {
  const values = toColumns(input)
  const issues = checkSellerFormat({ ...values, name: values.nameAr })
  return issues.length ? { ok: false, issues } : { ok: true, values }
}

export type ClientProfileField =
  | 'name'
  | 'vatNumber'
  | 'country'
  | 'idScheme'
  | 'idValue'
  | 'street'
  | 'buildingNumber'
  | 'additionalNumber'
  | 'district'
  | 'city'
  | 'postalCode'

export function prepareClientProfile(
  input: Partial<Record<ClientProfileField, string | null | undefined>>,
): Prepared<Columns<ClientProfileField>> {
  const values = toColumns(input)
  const issues = checkBuyerFormat(values)
  return issues.length ? { ok: false, issues } : { ok: true, values }
}

/** Error message format the forms parse: "INVALID_PROFILE:crNumber:INVALID_CR,postalCode:INVALID_POSTAL". */
export function profileErrorMessage(issues: PartyIssue[]): string {
  return `INVALID_PROFILE:${issues.map((i) => `${i.field}:${i.code}`).join(',')}`
}

export function parseProfileError(message: string | undefined): PartyIssue[] {
  if (!message?.startsWith('INVALID_PROFILE:')) return []
  return message
    .slice('INVALID_PROFILE:'.length)
    .split(',')
    .map((pair) => {
      const [field, code] = pair.split(':')
      return { field, code } as PartyIssue
    })
}
