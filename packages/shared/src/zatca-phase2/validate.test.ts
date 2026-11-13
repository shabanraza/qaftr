import { describe, expect, it } from "bun:test";
import { BUYER, simplifiedInvoice, standardInvoice } from "./fixtures";
import { validateZatcaInvoice } from "./validate";

const NOW = new Date("2026-11-09T20:00:00Z");
const codes = (r: ReturnType<typeof validateZatcaInvoice>) => r.issues.map((i) => i.code);

describe("validateZatcaInvoice", () => {
  it("accepts valid simplified and standard invoices", () => {
    expect(validateZatcaInvoice(simplifiedInvoice(), { now: NOW })).toEqual({ ok: true, issues: [] });
    expect(validateZatcaInvoice(standardInvoice(), { now: NOW })).toEqual({ ok: true, issues: [] });
  });

  it("returns localisable codes with the BR-KSA rule and field path", () => {
    const r = validateZatcaInvoice(simplifiedInvoice({ uuid: "nope" }), { now: NOW });
    expect(r.ok).toBe(false);
    expect(r.issues).toEqual([{ code: "UUID_INVALID", rule: "BR-KSA-03", path: "uuid" }]);
  });

  it("checks header fields (date not in future, time format, ICV, PIH, number)", () => {
    const r = validateZatcaInvoice(
      simplifiedInvoice({ issueDate: "2026-11-11", issueTime: "25:00", icv: 0, pih: "abc", id: " " }),
      { now: NOW },
    );
    expect(codes(r)).toEqual(
      expect.arrayContaining([
        "ISSUE_DATE_IN_FUTURE",
        "ISSUE_TIME_INVALID",
        "ICV_INVALID",
        "PIH_INVALID",
        "INVOICE_NUMBER_REQUIRED",
      ]),
    );
  });

  it("checks seller VAT (15 digits, starts and ends with 3), ID and address formats", () => {
    const r = validateZatcaInvoice(
      simplifiedInvoice({
        seller: {
          registrationName: "",
          vatNumber: "123456789012345",
          otherId: { scheme: "XYZ" as never, value: "1" },
          address: { street: "", buildingNumber: "12", district: "", city: "", postalCode: "123", country: "SA" },
        },
      }),
      { now: NOW },
    );
    expect(r.issues).toEqual(
      expect.arrayContaining([
        { code: "SELLER_NAME_REQUIRED", rule: "BR-06", path: "seller.registrationName" },
        { code: "SELLER_VAT_INVALID", rule: "BR-KSA-39", path: "seller.vatNumber" },
        { code: "SELLER_ID_SCHEME_INVALID", rule: "BR-KSA-08", path: "seller.otherId.scheme" },
        { code: "ADDRESS_STREET_REQUIRED", rule: "BR-KSA-09", path: "seller.address.street" },
        { code: "ADDRESS_BUILDING_NUMBER_INVALID", rule: "BR-KSA-37", path: "seller.address.buildingNumber" },
        { code: "ADDRESS_DISTRICT_REQUIRED", rule: "BR-KSA-09", path: "seller.address.district" },
        { code: "ADDRESS_CITY_REQUIRED", rule: "BR-KSA-09", path: "seller.address.city" },
        { code: "ADDRESS_POSTAL_CODE_INVALID", rule: "BR-KSA-66", path: "seller.address.postalCode" },
      ]),
    );
  });

  it("requires buyer name, Saudi address and an identifier on standard invoices", () => {
    const r = validateZatcaInvoice(
      standardInvoice({
        buyer: { registrationName: "", address: { ...BUYER.address, buildingNumber: "", postalCode: "" } },
      }),
      { now: NOW },
    );
    expect(codes(r)).toEqual(
      expect.arrayContaining([
        "BUYER_NAME_REQUIRED",
        "BUYER_ID_REQUIRED",
        "ADDRESS_BUILDING_NUMBER_INVALID",
        "ADDRESS_POSTAL_CODE_INVALID",
      ]),
    );
    expect(codes(validateZatcaInvoice(standardInvoice({ buyer: undefined }), { now: NOW }))).toContain(
      "BUYER_REQUIRED",
    );
  });

  it("validates buyer VAT format when given and requires supply date on standard tax invoices", () => {
    const r = validateZatcaInvoice(
      standardInvoice({ buyer: { ...BUYER, vatNumber: "300" }, supplyDate: undefined }),
      { now: NOW },
    );
    expect(r.issues).toEqual(
      expect.arrayContaining([
        { code: "BUYER_VAT_INVALID", rule: "BR-KSA-44", path: "buyer.vatNumber" },
        { code: "SUPPLY_DATE_REQUIRED", rule: "BR-KSA-15", path: "supplyDate" },
      ]),
    );
  });

  it("requires billing reference and reason on credit and debit notes", () => {
    for (const kind of ["credit-note", "debit-note"] as const) {
      const r = validateZatcaInvoice(simplifiedInvoice({ kind }), { now: NOW });
      expect(r.issues).toEqual(
        expect.arrayContaining([
          { code: "BILLING_REFERENCE_REQUIRED", rule: "BR-KSA-56", path: "billingReference.invoiceId" },
          { code: "NOTE_REASON_REQUIRED", rule: "BR-KSA-17", path: "noteReason" },
        ]),
      );
      const ok = validateZatcaInvoice(
        simplifiedInvoice({ kind, billingReference: { invoiceId: "SME00009" }, noteReason: "Returned goods" }),
        { now: NOW },
      );
      expect(ok.ok).toBe(true);
    }
  });

  it("validates lines: VAT category/rate pairs and exemption reason codes", () => {
    const r = validateZatcaInvoice(
      simplifiedInvoice({
        lines: [
          { name: "", quantity: 0, unitPrice: -1, vatCategory: "S", vatRate: 10 },
          { name: "x", quantity: 1, unitPrice: 1, vatCategory: "E", vatRate: 0 },
          { name: "y", quantity: 1, unitPrice: 1, vatCategory: "Z", vatRate: 0, exemptionReasonCode: "VATEX-SA-29" },
          { name: "z", quantity: 1, unitPrice: 1, vatCategory: "S", vatRate: 15, exemptionReasonCode: "VATEX-SA-35" },
        ],
      }),
      { now: NOW },
    );
    expect(r.issues).toEqual(
      expect.arrayContaining([
        { code: "LINE_NAME_REQUIRED", rule: "BR-25", path: "lines[0].name" },
        { code: "LINE_QUANTITY_INVALID", rule: "BR-KSA-F-04", path: "lines[0].quantity" },
        { code: "LINE_PRICE_INVALID", rule: "BR-27", path: "lines[0].unitPrice" },
        { code: "LINE_VAT_RATE_INVALID", rule: "BR-KSA-CL-04", path: "lines[0].vatRate" },
        { code: "LINE_EXEMPTION_REASON_REQUIRED", rule: "BR-KSA-69", path: "lines[1].exemptionReasonCode" },
        { code: "LINE_EXEMPTION_REASON_INVALID", rule: "BR-KSA-CL-04", path: "lines[2].exemptionReasonCode" },
        { code: "LINE_EXEMPTION_REASON_NOT_ALLOWED", rule: "BR-KSA-CL-04", path: "lines[3].exemptionReasonCode" },
      ]),
    );
    expect(codes(validateZatcaInvoice(simplifiedInvoice({ lines: [] }), { now: NOW }))).toContain(
      "LINES_REQUIRED",
    );
  });

  it("requires buyer national ID for private education/healthcare zero-rating (BR-KSA-49)", () => {
    const r = validateZatcaInvoice(
      simplifiedInvoice({
        lines: [{ name: "Tuition", quantity: 1, unitPrice: 100, vatCategory: "Z", vatRate: 0, exemptionReasonCode: "VATEX-SA-EDU" }],
      }),
      { now: NOW },
    );
    expect(r.issues).toContainEqual({ code: "BUYER_NATIONAL_ID_REQUIRED", rule: "BR-KSA-49", path: "buyer.otherId" });
  });
});
