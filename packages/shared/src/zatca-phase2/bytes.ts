/**
 * Byte helpers that run unchanged on Cloudflare Workers, Bun, Node and Hermes
 * (no Buffer, no atob/btoa dependency for binary data).
 */

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_LOOKUP = (() => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64.length; i++) table[B64.charCodeAt(i)] = i;
  return table;
})();

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export function utf8(text: string): Uint8Array {
  return encoder.encode(text);
}

export function fromUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] as number;
    const b1 = i + 1 < bytes.length ? (bytes[i + 1] as number) : 0;
    const b2 = i + 2 < bytes.length ? (bytes[i + 2] as number) : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[b2 & 0x3f] : "=";
  }
  return out;
}

/** Decodes standard base64; whitespace is ignored, invalid characters throw. */
export function fromBase64(input: string): Uint8Array {
  const clean = input.replace(/[\s]/g, "").replace(/=+$/, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let o = 0;
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const v = code < 128 ? (B64_LOOKUP[code] as number) : -1;
    if (v < 0) throw new Error(`Invalid base64 character at ${i}`);
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) throw new Error("Invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] as number) ^ (b[i] as number);
  return diff === 0;
}
