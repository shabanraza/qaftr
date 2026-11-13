import { parseLocaleDecimal } from "./numbers";

/**
 * Amount in words ("tafqeet") for receipts and other documents.
 *
 * Arabic follows the usual Gulf business convention «فقط … لا غير»:
 * - numbers 3–10 take the opposite gender of the counted noun
 *   (ثلاثة ريالات / ثلاث هللات), 11–99 take a singular accusative noun
 *   (خمسة عشر ريالاً / خمس عشرة هللة), round hundreds/thousands a singular
 *   genitive noun (مئة ريال), 1 and 2 use the noun itself (ريال واحد / ريالان);
 * - scale words (ألف/مليون/مليار) agree the same way (ثلاثة آلاف، أحد عشر ألفاً)
 *   and «مئتا» is used in construct before a scale word (مئتا ألف);
 * - the currency noun after a compound like «ألف ومئتان» stays in the common
 *   business form (ألف ومئتان ريال), not the strict construct (ومئتا ريال).
 * Riyal/dirham/fils are masculine; halala is feminine.
 */
export type WordsCurrency = "SAR" | "AED";

/** Largest whole amount supported (just under one trillion). */
const MAX_WHOLE = 999_999_999_999;

type Gender = "m" | "f";

type NounForms = {
  gender: Gender;
  /** after 1: "ريال سعودي واحد" */
  one: string;
  /** dual: "ريالان سعوديان" */
  two: string;
  /** 3–10: "ريالات سعودية" */
  plural: string;
  /** 11–99: "ريالاً سعودياً" */
  accusative: string;
  /** round numbers (100, 1000, …): "ريال سعودي" */
  genitive: string;
};

const AR_CURRENCY: Record<WordsCurrency, { main: NounForms; sub: NounForms }> = {
  SAR: {
    main: {
      gender: "m",
      one: "ريال سعودي واحد",
      two: "ريالان سعوديان",
      plural: "ريالات سعودية",
      accusative: "ريالاً سعودياً",
      genitive: "ريال سعودي",
    },
    sub: {
      gender: "f",
      one: "هللة واحدة",
      two: "هللتان",
      plural: "هللات",
      accusative: "هللة",
      genitive: "هللة",
    },
  },
  AED: {
    main: {
      gender: "m",
      one: "درهم إماراتي واحد",
      two: "درهمان إماراتيان",
      plural: "دراهم إماراتية",
      accusative: "درهماً إماراتياً",
      genitive: "درهم إماراتي",
    },
    sub: {
      gender: "m",
      one: "فلس واحد",
      two: "فلسان",
      plural: "فلوس",
      accusative: "فلساً",
      genitive: "فلس",
    },
  },
};

type Scale = { one: string; two: string; plural: string; accusative: string };

const AR_SCALES: Array<{ value: number; forms: Scale }> = [
  { value: 1e9, forms: { one: "مليار", two: "ملياران", plural: "مليارات", accusative: "ملياراً" } },
  { value: 1e6, forms: { one: "مليون", two: "مليونان", plural: "ملايين", accusative: "مليوناً" } },
  { value: 1e3, forms: { one: "ألف", two: "ألفان", plural: "آلاف", accusative: "ألفاً" } },
];

/** Units for a masculine counted noun (3–10 take tā' marbūṭa). */
const ONES_M = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];
/** Units for a feminine counted noun. */
const ONES_F = ["", "واحدة", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثماني", "تسع", "عشر"];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];

/** 1–99 agreeing with a counted noun of the given gender. */
function arabicBelow100(n: number, gender: Gender): string {
  if (n <= 10) return (gender === "m" ? ONES_M : ONES_F)[n];
  if (n === 11) return gender === "m" ? "أحد عشر" : "إحدى عشرة";
  if (n === 12) return gender === "m" ? "اثنا عشر" : "اثنتا عشرة";
  if (n < 20) {
    const unit = n - 10;
    return gender === "m" ? `${ONES_M[unit]} عشر` : `${ONES_F[unit]} عشرة`;
  }
  const unit = n % 10;
  const tens = TENS[Math.floor(n / 10)];
  if (unit === 0) return tens;
  let unitWord: string;
  if (unit === 1) unitWord = gender === "m" ? "واحد" : "إحدى";
  else if (unit === 2) unitWord = gender === "m" ? "اثنان" : "اثنتان";
  else if (unit === 8 && gender === "f") unitWord = "ثمان";
  else unitWord = (gender === "m" ? ONES_M : ONES_F)[unit];
  return `${unitWord} و${tens}`;
}

/** 1–999. `construct`: «مئتا» instead of «مئتان» (directly before a scale word). */
function arabicBelow1000(n: number, gender: Gender, construct = false): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(h === 2 && construct && rest === 0 ? "مئتا" : HUNDREDS[h]);
  if (rest) parts.push(arabicBelow100(rest, gender));
  return parts.join(" و");
}

/** "3 thousand" etc. `followed`: lower non-zero groups come after this one. */
function arabicScaleGroup(k: number, forms: Scale, followed: boolean): string {
  if (k === 1) return forms.one;
  if (k === 2) return forms.two;
  const rest = k % 100;
  if (rest >= 3 && rest <= 10) return `${arabicBelow1000(k, "m")} ${forms.plural}`;
  if (rest >= 11) return `${arabicBelow1000(k, "m")} ${followed ? forms.accusative : forms.one}`;
  return `${arabicBelow1000(k, "m", true)} ${forms.one}`;
}

/** Whole number (1 … MAX_WHOLE) as words, counted noun of `gender` for the last group. */
function arabicNumber(n: number, gender: Gender): string {
  const parts: string[] = [];
  let remaining = n;
  for (const { value, forms } of AR_SCALES) {
    const k = Math.floor(remaining / value);
    remaining %= value;
    if (k) parts.push(arabicScaleGroup(k, forms, remaining > 0));
  }
  if (remaining) parts.push(arabicBelow1000(remaining, gender));
  return parts.join(" و");
}

/** Number + counted noun with the right agreement ("ثلاثة ريالات سعودية"). */
function arabicCounted(n: number, noun: NounForms): string {
  if (n === 1) return noun.one;
  if (n === 2) return noun.two;
  const rest = n % 100;
  const words = arabicNumber(n, noun.gender);
  if (rest >= 3 && rest <= 10) return `${words} ${noun.plural}`;
  if (rest >= 11) return `${words} ${noun.accusative}`;
  return `${words} ${noun.genitive}`;
}

/** Splits an amount into whole units and hundredths, or null when unusable. */
function splitAmount(amount: number | string): { whole: number; cents: number } | null {
  const value = typeof amount === "number" ? amount : parseLocaleDecimal(amount.trim());
  if (!Number.isFinite(value) || value < 0) return null;
  const totalCents = Math.round(value * 100);
  const whole = Math.floor(totalCents / 100);
  if (whole > MAX_WHOLE) return null;
  return { whole, cents: totalCents % 100 };
}

/**
 * «فقط ألف ومئتان ريال سعودي لا غير». Accepts Latin or Arabic-Indic digits;
 * rounds to two decimals. Returns null for invalid, negative or ≥ 1 trillion.
 */
export function amountInArabicWords(
  amount: number | string,
  currency: WordsCurrency,
  options: { wrap?: boolean } = {},
): string | null {
  const parts = splitAmount(amount);
  if (!parts) return null;
  const { main, sub } = AR_CURRENCY[currency];
  let text: string;
  if (parts.whole === 0 && parts.cents > 0) {
    text = arabicCounted(parts.cents, sub);
  } else {
    text = parts.whole === 0 ? `صفر ${main.genitive}` : arabicCounted(parts.whole, main);
    if (parts.cents > 0) text += ` و${arabicCounted(parts.cents, sub)}`;
  }
  return options.wrap === false ? text : `فقط ${text} لا غير`;
}

const EN_ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const EN_SCALES: Array<[number, string]> = [
  [1e9, "billion"],
  [1e6, "million"],
  [1e3, "thousand"],
];

function englishBelow1000(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(`${EN_ONES[h]} hundred`);
  if (rest >= 20) {
    const unit = rest % 10;
    parts.push(unit ? `${EN_TENS[Math.floor(rest / 10)]}-${EN_ONES[unit]}` : EN_TENS[Math.floor(rest / 10)]);
  } else if (rest) {
    parts.push(EN_ONES[rest]);
  }
  return parts.join(" ");
}

function englishNumber(n: number): string {
  if (n === 0) return "zero";
  const parts: string[] = [];
  let remaining = n;
  for (const [value, word] of EN_SCALES) {
    const k = Math.floor(remaining / value);
    remaining %= value;
    if (k) parts.push(`${englishBelow1000(k)} ${word}`);
  }
  if (remaining) parts.push(englishBelow1000(remaining));
  return parts.join(" ");
}

const EN_CURRENCY: Record<WordsCurrency, { one: string; many: string; subOne: string; subMany: string }> = {
  SAR: { one: "Saudi riyal", many: "Saudi riyals", subOne: "halala", subMany: "halalas" },
  AED: { one: "UAE dirham", many: "UAE dirhams", subOne: "fils", subMany: "fils" },
};

/** "One thousand two hundred Saudi riyals and fifty halalas only". */
export function amountInEnglishWords(amount: number | string, currency: WordsCurrency): string | null {
  const parts = splitAmount(amount);
  if (!parts) return null;
  const c = EN_CURRENCY[currency];
  const mainText = `${englishNumber(parts.whole)} ${parts.whole === 1 ? c.one : c.many}`;
  const subText = parts.cents
    ? `${englishNumber(parts.cents)} ${parts.cents === 1 ? c.subOne : c.subMany}`
    : "";
  const text =
    parts.whole === 0 && parts.cents > 0
      ? subText
      : subText
        ? `${mainText} and ${subText}`
        : mainText;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} only`;
}
