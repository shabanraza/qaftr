import type { PartyField, PartyIssue, PartyIssueCode } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'

export interface PartyFieldCopy {
  label: string
  placeholder?: string
  hint?: string
}

export interface PartyCopy {
  fields: Record<PartyField | 'nameAr' | 'nameEn', PartyFieldCopy>
  idSchemes: Record<string, string>
  issues: Record<PartyIssueCode, string>
  optional: string
  addressTitle: string
  addressHint: string
  /** "Building number: 4 digits" */
  issueLine: (issue: PartyIssue) => string
}

const AR: Omit<PartyCopy, 'issueLine'> = {
  fields: {
    name: { label: 'الاسم' },
    nameAr: { label: 'اسم المنشأة (بالعربية)', placeholder: 'مؤسسة قافتر التجارية' },
    nameEn: { label: 'اسم المنشأة (بالإنجليزية)', placeholder: 'Qaftr Trading Est.' },
    vatNumber: { label: 'الرقم الضريبي', placeholder: '٣٠٠٠٠٠٠٠٠٠٠٠٠٠٣', hint: '١٥ رقماً تبدأ وتنتهي بـ ٣' },
    crNumber: { label: 'رقم السجل التجاري', placeholder: '١٠١٠٠١٠٠٠٠', hint: '١٠ أرقام' },
    country: { label: 'الدولة', placeholder: 'SA', hint: 'رمز من حرفين، اتركه فارغاً للسعودية' },
    idScheme: { label: 'نوع الهوية', hint: 'إذا لم يكن لدى العميل رقم ضريبي' },
    idValue: { label: 'رقم الهوية' },
    street: { label: 'الشارع', placeholder: 'طريق الملك فهد' },
    buildingNumber: { label: 'رقم المبنى', placeholder: '١٢٣٤', hint: '٤ أرقام' },
    additionalNumber: { label: 'الرقم الإضافي', placeholder: '٥٦٧٨', hint: '٤ أرقام (اختياري)' },
    district: { label: 'الحي', placeholder: 'العليا' },
    city: { label: 'المدينة', placeholder: 'الرياض' },
    postalCode: { label: 'الرمز البريدي', placeholder: '١٢٢١١', hint: '٥ أرقام' },
  },
  idSchemes: {
    CRN: 'السجل التجاري',
    MOM: 'ترخيص وزارة الشؤون البلدية',
    MLS: 'ترخيص وزارة الموارد البشرية',
    '700': 'الرقم الموحد (٧٠٠)',
    SAG: 'ترخيص وزارة الاستثمار',
    NAT: 'الهوية الوطنية',
    GCC: 'هوية خليجية',
    IQA: 'الإقامة',
    PAS: 'جواز السفر',
    OTH: 'هوية أخرى',
  },
  issues: {
    REQUIRED: 'مطلوب',
    VAT_OR_ID_REQUIRED: 'أدخل الرقم الضريبي أو رقم هوية آخر',
    INVALID_VAT: '١٥ رقماً تبدأ وتنتهي بـ ٣',
    INVALID_CR: '١٠ أرقام',
    INVALID_BUILDING: '٤ أرقام',
    INVALID_ADDITIONAL: '٤ أرقام',
    INVALID_POSTAL: '٥ أرقام',
    INVALID_SCHEME: 'اختر نوع هوية من القائمة',
    INVALID_COUNTRY: 'رمز دولة من حرفين، مثل SA',
  },
  optional: 'اختياري',
  addressTitle: 'العنوان الوطني',
  addressHint: 'كما يظهر في العنوان الوطني (سبل). تطلبه هيئة الزكاة والضريبة والجمارك في الفاتورة الإلكترونية.',
}

const EN: Omit<PartyCopy, 'issueLine'> = {
  fields: {
    name: { label: 'Name' },
    nameAr: { label: 'Business name (Arabic)', placeholder: 'مؤسسة قافتر التجارية' },
    nameEn: { label: 'Business name (English)', placeholder: 'Qaftr Trading Est.' },
    vatNumber: { label: 'VAT number', placeholder: '300000000000003', hint: '15 digits, starting and ending with 3' },
    crNumber: { label: 'Commercial registration (CR) number', placeholder: '1010010000', hint: '10 digits' },
    country: { label: 'Country', placeholder: 'SA', hint: 'Two-letter code; leave blank for Saudi Arabia' },
    idScheme: { label: 'ID type', hint: 'If the client has no VAT number' },
    idValue: { label: 'ID number' },
    street: { label: 'Street', placeholder: 'King Fahd Road' },
    buildingNumber: { label: 'Building number', placeholder: '1234', hint: '4 digits' },
    additionalNumber: { label: 'Additional number', placeholder: '5678', hint: '4 digits (optional)' },
    district: { label: 'District', placeholder: 'Al Olaya' },
    city: { label: 'City', placeholder: 'Riyadh' },
    postalCode: { label: 'Postal code', placeholder: '12211', hint: '5 digits' },
  },
  idSchemes: {
    CRN: 'Commercial registration',
    MOM: 'MOMRA licence',
    MLS: 'MHRSD licence',
    '700': 'Unified number (700)',
    SAG: 'MISA licence',
    NAT: 'National ID',
    GCC: 'GCC ID',
    IQA: 'Iqama',
    PAS: 'Passport',
    OTH: 'Other ID',
  },
  issues: {
    REQUIRED: 'Required',
    VAT_OR_ID_REQUIRED: 'Enter a VAT number or another ID',
    INVALID_VAT: '15 digits, starting and ending with 3',
    INVALID_CR: '10 digits',
    INVALID_BUILDING: '4 digits',
    INVALID_ADDITIONAL: '4 digits',
    INVALID_POSTAL: '5 digits',
    INVALID_SCHEME: 'Choose an ID type from the list',
    INVALID_COUNTRY: 'Two-letter country code, e.g. SA',
  },
  optional: 'optional',
  addressTitle: 'National address',
  addressHint: 'As shown in your Saudi National Address (SPL). ZATCA requires it on e-invoices.',
}

export function getPartyCopy(lang: MarketingLang): PartyCopy {
  const base = lang === 'ar' ? AR : EN
  return {
    ...base,
    issueLine: (issue) => {
      // The seller name column is nameAr; buyers use name.
      const label = base.fields[issue.field]?.label ?? issue.field
      return `${label}: ${base.issues[issue.code]}`
    },
  }
}
