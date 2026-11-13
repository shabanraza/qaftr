import { describe, expect, it } from "bun:test";
import { simplifiedInvoice, standardInvoice } from "./fixtures";
import { FIRST_INVOICE_PIH } from "./hash";
import { ZatcaInvoiceValidationError, buildInvoiceXml, computeZatcaTotals, invoiceTypeName } from "./ubl-builder";
import { canonicalize, findAll, findFirst, parseXml, textAt } from "./xml";

const NOW = new Date("2026-11-09T20:00:00Z");

describe("invoiceTypeName (KSA-2, NNPEXSB)", () => {
  it("encodes subtype and transaction flags", () => {
    expect(invoiceTypeName("standard")).toBe("0100000");
    expect(invoiceTypeName("simplified")).toBe("0200000");
    expect(invoiceTypeName("standard", { exports: true, selfBilled: true })).toBe("0100101");
    expect(invoiceTypeName("simplified", { thirdParty: true, nominal: true, summary: true })).toBe("0211010");
  });
});

describe("computeZatcaTotals", () => {
  it("rounds per line, groups tax subtotals by category/rate/exemption, totals in SAR", () => {
    const t = computeZatcaTotals(simplifiedInvoice().lines);
    expect(t.lines.map((l) => [l.net, l.vat, l.gross])).toEqual([
      [100, 15, 115],
      [33.33, 0, 33.33],
    ]);
    expect(t.subtotals).toEqual([
      { category: "S", rate: 15, taxable: 100, vat: 15 },
      { category: "Z", rate: 0, taxable: 33.33, vat: 0, exemptionReasonCode: "VATEX-SA-35", exemptionReason: "Medicines and medical equipment" },
    ]);
    expect([t.lineExtension, t.taxExclusive, t.vatTotal, t.taxInclusive, t.payable]).toEqual([
      133.33, 133.33, 15, 148.33, 148.33,
    ]);
  });

  it("applies per-unit price discounts", () => {
    const t = computeZatcaTotals([
      { name: "a", quantity: 3, unitPrice: 10, discountPerUnit: 2.5, vatCategory: "S", vatRate: 15 },
    ]);
    expect(t.lines[0]).toMatchObject({ net: 22.5, vat: 3.38, gross: 25.88 });
  });
});

describe("buildInvoiceXml", () => {
  it("throws a typed error carrying the validation issues", () => {
    try {
      buildInvoiceXml(simplifiedInvoice({ uuid: "bad" }), { now: NOW });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ZatcaInvoiceValidationError);
      expect((e as ZatcaInvoiceValidationError).issues[0]?.code).toBe("UUID_INVALID");
    }
  });

  it("emits canonical-by-construction XML (no declaration-sensitive diffs)", () => {
    const xml = buildInvoiceXml(simplifiedInvoice(), { now: NOW });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    const body = xml.slice(xml.indexOf("<Invoice"));
    expect(canonicalize(xml)).toBe(body);
  });

  it("builds a simplified tax invoice with the KSA header fields", () => {
    const root = parseXml(buildInvoiceXml(simplifiedInvoice(), { now: NOW })).root;
    expect(textAt(root, "cbc:ProfileID")).toBe("reporting:1.0");
    expect(textAt(root, "cbc:ID")).toBe("SME00010");
    expect(textAt(root, "cbc:UUID")).toBe("8e6000cf-1a98-4174-b3e7-b5d5954bc10d");
    expect(textAt(root, "cbc:IssueDate")).toBe("2026-11-09");
    expect(textAt(root, "cbc:IssueTime")).toBe("14:40:40");
    const type = findFirst(root, "cbc:InvoiceTypeCode");
    expect(type?.attributes).toEqual([{ name: "name", value: "0200000" }]);
    expect(textAt(root, "cbc:InvoiceTypeCode")).toBe("388");
    expect(textAt(root, "cbc:DocumentCurrencyCode")).toBe("SAR");
    expect(textAt(root, "cbc:TaxCurrencyCode")).toBe("SAR");

    const refs = findAll(root, "cac:AdditionalDocumentReference");
    expect(refs.map((r) => textAt(r, "cbc:ID"))).toEqual(["ICV", "PIH"]);
    expect(textAt(refs[0]!, "cbc:UUID")).toBe("1");
    expect(textAt(refs[1]!, "cac:Attachment/cbc:EmbeddedDocumentBinaryObject")).toBe(FIRST_INVOICE_PIH);
    expect(textAt(root, "cac:Signature/cbc:SignatureMethod")).toBe(
      "urn:oasis:names:specification:ubl:dsig:enveloped:xades",
    );
  });

  it("writes seller party with CRN, address, VAT and legal name (escaped)", () => {
    const xml = buildInvoiceXml(simplifiedInvoice(), { now: NOW });
    expect(xml).toContain("شركة قفطر للتجارة &amp; Co");
    const party = findFirst(parseXml(xml).root, "cac:AccountingSupplierParty/cac:Party")!;
    expect(findFirst(party, "cac:PartyIdentification/cbc:ID")?.attributes).toEqual([{ name: "schemeID", value: "CRN" }]);
    expect(textAt(party, "cac:PostalAddress/cbc:StreetName")).toBe("King Fahd Road");
    expect(textAt(party, "cac:PostalAddress/cbc:BuildingNumber")).toBe("1234");
    expect(textAt(party, "cac:PostalAddress/cbc:PlotIdentification")).toBe("5678");
    expect(textAt(party, "cac:PostalAddress/cbc:CitySubdivisionName")).toBe("Al Olaya");
    expect(textAt(party, "cac:PostalAddress/cbc:CityName")).toBe("Riyadh");
    expect(textAt(party, "cac:PostalAddress/cbc:PostalZone")).toBe("12211");
    expect(textAt(party, "cac:PostalAddress/cac:Country/cbc:IdentificationCode")).toBe("SA");
    expect(textAt(party, "cac:PartyTaxScheme/cbc:CompanyID")).toBe("399999999900003");
    expect(textAt(party, "cac:PartyTaxScheme/cac:TaxScheme/cbc:ID")).toBe("VAT");
    expect(textAt(party, "cac:PartyLegalEntity/cbc:RegistrationName")).toBe("شركة قفطر للتجارة & Co");
  });

  it("writes tax totals (plain + with subtotals incl. exemption reason) and monetary totals", () => {
    const root = parseXml(buildInvoiceXml(simplifiedInvoice(), { now: NOW })).root;
    const taxTotals = findAll(root, "cac:TaxTotal");
    expect(taxTotals).toHaveLength(2);
    expect(textAt(taxTotals[0]!, "cbc:TaxAmount")).toBe("15.00");
    expect(findAll(taxTotals[0]!, "cac:TaxSubtotal")).toHaveLength(0);
    const subs = findAll(taxTotals[1]!, "cac:TaxSubtotal");
    expect(subs.map((s) => textAt(s, "cac:TaxCategory/cbc:ID"))).toEqual(["S", "Z"]);
    expect(textAt(subs[0]!, "cac:TaxCategory/cbc:Percent")).toBe("15.00");
    expect(textAt(subs[1]!, "cac:TaxCategory/cbc:TaxExemptionReasonCode")).toBe("VATEX-SA-35");
    expect(textAt(subs[1]!, "cac:TaxCategory/cbc:TaxExemptionReason")).toBe("Medicines and medical equipment");
    expect(findFirst(subs[0]!, "cbc:TaxAmount")?.attributes).toEqual([{ name: "currencyID", value: "SAR" }]);

    expect(textAt(root, "cac:LegalMonetaryTotal/cbc:LineExtensionAmount")).toBe("133.33");
    expect(textAt(root, "cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount")).toBe("133.33");
    expect(textAt(root, "cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount")).toBe("148.33");
    expect(textAt(root, "cac:LegalMonetaryTotal/cbc:PayableAmount")).toBe("148.33");
    expect(textAt(root, "cac:PaymentMeans/cbc:PaymentMeansCode")).toBe("10");

    const lines = findAll(root, "cac:InvoiceLine");
    expect(lines).toHaveLength(2);
    expect(textAt(lines[0]!, "cbc:InvoicedQuantity")).toBe("2");
    expect(textAt(lines[0]!, "cbc:LineExtensionAmount")).toBe("100.00");
    expect(textAt(lines[0]!, "cac:TaxTotal/cbc:TaxAmount")).toBe("15.00");
    expect(textAt(lines[0]!, "cac:TaxTotal/cbc:RoundingAmount")).toBe("115.00");
    expect(textAt(lines[0]!, "cac:Item/cbc:Name")).toBe("قلم Pen");
    expect(textAt(lines[0]!, "cac:Item/cac:ClassifiedTaxCategory/cbc:ID")).toBe("S");
    expect(textAt(lines[0]!, "cac:Price/cbc:PriceAmount")).toBe("50.00");
  });

  it("builds a standard invoice with buyer and delivery date", () => {
    const root = parseXml(buildInvoiceXml(standardInvoice(), { now: NOW })).root;
    expect(findFirst(root, "cbc:InvoiceTypeCode")?.attributes[0]?.value).toBe("0100000");
    expect(textAt(root, "cac:AccountingCustomerParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID")).toBe("300000000000003");
    expect(textAt(root, "cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName")).toBe("Buyer Trading LLC");
    expect(textAt(root, "cac:Delivery/cbc:ActualDeliveryDate")).toBe("2026-11-09");
  });

  it("builds credit (381) and debit (383) notes with billing reference and reason", () => {
    for (const [kind, code] of [["credit-note", "381"], ["debit-note", "383"]] as const) {
      const root = parseXml(
        buildInvoiceXml(
          standardInvoice({ kind, billingReference: { invoiceId: "STD00000" }, noteReason: "Price correction" }),
          { now: NOW },
        ),
      ).root;
      expect(textAt(root, "cbc:InvoiceTypeCode")).toBe(code);
      expect(textAt(root, "cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID")).toBe("STD00000");
      expect(textAt(root, "cac:PaymentMeans/cbc:InstructionNote")).toBe("Price correction");
    }
  });
});
