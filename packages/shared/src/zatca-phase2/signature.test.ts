import { describe, expect, it } from "bun:test";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { fromBase64, fromUtf8, toBase64, toHex, utf8 } from "./bytes";
import { parseCertificate } from "./certificate";
import { TEST_SIGNER_KEY, createTestCertificate, simplifiedInvoice, standardInvoice } from "./fixtures";
import { computeInvoiceHash } from "./hash";
import { publicKeyFromPrivate } from "./keys";
import { decodeQrTlv } from "./qr";
import { certificateHash, signInvoice, verifySignedInvoice } from "./signature";
import { buildInvoiceXml } from "./ubl-builder";
import { findDescendant, parseXml, textAt, textContent } from "./xml";

/*
 * Round trip with CONSTRUCTED vectors: a self-signed secp256k1 test
 * certificate stands in for the ZATCA compliance CSID. Digest quirks follow
 * the ZATCA SDK conventions (certificate and SignedProperties digests are
 * base64 of the HEX SHA-256; the invoice digest is base64 of the raw digest).
 */

const NOW = new Date("2026-11-09T20:00:00Z");
const SIGNING_TIME = new Date("2026-11-09T11:40:41Z");
const CERT_DER = createTestCertificate();
const CERT_B64 = toBase64(CERT_DER);

function sign(input = simplifiedInvoice()) {
  const xml = buildInvoiceXml(input, { now: NOW });
  return { xml, ...signInvoice({ xml, certificate: CERT_B64, privateKey: TEST_SIGNER_KEY, signingTime: SIGNING_TIME }) };
}

describe("certificateHash", () => {
  it("is base64(hex(SHA-256(base64 certificate text)))", () => {
    expect(certificateHash(CERT_B64)).toBe(toBase64(utf8(toHex(sha256(utf8(CERT_B64))))));
  });
});

describe("signInvoice", () => {
  it("does not change the invoice hash (signature, extensions and QR are excluded)", () => {
    const { xml, signedXml, invoiceHash } = sign();
    expect(invoiceHash).toBe(computeInvoiceHash(xml));
    expect(computeInvoiceHash(signedXml)).toBe(invoiceHash);
  });

  it("embeds a XAdES-BES block with digests, signing time, issuer/serial and certificate", () => {
    const { signedXml, invoiceHash, signature } = sign();
    const root = parseXml(signedXml).root;
    const firstChild = root.children[0];
    expect(firstChild?.type === "element" && firstChild.name).toBe("ext:UBLExtensions");
    expect(textAt(root, "ext:UBLExtensions/ext:UBLExtension/ext:ExtensionURI")).toBe(
      "urn:oasis:names:specification:ubl:dsig:enveloped:xades",
    );
    const sigEl = findDescendant(root, "ds:Signature")!;
    expect(sigEl.attributes).toContainEqual({ name: "Id", value: "signature" });
    expect(textAt(sigEl, "ds:SignedInfo/ds:Reference/ds:DigestValue")).toBe(invoiceHash);
    expect(textAt(sigEl, "ds:SignatureValue")).toBe(signature);
    expect(textAt(sigEl, "ds:KeyInfo/ds:X509Data/ds:X509Certificate")).toBe(CERT_B64);
    const algs = findDescendant(sigEl, "ds:Transforms")!.children.map((c) => (c.type === "element" ? textContent(c) : ""));
    expect(algs).toEqual([
      "not(//ancestor-or-self::ext:UBLExtensions)",
      "not(//ancestor-or-self::cac:Signature)",
      "not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])",
      "",
    ]);

    const props = findDescendant(sigEl, "xades:SignedSignatureProperties")!;
    expect(textAt(props, "xades:SigningTime")).toBe("2026-11-09T11:40:41");
    const cert = parseCertificate(CERT_DER);
    expect(textAt(props, "xades:SigningCertificate/xades:Cert/xades:CertDigest/ds:DigestValue")).toBe(certificateHash(CERT_B64));
    expect(textAt(props, "xades:SigningCertificate/xades:Cert/xades:IssuerSerial/ds:X509IssuerName")).toBe(cert.issuerName);
    expect(textAt(props, "xades:SigningCertificate/xades:Cert/xades:IssuerSerial/ds:X509SerialNumber")).toBe(cert.serialNumber);
  });

  it("produces an ECDSA-secp256k1 signature over the invoice hash that verifies with the public key", () => {
    const { invoiceHash, signature } = sign();
    const ok = secp256k1.verify(fromBase64(signature), fromBase64(invoiceHash), publicKeyFromPrivate(TEST_SIGNER_KEY), {
      format: "der",
      lowS: false,
    });
    expect(ok).toBe(true);
  });

  it("writes a QR with tags 1-9 for simplified invoices, placed before cac:Signature", () => {
    const { signedXml, invoiceHash, signature, qr } = sign();
    expect(signedXml.indexOf("<cbc:ID>QR</cbc:ID>")).toBeLessThan(signedXml.indexOf("<cac:Signature>"));
    expect(signedXml.indexOf("<cbc:ID>PIH</cbc:ID>")).toBeLessThan(signedXml.indexOf("<cbc:ID>QR</cbc:ID>"));
    const tags = decodeQrTlv(qr);
    const cert = parseCertificate(CERT_DER);
    expect(fromUtf8(tags.get(1)!)).toBe("شركة قفطر للتجارة & Co");
    expect(fromUtf8(tags.get(2)!)).toBe("399999999900003");
    expect(fromUtf8(tags.get(3)!)).toBe("2026-11-09T14:40:40");
    expect(fromUtf8(tags.get(4)!)).toBe("148.33");
    expect(fromUtf8(tags.get(5)!)).toBe("15.00");
    expect(fromUtf8(tags.get(6)!)).toBe(invoiceHash);
    expect(fromUtf8(tags.get(7)!)).toBe(signature);
    expect(tags.get(8)).toEqual(cert.publicKeySpki);
    expect(tags.get(9)).toEqual(cert.signature);
  });

  it("omits tag 9 on standard invoices (ZATCA stamps those at clearance)", () => {
    const tags = decodeQrTlv(sign(standardInvoice()).qr);
    expect(tags.has(8)).toBe(true);
    expect(tags.has(9)).toBe(false);
  });
});

describe("verifySignedInvoice", () => {
  it("accepts an untampered signed invoice", () => {
    expect(verifySignedInvoice(sign().signedXml)).toEqual({
      valid: true,
      invoiceHashMatches: true,
      signedPropertiesMatches: true,
      certificateDigestMatches: true,
      signatureValid: true,
    });
  });

  it("detects tampered business content", () => {
    const tampered = sign().signedXml.replace(">148.33<", ">1.00<");
    const r = verifySignedInvoice(tampered);
    expect(r.valid).toBe(false);
    expect(r.invoiceHashMatches).toBe(false);
  });

  it("detects a signature made with a different key", () => {
    const { xml } = sign();
    const other = signInvoice({
      xml,
      certificate: CERT_B64,
      privateKey: new Uint8Array(32).fill(7),
      signingTime: SIGNING_TIME,
    });
    expect(verifySignedInvoice(other.signedXml).signatureValid).toBe(false);
  });
});
