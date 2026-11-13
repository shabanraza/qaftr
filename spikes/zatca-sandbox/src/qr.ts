// Phase 2 QR: TLV (tag 1 byte, length 1 byte, value) for tags 1-9, then base64.
import { concat } from "./der.ts";

const enc = new TextEncoder();

export interface QrInput {
  sellerName: string; // 1
  vatNumber: string; // 2
  timestamp: string; // 3  ISO 8601
  total: string; // 4  invoice total incl. VAT
  vat: string; // 5  VAT total
  invoiceHash: string; // 6  base64 SHA-256 of canonical XML (as text)
  signature: string; // 7  base64 ECDSA signature (as text)
  publicKey: Uint8Array; // 8  SPKI DER bytes
  certSignature?: Uint8Array; // 9  ZATCA CA signature on the stamp cert (simplified only)
}

const field = (tag: number, value: Uint8Array) => {
  if (value.length > 255) throw new Error(`QR tag ${tag} too long (${value.length})`);
  return concat(Uint8Array.of(tag, value.length), value);
};

export function buildQr(q: QrInput): string {
  const parts = [
    field(1, enc.encode(q.sellerName)),
    field(2, enc.encode(q.vatNumber)),
    field(3, enc.encode(q.timestamp)),
    field(4, enc.encode(q.total)),
    field(5, enc.encode(q.vat)),
    field(6, enc.encode(q.invoiceHash)),
    field(7, enc.encode(q.signature)),
    field(8, q.publicKey),
  ];
  if (q.certSignature) parts.push(field(9, q.certSignature));
  return Buffer.from(concat(...parts)).toString("base64");
}

/** Decoder (basis for the public "ZATCA QR decoder" tool). */
export function decodeQr(b64: string): { tag: number; value: Uint8Array }[] {
  const buf = new Uint8Array(Buffer.from(b64, "base64"));
  const out: { tag: number; value: Uint8Array }[] = [];
  for (let i = 0; i < buf.length; ) {
    const tag = buf[i];
    const len = buf[i + 1];
    out.push({ tag, value: buf.subarray(i + 2, i + 2 + len) });
    i += 2 + len;
  }
  return out;
}
