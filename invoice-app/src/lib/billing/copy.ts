import type { MarketingLang } from '#/lib/marketing/lang'
import { toArabicIndic } from '#/lib/sa/format'

/** Pro prices in SAR. Must match the Polar products and the pricing card. */
export const PRO_PRICE_SAR = { monthly: 39, yearly: 349 } as const

export function getBillingCopy(lang: MarketingLang) {
  const n = (v: number) => (lang === 'ar' ? toArabicIndic(String(v)) : String(v))
  if (lang === 'ar') {
    return {
      title: 'الخطة والفوترة',
      subtitle: 'خطتك الحالية، واستخدامك هذا الشهر، والترقية إلى برو.',
      freeName: 'الخطة المجانية',
      proName: 'برو',
      // A lone Arabic-Indic zero (٠) reads as a dot, so spell out "none yet".
      usage: (used: number, limit: number) =>
        used === 0 ? `لم تحفظ أي فاتورة هذا الشهر (الحد ${n(limit)} فواتير)` : `${n(used)} من ${n(limit)} فواتير هذا الشهر`,
      freeBody: 'تحفظ ٣ فواتير شهرياً مجاناً. برو يفتح الفواتير بلا حد.',
      proBody: 'فواتير بلا حد، وكل القوالب، وتذكيرات الدفع، ودعم ذو أولوية.',
      upgradeTitle: 'رقِّ إلى برو',
      monthly: `${n(PRO_PRICE_SAR.monthly)} ر.س / شهرياً`,
      yearly: `${n(PRO_PRICE_SAR.yearly)} ر.س / سنوياً`,
      yearlyHint: 'وفّر ٢٥٪ مع الدفع السنوي',
      opening: 'جارٍ فتح صفحة الدفع…',
      payNote:
        'الدفع آمن عبر Polar (بائع مسجّل). نقبل بطاقات Visa وMastercard وApple Pay. يمكنك الإلغاء في أي وقت، وتبقى برو فعّالة حتى نهاية الفترة المدفوعة.',
      renews: 'يتجدد أو ينتهي في',
      manage: 'إدارة الاشتراك',
      manageHint: 'غيّر البطاقة، أو نزّل الإيصالات، أو ألغِ الاشتراك.',
      storeManaged: 'اشتركت في برو عبر App Store أو Google Play، فتُدار من إعدادات المتجر في جوالك.',
      activating: 'تم الدفع. جارٍ تفعيل برو… قد يستغرق ذلك دقيقة.',
      activated: 'تم تفعيل برو. شكراً لك!',
      stillProcessing: 'ما زلنا نعالج الدفع. حدّث الصفحة بعد قليل، وإن لم تُفعَّل برو راسلنا على support@qaftr.com.',
      unavailable: 'الدفع عبر الموقع غير متاح الآن. راسلنا على support@qaftr.com للترقية.',
      errors: {
        BILLING_FAILED: 'تعذّر فتح صفحة الدفع. حاول مرة أخرى بعد قليل.',
        BILLING_UNAVAILABLE: 'الدفع عبر الموقع غير متاح الآن. راسلنا على support@qaftr.com.',
        ALREADY_PRO: 'لديك اشتراك برو فعّال بالفعل.',
      } as Record<string, string>,
      genericError: 'حدث خطأ. حاول مرة أخرى.',
      settingsLink: 'الخطة والفوترة',
      upgradeLink: 'رقِّ إلى برو',
    }
  }
  return {
    title: 'Plan & billing',
    subtitle: 'Your current plan, this month’s usage, and upgrading to Pro.',
    freeName: 'Free plan',
    proName: 'Pro',
    usage: (used: number, limit: number) => `${used} of ${limit} invoices this month`,
    freeBody: 'Save 3 invoices a month for free. Pro unlocks unlimited invoices.',
    proBody: 'Unlimited invoices, all templates, payment reminders and priority support.',
    upgradeTitle: 'Upgrade to Pro',
    monthly: `${PRO_PRICE_SAR.monthly} SAR / month`,
    yearly: `${PRO_PRICE_SAR.yearly} SAR / year`,
    yearlyHint: 'Save 25% with yearly billing',
    opening: 'Opening checkout…',
    payNote:
      'Secure payment through Polar (merchant of record). We accept Visa, Mastercard and Apple Pay. Cancel anytime; Pro stays on until the end of the paid period.',
    renews: 'Renews or ends on',
    manage: 'Manage subscription',
    manageHint: 'Change card, download receipts or cancel.',
    storeManaged: 'You subscribed to Pro through the App Store or Google Play, so it is managed in your phone’s store settings.',
    activating: 'Payment received. Activating Pro… this can take a minute.',
    activated: 'Pro is active. Thank you!',
    stillProcessing: 'We are still processing your payment. Refresh in a moment; if Pro is not on, email support@qaftr.com.',
    unavailable: 'Web checkout is not available right now. Email support@qaftr.com to upgrade.',
    errors: {
      BILLING_FAILED: 'Could not open checkout. Please try again in a moment.',
      BILLING_UNAVAILABLE: 'Web checkout is not available right now. Email support@qaftr.com.',
      ALREADY_PRO: 'You already have an active Pro subscription.',
    } as Record<string, string>,
    genericError: 'Something went wrong. Please try again.',
    settingsLink: 'Plan & billing',
    upgradeLink: 'Upgrade to Pro',
  }
}
