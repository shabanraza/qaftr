import { describe, expect, it } from "bun:test";
import { fromBase64, fromUtf8, toHex } from "./bytes";
import { decodeQrTlv, encodeQrTlv } from "./qr";

const BASE = {
  sellerName: "شركة قفطر",
  vatNumber: "399999999900003",
  timestamp: "2026-11-09T14:40:40",
  totalWithVat: "148.33",
  vatTotal: "15.00",
  invoiceHash: "mA6t2R9EkBGXTXcK9x8e1qbK1lXzZsY2nJ8Y5mN6rX0=",
  signature: "MEUCIQ==",
  publicKey: new Uint8Array([0x30, 0x56, 1, 2, 3]),
};

describe("encodeQrTlv (Phase 2 tags 1-9)", () => {
  it("encodes tags 1-8 as tag|len|value, text as UTF-8, key as raw bytes", () => {
    const bytes = fromBase64(encodeQrTlv(BASE));
    // Tag 1: Arabic name (multi-byte length) — constructed vector checked byte-wise.
    const nameBytes = new TextEncoder().encode(BASE.sellerName);
    expect(bytes[0]).toBe(1);
    expect(bytes[1]).toBe(nameBytes.length);
    expect(toHex(bytes.subarray(2, 2 + nameBytes.length))).toBe(toHex(nameBytes));
    const tags = decodeQrTlv(encodeQrTlv(BASE));
    expect([...tags.keys()]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(fromUtf8(tags.get(6)!)).toBe(BASE.invoiceHash);
    expect(fromUtf8(tags.get(7)!)).toBe(BASE.signature);
    expect(tags.get(8)).toEqual(BASE.publicKey);
  });

  it("adds tag 9 (certificate signature) when provided (simplified invoices)", () => {
    const tags = decodeQrTlv(encodeQrTlv({ ...BASE, certificateSignature: new Uint8Array([9, 9]) }));
    expect(tags.get(9)).toEqual(new Uint8Array([9, 9]));
  });

  it("rejects values longer than 255 bytes", () => {
    expect(() => encodeQrTlv({ ...BASE, sellerName: "x".repeat(256) })).toThrow(RangeError);
  });
});
