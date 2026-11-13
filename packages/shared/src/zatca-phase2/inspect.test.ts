import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toBase64 } from "./bytes";
import { TEST_SIGNER_KEY, createTestCertificate, simplifiedInvoice, standardInvoice } from "./fixtures";
import { inspectZatcaInvoiceXml, parseZatcaInvoiceXml } from "./inspect";
import { signInvoice } from "./signature";
import { buildInvoiceXml } from "./ubl-builder";
import { parseXml } from "./xml";

const read = (name: string) => readFileSync(join(import.meta.dir, "__fixtures__", name), "utf8");
const COMPLIANCE = read("sandbox-compliance-simplified.xml");
const REPORTED_PCSID = read("sandbox-reported-simplified-pcsid.xml");
const NOW = new Date("2026-11-13T09:00:00Z");
const CERT_B64 = toBase64(createTestCertificate());

function inspect(xml: string) {
  const r = inspectZatcaInvoiceXml(xml, { now: NOW });
  if (!r.ok) throw new Error(`expected a report, got ${r.error}`);
  return r.report;
}

function signedSimplified() {
  const xml = buildInvoiceXml(simplifiedInvoice(), { now: NOW });
  return signInvoice({ xml, certificate: CERT_B64, privateKey: TEST_SIGNER_KEY, signingTime: NOW }).signedXml;
}

describe("parseZatcaInvoiceXml", () => {
  it("reads a built standard invoice back into the validator's input model", () => {
    const input = standardInvoice();
    const parsed = parseZatcaInvoiceXml(parseXml(buildInvoiceXml(input, { now: NOW })).root);
    expect(parsed.kind).toBe("invoice");
    expect(parsed.subtype).toBe("standard");
    expect(parsed.id).toBe(input.id);
    expect(parsed.uuid).toBe(input.uuid);
    expect(parsed.icv).toBe(1);
    expect(parsed.pih).toBe(input.pih);
    expect(parsed.seller).toEqual(input.seller);
    expect(parsed.buyer).toEqual(input.buyer);
    expect(parsed.supplyDate).toBe("2026-11-09");
    expect(parsed.paymentMeansCode).toBe("42");
    expect(parsed.lines.map((l) => [l.name, l.quantity, l.unitPrice, l.vatCategory, l.vatRate, l.exemptionReasonCode])).toEqual([
      ["قلم Pen", 2, 50, "S", 15, undefined],
      ["Book", 1, 33.33, "Z", 0, "VATEX-SA-35"],
    ]);
  });

  it("reads credit-note fields (billing reference, reason) and line discounts", () => {
    const input = standardInvoice({
      kind: "credit-note",
      billingReference: { invoiceId: "STD00001" },
      noteReason: "Returned goods",
      lines: [{ name: "Pen", quantity: 2, unitPrice: 50, discountPerUnit: 5, vatCategory: "S", vatRate: 15 }],
    });
    const parsed = parseZatcaInvoiceXml(parseXml(buildInvoiceXml(input, { now: NOW })).root);
    expect(parsed.kind).toBe("credit-note");
    expect(parsed.billingReference).toEqual({ invoiceId: "STD00001" });
    expect(parsed.noteReason).toBe("Returned goods");
    expect(parsed.lines[0]).toMatchObject({ unitPrice: 50, discountPerUnit: 5 });
  });
});

describe("inspectZatcaInvoiceXml: input errors", () => {
  it("explains empty input, non-XML, DTDs and XML that is not a UBL invoice", () => {
    expect(inspectZatcaInvoiceXml("  ")).toEqual({ ok: false, error: "EMPTY" });
    expect(inspectZatcaInvoiceXml("hello")).toEqual({ ok: false, error: "NOT_XML" });
    expect(inspectZatcaInvoiceXml("<a><b></a>")).toEqual({ ok: false, error: "NOT_XML" });
    expect(inspectZatcaInvoiceXml('<!DOCTYPE x [<!ENTITY a "b">]><x/>')).toEqual({ ok: false, error: "NOT_XML" });
    expect(inspectZatcaInvoiceXml("<Order><ID>1</ID></Order>")).toEqual({ ok: false, error: "NOT_INVOICE" });
  });

  it("rejects an invoice that uses other prefixes for the UBL namespaces", () => {
    const xml = COMPLIANCE.replaceAll("cbc:", "b:").replace("xmlns:cbc=", "xmlns:b=");
    expect(inspectZatcaInvoiceXml(xml)).toEqual({ ok: false, error: "PREFIXES_UNSUPPORTED" });
  });
});

describe("inspectZatcaInvoiceXml: sandbox-accepted documents", () => {
  it("passes every check on the compliance-CSID document", () => {
    const r = inspect(COMPLIANCE);
    expect(r.summary).toMatchObject({
      kind: "invoice",
      subtype: "simplified",
      typeCode: "388",
      typeName: "0200000",
      id: "SPK-1",
      issueDate: "2026-11-09",
      issueTime: "07:30:06",
      icv: "1",
      currency: "SAR",
      sellerName: "Qaftr Spike Test LLC",
      sellerVat: "399999999900003",
      lineCount: 1,
      total: "115.00",
      vatTotal: "15.00",
    });
    expect(r.missing).toEqual([]);
    expect(r.rules).toEqual([]);
    expect(r.totals.length).toBeGreaterThanOrEqual(5);
    expect(r.totals.filter((t) => !t.ok)).toEqual([]);
    expect(r.qr.status).toBe("decoded");
    expect(r.qr.phase).toBe(2);
    expect(r.qr.mismatches).toEqual([]);
    expect(r.signature.status).toBe("verified");
    expect(r.errorCount).toBe(0);
  });

  it("flags the document whose certificate is not bound to the signing key", () => {
    const r = inspect(REPORTED_PCSID);
    expect(r.signature.status).toBe("failed");
    expect(r.signature.checks).toMatchObject({ invoiceHashMatches: true, signatureValid: false });
    expect(r.errorCount).toBeGreaterThan(0);
  });
});

describe("inspectZatcaInvoiceXml: broken documents", () => {
  it("reports missing mandatory fields, totals that don't add up, and a hash that no longer matches", () => {
    const broken = COMPLIANCE.replace(/<cac:PartyTaxScheme><cbc:CompanyID>399999999900003<\/cbc:CompanyID>/, "<cac:PartyTaxScheme>")
      .replace(">115.00</cbc:PayableAmount>", ">120.00</cbc:PayableAmount>")
      .replace("<cbc:IssueTime>07:30:06</cbc:IssueTime>", "");
    const r = inspect(broken);
    expect(r.missing.map((m) => m.field)).toEqual(expect.arrayContaining(["SELLER_VAT", "ISSUE_TIME"]));
    // the validator's format issue for the same field is not repeated
    expect(r.rules.map((i) => i.code)).not.toContain("SELLER_VAT_INVALID");
    expect(r.rules.map((i) => i.code)).not.toContain("ISSUE_TIME_INVALID");
    expect(r.totals.find((t) => t.check === "PAYABLE")).toMatchObject({ ok: false, expected: "115.00", actual: "120.00" });
    expect(r.signature.status).toBe("failed");
    expect(r.signature.checks?.invoiceHashMatches).toBe(false);
    expect(r.qr.mismatches.map((m) => m.field)).toEqual(expect.arrayContaining(["VAT_NUMBER", "INVOICE_HASH", "TIMESTAMP"]));
    expect(r.errorCount).toBeGreaterThan(0);
  });

  it("checks each line's net amount and the sum of lines", () => {
    const xml = buildInvoiceXml(simplifiedInvoice(), { now: NOW }).replace(
      '<cbc:InvoicedQuantity unitCode="PCE">2</cbc:InvoicedQuantity>',
      '<cbc:InvoicedQuantity unitCode="PCE">3</cbc:InvoicedQuantity>',
    );
    const r = inspect(xml);
    expect(r.totals.find((t) => t.check === "LINE_NET")).toMatchObject({ ok: false, line: 1, expected: "150.00", actual: "100.00" });
    expect(r.totals.find((t) => t.check === "LINE_EXTENSION_SUM")?.ok).toBe(true);
  });

  it("checks VAT subtotals against their rate and the document VAT", () => {
    const xml = buildInvoiceXml(simplifiedInvoice(), { now: NOW }).replace(
      /(<cac:TaxSubtotal><cbc:TaxableAmount currencyID="SAR">100.00<\/cbc:TaxableAmount><cbc:TaxAmount currencyID="SAR">)15.00/,
      "$114.00",
    );
    const r = inspect(xml);
    expect(r.totals.find((t) => t.check === "SUBTOTAL_VAT")).toMatchObject({ ok: false, expected: "15.00", actual: "14.00" });
    expect(r.totals.find((t) => t.check === "VAT_SUM")?.ok).toBe(false);
  });

  it("runs the shared business rules (e.g. issue date in the future, bad VAT number)", () => {
    const xml = buildInvoiceXml(simplifiedInvoice(), { now: NOW })
      .replace("<cbc:IssueDate>2026-11-09</cbc:IssueDate>", "<cbc:IssueDate>2026-12-01</cbc:IssueDate>")
      .replace("<cbc:CompanyID>399999999900003</cbc:CompanyID>", "<cbc:CompanyID>123</cbc:CompanyID>");
    const codes = inspect(xml).rules.map((i) => i.code);
    expect(codes).toContain("ISSUE_DATE_IN_FUTURE");
    expect(codes).toContain("SELLER_VAT_INVALID");
  });
});

describe("inspectZatcaInvoiceXml: stamp and QR by invoice type", () => {
  it("requires the QR and cryptographic stamp on an unsigned simplified invoice", () => {
    const r = inspect(buildInvoiceXml(simplifiedInvoice(), { now: NOW }));
    expect(r.qr).toMatchObject({ status: "missing", severity: "error" });
    expect(r.signature).toMatchObject({ status: "missing", severity: "error" });
    expect(r.rules).toEqual([]);
    expect(r.totals.filter((t) => !t.ok)).toEqual([]);
    expect(r.errorCount).toBe(2);
  });

  it("treats a missing stamp and QR on a standard invoice as info (added at clearance)", () => {
    const r = inspect(buildInvoiceXml(standardInvoice(), { now: NOW }));
    expect(r.summary.subtype).toBe("standard");
    expect(r.qr).toMatchObject({ status: "missing", severity: "info" });
    expect(r.signature).toMatchObject({ status: "missing", severity: "info" });
    expect(r.errorCount).toBe(0);
  });

  it("verifies a signed simplified invoice end to end", () => {
    const r = inspect(signedSimplified());
    expect(r.signature.status).toBe("verified");
    expect(r.qr.status).toBe("decoded");
    expect(r.qr.mismatches).toEqual([]);
    expect(r.errorCount).toBe(0);
  });

  it("reports an unreadable QR without crashing", () => {
    const xml = COMPLIANCE.replace(/(<cbc:ID>QR<\/cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject[^>]*>)[^<]+/, "$1not base64!");
    const r = inspect(xml);
    expect(r.qr.status).toBe("invalid");
    expect(r.qr.error).toBe("NOT_BASE64");
  });

  it("reports an unreadable certificate as a signature error, not a crash", () => {
    const xml = COMPLIANCE.replace(/<ds:X509Certificate>[^<]+/, "<ds:X509Certificate>AAAA");
    expect(inspect(xml).signature.status).toBe("error");
  });
});
