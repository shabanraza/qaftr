/**
 * secp256k1 key generation and PEM import/export (WebCrypto has no secp256k1,
 * so @noble/curves is used; randomness comes from crypto.getRandomValues,
 * available on Workers).
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { OID, child, decodeDer, decodeOid, der } from "./asn1";
import { fromBase64, toBase64 } from "./bytes";

export interface ZatcaKeyPair {
  /** 32-byte secret scalar. Never log or persist unencrypted. */
  privateKey: Uint8Array;
  /** 65-byte uncompressed SEC1 point (0x04 || X || Y). */
  publicKey: Uint8Array;
}

export function generateZatcaKeyPair(): ZatcaKeyPair {
  const privateKey = secp256k1.utils.randomSecretKey();
  return { privateKey, publicKey: secp256k1.getPublicKey(privateKey, false) };
}

export function publicKeyFromPrivate(privateKey: Uint8Array): Uint8Array {
  return secp256k1.getPublicKey(privateKey, false);
}

export function publicKeyToSpki(publicKey: Uint8Array): Uint8Array {
  const point = publicKey.length === 33 ? secp256k1.Point.fromBytes(publicKey).toBytes(false) : publicKey;
  return der.seq(der.seq(der.oid(OID.ecPublicKey), der.oid(OID.secp256k1)), der.bitString(point));
}

export function toPem(label: string, bytes: Uint8Array): string {
  const b64 = toBase64(bytes).replace(/(.{64})/g, "$1\n").replace(/\n$/, "");
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`;
}

export function pemBody(pem: string): Uint8Array {
  return fromBase64(pem.replace(/-----(BEGIN|END) [^-]+-----/g, ""));
}

/** SEC1 ECPrivateKey ("EC PRIVATE KEY"), the format the ZATCA SDK uses. */
export function privateKeyToPem(privateKey: Uint8Array): string {
  const sec1 = der.seq(
    der.int(1n),
    der.octet(privateKey),
    der.ctx(0, true, der.oid(OID.secp256k1)),
    der.ctx(1, true, der.bitString(publicKeyFromPrivate(privateKey))),
  );
  return toPem("EC PRIVATE KEY", sec1);
}

function fromSec1(node: ReturnType<typeof decodeDer>): Uint8Array {
  const key = child(node, 1).value;
  if (key.length !== 32) throw new Error("Expected a 32-byte secp256k1 private key");
  const params = node.children?.find((c) => c.tag === 0xa0);
  if (params && decodeOid(child(params, 0).value) !== OID.secp256k1) throw new Error("Key is not secp256k1");
  return new Uint8Array(key);
}

/** Accepts SEC1 or PKCS#8 PEM, or header-less base64 of either. */
export function privateKeyFromPem(pem: string): Uint8Array {
  const node = decodeDer(pemBody(pem));
  const second = child(node, 1);
  if (second.tag === 0x30) {
    // PKCS#8: version, AlgorithmIdentifier, OCTET STRING(SEC1)
    if (decodeOid(child(second, 1).value) !== OID.secp256k1) throw new Error("Key is not secp256k1");
    return fromSec1(decodeDer(child(node, 2).value));
  }
  return fromSec1(node);
}
