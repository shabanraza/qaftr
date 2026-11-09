import type { MarketingLang } from '#/lib/marketing/lang'

// Cookie consent banner + footer "Cookie settings" copy (needs product/legal sign-off).
const COPY = {
  ar: {
    label: 'ملفات تعريف الارتباط',
    body: 'نستخدم ملفات تعريف الارتباط التحليلية (Google Analytics) لفهم كيفية استخدام قافتر وتحسينه. لا نستخدمها للإعلانات.',
    privacy: 'سياسة الخصوصية',
    accept: 'قبول',
    reject: 'رفض',
    settings: 'إعدادات ملفات تعريف الارتباط',
  },
  en: {
    label: 'Cookies',
    body: 'We use analytics cookies (Google Analytics) to understand how Qaftr is used and improve it. We don’t use them for ads.',
    privacy: 'Privacy policy',
    accept: 'Accept',
    reject: 'Reject',
    settings: 'Cookie settings',
  },
} as const

export function getConsentCopy(lang: MarketingLang) {
  return COPY[lang]
}
