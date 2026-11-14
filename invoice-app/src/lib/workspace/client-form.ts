import { CLIENT_B2B_KEYS } from '#/components/workspace/ClientB2bDetails'
import type { PartyFormKey, PartyValues } from '#/components/workspace/PartyFields'

export interface ClientForm {
  name: string
  vatNumber: string
  email: string
  phone: string
  b2b: PartyValues
}

type SavedClient = { name: string; vatNumber?: string | null; email?: string | null; phone?: string | null } & Partial<
  Record<PartyFormKey, string | null>
>

export function emptyClientForm(): ClientForm {
  return { name: '', vatNumber: '', email: '', phone: '', b2b: {} }
}

/** Fill the form from a saved client; missing values become empty strings. */
export function clientToForm(client: SavedClient): ClientForm {
  return {
    name: client.name,
    vatNumber: client.vatNumber ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    b2b: Object.fromEntries(CLIENT_B2B_KEYS.map((k) => [k, client[k] ?? ''])) as PartyValues,
  }
}

/**
 * What to send to clients.create / clients.update. On create a blank field is
 * left out; on update it is sent as null so a removed detail is really cleared.
 */
export function buildClientPayload(form: ClientForm, mode: 'create' | 'update') {
  const blank = mode === 'create' ? undefined : null
  const value = (v: string | undefined) => {
    const t = (v ?? '').trim()
    return t ? t : blank
  }
  const out: Record<string, string | null> = { name: form.name.trim() }
  const fields: Record<string, string | undefined> = {
    vatNumber: form.vatNumber,
    email: form.email,
    phone: form.phone,
    ...form.b2b,
  }
  for (const [key, raw] of Object.entries(fields)) {
    const v = value(raw)
    if (v !== undefined) out[key] = v
  }
  return out as { name: string } & Record<string, string | null | undefined>
}
