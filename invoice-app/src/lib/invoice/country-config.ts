/**
 * Per-country invoice settings. The UAE generator reads its behaviour from
 * here so the form, preview and PDF pieces can be reused for another country
 * by adding a config instead of forking components.
 *
 * The Saudi instant-invoice tool predates this and is intentionally not wired
 * to it yet (its behaviour must stay byte-for-byte identical).
 */
export type InvoiceCountryCode = 'sa' | 'ae'

export interface InvoiceCountryConfig {
  country: InvoiceCountryCode
  currency: { code: string; labelAr: string; labelEn: string }
  /** Selectable VAT categories with their rate in percent (null = exempt). */
  vatCategories: { id: string; ratePercent: number | null }[]
  /** Saudi Phase 1 invoices carry a ZATCA TLV QR; UAE invoices must not. */
  showZatcaQr: boolean
  /** Amounts are always printed with Latin digits. */
  latinDigits: true
  taxIdLabel: { ar: string; en: string }
  /** localStorage key for the in-browser draft. */
  draftStorageKey: string
}

export const AE_INVOICE_CONFIG: InvoiceCountryConfig = {
  country: 'ae',
  currency: { code: 'AED', labelAr: 'درهم', labelEn: 'AED' },
  vatCategories: [
    { id: 'standard', ratePercent: 5 },
    { id: 'zero', ratePercent: 0 },
    { id: 'exempt', ratePercent: null },
  ],
  showZatcaQr: false,
  latinDigits: true,
  taxIdLabel: { ar: 'رقم التسجيل الضريبي (TRN)', en: 'TRN' },
  draftStorageKey: 'qaftr:ae-invoice-draft:v1',
}

/** Documented for parity; the Saudi tool still uses its own constants. */
export const SA_INVOICE_CONFIG: InvoiceCountryConfig = {
  country: 'sa',
  currency: { code: 'SAR', labelAr: 'ريال', labelEn: 'SAR' },
  vatCategories: [{ id: 'standard', ratePercent: 15 }],
  showZatcaQr: true,
  latinDigits: true,
  taxIdLabel: { ar: 'الرقم الضريبي', en: 'VAT number' },
  draftStorageKey: 'qaftr:instant-invoice-draft',
}
