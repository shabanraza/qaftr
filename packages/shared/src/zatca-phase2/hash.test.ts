import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { FIRST_INVOICE_PIH, canonicalInvoiceForHash, computeInvoiceHash } from "./hash";

/*
 * Test vectors. FIRST_INVOICE_PIH is the official value printed in the ZATCA
 * SDK samples / developer guideline (base64 of the HEX text of SHA-256("0")).
 * The canonicalisation vectors below are CONSTRUCTED from the transforms the
 * XAdES SignedInfo declares (remove ext:UBLExtensions, cac:Signature and the
 * QR AdditionalDocumentReference, then C14N 1.1) — not copied from the SDK.
 */

const NS =
  'xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" ' +
  'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" ' +
  'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" ' +
  'xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"';

function invoice(ext: string, qr: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<Invoice ${NS}>` +
    `<ext:UBLExtensions>${ext}</ext:UBLExtensions>` +
    `<cbc:ProfileID>reporting:1.0</cbc:ProfileID><cbc:ID>INV-1</cbc:ID>` +
    `<cac:AdditionalDocumentReference><cbc:ID>ICV</cbc:ID><cbc:UUID>1</cbc:UUID></cac:AdditionalDocumentReference>` +
    `<cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qr}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>` +
    `<cac:Signature><cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID></cac:Signature>` +
    `<cbc:Note/></Invoice>`
  );
}

const EXPECTED_CANONICAL =
  `<Invoice ${NS}>` +
  `<cbc:ProfileID>reporting:1.0</cbc:ProfileID><cbc:ID>INV-1</cbc:ID>` +
  `<cac:AdditionalDocumentReference><cbc:ID>ICV</cbc:ID><cbc:UUID>1</cbc:UUID></cac:AdditionalDocumentReference>` +
  `<cbc:Note></cbc:Note></Invoice>`;

describe("FIRST_INVOICE_PIH", () => {
  it("matches the official ZATCA initial previous-invoice-hash", () => {
    expect(FIRST_INVOICE_PIH).toBe(
      "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==",
    );
  });
});

describe("canonicalInvoiceForHash", () => {
  it("removes UBLExtensions, cac:Signature and the QR reference, then C14N 1.1", () => {
    expect(canonicalInvoiceForHash(invoice("<x/>", "AAAA"))).toBe(EXPECTED_CANONICAL);
  });

  it("matches on namespace URI, not on prefix", () => {
    const xml = invoice("<x/>", "AAAA")
      .replaceAll("ext:", "e:")
      .replace('xmlns:ext="', 'xmlns:e="');
    expect(canonicalInvoiceForHash(xml)).toBe(
      EXPECTED_CANONICAL.replace('xmlns:ext="', 'xmlns:e="'),
    );
  });
});

describe("computeInvoiceHash", () => {
  it("is base64(SHA-256(canonical bytes))", async () => {
    const expected = createHash("sha256").update(EXPECTED_CANONICAL, "utf8").digest("base64");
    expect(await computeInvoiceHash(invoice("<x/>", "AAAA"))).toBe(expected);
  });

  it("is unaffected by signature and QR contents (they are excluded)", async () => {
    const a = await computeInvoiceHash(invoice("<x/>", "AAAA"));
    const b = await computeInvoiceHash(invoice("<y>other signature</y>", "BBBBCCCC"));
    expect(a).toBe(b);
  });

  it("changes when business content changes", async () => {
    const a = await computeInvoiceHash(invoice("", "A"));
    const b = await computeInvoiceHash(invoice("", "A").replace("INV-1", "INV-2"));
    expect(a).not.toBe(b);
  });
});
