/**
 * XAdES-BES enveloped signature + QR for ZATCA Phase 2.
 *
 * ZATCA conventions (from the SDK / guideline; verify against sandbox):
 *  - ds:SignatureValue = ECDSA-secp256k1-SHA256 over the raw invoice-hash bytes
 *    (i.e. the signed message is the 32-byte digest), DER, base64.
 *  - invoiceSignedData DigestValue = invoice hash (base64 of raw SHA-256).
 *  - CertDigest = base64(hex(SHA-256(base64 certificate text))).
 *  - SignedProperties digest = base64(hex(SHA-256(SignedProperties text))) over
 *    the namespaced, self-closing-DigestMethod form (see buildSignedProperties).
 *  - The sandbox is LENIENT (accepted tampered bodies and unrelated-key
 *    signatures), so sandbox acceptance is not proof: use verifySignedInvoice.
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { fromBase64, toBase64, toHex, utf8 } from "./bytes";
import { type ZatcaCertificate, parseCertificate } from "./certificate";
import { computeInvoiceHash } from "./hash";
import { ALG, NS } from "./namespaces";
import { encodeQrTlv } from "./qr";
import { SIGNATURE_PLACEHOLDER_ELEMENT } from "./ubl-builder";
import { escapeText, findAll, findDescendant, findFirst, parseXml, textAt } from "./xml";

export interface SignInvoiceInput {
  /** Unsigned UBL XML (from buildInvoiceXml). */
  xml: string;
  /** Certificate: ZatcaCertificate, PEM, base64 DER, or DER bytes. */
  certificate: ZatcaCertificate | string | Uint8Array;
  privateKey: Uint8Array;
  signingTime?: Date;
}

export interface SignedInvoice {
  signedXml: string;
  invoiceHash: string;
  signature: string;
  qr: string;
}

const hexDigestB64 = (text: string) => toBase64(utf8(toHex(sha256(utf8(text)))));

export function certificateHash(certificateBase64: string): string {
  return hexDigestB64(certificateBase64);
}

function signingTimeString(d: Date): string {
  return d.toISOString().slice(0, 19);
}

/**
 * SignedProperties in the serialisation the ZATCA sandbox accepts on
 * reporting (spikes/zatca-sandbox, 2026-11-09): NOT strict C14N —
 * `<ds:DigestMethod .../>` is self-closing (strict `></ds:DigestMethod>` was
 * rejected with `signed-properties-hashing`).
 *  - withNamespaces: true  -> the exact bytes whose digest goes into SignedInfo
 *    (xmlns:xades on the element, xmlns:ds on every ds:* child)
 *  - withNamespaces: false -> the form embedded inside QualifyingProperties
 *    (namespaces inherited from ancestors)
 */
export function buildSignedProperties(
  cert: ZatcaCertificate,
  signingTime: Date,
  options: { withNamespaces: boolean },
): string {
  const ds = options.withNamespaces ? ` xmlns:ds="${NS.ds}"` : "";
  const xades = options.withNamespaces ? ` xmlns:xades="${NS.xades}"` : "";
  return (
    `<xades:SignedProperties${xades} Id="xadesSignedProperties">` +
    `<xades:SignedSignatureProperties>` +
    `<xades:SigningTime>${signingTimeString(signingTime)}</xades:SigningTime>` +
    `<xades:SigningCertificate><xades:Cert><xades:CertDigest>` +
    `<ds:DigestMethod${ds} Algorithm="${ALG.sha256}"/>` +
    `<ds:DigestValue${ds}>${certificateHash(cert.base64)}</ds:DigestValue>` +
    `</xades:CertDigest><xades:IssuerSerial>` +
    `<ds:X509IssuerName${ds}>${escapeText(cert.issuerName)}</ds:X509IssuerName>` +
    `<ds:X509SerialNumber${ds}>${cert.serialNumber}</ds:X509SerialNumber>` +
    `</xades:IssuerSerial></xades:Cert></xades:SigningCertificate>` +
    `</xades:SignedSignatureProperties></xades:SignedProperties>`
  );
}

/** Re-derives the hashed form from the embedded SignedProperties text. */
export function signedPropertiesForDigest(embedded: string): string {
  return embedded
    .replace(/^<xades:SignedProperties(?![^>]*xmlns:xades)/, `<xades:SignedProperties xmlns:xades="${NS.xades}"`)
    .replace(/<ds:([A-Za-z0-9]+)(?![^>]*xmlns:ds)/g, `<ds:$1 xmlns:ds="${NS.ds}"`);
}

function buildUblExtensions(p: {
  invoiceHash: string;
  /** Embedded form (no namespace declarations). */
  signedProperties: string;
  /** Digest of the namespaced form. */
  signedPropertiesDigest: string;
  signature: string;
  certificate: string;
}): string {
  const xpath = (expr: string) =>
    `<ds:Transform Algorithm="${ALG.xpath}"><ds:XPath>${escapeText(expr)}</ds:XPath></ds:Transform>`;
  return (
    `<ext:UBLExtensions><ext:UBLExtension>` +
    `<ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>` +
    `<ext:ExtensionContent>` +
    `<sig:UBLDocumentSignatures xmlns:sac="${NS.sac}" xmlns:sbc="${NS.sbc}" xmlns:sig="${NS.sig}">` +
    `<sac:SignatureInformation>` +
    `<cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>` +
    `<sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>` +
    `<ds:Signature xmlns:ds="${NS.ds}" Id="signature">` +
    `<ds:SignedInfo>` +
    `<ds:CanonicalizationMethod Algorithm="${ALG.c14n11}"></ds:CanonicalizationMethod>` +
    `<ds:SignatureMethod Algorithm="${ALG.ecdsaSha256}"></ds:SignatureMethod>` +
    `<ds:Reference Id="invoiceSignedData" URI="">` +
    `<ds:Transforms>` +
    xpath("not(//ancestor-or-self::ext:UBLExtensions)") +
    xpath("not(//ancestor-or-self::cac:Signature)") +
    xpath("not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])") +
    `<ds:Transform Algorithm="${ALG.c14n11}"></ds:Transform>` +
    `</ds:Transforms>` +
    `<ds:DigestMethod Algorithm="${ALG.sha256}"></ds:DigestMethod>` +
    `<ds:DigestValue>${p.invoiceHash}</ds:DigestValue>` +
    `</ds:Reference>` +
    `<ds:Reference Type="${ALG.signatureProperties}" URI="#xadesSignedProperties">` +
    `<ds:DigestMethod Algorithm="${ALG.sha256}"></ds:DigestMethod>` +
    `<ds:DigestValue>${p.signedPropertiesDigest}</ds:DigestValue>` +
    `</ds:Reference>` +
    `</ds:SignedInfo>` +
    `<ds:SignatureValue>${p.signature}</ds:SignatureValue>` +
    `<ds:KeyInfo><ds:X509Data><ds:X509Certificate>${p.certificate}</ds:X509Certificate></ds:X509Data></ds:KeyInfo>` +
    `<ds:Object><xades:QualifyingProperties xmlns:xades="${NS.xades}" Target="signature">` +
    p.signedProperties +
    `</xades:QualifyingProperties></ds:Object>` +
    `</ds:Signature></sac:SignatureInformation></sig:UBLDocumentSignatures>` +
    `</ext:ExtensionContent></ext:UBLExtension></ext:UBLExtensions>`
  );
}

function qrReference(qr: string): string {
  return (
    `<cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cac:Attachment>` +
    `<cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qr}</cbc:EmbeddedDocumentBinaryObject>` +
    `</cac:Attachment></cac:AdditionalDocumentReference>`
  );
}

function toCertificate(c: SignInvoiceInput["certificate"]): ZatcaCertificate {
  return typeof c === "string" || c instanceof Uint8Array ? parseCertificate(c) : c;
}

export function signInvoice(input: SignInvoiceInput): SignedInvoice {
  const cert = toCertificate(input.certificate);
  const invoiceHash = computeInvoiceHash(input.xml);
  const signature = toBase64(secp256k1.sign(fromBase64(invoiceHash), input.privateKey, { format: "der" }));
  const signingTime = input.signingTime ?? new Date();
  const signedProperties = buildSignedProperties(cert, signingTime, { withNamespaces: false });
  const signedPropertiesDigest = hexDigestB64(buildSignedProperties(cert, signingTime, { withNamespaces: true }));

  const root = parseXml(input.xml).root;
  const supplier = "cac:AccountingSupplierParty/cac:Party";
  const typeName = findFirst(root, "cbc:InvoiceTypeCode")?.attributes.find((a) => a.name === "name")?.value ?? "";
  const qr = encodeQrTlv({
    sellerName: textAt(root, `${supplier}/cac:PartyLegalEntity/cbc:RegistrationName`) ?? "",
    vatNumber: textAt(root, `${supplier}/cac:PartyTaxScheme/cbc:CompanyID`) ?? "",
    timestamp: `${textAt(root, "cbc:IssueDate")}T${textAt(root, "cbc:IssueTime")}`,
    totalWithVat: textAt(root, "cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount") ?? "",
    vatTotal: textAt(root, "cac:TaxTotal/cbc:TaxAmount") ?? "",
    invoiceHash,
    signature,
    publicKey: cert.publicKeySpki,
    certificateSignature: typeName.startsWith("02") ? cert.signature : undefined,
  });

  const extensions = buildUblExtensions({
    invoiceHash,
    signedProperties,
    signedPropertiesDigest,
    signature,
    certificate: cert.base64,
  });
  const rootStart = input.xml.indexOf("<Invoice");
  const rootEnd = input.xml.indexOf(">", rootStart) + 1;
  let signedXml = input.xml.slice(0, rootEnd) + extensions + input.xml.slice(rootEnd);
  if (signedXml.includes(SIGNATURE_PLACEHOLDER_ELEMENT)) {
    signedXml = signedXml.replace(SIGNATURE_PLACEHOLDER_ELEMENT, qrReference(qr) + SIGNATURE_PLACEHOLDER_ELEMENT);
  } else {
    signedXml = signedXml.replace(
      "<cac:AccountingSupplierParty>",
      qrReference(qr) + SIGNATURE_PLACEHOLDER_ELEMENT + "<cac:AccountingSupplierParty>",
    );
  }
  return { signedXml, invoiceHash, signature, qr };
}

export interface SignatureVerification {
  valid: boolean;
  invoiceHashMatches: boolean;
  signedPropertiesMatches: boolean;
  certificateDigestMatches: boolean;
  signatureValid: boolean;
}

/** Local self-check of a signed invoice (mirrors what ZATCA recomputes). */
export function verifySignedInvoice(signedXml: string): SignatureVerification {
  const root = parseXml(signedXml).root;
  const sig = findDescendant(root, "ds:Signature");
  if (!sig) throw new Error("No ds:Signature found");
  const refs = findAll(sig, "ds:SignedInfo/ds:Reference");
  const digestOf = (id: string) =>
    textAt(refs.find((r) => r.attributes.some((a) => a.value === id)) ?? sig, "ds:DigestValue") ?? "";
  const declaredInvoiceHash = digestOf("invoiceSignedData");
  const declaredPropsHash = digestOf("#xadesSignedProperties");

  const invoiceHashMatches = computeInvoiceHash(signedXml) === declaredInvoiceHash;

  const start = signedXml.indexOf("<xades:SignedProperties");
  const endTag = "</xades:SignedProperties>";
  const end = signedXml.indexOf(endTag, start) + endTag.length;
  const signedPropertiesMatches =
    start >= 0 && hexDigestB64(signedPropertiesForDigest(signedXml.slice(start, end))) === declaredPropsHash;

  const certB64 = textAt(sig, "ds:KeyInfo/ds:X509Data/ds:X509Certificate") ?? "";
  const cert = parseCertificate(certB64);
  const certDigest = findDescendant(sig, "xades:CertDigest");
  const certificateDigestMatches =
    !!certDigest && textAt(certDigest, "ds:DigestValue") === certificateHash(certB64.replace(/\s/g, ""));

  let signatureValid = false;
  try {
    signatureValid = secp256k1.verify(
      fromBase64(textAt(sig, "ds:SignatureValue") ?? ""),
      fromBase64(declaredInvoiceHash),
      cert.publicKey,
      { format: "der", lowS: false },
    );
  } catch {
    signatureValid = false;
  }
  return {
    valid: invoiceHashMatches && signedPropertiesMatches && certificateDigestMatches && signatureValid,
    invoiceHashMatches,
    signedPropertiesMatches,
    certificateDigestMatches,
    signatureValid,
  };
}
