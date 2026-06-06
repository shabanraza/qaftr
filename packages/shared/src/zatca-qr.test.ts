import { describe, expect, it } from "bun:test";
import { encodeZatcaQr, ZATCA_QR_TAGS, type ZatcaQrData } from "./zatca-qr";

const sample: ZatcaQrData = {
  sellerName: "شركة مثال", // Arabic name -> multi-byte UTF-8, exercises byte-length logic
  vatNumber: "300000000000003",
  timestamp: "2026-06-05T15:30:00.000Z",
  invoiceTotal: "115.00",
  vatTotal: "15.00",
};

function decodeTlv(base64: string): Map<number, string> {
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  const decoder = new TextDecoder();
  const fields = new Map<number, string>();
  let i = 0;
  while (i < bytes.length) {
    const tag = bytes[i] as number;
    const length = bytes[i + 1] as number;
    const value = decoder.decode(bytes.subarray(i + 2, i + 2 + length));
    fields.set(tag, value);
    i += 2 + length;
  }
  return fields;
}

describe("encodeZatcaQr", () => {
  it("produces a valid base64 string", () => {
    const payload = encodeZatcaQr(sample);
    expect(payload).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });

  it("round-trips all 5 TLV fields including multi-byte Arabic", () => {
    const fields = decodeTlv(encodeZatcaQr(sample));
    expect(fields.get(ZATCA_QR_TAGS.sellerName)).toBe(sample.sellerName);
    expect(fields.get(ZATCA_QR_TAGS.vatNumber)).toBe(sample.vatNumber);
    expect(fields.get(ZATCA_QR_TAGS.timestamp)).toBe(sample.timestamp);
    expect(fields.get(ZATCA_QR_TAGS.invoiceTotal)).toBe(sample.invoiceTotal);
    expect(fields.get(ZATCA_QR_TAGS.vatTotal)).toBe(sample.vatTotal);
  });

  it("throws when a field exceeds the single-byte length limit", () => {
    expect(() => encodeZatcaQr({ ...sample, sellerName: "a".repeat(256) })).toThrow(RangeError);
  });
});
