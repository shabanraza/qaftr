// Minimal DER encoder/decoder: just enough ASN.1 to build a ZATCA CSR and to
// read issuer / serial / public key / signature out of the returned X.509 cert.
// Pure Uint8Array code: runs unchanged in Node, Bun, browsers and Cloudflare Workers.

export const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

const len = (n: number): Uint8Array => {
  if (n < 0x80) return Uint8Array.of(n);
  const bytes: number[] = [];
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
};

export const tlv = (tag: number, ...content: Uint8Array[]): Uint8Array => {
  const body = concat(...content);
  return concat(Uint8Array.of(tag), len(body.length), body);
};

export const seq = (...c: Uint8Array[]) => tlv(0x30, ...c);
export const set = (...c: Uint8Array[]) => tlv(0x31, ...c);
export const utf8 = (s: string) => tlv(0x0c, new TextEncoder().encode(s));
export const printable = (s: string) => tlv(0x13, new TextEncoder().encode(s));
export const octet = (b: Uint8Array) => tlv(0x04, b);
export const bitString = (b: Uint8Array) => tlv(0x03, Uint8Array.of(0), b);
export const int = (n: number) => tlv(0x02, Uint8Array.of(n));
export const ctx = (n: number, constructed: boolean, ...c: Uint8Array[]) =>
  tlv((constructed ? 0xa0 : 0x80) | n, ...c);

export const oid = (dotted: string): Uint8Array => {
  const parts = dotted.split(".").map(Number);
  const out: number[] = [40 * parts[0] + parts[1]];
  for (const p of parts.slice(2)) {
    const stack: number[] = [p & 0x7f];
    let v = p >>> 7;
    while (v > 0) {
      stack.unshift((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    out.push(...stack);
  }
  return tlv(0x06, Uint8Array.from(out));
};

// ---- decoding ---------------------------------------------------------------

export interface Node {
  tag: number;
  start: number; // offset of tag byte
  headerLen: number;
  len: number;
  bytes: Uint8Array; // full TLV bytes
  value: Uint8Array; // content bytes
  children?: Node[];
}

export const parse = (buf: Uint8Array, offset = 0): Node => {
  const tag = buf[offset];
  let l = buf[offset + 1];
  let headerLen = 2;
  if (l & 0x80) {
    const n = l & 0x7f;
    l = 0;
    for (let i = 0; i < n; i++) l = (l << 8) | buf[offset + 2 + i];
    headerLen += n;
  }
  const node: Node = {
    tag,
    start: offset,
    headerLen,
    len: l,
    bytes: buf.subarray(offset, offset + headerLen + l),
    value: buf.subarray(offset + headerLen, offset + headerLen + l),
  };
  if (tag & 0x20) {
    node.children = [];
    let p = offset + headerLen;
    while (p < offset + headerLen + l) {
      const child = parse(buf, p);
      node.children.push(child);
      p += child.headerLen + child.len;
    }
  }
  return node;
};

export const oidToString = (v: Uint8Array): string => {
  const out = [Math.floor(v[0] / 40), v[0] % 40];
  let acc = 0;
  for (const b of v.subarray(1)) {
    acc = (acc << 7) | (b & 0x7f);
    if (!(b & 0x80)) {
      out.push(acc);
      acc = 0;
    }
  }
  return out.join(".");
};
