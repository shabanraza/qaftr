import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { fromBase64, fromUtf8 } from "./bytes";
import { parseCertificate } from "./certificate";
import { TEST_SIGNER_KEY, createTestCertificate, simplifiedInvoice } from "./fixtures";
import { computeInvoiceHash } from "./hash";
import { decodeQrTlv } from "./qr";
import { buildSignedProperties, signInvoice, verifySignedInvoice } from "./signature";
import { buildInvoiceXml } from "./ubl-builder";
import { findDescendant, parseXml, textAt } from "./xml";

/*
 * GOLDEN vectors from the developer-portal sandbox POC
 * (spikes/zatca-sandbox/out, 2026-11-09, copied read-only):
 *  - sandbox-compliance-simplified.xml: signed with the compliance CSID (bound
 *    to the POC key); compliance check PASS; invoice hash cross-checked with
 *    the JDK's C14N 1.1 (verify/HashCheck.java -> MATCH).
 *  - sandbox-reported-simplified-pcsid.xml: REPORTED by the sandbox, but the
 *    sandbox production CSID is a fixed cert NOT bound to the signing key —
 *    the sandbox is lenient, so our verifier must flag it.
 * SignedProperties serialisation: the sandbox rejected strict C14N
 * (`></ds:DigestMethod>`) with `signed-properties-hashing` on reporting and
 * accepted the self-closing form below.
 */

const read = (name: string) => readFileSync(join(import.meta.dir, "__fixtures__", name), "utf8");
const COMPLIANCE = read("sandbox-compliance-simplified.xml");
const REPORTED_PCSID = read("sandbox-reported-simplified-pcsid.xml");

describe("golden: sandbox-accepted documents", () => {
  it("our C14N 1.1 invoice hash equals the embedded digest (= JDK C14N 1.1 result)", () => {
    for (const xml of [COMPLIANCE, REPORTED_PCSID]) {
      const sig = findDescendant(parseXml(xml).root, "ds:Signature")!;
      expect(computeInvoiceHash(xml)).toBe(textAt(sig, "ds:SignedInfo/ds:Reference/ds:DigestValue")!);
    }
  });

  it("fully verifies the compliance-CSID document (hash, signed props, cert digest, signature)", () => {
    expect(verifySignedInvoice(COMPLIANCE)).toEqual({
      valid: true,
      invoiceHashMatches: true,
      signedPropertiesMatches: true,
      certificateDigestMatches: true,
      signatureValid: true,
    });
  });

  it("flags the sandbox-REPORTED document whose PCSID cert is not bound to the signing key", () => {
    const r = verifySignedInvoice(REPORTED_PCSID);
    expect(r.invoiceHashMatches).toBe(true);
    expect(r.signedPropertiesMatches).toBe(true);
    expect(r.signatureValid).toBe(false);
    expect(r.valid).toBe(false);
  });

  it("QR tags 6/7/8 agree with the document; tag 9 equals the embedded certificate's signature", () => {
    const root = parseXml(COMPLIANCE).root;
    const sig = findDescendant(root, "ds:Signature")!;
    const qrRef = root.children.find(
      (c) => c.type === "element" && c.name === "cac:AdditionalDocumentReference" && textAt(c, "cbc:ID") === "QR",
    );
    if (qrRef?.type !== "element") throw new Error("QR missing");
    const tags = decodeQrTlv(textAt(qrRef, "cac:Attachment/cbc:EmbeddedDocumentBinaryObject")!);
    const cert = parseCertificate(textAt(sig, "ds:KeyInfo/ds:X509Data/ds:X509Certificate")!);
    expect(fromUtf8(tags.get(6)!)).toBe(computeInvoiceHash(COMPLIANCE));
    expect(fromUtf8(tags.get(7)!)).toBe(textAt(sig, "ds:SignatureValue")!);
    expect(tags.get(8)).toEqual(cert.publicKeySpki);
    expect(tags.get(9)).toEqual(cert.signature);
    // Tag 7 verifies against tag 8's key over the tag 6 hash (independent of the XML).
    expect(
      secp256k1.verify(fromBase64(fromUtf8(tags.get(7)!)), fromBase64(fromUtf8(tags.get(6)!)), cert.publicKey, {
        format: "der",
        lowS: false,
      }),
    ).toBe(true);
  });
});

describe("golden: SignedProperties / SignedInfo serialisation (sandbox-accepted form)", () => {
  const cert = parseCertificate(createTestCertificate());
  const time = new Date("2026-11-09T11:40:41Z");
  const DS = 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#"';

  it("hashed form: xmlns:xades on the element, xmlns:ds on each ds child, self-closing DigestMethod", () => {
    expect(buildSignedProperties(cert, time, { withNamespaces: true })).toBe(
      `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties">` +
        `<xades:SignedSignatureProperties><xades:SigningTime>2026-11-09T11:40:41</xades:SigningTime>` +
        `<xades:SigningCertificate><xades:Cert><xades:CertDigest>` +
        `<ds:DigestMethod ${DS} Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
        `<ds:DigestValue ${DS}>${textOfCertDigest()}</ds:DigestValue></xades:CertDigest>` +
        `<xades:IssuerSerial><ds:X509IssuerName ${DS}>CN=TSZEINVOICE-SubCA-1, DC=extgazt, DC=gov, DC=local</ds:X509IssuerName>` +
        `<ds:X509SerialNumber ${DS}>${cert.serialNumber}</ds:X509SerialNumber></xades:IssuerSerial>` +
        `</xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`,
    );
  });

  it("embedded form omits the namespace declarations but keeps the self-closing DigestMethod", () => {
    const embedded = buildSignedProperties(cert, time, { withNamespaces: false });
    expect(embedded.startsWith(`<xades:SignedProperties Id="xadesSignedProperties">`)).toBe(true);
    expect(embedded).toContain(`<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`);
    expect(embedded).not.toContain("xmlns");
  });

  it("signed document embeds SignedProperties and SignedInfo exactly like the sandbox-accepted POC", () => {
    const xml = buildInvoiceXml(simplifiedInvoice(), { now: new Date("2026-11-09T20:00:00Z") });
    const { signedXml } = signInvoice({ xml, certificate: cert, privateKey: TEST_SIGNER_KEY, signingTime: time });
    expect(signedXml).toContain(buildSignedProperties(cert, time, { withNamespaces: false }));
    const signedInfo = /<ds:SignedInfo>.*<\/ds:SignedInfo>/.exec(signedXml)![0];
    const shape = (s: string) => s.replace(/<ds:DigestValue>[^<]*<\/ds:DigestValue>/g, "<ds:DigestValue>*</ds:DigestValue>");
    const pocSignedInfo = /<ds:SignedInfo>.*<\/ds:SignedInfo>/.exec(COMPLIANCE)![0];
    expect(shape(signedInfo)).toBe(shape(pocSignedInfo));
    const ublExt = (s: string) =>
      shape(/<ext:UBLExtensions>.*<\/ext:UBLExtensions>/.exec(s)![0])
        .replace(/<ds:SignatureValue>[^<]*</, "<ds:SignatureValue>*<")
        .replace(/<ds:X509Certificate>[^<]*</, "<ds:X509Certificate>*<")
        .replace(/<xades:SigningTime>[^<]*</, "<xades:SigningTime>*<")
        .replace(/<ds:X509IssuerName>[^<]*</, "<ds:X509IssuerName>*<")
        .replace(/<ds:X509SerialNumber>[^<]*</, "<ds:X509SerialNumber>*<");
    expect(ublExt(signedXml)).toBe(ublExt(COMPLIANCE));
  });

  function textOfCertDigest(): string {
    const xml = buildSignedProperties(cert, time, { withNamespaces: false });
    return /<ds:DigestValue>([^<]+)</.exec(xml)![1]!;
  }
});
