/** Minimal DER encoder/decoder (enough for PKCS#10, SEC1/PKCS#8 and X.509). */

import { concatBytes, utf8 } from "./bytes";

function encodeLength(len: number): Uint8Array {
  if (len < 0x80) return new Uint8Array([len]);
  const bytes: number[] = [];
  for (let n = len; n > 0; n = Math.floor(n / 256)) bytes.unshift(n & 0xff);
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function tlv(tag: number, content: Uint8Array): Uint8Array {
  return concatBytes(new Uint8Array([tag]), encodeLength(content.length), content);
}

function encodeOid(oid: string): Uint8Array {
  const parts = oid.split(".").map((p) => BigInt(p));
  const first = (parts[0] as bigint) * 40n + (parts[1] as bigint);
  const out: number[] = [];
  for (const arc of [first, ...parts.slice(2)]) {
    const chunk: number[] = [Number(arc & 0x7fn)];
    for (let v = arc >> 7n; v > 0n; v >>= 7n) chunk.unshift(Number(v & 0x7fn) | 0x80);
    out.push(...chunk);
  }
  return new Uint8Array(out);
}

function encodeInt(value: bigint | Uint8Array): Uint8Array {
  let bytes: Uint8Array;
  if (typeof value === "bigint") {
    if (value < 0n) throw new Error("negative INTEGER not supported");
    let hex = value.toString(16);
    if (hex.length % 2) hex = `0${hex}`;
    bytes = Uint8Array.from(hex.match(/../g) ?? ["00"], (h) => parseInt(h, 16));
  } else {
    let i = 0;
    while (i < value.length - 1 && value[i] === 0) i++;
    bytes = value.subarray(i);
  }
  if (((bytes[0] ?? 0) & 0x80) !== 0) bytes = concatBytes(new Uint8Array([0]), bytes);
  return tlv(0x02, bytes);
}

function time(date: Date, generalized: boolean): Uint8Array {
  const iso = date.toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDhhmmss
  return generalized ? tlv(0x18, utf8(`${iso}Z`)) : tlv(0x17, utf8(`${iso.slice(2)}Z`));
}

export const der = {
  tlv,
  seq: (...children: Uint8Array[]) => tlv(0x30, concatBytes(...children)),
  set: (...children: Uint8Array[]) => tlv(0x31, concatBytes(...children)),
  int: encodeInt,
  bool: (v: boolean) => tlv(0x01, new Uint8Array([v ? 0xff : 0])),
  oid: (oid: string) => tlv(0x06, encodeOid(oid)),
  null: () => new Uint8Array([0x05, 0x00]),
  octet: (b: Uint8Array) => tlv(0x04, b),
  bitString: (b: Uint8Array, unusedBits = 0) => tlv(0x03, concatBytes(new Uint8Array([unusedBits]), b)),
  utf8: (s: string) => tlv(0x0c, utf8(s)),
  printable: (s: string) => {
    if (!/^[A-Za-z0-9 '()+,\-./:=?]*$/.test(s)) throw new Error(`Not a PrintableString: ${s}`);
    return tlv(0x13, utf8(s));
  },
  ia5: (s: string) => tlv(0x16, utf8(s)),
  utcTime: (d: Date) => time(d, false),
  generalizedTime: (d: Date) => time(d, true),
  /** Context-specific tag [n]; constructed => EXPLICIT-style wrapper. */
  ctx: (n: number, constructed: boolean, content: Uint8Array) => tlv(0x80 | (constructed ? 0x20 : 0) | n, content),
};

export interface Asn1Node {
  tag: number;
  /** Content octets. */
  value: Uint8Array;
  /** Whole TLV. */
  raw: Uint8Array;
  children?: Asn1Node[];
}

function decodeAt(bytes: Uint8Array, offset: number): Asn1Node {
  const tag = bytes[offset];
  if (tag === undefined) throw new Error("DER: unexpected end");
  if ((tag & 0x1f) === 0x1f) throw new Error("DER: high tag numbers not supported");
  let lenByte = bytes[offset + 1];
  if (lenByte === undefined) throw new Error("DER: missing length");
  let pos = offset + 2;
  let len = lenByte;
  if (lenByte & 0x80) {
    const n = lenByte & 0x7f;
    if (n === 0 || n > 4) throw new Error("DER: unsupported length");
    len = 0;
    for (let i = 0; i < n; i++) {
      lenByte = bytes[pos++];
      if (lenByte === undefined) throw new Error("DER: truncated length");
      len = len * 256 + lenByte;
    }
  }
  if (pos + len > bytes.length) throw new Error("DER: truncated value");
  const node: Asn1Node = { tag, value: bytes.subarray(pos, pos + len), raw: bytes.subarray(offset, pos + len) };
  if (tag & 0x20) {
    node.children = [];
    let p = pos;
    while (p < pos + len) {
      const child = decodeAt(bytes, p);
      node.children.push(child);
      p += child.raw.length;
    }
  }
  return node;
}

export function decodeDer(bytes: Uint8Array): Asn1Node {
  const node = decodeAt(bytes, 0);
  if (node.raw.length !== bytes.length) throw new Error("DER: trailing bytes");
  return node;
}

export function decodeOid(content: Uint8Array): string {
  const arcs: bigint[] = [];
  let v = 0n;
  for (const b of content) {
    v = (v << 7n) | BigInt(b & 0x7f);
    if (!(b & 0x80)) {
      arcs.push(v);
      v = 0n;
    }
  }
  const first = arcs.shift() ?? 0n;
  const a = first < 80n ? first / 40n : 2n;
  return [a, first - a * 40n, ...arcs].join(".");
}

export function decodeInt(content: Uint8Array): bigint {
  let v = 0n;
  for (const b of content) v = (v << 8n) | BigInt(b);
  return v;
}

export function child(node: Asn1Node, index: number): Asn1Node {
  const c = node.children?.[index];
  if (!c) throw new Error(`DER: missing child ${index}`);
  return c;
}

export const OID = {
  ecPublicKey: "1.2.840.10045.2.1",
  secp256k1: "1.3.132.0.10",
  ecdsaWithSha256: "1.2.840.10045.4.3.2",
  extensionRequest: "1.2.840.113549.1.9.14",
  subjectAltName: "2.5.29.17",
  certificateTemplateName: "1.3.6.1.4.1.311.20.2",
  commonName: "2.5.4.3",
  surname: "2.5.4.4",
  serialNumber: "2.5.4.5",
  country: "2.5.4.6",
  locality: "2.5.4.7",
  state: "2.5.4.8",
  organization: "2.5.4.10",
  organizationalUnit: "2.5.4.11",
  title: "2.5.4.12",
  businessCategory: "2.5.4.15",
  registeredAddress: "2.5.4.26",
  uid: "0.9.2342.19200300.100.1.1",
  domainComponent: "0.9.2342.19200300.100.1.25",
  email: "1.2.840.113549.1.9.1",
} as const;
