/**
 * Parses a decimal typed by a user in Latin, Arabic-Indic (٠-٩) or Persian
 * (۰-۹) digits, with the Arabic decimal (٫) and thousands (٬) separators,
 * commas or spaces as grouping: "١٬٠٠٠٫٥٠" → 1000.5. NaN for anything else.
 */
export function parseLocaleDecimal(raw: string): number {
  const ascii = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[,\s٬]/g, "")
    .replace(/٫/g, ".");
  return /^-?(\d+\.?\d*|\.\d+)$/.test(ascii) ? Number(ascii) : Number.NaN;
}
