import { describe, expect, it } from "bun:test";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { toBase64, utf8 } from "./bytes";
import { certificateFromBinarySecurityToken, parseCertificate } from "./certificate";
import { TEST_CERT_SERIAL, TEST_SIGNER_KEY, createTestCertificate } from "./fixtures";
import { publicKeyFromPrivate, toPem } from "./keys";

describe("parseCertificate", () => {
  const der = createTestCertificate();

  it("extracts issuer (RFC 4514 order, ', ' separated) and decimal serial", () => {
    const cert = parseCertificate(toBase64(der));
    expect(cert.issuerName).toBe("CN=TSZEINVOICE-SubCA-1, DC=extgazt, DC=gov, DC=local");
    expect(cert.serialNumber).toBe(TEST_CERT_SERIAL.toString(10));
    expect(cert.subjectName).toBe("CN=TST-886431145-399999999900003, O=Qaftr Test Co, OU=Riyadh Branch, C=SA");
  });

  it("exposes public key (raw and SPKI), signature bytes and base64 body", () => {
    const cert = parseCertificate(toPem("CERTIFICATE", der));
    expect(cert.publicKey).toEqual(publicKeyFromPrivate(TEST_SIGNER_KEY));
    expect(cert.publicKeySpki.length).toBe(88);
    expect(cert.base64).toBe(toBase64(der));
    // Self-signed fixture: certificate signature verifies over TBS with its own key.
    expect(secp256k1.verify(cert.signature, cert.tbs, cert.publicKey, { format: "der", lowS: false })).toBe(true);
    expect(cert.notAfter.getTime()).toBeGreaterThan(cert.notBefore.getTime());
  });

  it("decodes a ZATCA binarySecurityToken (base64 of the base64 certificate)", () => {
    const token = toBase64(utf8(toBase64(der)));
    expect(certificateFromBinarySecurityToken(token).base64).toBe(toBase64(der));
  });
});
