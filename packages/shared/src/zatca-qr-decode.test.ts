import { describe, expect, it } from "bun:test";
import { encodeZatcaQr } from "./zatca-qr";
import { encodeQrTlv } from "./zatca-phase2/qr";
import { decodeZatcaQrPayload } from "./zatca-qr-decode";

const PHASE1 = {
  sellerName: "شركة قافتر للتجارة",
  vatNumber: "300000000000003",
  timestamp: "2026-11-13T10:30:00Z",
  invoiceTotal: "1150.00",
  vatTotal: "150.00",
};

const toB64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes));
const codes = (r: ReturnType<typeof decodeZatcaQrPayload>) =>
  r.ok ? r.qr.issues.map((i) => `${i.severity}:${i.code}`) : [`fail:${r.error}`];

describe("decodeZatcaQrPayload — Phase 1", () => {
  it("decodes the five fields of a valid QR with no issues", () => {
    const r = decodeZatcaQrPayload(encodeZatcaQr(PHASE1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.qr).toMatchObject({
      phase: 1,
      sellerName: "شركة قافتر للتجارة",
      vatNumber: "300000000000003",
      timestamp: "2026-11-13T10:30:00Z",
      total: "1150.00",
      vatTotal: "150.00",
      tags: [1, 2, 3, 4, 5],
    });
    expect(r.qr.issues).toEqual([]);
  });

  it("tolerates whitespace, line breaks and base64url characters", () => {
    const b64 = encodeZatcaQr(PHASE1);
    const messy = `  ${b64.slice(0, 20)}\n${b64.slice(20)}  `.replace(/\+/g, "-").replace(/\//g, "_");
    expect(decodeZatcaQrPayload(messy).ok).toBe(true);
  });

  it("flags a date-only timestamp, an invalid VAT number and VAT above the total", () => {
    const r = decodeZatcaQrPayload(
      encodeZatcaQr({ ...PHASE1, vatNumber: "123456789012345", timestamp: "2026-11-13", vatTotal: "2000.00" }),
    );
    expect(codes(r)).toEqual(["error:VAT_NUMBER_INVALID", "error:TIMESTAMP_DATE_ONLY", "error:VAT_EXCEEDS_TOTAL"]);
  });

  it("warns (not errors) when VAT is not 15% of the net amount", () => {
    expect(codes(decodeZatcaQrPayload(encodeZatcaQr({ ...PHASE1, vatTotal: "100.00" })))).toEqual([
      "warning:VAT_NOT_15",
    ]);
    expect(codes(decodeZatcaQrPayload(encodeZatcaQr({ ...PHASE1, vatTotal: "0.00" })))).toEqual([]);
  });

  it("flags non-numeric amounts", () => {
    expect(codes(decodeZatcaQrPayload(encodeZatcaQr({ ...PHASE1, invoiceTotal: "SAR 1,150" })))).toEqual([
      "error:TOTAL_INVALID",
    ]);
  });

  it("reports missing required tags", () => {
    // only tags 1 and 2
    const tlv = [1, 1, 0x41, 2, 15, ...[..."300000000000003"].map((c) => c.charCodeAt(0))];
    expect(codes(decodeZatcaQrPayload(toB64(tlv)))).toEqual([
      "error:TIMESTAMP_MISSING",
      "error:TOTAL_MISSING",
      "error:VAT_TOTAL_MISSING",
    ]);
  });
});

describe("decodeZatcaQrPayload — Phase 2", () => {
  const phase2 = (withTag9: boolean) =>
    encodeQrTlv({
      sellerName: PHASE1.sellerName,
      vatNumber: PHASE1.vatNumber,
      timestamp: "2026-11-13T10:30:00",
      totalWithVat: "1150.00",
      vatTotal: "150.00",
      invoiceHash: "z5F9qsS6oWyDhehD8u8S0BaE4HcTxYjIvTBmHVbDxe8=",
      signature: "MEUCIQDk5Q0lJ3oT7m4sQ0Yk1o3nZ0yZbDqV5o7m4sQ0Yk1o3nZ0yZbDqV5o",
      publicKey: new Uint8Array(88).fill(7),
      ...(withTag9 ? { certificateSignature: new Uint8Array(71).fill(9) } : {}),
    });

  it("detects Phase 2 tags 6–9 and reports their presence", () => {
    const r = decodeZatcaQrPayload(phase2(true));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.qr.phase).toBe(2);
    expect(r.qr.tags).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(r.qr.invoiceHash).toBe("z5F9qsS6oWyDhehD8u8S0BaE4HcTxYjIvTBmHVbDxe8=");
    expect(r.qr.publicKeyBytes).toBe(88);
    expect(r.qr.certificateSignatureBytes).toBe(71);
    expect(r.qr.issues).toEqual([]);
  });

  it("accepts a standard-invoice QR without tag 9", () => {
    const r = decodeZatcaQrPayload(phase2(false));
    expect(r.ok && r.qr.phase === 2 && r.qr.certificateSignatureBytes === undefined).toBe(true);
    expect(codes(r)).toEqual([]);
  });

  it("flags a Phase 2 QR missing the signature or public key", () => {
    const b64 = encodeZatcaQr(PHASE1);
    const bytes = [...atob(b64)].map((c) => c.charCodeAt(0));
    const withHashOnly = toB64([...bytes, 6, 3, 0x61, 0x62, 0x63]);
    expect(codes(decodeZatcaQrPayload(withHashOnly))).toEqual(["error:PHASE2_INCOMPLETE"]);
  });
});

describe("decodeZatcaQrPayload — not a ZATCA QR", () => {
  it("rejects empty input, URLs, non-base64 and truncated TLV", () => {
    expect(codes(decodeZatcaQrPayload("   "))).toEqual(["fail:EMPTY"]);
    expect(codes(decodeZatcaQrPayload("https://example.com/invoice/42"))).toEqual(["fail:IS_URL"]);
    expect(codes(decodeZatcaQrPayload("not base64 at all!"))).toEqual(["fail:NOT_BASE64"]);
    expect(codes(decodeZatcaQrPayload(toB64([1, 10, 0x41])))).toEqual(["fail:TLV_TRUNCATED"]);
  });

  it("rejects TLV that has none of the ZATCA tags", () => {
    expect(codes(decodeZatcaQrPayload(toB64([0x20, 1, 0x41, 0x30, 1, 0x42])))).toEqual(["fail:NOT_ZATCA"]);
    expect(codes(decodeZatcaQrPayload(btoa("hello world")))).toEqual(["fail:NOT_ZATCA"]);
  });
});
