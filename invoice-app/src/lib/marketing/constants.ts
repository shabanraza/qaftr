export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://qaftr.com'

export const SUPPORT_EMAIL = 'support@qaftr.com'

export const BRAND = {
  nameAr: 'قافتر',
  nameEn: 'Qaftr',
  green: '#0A3D2E',
  gold: '#C8973A',
  warmWhite: '#F6F6F3',
  ink: '#0E1C16',
  muted: '#3E5A4A',
  line: '#E4EBE7',
  sage: '#A8D5BC',
} as const

export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`

export const GOOGLE_SITE_VERIFICATION =
  (import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined) ??
  '8H1LqPyUB-MP8VyL6TYWNEwKRV_9U6zl3ebiw2Fmmtc'

export const GOOGLE_ANALYTICS_ID =
  (import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string | undefined) ??
  'G-LKFPFV4QSK'

export const BING_SITE_VERIFICATION =
  (import.meta.env.VITE_BING_SITE_VERIFICATION as string | undefined) ?? ''

export const SEO_KEYWORDS = [
  'فاتورة زاتكا',
  'فوترة إلكترونية',
  'فاتورة للمستقلين',
  'ZATCA invoice',
  'Saudi freelancer invoice',
  'QR فاتورة',
  'فاتورة ضريبية',
  'إنشاء فاتورة',
  'ZATCA Phase 1',
  'فاتورة واتساب',
  'قافتر',
  'Qaftr',
  'invoice generator Saudi Arabia',
  'free invoice generator',
  'e-invoicing Saudi Arabia',
  'VAT invoice generator Saudi Arabia',
  'VAT calculator Saudi',
  'TRN checker',
  'حاسبة ضريبة',
  'الرقم الضريبي',
] as const
