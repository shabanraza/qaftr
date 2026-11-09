import { describe, expect, it } from "bun:test";
import { amountInArabicWords, amountInEnglishWords } from "./amount-in-words";

describe("amountInArabicWords (SAR)", () => {
  const sar = (v: number | string) => amountInArabicWords(v, "SAR");

  it.each([
    [1200, "فقط ألف ومئتان ريال سعودي لا غير"],
    [1, "فقط ريال سعودي واحد لا غير"],
    [2, "فقط ريالان سعوديان لا غير"],
    [3, "فقط ثلاثة ريالات سعودية لا غير"],
    [10, "فقط عشرة ريالات سعودية لا غير"],
    [11, "فقط أحد عشر ريالاً سعودياً لا غير"],
    [12, "فقط اثنا عشر ريالاً سعودياً لا غير"],
    [15, "فقط خمسة عشر ريالاً سعودياً لا غير"],
    [21, "فقط واحد وعشرون ريالاً سعودياً لا غير"],
    [99, "فقط تسعة وتسعون ريالاً سعودياً لا غير"],
    [100, "فقط مئة ريال سعودي لا غير"],
    [103, "فقط مئة وثلاثة ريالات سعودية لا غير"],
    [200, "فقط مئتان ريال سعودي لا غير"],
    [350, "فقط ثلاثمئة وخمسون ريالاً سعودياً لا غير"],
    [1000, "فقط ألف ريال سعودي لا غير"],
    [2000, "فقط ألفان ريال سعودي لا غير"],
    [3000, "فقط ثلاثة آلاف ريال سعودي لا غير"],
    [11000, "فقط أحد عشر ألف ريال سعودي لا غير"],
    [11500, "فقط أحد عشر ألفاً وخمسمئة ريال سعودي لا غير"],
    [25000, "فقط خمسة وعشرون ألف ريال سعودي لا غير"],
    [200000, "فقط مئتا ألف ريال سعودي لا غير"],
    [103000, "فقط مئة وثلاثة آلاف ريال سعودي لا غير"],
    [1000000, "فقط مليون ريال سعودي لا غير"],
    [2000000, "فقط مليونان ريال سعودي لا غير"],
    [5000000, "فقط خمسة ملايين ريال سعودي لا غير"],
    [1000000000, "فقط مليار ريال سعودي لا غير"],
    [
      1234567,
      "فقط مليون ومئتان وأربعة وثلاثون ألفاً وخمسمئة وسبعة وستون ريالاً سعودياً لا غير",
    ],
    [0, "فقط صفر ريال سعودي لا غير"],
  ])("%p → %s", (value, words) => {
    expect(sar(value)).toBe(words);
  });

  it("adds halalas with feminine agreement", () => {
    expect(sar(1250.5)).toBe("فقط ألف ومئتان وخمسون ريالاً سعودياً وخمسون هللة لا غير");
    expect(sar("10.01")).toBe("فقط عشرة ريالات سعودية وهللة واحدة لا غير");
    expect(sar("10.02")).toBe("فقط عشرة ريالات سعودية وهللتان لا غير");
    expect(sar("1.03")).toBe("فقط ريال سعودي واحد وثلاث هللات لا غير");
    expect(sar("1.11")).toBe("فقط ريال سعودي واحد وإحدى عشرة هللة لا غير");
    expect(sar("1.12")).toBe("فقط ريال سعودي واحد واثنتا عشرة هللة لا غير");
    expect(sar("1.18")).toBe("فقط ريال سعودي واحد وثماني عشرة هللة لا غير");
    expect(sar("1.21")).toBe("فقط ريال سعودي واحد وإحدى وعشرون هللة لا غير");
    expect(sar("1.28")).toBe("فقط ريال سعودي واحد وثمان وعشرون هللة لا غير");
    expect(sar("0.75")).toBe("فقط خمس وسبعون هللة لا غير");
  });

  it("parses Arabic-Indic digits and grouping, rounds to halalas", () => {
    expect(sar("١٬٢٠٠")).toBe("فقط ألف ومئتان ريال سعودي لا غير");
    expect(sar("2.999")).toBe("فقط ثلاثة ريالات سعودية لا غير");
  });

  it("returns null for invalid, negative or out-of-range amounts", () => {
    expect(sar("abc")).toBeNull();
    expect(sar("")).toBeNull();
    expect(sar(-5)).toBeNull();
    expect(sar(1e12)).toBeNull();
  });

  it("can omit the فقط … لا غير wrapper", () => {
    expect(amountInArabicWords(3, "SAR", { wrap: false })).toBe("ثلاثة ريالات سعودية");
  });
});

describe("amountInArabicWords (AED)", () => {
  const aed = (v: number | string) => amountInArabicWords(v, "AED");
  it("uses dirham (masc.) and fils (masc.) forms", () => {
    expect(aed(1)).toBe("فقط درهم إماراتي واحد لا غير");
    expect(aed(2)).toBe("فقط درهمان إماراتيان لا غير");
    expect(aed(5)).toBe("فقط خمسة دراهم إماراتية لا غير");
    expect(aed(40)).toBe("فقط أربعون درهماً إماراتياً لا غير");
    expect(aed(1000)).toBe("فقط ألف درهم إماراتي لا غير");
    expect(aed("3.01")).toBe("فقط ثلاثة دراهم إماراتية وفلس واحد لا غير");
    expect(aed("3.02")).toBe("فقط ثلاثة دراهم إماراتية وفلسان لا غير");
    expect(aed("3.05")).toBe("فقط ثلاثة دراهم إماراتية وخمسة فلوس لا غير");
    expect(aed("3.25")).toBe("فقط ثلاثة دراهم إماراتية وخمسة وعشرون فلساً لا غير");
  });
});

describe("amountInEnglishWords", () => {
  it.each([
    [1200, "SAR", "One thousand two hundred Saudi riyals only"],
    [1, "SAR", "One Saudi riyal only"],
    [0, "SAR", "Zero Saudi riyals only"],
    [21, "SAR", "Twenty-one Saudi riyals only"],
    [1250.5, "SAR", "One thousand two hundred fifty Saudi riyals and fifty halalas only"],
    ["0.01", "SAR", "One halala only"],
    [1234567.89, "SAR", "One million two hundred thirty-four thousand five hundred sixty-seven Saudi riyals and eighty-nine halalas only"],
    [2000000000, "SAR", "Two billion Saudi riyals only"],
    [1, "AED", "One UAE dirham only"],
    ["15.01", "AED", "Fifteen UAE dirhams and one fils only"],
    ["15.25", "AED", "Fifteen UAE dirhams and twenty-five fils only"],
  ] as const)("%p %s → %s", (value, currency, words) => {
    expect(amountInEnglishWords(value, currency)).toBe(words);
  });

  it("returns null for invalid input", () => {
    expect(amountInEnglishWords("x", "SAR")).toBeNull();
    expect(amountInEnglishWords(-1, "SAR")).toBeNull();
  });
});
