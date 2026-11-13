// Build + sign a ZATCA simplified tax invoice (UBL 2.1 + XAdES-B-B enveloped signature).
//
// Trick used here: we emit the XML already in canonical (C14N 1.1) form —
// minified, no self-closing tags, root namespace declarations in canonical order —
// so the "invoice hash" is simply SHA-256 over the document string with the three
// excluded nodes (UBLExtensions, cac:Signature, QR AdditionalDocumentReference)
// removed. No XML/C14N library needed, which keeps this Worker-friendly.
// A production implementation should still verify with the official SDK in CI.
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import type { CertInfo } from "./cert.ts";
import { buildQr } from "./qr.ts";

const enc = new TextEncoder();
const b64 = (b: Uint8Array) => Buffer.from(b).toString("base64");
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** PIH of the very first invoice of an EGS = base64( hex( sha256("0") ) ) */
export const FIRST_PIH = b64(enc.encode(bytesToHex(sha256(enc.encode("0")))));

export type DocKind = "invoice" | "credit" | "debit";
const TYPE_CODE: Record<DocKind, string> = { invoice: "388", credit: "381", debit: "383" };

export interface InvoiceInput {
  id: string;
  uuid: string;
  icv: number;
  pih: string;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  kind: DocKind;
  /** 0200000 = simplified; 0100000 = standard */
  subtype: "0200000" | "0100000";
  /** Credit/debit notes: original invoice id + reason */
  billingReference?: { id: string; reason: string };
  seller: {
    name: string; vat: string; crn: string; street: string; building: string;
    district: string; city: string; postal: string;
  };
  buyer?: {
    name: string; vat?: string; street: string; building: string; district: string;
    city: string; postal: string;
  };
  lines: { name: string; qty: number; unitPrice: number; vatRate: number }[];
}

const m = (n: number) => n.toFixed(2);
const S = 'currencyID="SAR"';

function totals(inp: InvoiceInput) {
  const lines = inp.lines.map((l) => {
    const net = Math.round(l.qty * l.unitPrice * 100) / 100;
    const vat = Math.round(net * l.vatRate) / 100;
    return { ...l, net, vat };
  });
  const net = lines.reduce((s, l) => s + l.net, 0);
  const vat = Math.round(net * 15) / 100; // single 15% category in this spike
  return { lines, net, vat, gross: net + vat };
}

/** Root-level body after the extension/signature slots (canonical form). */
function body(inp: InvoiceInput, qrB64: string | null): { pre: string; qr: string; post: string } {
  const t = totals(inp);
  const isStd = inp.subtype === "0100000";
  const pre =
    `<cbc:ProfileID>reporting:1.0</cbc:ProfileID>` +
    `<cbc:ID>${esc(inp.id)}</cbc:ID>` +
    `<cbc:UUID>${inp.uuid}</cbc:UUID>` +
    `<cbc:IssueDate>${inp.issueDate}</cbc:IssueDate>` +
    `<cbc:IssueTime>${inp.issueTime}</cbc:IssueTime>` +
    `<cbc:InvoiceTypeCode name="${inp.subtype}">${TYPE_CODE[inp.kind]}</cbc:InvoiceTypeCode>` +
    `<cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>` +
    `<cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>` +
    (inp.billingReference
      ? `<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${esc(inp.billingReference.id)}</cbc:ID></cac:InvoiceDocumentReference></cac:BillingReference>`
      : "") +
    `<cac:AdditionalDocumentReference><cbc:ID>ICV</cbc:ID><cbc:UUID>${inp.icv}</cbc:UUID></cac:AdditionalDocumentReference>` +
    `<cac:AdditionalDocumentReference><cbc:ID>PIH</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${inp.pih}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>`;

  const qr = qrB64
    ? `<cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrB64}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>`
    : "";

  const s = inp.seller;
  const b = inp.buyer;
  const post =
    `<cac:AccountingSupplierParty><cac:Party>` +
    `<cac:PartyIdentification><cbc:ID schemeID="CRN">${s.crn}</cbc:ID></cac:PartyIdentification>` +
    `<cac:PostalAddress><cbc:StreetName>${esc(s.street)}</cbc:StreetName><cbc:BuildingNumber>${s.building}</cbc:BuildingNumber><cbc:CitySubdivisionName>${esc(s.district)}</cbc:CitySubdivisionName><cbc:CityName>${esc(s.city)}</cbc:CityName><cbc:PostalZone>${s.postal}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>` +
    `<cac:PartyTaxScheme><cbc:CompanyID>${s.vat}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` +
    `<cac:PartyLegalEntity><cbc:RegistrationName>${esc(s.name)}</cbc:RegistrationName></cac:PartyLegalEntity>` +
    `</cac:Party></cac:AccountingSupplierParty>` +
    `<cac:AccountingCustomerParty><cac:Party>` +
    (b
      ? `<cac:PostalAddress><cbc:StreetName>${esc(b.street)}</cbc:StreetName><cbc:BuildingNumber>${b.building}</cbc:BuildingNumber><cbc:CitySubdivisionName>${esc(b.district)}</cbc:CitySubdivisionName><cbc:CityName>${esc(b.city)}</cbc:CityName><cbc:PostalZone>${b.postal}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>` +
        (b.vat
          ? `<cac:PartyTaxScheme><cbc:CompanyID>${b.vat}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`
          : "") +
        `<cac:PartyLegalEntity><cbc:RegistrationName>${esc(b.name)}</cbc:RegistrationName></cac:PartyLegalEntity>`
      : "") +
    `</cac:Party></cac:AccountingCustomerParty>` +
    (isStd ? `<cac:Delivery><cbc:ActualDeliveryDate>${inp.issueDate}</cbc:ActualDeliveryDate></cac:Delivery>` : "") +
    `<cac:PaymentMeans><cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>` +
    (inp.billingReference ? `<cbc:InstructionNote>${esc(inp.billingReference.reason)}</cbc:InstructionNote>` : "") +
    `</cac:PaymentMeans>` +
    `<cac:TaxTotal><cbc:TaxAmount ${S}>${m(t.vat)}</cbc:TaxAmount></cac:TaxTotal>` +
    `<cac:TaxTotal><cbc:TaxAmount ${S}>${m(t.vat)}</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount ${S}>${m(t.net)}</cbc:TaxableAmount><cbc:TaxAmount ${S}>${m(t.vat)}</cbc:TaxAmount><cac:TaxCategory><cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID><cbc:Percent>15.00</cbc:Percent><cac:TaxScheme><cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>` +
    `<cac:LegalMonetaryTotal><cbc:LineExtensionAmount ${S}>${m(t.net)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount ${S}>${m(t.net)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount ${S}>${m(t.gross)}</cbc:TaxInclusiveAmount><cbc:AllowanceTotalAmount ${S}>0.00</cbc:AllowanceTotalAmount><cbc:PrepaidAmount ${S}>0.00</cbc:PrepaidAmount><cbc:PayableAmount ${S}>${m(t.gross)}</cbc:PayableAmount></cac:LegalMonetaryTotal>` +
    t.lines
      .map(
        (l, i) =>
          `<cac:InvoiceLine><cbc:ID>${i + 1}</cbc:ID><cbc:InvoicedQuantity unitCode="PCE">${l.qty.toFixed(6)}</cbc:InvoicedQuantity><cbc:LineExtensionAmount ${S}>${m(l.net)}</cbc:LineExtensionAmount>` +
          `<cac:TaxTotal><cbc:TaxAmount ${S}>${m(l.vat)}</cbc:TaxAmount><cbc:RoundingAmount ${S}>${m(l.net + l.vat)}</cbc:RoundingAmount></cac:TaxTotal>` +
          `<cac:Item><cbc:Name>${esc(l.name)}</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${l.vatRate.toFixed(2)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>` +
          `<cac:Price><cbc:PriceAmount ${S}>${m(l.unitPrice)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`,
      )
      .join("");
  return { pre, qr, post };
}

// Canonical attribute/namespace order: default ns first, then prefixes alphabetically.
const ROOT_OPEN =
  `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" ` +
  `xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" ` +
  `xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" ` +
  `xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">`;

const CAC_SIGNATURE =
  `<cac:Signature><cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>` +
  `<cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod></cac:Signature>`;

const DS = 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#"';

/** SignedProperties in exclusive-canonical form (namespaces declared where first used). */
function signedProperties(signingTime: string, cert: CertInfo, certHash: string, withNs: boolean) {
  const ds = withNs ? ` ${DS}` : "";
  return (
    `<xades:SignedProperties${withNs ? ' xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"' : ""} Id="xadesSignedProperties">` +
    `<xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime>` +
    `<xades:SigningCertificate><xades:Cert><xades:CertDigest>` +
    (process.env.SP_VARIANT === "c14n"
      ? `<ds:DigestMethod${ds} Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>`
      : `<ds:DigestMethod${ds} Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`) +
    `<ds:DigestValue${ds}>${certHash}</ds:DigestValue></xades:CertDigest>` +
    `<xades:IssuerSerial><ds:X509IssuerName${ds}>${esc(cert.issuerName)}</ds:X509IssuerName>` +
    `<ds:X509SerialNumber${ds}>${cert.serialDecimal}</ds:X509SerialNumber></xades:IssuerSerial>` +
    `</xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`
  );
}

export interface SignedInvoice {
  xml: string;
  invoiceHash: string; // base64(sha256(canonical invoice))
  signature: string; // base64 DER ECDSA
  qr: string; // base64 TLV
}

export function signInvoice(
  inp: InvoiceInput,
  privateKey: Uint8Array,
  cert: CertInfo,
  signingTime = `${inp.issueDate}T${inp.issueTime}`,
): SignedInvoice {
  // 1) invoice hash over canonical doc without UBLExtensions / cac:Signature / QR
  const parts = body(inp, null);
  const forHash = ROOT_OPEN + parts.pre + parts.post + `</Invoice>`;
  const hashBytes = sha256(enc.encode(forHash));
  const invoiceHash = b64(hashBytes);

  // 2) ECDSA-SHA256 signature. Matches the widely used open-source implementations
  //    accepted by ZATCA (they feed the raw 32-byte invoice digest into SHA256withECDSA).
  const signature = b64(secp256k1.sign(sha256(hashBytes), privateKey).toDERRawBytes());

  // 3) certificate digest = base64( hex( sha256( base64Cert ) ) )
  const certHash = b64(enc.encode(bytesToHex(sha256(enc.encode(cert.base64)))));

  // 4) signed properties digest = base64( hex( sha256( SignedProperties ) ) )
  const sp = signedProperties(signingTime, cert, certHash, true);
  const spHash = b64(enc.encode(bytesToHex(sha256(enc.encode(sp)))));

  // 5) QR (tags 1-9) for simplified documents
  const t = totals(inp);
  const qr = buildQr({
    sellerName: inp.seller.name,
    vatNumber: inp.seller.vat,
    timestamp: `${inp.issueDate}T${inp.issueTime}`,
    total: m(t.gross),
    vat: m(t.vat),
    invoiceHash,
    signature,
    publicKey: cert.publicKeySpki,
    certSignature: cert.signatureValue,
  });

  const ublExtensions =
    `<ext:UBLExtensions><ext:UBLExtension><ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI><ext:ExtensionContent>` +
    `<sig:UBLDocumentSignatures xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2" xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2">` +
    `<sac:SignatureInformation><cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>` +
    `<sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>` +
    `<ds:Signature ${DS} Id="signature"><ds:SignedInfo>` +
    `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"></ds:CanonicalizationMethod>` +
    `<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"></ds:SignatureMethod>` +
    `<ds:Reference Id="invoiceSignedData" URI=""><ds:Transforms>` +
    `<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath></ds:Transform>` +
    `<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath></ds:Transform>` +
    `<ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath></ds:Transform>` +
    `<ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"></ds:Transform></ds:Transforms>` +
    `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${invoiceHash}</ds:DigestValue></ds:Reference>` +
    `<ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties">` +
    `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod><ds:DigestValue>${spHash}</ds:DigestValue></ds:Reference>` +
    `</ds:SignedInfo><ds:SignatureValue>${signature}</ds:SignatureValue>` +
    `<ds:KeyInfo><ds:X509Data><ds:X509Certificate>${cert.base64}</ds:X509Certificate></ds:X509Data></ds:KeyInfo>` +
    `<ds:Object><xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="signature">` +
    signedProperties(signingTime, cert, certHash, false) +
    `</xades:QualifyingProperties></ds:Object></ds:Signature></sac:SignatureInformation></sig:UBLDocumentSignatures>` +
    `</ext:ExtensionContent></ext:UBLExtension></ext:UBLExtensions>`;

  const finalParts = body(inp, qr);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    ROOT_OPEN + ublExtensions + finalParts.pre + finalParts.qr + CAC_SIGNATURE + finalParts.post + `</Invoice>`;

  return { xml, invoiceHash, signature, qr };
}
