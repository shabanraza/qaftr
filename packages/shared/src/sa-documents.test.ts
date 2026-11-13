import { describe, expect, it } from "bun:test";
import {
  CREDIT_NOTE_REASONS,
  computeSaudiDocumentTotals,
  quotationToInstantInvoiceDraft,
  validateCreditNote,
  validateQuotation,
  validateReceiptVoucher,
} from "./sa-documents";
import type { CreditNoteInput, QuotationInput, ReceiptVoucherInput } from "./sa-documents";

const VALID_VAT = "300000000000003";

const codes = (issues: { code: string; line?: number }[]) =>
  issues.map((i) => (i.line === undefined ? i.code : `${i.code}@${i.line}`));

function receipt(patch: Partial<ReceiptVoucherInput> = {}): ReceiptVoucherInput {
  return {
    number: "RV-0001",
    date: "2026-11-09",
    receivedFrom: "شركة الأفق",
    amount: "1200",
    paymentMethod: "cash",
    chequeNumber: "",
    bankName: "",
    purpose: "دفعة مقدمة",
    ...patch,
  };
}

describe("validateReceiptVoucher", () => {
  it("accepts a complete cash receipt", () => {
    expect(validateReceiptVoucher(receipt())).toEqual({ valid: true, issues: [] });
  });

  it("requires number, date, payer, purpose and a positive amount", () => {
    const r = validateReceiptVoucher(
      receipt({ number: " ", date: "", receivedFrom: "", purpose: "", amount: "0" }),
    );
    expect(codes(r.issues)).toEqual([
      "NUMBER_REQUIRED",
      "DATE_REQUIRED",
      "RECEIVED_FROM_REQUIRED",
      "AMOUNT_INVALID",
      "PURPOSE_REQUIRED",
    ]);
  });

  it("rejects malformed and huge amounts, accepts Arabic-Indic digits", () => {
    expect(codes(validateReceiptVoucher(receipt({ amount: "12a" })).issues)).toEqual(["AMOUNT_INVALID"]);
    expect(codes(validateReceiptVoucher(receipt({ amount: "1000000000000" })).issues)).toEqual([
      "AMOUNT_TOO_LARGE",
    ]);
    expect(validateReceiptVoucher(receipt({ amount: "١٬٢٠٠٫٥٠" })).valid).toBe(true);
  });

  it("requires cheque number and bank for a cheque only", () => {
    expect(codes(validateReceiptVoucher(receipt({ paymentMethod: "cheque" })).issues)).toEqual([
      "CHEQUE_NUMBER_REQUIRED",
      "BANK_REQUIRED",
    ]);
    expect(
      validateReceiptVoucher(receipt({ paymentMethod: "cheque", chequeNumber: "000123", bankName: "الراجحي" })).valid,
    ).toBe(true);
    expect(validateReceiptVoucher(receipt({ paymentMethod: "bank_transfer" })).valid).toBe(true);
    expect(validateReceiptVoucher(receipt({ paymentMethod: "card" })).valid).toBe(true);
  });
});

describe("computeSaudiDocumentTotals", () => {
  it("applies 15% VAT on complete lines and skips empty ones", () => {
    const totals = computeSaudiDocumentTotals([
      { description: "تصميم", qty: "2", unitPrice: "500" },
      { description: "", qty: "1", unitPrice: "" },
      { description: "استضافة", qty: "١", unitPrice: "٢٠٠" },
    ]);
    expect(totals.subtotal).toBe("1200.00");
    expect(totals.vatAmount).toBe("180.00");
    expect(totals.total).toBe("1380.00");
    expect(totals.lineItems).toHaveLength(2);
  });
});

function quote(patch: Partial<QuotationInput> = {}): QuotationInput {
  return {
    number: "Q-0001",
    date: "2026-11-09",
    validUntil: "2026-11-30",
    seller: { name: "مؤسسة قافتر", address: "الرياض", vatNumber: "" },
    buyer: { name: "شركة الأفق", address: "", vatNumber: "" },
    lines: [{ description: "تصميم", qty: "1", unitPrice: "1000" }],
    terms: "",
    ...patch,
  };
}

describe("validateQuotation", () => {
  it("accepts a minimal quotation (VAT numbers optional)", () => {
    expect(validateQuotation(quote())).toEqual({ valid: true, issues: [] });
  });

  it("flags missing parties, dates, lines and an expired validity", () => {
    const r = validateQuotation(
      quote({
        number: "",
        validUntil: "2026-11-01",
        seller: { name: "", address: "", vatNumber: "123" },
        buyer: { name: "", address: "", vatNumber: "" },
        lines: [{ description: "", qty: "1", unitPrice: "" }],
      }),
    );
    expect(codes(r.issues)).toEqual([
      "NUMBER_REQUIRED",
      "VALID_UNTIL_BEFORE_DATE",
      "SELLER_NAME_REQUIRED",
      "SELLER_VAT_INVALID",
      "BUYER_NAME_REQUIRED",
      "LINES_REQUIRED",
    ]);
  });

  it("reports incomplete lines by index", () => {
    const r = validateQuotation(
      quote({
        lines: [
          { description: "تصميم", qty: "1", unitPrice: "1000" },
          { description: "", qty: "1", unitPrice: "50" },
          { description: "صيانة", qty: "0", unitPrice: "50" },
        ],
      }),
    );
    expect(codes(r.issues)).toEqual(["LINE_DESCRIPTION_REQUIRED@1", "LINE_QTY_INVALID@2"]);
  });
});

function creditNote(patch: Partial<CreditNoteInput> = {}): CreditNoteInput {
  return {
    number: "CN-0001",
    date: "2026-11-09",
    originalInvoiceNumber: "INV-0042",
    originalInvoiceDate: "2026-10-20",
    reason: "return",
    reasonDetail: "",
    seller: { name: "مؤسسة قافتر", address: "الرياض", vatNumber: VALID_VAT },
    buyer: { name: "شركة الأفق", address: "جدة", vatNumber: "" },
    lines: [{ description: "مرتجع", qty: "1", unitPrice: "100" }],
    ...patch,
  };
}

describe("validateCreditNote", () => {
  it("offers the Article 40(1) cases plus other", () => {
    expect(CREDIT_NOTE_REASONS).toEqual([
      "cancellation",
      "supply_change",
      "price_change",
      "return",
      "info_error",
      "other",
    ]);
  });

  it("accepts a complete credit note", () => {
    expect(validateCreditNote(creditNote())).toEqual({ valid: true, issues: [] });
  });

  it("requires the original invoice reference, reason and seller VAT number", () => {
    const r = validateCreditNote(
      creditNote({
        originalInvoiceNumber: "",
        originalInvoiceDate: "",
        reason: "",
        seller: { name: "مؤسسة قافتر", address: "الرياض", vatNumber: "" },
      }),
    );
    expect(codes(r.issues)).toEqual([
      "ORIGINAL_INVOICE_NUMBER_REQUIRED",
      "ORIGINAL_INVOICE_DATE_REQUIRED",
      "REASON_REQUIRED",
      "SELLER_VAT_REQUIRED",
    ]);
  });

  it("rejects an original invoice dated after the note, an invalid VAT number and other without detail", () => {
    const r = validateCreditNote(
      creditNote({
        originalInvoiceDate: "2026-12-01",
        reason: "other",
        seller: { name: "x", address: "y", vatNumber: "300000000000001" },
        buyer: { name: "b", address: "", vatNumber: "12" },
      }),
    );
    expect(codes(r.issues)).toEqual([
      "ORIGINAL_DATE_AFTER_NOTE",
      "REASON_DETAIL_REQUIRED",
      "SELLER_VAT_INVALID",
      "BUYER_VAT_INVALID",
    ]);
  });
});

describe("quotationToInstantInvoiceDraft", () => {
  it("maps a quotation onto the Saudi invoice tool draft", () => {
    const draft = quotationToInstantInvoiceDraft(
      quote({
        seller: { name: "مؤسسة قافتر", address: "الرياض", vatNumber: VALID_VAT },
        lines: [
          { description: "تصميم", qty: "2", unitPrice: "500" },
          { description: "", qty: "1", unitPrice: "" },
        ],
        terms: "الدفع خلال ٣٠ يوماً",
      }),
    );
    expect(draft.invoiceType).toBe("simplified");
    expect(draft.sellerName).toBe("مؤسسة قافتر");
    expect(draft.sellerVat).toBe(VALID_VAT);
    expect(draft.sellerAddress).toBe("الرياض");
    expect(draft.clientName).toBe("شركة الأفق");
    expect(draft.notes).toBe("");
    expect(draft.lineItems).toHaveLength(1);
    expect(draft.lineItems[0]).toMatchObject({ description: "تصميم", qty: "2", unitPrice: "500" });
    expect(typeof draft.lineItems[0].id).toBe("string");
  });

  it("chooses a standard tax invoice when the buyer has a VAT number", () => {
    const draft = quotationToInstantInvoiceDraft(
      quote({ buyer: { name: "شركة الأفق", address: "جدة", vatNumber: VALID_VAT } }),
    );
    expect(draft.invoiceType).toBe("standard");
    expect(draft.clientVat).toBe(VALID_VAT);
    expect(draft.clientAddress).toBe("جدة");
  });
});
