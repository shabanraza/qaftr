import { describe, expect, it } from "bun:test";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { decodeDer, decodeOid, der } from "./asn1";
import { fromBase64, fromHex, toBase64, toHex } from "./bytes";
import {
  generateZatcaKeyPair,
  privateKeyFromPem,
  privateKeyToPem,
  publicKeyFromPrivate,
  publicKeyToSpki,
} from "./keys";

// Constructed vector: secret key 0x01..01 (not a real key).
const SK = fromHex("0101010101010101010101010101010101010101010101010101010101010101");

describe("secp256k1 key handling", () => {
  it("generates a valid secp256k1 key pair with an uncompressed public key", () => {
    const { privateKey, publicKey } = generateZatcaKeyPair();
    expect(privateKey.length).toBe(32);
    expect(publicKey.length).toBe(65);
    expect(publicKey[0]).toBe(0x04);
    expect(toHex(secp256k1.getPublicKey(privateKey, false))).toBe(toHex(publicKey));
  });

  it("exports SEC1 'EC PRIVATE KEY' PEM with curve OID and public key, and re-imports it", () => {
    const pem = privateKeyToPem(SK);
    expect(pem.startsWith("-----BEGIN EC PRIVATE KEY-----\n")).toBe(true);
    expect(pem.trimEnd().endsWith("-----END EC PRIVATE KEY-----")).toBe(true);
    const body = pem.replace(/-----[^-]+-----|\s/g, "");
    const node = decodeDer(Uint8Array.from(atob(body), (c) => c.charCodeAt(0)));
    expect(node.children![0]!.value[0]).toBe(1); // version
    expect(toHex(node.children![1]!.value)).toBe(toHex(SK));
    expect(decodeOid(node.children![2]!.children![0]!.value)).toBe("1.3.132.0.10");
    expect(toHex(privateKeyFromPem(pem))).toBe(toHex(SK));
  });

  it("imports PKCS#8 'PRIVATE KEY' and header-less base64 SEC1 (ZATCA SDK style)", () => {
    const sec1Body = privateKeyToPem(SK).replace(/-----[^-]+-----|\s/g, "");
    expect(toHex(privateKeyFromPem(sec1Body))).toBe(toHex(SK));
    // PKCS#8 wrapping of the same SEC1 key (constructed with our own DER encoder).
    const pkcs8 = `-----BEGIN PRIVATE KEY-----\n${pkcs8Of(sec1Body)}\n-----END PRIVATE KEY-----`;
    expect(toHex(privateKeyFromPem(pkcs8))).toBe(toHex(SK));
  });

  it("encodes SubjectPublicKeyInfo with id-ecPublicKey + secp256k1", () => {
    const spki = publicKeyToSpki(publicKeyFromPrivate(SK));
    expect(spki.length).toBe(88);
    const node = decodeDer(spki);
    expect(decodeOid(node.children![0]!.children![0]!.value)).toBe("1.2.840.10045.2.1");
    expect(decodeOid(node.children![0]!.children![1]!.value)).toBe("1.3.132.0.10");
  });
});

function pkcs8Of(sec1Base64: string): string {
  return toBase64(
    der.seq(der.int(0n), der.seq(der.oid("1.2.840.10045.2.1"), der.oid("1.3.132.0.10")), der.octet(fromBase64(sec1Base64))),
  );
}
