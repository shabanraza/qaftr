/**
 * ZATCA e-invoicing Phase 1 (Generation) QR payload encoder.
 *
 * The QR encodes 5 fields as TLV (Tag-Length-Value), where each entry is:
 *   [tag: 1 byte][length: 1 byte][value: UTF-8 bytes]
 * The concatenated TLV buffer is then Base64-encoded; that string is the QR payload.
 *
 * Implemented dependency-free (Uint8Array + TextEncoder + manual Base64) so it
 * behaves identically on Hermes (React Native), Cloudflare Workers, and Node.
 */

const textEncoder = new TextEncoder();

/** Single-byte length means each field value must encode to <= 255 UTF-8 bytes. */
const MAX_FIELD_BYTES = 255;

export const ZATCA_QR_TAGS = {
  sellerName: 1,
  vatNumber: 2,
  timestamp: 3,
  invoiceTotal: 4,
  vatTotal: 5,
} as const;

export interface ZatcaQrData {
  /** Seller's registered (legal) name. */
  sellerName: string;
  /** Seller's 15-digit VAT registration number. */
  vatNumber: string;
  /** Invoice issue timestamp in ISO 8601 (e.g. 2026-06-05T15:30:00Z). */
  timestamp: string;
  /** Invoice grand total including VAT, as a decimal string (e.g. "115.00"). */
  invoiceTotal: string;
  /** VAT total, as a decimal string (e.g. "15.00"). */
  vatTotal: string;
}

function encodeTlvField(tag: number, value: string): Uint8Array {
  const valueBytes = textEncoder.encode(value);
  if (valueBytes.length > MAX_FIELD_BYTES) {
    throw new RangeError(
      `ZATCA QR field (tag ${tag}) is ${valueBytes.length} bytes; max is ${MAX_FIELD_BYTES}.`,
    );
  }
  const field = new Uint8Array(2 + valueBytes.length);
  field[0] = tag;
  field[1] = valueBytes.length;
  field.set(valueBytes, 2);
  return field;
}

function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array): string {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] as number;
    const b1 = i + 1 < bytes.length ? (bytes[i + 1] as number) : 0;
    const b2 = i + 2 < bytes.length ? (bytes[i + 2] as number) : 0;

    output += BASE64_ALPHABET[b0 >> 2];
    output += BASE64_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    output += i + 1 < bytes.length ? BASE64_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    output += i + 2 < bytes.length ? BASE64_ALPHABET[b2 & 0x3f] : "=";
  }
  return output;
}

/**
 * Encode ZATCA Phase 1 invoice data into the Base64 TLV string used as the QR payload.
 */
export function encodeZatcaQr(data: ZatcaQrData): string {
  const tlv = concatBytes([
    encodeTlvField(ZATCA_QR_TAGS.sellerName, data.sellerName),
    encodeTlvField(ZATCA_QR_TAGS.vatNumber, data.vatNumber),
    encodeTlvField(ZATCA_QR_TAGS.timestamp, data.timestamp),
    encodeTlvField(ZATCA_QR_TAGS.invoiceTotal, data.invoiceTotal),
    encodeTlvField(ZATCA_QR_TAGS.vatTotal, data.vatTotal),
  ]);
  return bytesToBase64(tlv);
}
