/**
 * Shared test fixtures (imported by *.test.ts only). Values are CONSTRUCTED to
 * satisfy the ZATCA field formats (e.g. VAT 3xxxxxxxxxxxxx3, 4-digit building
 * number, 5-digit postal code); they are not real taxpayers.
 */
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { OID, der } from "./asn1";
import { fromHex } from "./bytes";
import { encodeName } from "./csr";
import { FIRST_INVOICE_PIH } from "./hash";
import { publicKeyFromPrivate, publicKeyToSpki } from "./keys";
import type { ZatcaInvoiceInput } from "./invoice-model";

export const SELLER = {
  registrationName: "شركة قفطر للتجارة & Co",
  vatNumber: "399999999900003",
  otherId: { scheme: "CRN", value: "1010010000" },
  address: {
    street: "King Fahd Road",
    buildingNumber: "1234",
    plotIdentification: "5678",
    district: "Al Olaya",
    city: "Riyadh",
    postalCode: "12211",
    country: "SA",
  },
} as const satisfies ZatcaInvoiceInput["seller"];

export const BUYER = {
  registrationName: "Buyer Trading LLC",
  vatNumber: "300000000000003",
  address: {
    street: "Prince Sultan St",
    buildingNumber: "4321",
    district: "Al Rawdah",
    city: "Jeddah",
    postalCode: "23435",
    country: "SA",
  },
} as const satisfies NonNullable<ZatcaInvoiceInput["buyer"]>;

export function simplifiedInvoice(overrides: Partial<ZatcaInvoiceInput> = {}): ZatcaInvoiceInput {
  return {
    kind: "invoice",
    subtype: "simplified",
    id: "SME00010",
    uuid: "8e6000cf-1a98-4174-b3e7-b5d5954bc10d",
    issueDate: "2026-11-09",
    issueTime: "14:40:40",
    icv: 1,
    pih: FIRST_INVOICE_PIH,
    seller: SELLER,
    paymentMeansCode: "10",
    lines: [
      { name: "قلم Pen", quantity: 2, unitPrice: 50, vatCategory: "S", vatRate: 15 },
      { name: "Book", quantity: 1, unitPrice: 33.33, vatCategory: "Z", vatRate: 0, exemptionReasonCode: "VATEX-SA-35", exemptionReason: "Medicines and medical equipment" },
    ],
    ...overrides,
  };
}

export function standardInvoice(overrides: Partial<ZatcaInvoiceInput> = {}): ZatcaInvoiceInput {
  return simplifiedInvoice({
    subtype: "standard",
    id: "STD00001",
    uuid: "3cf5ee18-ee25-44ea-a444-2c37ba7f28be",
    buyer: BUYER,
    supplyDate: "2026-11-09",
    paymentMeansCode: "42",
    ...overrides,
  });
}

/** Constructed secret key for test signing (never use outside tests). */
export const TEST_SIGNER_KEY = fromHex("0303030303030303030303030303030303030303030303030303030303030303");
export const TEST_CERT_SERIAL = 379112742831380471835263969587287663520528387n;

/**
 * Self-signed X.509 v3 certificate shaped like a ZATCA compliance CSID
 * (issuer DN copied in form from the public ZATCA samples). CONSTRUCTED for
 * tests: ZATCA would sign with its CA key, here the EGS key signs itself.
 */
export function createTestCertificate(privateKey: Uint8Array = TEST_SIGNER_KEY): Uint8Array {
  const issuer = encodeName([
    [OID.domainComponent, der.ia5("local")],
    [OID.domainComponent, der.ia5("gov")],
    [OID.domainComponent, der.ia5("extgazt")],
    [OID.commonName, der.utf8("TSZEINVOICE-SubCA-1")],
  ]);
  const subject = encodeName([
    [OID.country, der.printable("SA")],
    [OID.organizationalUnit, der.utf8("Riyadh Branch")],
    [OID.organization, der.utf8("Qaftr Test Co")],
    [OID.commonName, der.utf8("TST-886431145-399999999900003")],
  ]);
  const sigAlg = der.seq(der.oid(OID.ecdsaWithSha256));
  const tbs = der.seq(
    der.ctx(0, true, der.int(2n)),
    der.int(TEST_CERT_SERIAL),
    sigAlg,
    issuer,
    der.seq(der.utcTime(new Date("2026-01-01T00:00:00Z")), der.utcTime(new Date("2031-01-01T00:00:00Z"))),
    subject,
    publicKeyToSpki(publicKeyFromPrivate(privateKey)),
  );
  return der.seq(tbs, sigAlg, der.bitString(secp256k1.sign(tbs, privateKey, { format: "der" })));
}
