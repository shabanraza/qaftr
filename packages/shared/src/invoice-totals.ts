/** Saudi standard VAT rate applied to invoice line items. */
export const VAT_RATE = 0.15;

export interface LineItemForTotals {
  description: string;
  qty: string;
  unitPrice: string;
  sortOrder?: number;
}

export interface ComputedLineItem extends LineItemForTotals {
  lineTotal: string;
  sortOrder: number;
}

export interface ComputedInvoiceTotals {
  subtotal: string;
  vatAmount: string;
  total: string;
  lineItems: ComputedLineItem[];
}

function roundMoney(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function roundQty(value: number): string {
  return (Math.round(value * 1000) / 1000).toFixed(3);
}

export function computeInvoiceTotals(items: LineItemForTotals[]): ComputedInvoiceTotals {
  let subtotal = 0;
  const lineItems = items.map((item, index) => {
    const qty = parseFloat(item.qty) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const lineTotal = Math.round(qty * unitPrice * 100) / 100;
    subtotal += lineTotal;

    return {
      description: item.description,
      qty: roundQty(qty),
      unitPrice: roundMoney(unitPrice),
      lineTotal: roundMoney(lineTotal),
      sortOrder: item.sortOrder ?? index,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  return {
    subtotal: roundMoney(subtotal),
    vatAmount: roundMoney(vatAmount),
    total: roundMoney(total),
    lineItems,
  };
}

export function totalsMatch(
  computed: Pick<ComputedInvoiceTotals, "subtotal" | "vatAmount" | "total">,
  submitted: { subtotal: string; vatAmount: string; total: string },
): boolean {
  return (
    computed.subtotal === submitted.subtotal &&
    computed.vatAmount === submitted.vatAmount &&
    computed.total === submitted.total
  );
}
