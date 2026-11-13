/**
 * ZATCA invoice hash (KSA-13 / XAdES invoiceSignedData digest).
 *
 * Steps declared by the ds:Reference transforms in the signature:
 *   1. remove ext:UBLExtensions
 *   2. remove cac:Signature
 *   3. remove cac:AdditionalDocumentReference whose cbc:ID is "QR"
 *   4. Canonical XML 1.1 (http://www.w3.org/2006/12/xml-c14n11)
 * then SHA-256 over the UTF-8 bytes, base64-encoded (raw digest bytes).
 *
 * Whitespace text nodes adjacent to removed elements are KEPT (XPath filter
 * semantics). Our own builder emits no inter-element whitespace, so this is
 * only relevant when hashing pretty-printed third-party XML.
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { toBase64, toHex, utf8 } from "./bytes";
import { NS } from "./namespaces";
import { canonicalize, type ElementInfo } from "./xml";

/**
 * PIH for the first invoice of an EGS unit. Note the ZATCA quirk: this is
 * base64 of the HEX string of SHA-256("0"), unlike invoice hashes which are
 * base64 of the raw digest.
 */
export const FIRST_INVOICE_PIH = toBase64(utf8(toHex(sha256(utf8("0")))));

function isQrReference(info: ElementInfo): boolean {
  if (info.localName !== "AdditionalDocumentReference" || info.namespaceURI !== NS.cac) return false;
  return info.element.children.some(
    (c) =>
      c.type === "element" &&
      (c.name === "cbc:ID" || c.name.endsWith(":ID") || c.name === "ID") &&
      c.children.map((t) => (t.type === "text" ? t.value : "")).join("").trim() === "QR",
  );
}

export function isExcludedFromInvoiceHash(info: ElementInfo): boolean {
  if (info.namespaceURI === NS.ext && info.localName === "UBLExtensions") return true;
  if (info.namespaceURI === NS.cac && info.localName === "Signature") return true;
  return isQrReference(info);
}

export function canonicalInvoiceForHash(xml: string): string {
  return canonicalize(xml, { exclude: isExcludedFromInvoiceHash });
}

export function invoiceHashBytes(xml: string): Uint8Array {
  return sha256(utf8(canonicalInvoiceForHash(xml)));
}

/** base64(SHA-256(C14N11(invoice without UBLExtensions/Signature/QR))) */
export function computeInvoiceHash(xml: string): string {
  return toBase64(invoiceHashBytes(xml));
}
