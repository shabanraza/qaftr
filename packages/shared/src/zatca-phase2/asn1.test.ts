import { describe, expect, it } from "bun:test";
import { decodeDer, decodeOid, der } from "./asn1";
import { toHex } from "./bytes";

describe("DER encoding", () => {
  it("encodes well-known OIDs exactly", () => {
    expect(toHex(der.oid("1.2.840.10045.2.1"))).toBe("06072a8648ce3d0201");
    expect(toHex(der.oid("1.3.132.0.10"))).toBe("06052b8104000a");
    expect(toHex(der.oid("1.3.6.1.4.1.311.20.2"))).toBe("06092b0601040182371402");
  });

  it("encodes integers with sign padding and minimal length", () => {
    expect(toHex(der.int(0n))).toBe("020100");
    expect(toHex(der.int(127n))).toBe("02017f");
    expect(toHex(der.int(128n))).toBe("02020080");
    expect(toHex(der.int(256n))).toBe("02020100");
  });

  it("uses long-form lengths above 127 bytes", () => {
    const big = der.octet(new Uint8Array(200));
    expect(toHex(big.subarray(0, 3))).toBe("0481c8");
    expect(toHex(der.octet(new Uint8Array(300)).subarray(0, 4))).toBe("0482012c");
  });

  it("encodes strings, bit strings, null, context tags and sequences", () => {
    expect(toHex(der.printable("SA"))).toBe("13025341");
    expect(toHex(der.utf8("é"))).toBe("0c02c3a9");
    expect(toHex(der.bitString(new Uint8Array([0xff])))).toBe("030200ff");
    expect(toHex(der.null())).toBe("0500");
    expect(toHex(der.ctx(0, true, der.null()))).toBe("a0020500");
    expect(toHex(der.seq(der.int(1n), der.null()))).toBe("30050201010500");
    expect(toHex(der.set(der.null()))).toBe("31020500");
  });
});

describe("DER decoding", () => {
  it("round-trips nested structures and exposes raw TLV bytes", () => {
    const bytes = der.seq(der.oid("1.3.132.0.10"), der.ctx(1, true, der.utf8("x")), der.octet(new Uint8Array(150)));
    const node = decodeDer(bytes);
    expect(node.tag).toBe(0x30);
    expect(node.children).toHaveLength(3);
    expect(decodeOid(node.children![0]!.value)).toBe("1.3.132.0.10");
    expect(node.children![1]!.tag).toBe(0xa1);
    expect(node.children![1]!.children![0]!.tag).toBe(0x0c);
    expect(node.children![2]!.value.length).toBe(150);
    expect(toHex(node.raw)).toBe(toHex(bytes));
  });

  it("rejects truncated input", () => {
    expect(() => decodeDer(new Uint8Array([0x30, 0x05, 0x02]))).toThrow();
  });
});
