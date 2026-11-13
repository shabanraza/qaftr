import type { MarketingLang, MarketingRegion } from './lang'

/** UI strings for the region picker and the geo suggestion banner. */
type RegionCopy = {
  /** Picker trigger + list label. */
  pickerLabel: string
  /** Accessible name of the picker trigger, e.g. "Region: Saudi Arabia". */
  pickerCurrent: (region: MarketingRegion) => string
  regions: Record<
    MarketingRegion,
    { name: string; currency: string; label: string }
  >
  banner: {
    /** Banner landmark name. */
    label: string
    message: (target: MarketingRegion) => string
    go: (target: MarketingRegion) => string
    stay: (current: MarketingRegion) => string
  }
  /** Slim per-region deadline strip (spec item 12). */
  deadline: {
    label: string
    dismiss: string
    regions: Record<MarketingRegion, { message: string; link: string }>
  }
}

const AR: RegionCopy = {
  pickerLabel: 'الدولة',
  pickerCurrent: (region) => `الدولة: ${AR.regions[region].name}`,
  regions: {
    sa: { name: 'السعودية', currency: 'ر.س', label: 'السعودية · ر.س' },
    ae: { name: 'الإمارات', currency: 'د.إ', label: 'الإمارات · د.إ' },
  },
  banner: {
    label: 'اقتراح الدولة',
    message: (target) =>
      target === 'ae'
        ? 'يبدو أنك في الإمارات — اعرض قافتر للإمارات'
        : 'يبدو أنك في السعودية — اعرض قافتر للسعودية',
    go: (target) => (target === 'ae' ? 'انتقل لصفحة الإمارات' : 'انتقل لصفحة السعودية'),
    stay: (current) => (current === 'sa' ? 'البقاء في صفحة السعودية' : 'البقاء في صفحة الإمارات'),
  },
  deadline: {
    label: 'موعد قادم',
    dismiss: 'إخفاء',
    regions: {
      sa: {
        message: 'الموجة ٢٥ من مرحلة الربط والتكامل: آخر موعد للربط مع بوابة فاتورة ١ فبراير ٢٠٢٧.',
        link: 'هل منشأتك ضمن الموجة ٢٥؟',
      },
      ae: {
        message:
          'الفوترة الإلكترونية في الإمارات إلزامية من 1 يناير 2027 للشركات التي تبلغ إيراداتها 50 مليون درهم فأكثر، ومن 1 يوليو 2027 لباقي الشركات.',
        link: 'اعرف موعد شركتك',
      },
    },
  },
}

const EN: RegionCopy = {
  pickerLabel: 'Country',
  pickerCurrent: (region) => `Country: ${EN.regions[region].name}`,
  regions: {
    sa: { name: 'Saudi Arabia', currency: 'SAR', label: 'Saudi Arabia · SAR' },
    ae: { name: 'UAE', currency: 'AED', label: 'UAE · AED' },
  },
  banner: {
    label: 'Country suggestion',
    message: (target) =>
      target === 'ae'
        ? 'Looks like you’re in the UAE — view Qaftr for the UAE'
        : 'Looks like you’re in Saudi Arabia — view Qaftr for Saudi Arabia',
    go: (target) => (target === 'ae' ? 'Go to UAE page' : 'Go to Saudi page'),
    stay: (current) => (current === 'sa' ? 'Stay on Saudi page' : 'Stay on UAE page'),
  },
  deadline: {
    label: 'Upcoming deadline',
    dismiss: 'Dismiss',
    regions: {
      sa: {
        message: 'ZATCA Wave 25 (Phase 2, integration): connect to the FATOORA portal by 1 February 2027.',
        link: 'Is your business in Wave 25?',
      },
      ae: {
        message:
          'UAE e-invoicing is mandatory from 1 January 2027 for businesses with revenue of AED 50M or more, and from 1 July 2027 for others.',
        link: 'Check your date',
      },
    },
  },
}

export function getRegionCopy(lang: MarketingLang): RegionCopy {
  return lang === 'en' ? EN : AR
}
