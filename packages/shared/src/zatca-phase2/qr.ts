/**
 * ZATCA Phase 2 QR payload: TLV (1-byte tag, 1-byte length, value), base64.
 *   1 seller name, 2 VAT number, 3 timestamp, 4 total incl. VAT, 5 VAT total,
 *   6 invoice hash (base64 text), 7 ECDSA signature (base64 text),
 *   8 ECDSA public key (DER SPKI bytes),
 *   9 certificate signature by ZATCA CA (DER bytes; simplified invoices).
 */

import { concatBytes, fromBase64, toBase64, utf8 } from "./bytes";

export interface ZatcaQrPhase2Fields {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: string;
  vatTotal: string;
  invoiceHash: string;
  signature: string;
  publicKey: Uint8Array;
  certificateSignature?: Uint8Array;
}

function field(tag: number, value: Uint8Array): Uint8Array {
  if (value.length > 255) throw new RangeError(`QR tag ${tag} is ${value.length} bytes; max is 255`);
  return concatBytes(new Uint8Array([tag, value.length]), value);
}

export function encodeQrTlv(f: ZatcaQrPhase2Fields): string {
  const parts = [
    field(1, utf8(f.sellerName)),
    field(2, utf8(f.vatNumber)),
    field(3, utf8(f.timestamp)),
    field(4, utf8(f.totalWithVat)),
    field(5, utf8(f.vatTotal)),
    field(6, utf8(f.invoiceHash)),
    field(7, utf8(f.signature)),
    field(8, f.publicKey),
  ];
  if (f.certificateSignature) parts.push(field(9, f.certificateSignature));
  return toBase64(concatBytes(...parts));
}

export function decodeQrTlv(base64: string): Map<number, Uint8Array> {
  const bytes = fromBase64(base64);
  const out = new Map<number, Uint8Array>();
  let i = 0;
  while (i < bytes.length) {
    const tag = bytes[i] as number;
    const len = bytes[i + 1];
    if (len === undefined || i + 2 + len > bytes.length) throw new Error("QR TLV truncated");
    out.set(tag, bytes.slice(i + 2, i + 2 + len));
    i += 2 + len;
  }
  return out;
}
