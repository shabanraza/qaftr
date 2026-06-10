import { VAT_RATE } from "./invoice-totals";

export type VatCalculationMode = "exclusive" | "inclusive";

export interface VatCalculationResult {
  mode: VatCalculationMode;
  inputAmount: string;
  subtotal: string;
  vatAmount: string;
  total: string;
}

function roundMoney(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function calculateVat(
  amount: number,
  mode: VatCalculationMode,
): VatCalculationResult | null {
  if (!Number.isFinite(amount) || amount < 0) return null;

  if (mode === "exclusive") {
    const subtotal = Math.round(amount * 100) / 100;
    const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;
    return {
      mode,
      inputAmount: roundMoney(amount),
      subtotal: roundMoney(subtotal),
      vatAmount: roundMoney(vatAmount),
      total: roundMoney(total),
    };
  }

  const total = Math.round(amount * 100) / 100;
  const subtotal = Math.round((total / (1 + VAT_RATE)) * 100) / 100;
  const vatAmount = Math.round((total - subtotal) * 100) / 100;
  return {
    mode,
    inputAmount: roundMoney(amount),
    subtotal: roundMoney(subtotal),
    vatAmount: roundMoney(vatAmount),
    total: roundMoney(total),
  };
}
