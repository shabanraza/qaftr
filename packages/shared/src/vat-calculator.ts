import { VAT_RATE } from "./invoice-totals";

export type VatCalculationMode = "exclusive" | "inclusive";

export interface VatCalculationResult {
  mode: VatCalculationMode;
  inputAmount: string;
  subtotal: string;
  vatAmount: string;
  total: string;
}

/** Saudi Arabia standard VAT rate (15%). */
export const SAUDI_VAT_RATE = VAT_RATE;
/** UAE standard VAT rate (5%). */
export const UAE_VAT_RATE = 0.05;
/** Largest amount accepted (1 trillion); beyond this, input is almost certainly a typo. */
export const MAX_VAT_AMOUNT = 1e12;

const BASIS_POINTS = 10_000n;

/**
 * Converts a currency amount to whole cents (halalas / fils), half up.
 * `toPrecision(15)` strips binary noise (1.005 * 100 = 100.49999…) while
 * staying exact for every amount up to MAX_VAT_AMOUNT.
 */
function toCents(value: number): bigint {
  return BigInt(Math.round(Number((value * 100).toPrecision(15))));
}

/** Integer division rounded half up (operands are non-negative). */
function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

function formatCents(cents: bigint): string {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

/**
 * Splits an amount into subtotal / VAT / total using exact integer cents,
 * so subtotal + VAT always equals the total.
 * `rate` defaults to the Saudi 15% rate; pass `UAE_VAT_RATE` for the UAE.
 * The rate is applied with basis-point precision (0.01%).
 */
export function calculateVat(
  amount: number,
  mode: VatCalculationMode,
  rate: number = SAUDI_VAT_RATE,
): VatCalculationResult | null {
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_VAT_AMOUNT) return null;
  if (!Number.isFinite(rate) || rate < 0 || rate >= 1) return null;

  const rateBp = BigInt(Math.round(rate * 10_000));
  const input = toCents(amount);
  let subtotal: bigint;
  let vat: bigint;
  let total: bigint;

  if (mode === "exclusive") {
    subtotal = input;
    vat = divRoundHalfUp(subtotal * rateBp, BASIS_POINTS);
    total = subtotal + vat;
  } else {
    total = input;
    subtotal = divRoundHalfUp(total * BASIS_POINTS, BASIS_POINTS + rateBp);
    vat = total - subtotal;
  }

  return {
    mode,
    inputAmount: formatCents(input),
    subtotal: formatCents(subtotal),
    vatAmount: formatCents(vat),
    total: formatCents(total),
  };
}
