/**
 * Typed input model for ZATCA Phase 2 UBL 2.1 documents.
 * Field references (KSA-x / BT-x) follow the ZATCA E-invoicing XML
 * Implementation Standard and the Detailed Technical Guideline.
 */

export type ZatcaDocumentKind = "invoice" | "credit-note" | "debit-note";
/** standard = B2B tax invoice (clearance); simplified = B2C (reporting). */
export type ZatcaInvoiceSubtype = "standard" | "simplified";
export type ZatcaVatCategory = "S" | "Z" | "E" | "O";

/** UNTDID 1001 codes used by ZATCA. */
export const DOCUMENT_TYPE_CODES: Record<ZatcaDocumentKind, string> = {
  invoice: "388",
  "credit-note": "381",
  "debit-note": "383",
};

/** KSA-2 positions 3..7 (P, N, E, S, B). */
export interface ZatcaTransactionFlags {
  thirdParty?: boolean;
  nominal?: boolean;
  exports?: boolean;
  summary?: boolean;
  selfBilled?: boolean;
}

export const SELLER_ID_SCHEMES = ["CRN", "MOM", "MLS", "700", "SAG", "OTH"] as const;
export type SellerIdScheme = (typeof SELLER_ID_SCHEMES)[number];
export const BUYER_ID_SCHEMES = ["TIN", "CRN", "MOM", "MLS", "700", "SAG", "NAT", "GCC", "IQA", "PAS", "OTH"] as const;
export type BuyerIdScheme = (typeof BUYER_ID_SCHEMES)[number];

/** UNTDID 4461 subset accepted by ZATCA (KSA BT-81). */
export const PAYMENT_MEANS_CODES = ["1", "10", "30", "42", "48"] as const;
export type PaymentMeansCode = (typeof PAYMENT_MEANS_CODES)[number];

export interface ZatcaAddress {
  street: string;
  additionalStreet?: string;
  /** 4 digits (BR-KSA-37) */
  buildingNumber: string;
  /** "Additional number" (KSA-23) */
  plotIdentification?: string;
  /** District / neighbourhood (KSA-3 / KSA-4) */
  district: string;
  city: string;
  /** 5 digits for SA (BR-KSA-66) */
  postalCode: string;
  countrySubentity?: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
}

export interface ZatcaSeller {
  registrationName: string;
  /** 15 digits, starts and ends with 3 (BR-KSA-39). */
  vatNumber: string;
  /** BT-29 other seller ID, required (BR-KSA-08). */
  otherId: { scheme: SellerIdScheme; value: string };
  address: ZatcaAddress;
}

export interface ZatcaBuyer {
  registrationName?: string;
  vatNumber?: string;
  otherId?: { scheme: BuyerIdScheme; value: string };
  address?: Partial<ZatcaAddress>;
}

export interface ZatcaLineInput {
  name: string;
  quantity: number;
  /** Gross unit price before per-unit discount, SAR, VAT exclusive. */
  unitPrice: number;
  /** Price-level allowance per unit (cac:Price/cac:AllowanceCharge). */
  discountPerUnit?: number;
  /** UN/ECE Rec 20 unit code, default "PCE". */
  unitCode?: string;
  vatCategory: ZatcaVatCategory;
  /** 15 (or 5 legacy) for S; 0 for Z/E/O. */
  vatRate: number;
  exemptionReasonCode?: string;
  exemptionReason?: string;
}

export interface ZatcaInvoiceInput {
  kind: ZatcaDocumentKind;
  subtype: ZatcaInvoiceSubtype;
  flags?: ZatcaTransactionFlags;
  /** BT-1 invoice number */
  id: string;
  /** KSA-1 UUID v4 */
  uuid: string;
  /** YYYY-MM-DD (Asia/Riyadh calendar day) */
  issueDate: string;
  /** HH:mm:ss */
  issueTime: string;
  /** KSA-16 invoice counter value (per EGS unit, strictly increasing). */
  icv: number;
  /** KSA-13 previous invoice hash. */
  pih: string;
  seller: ZatcaSeller;
  buyer?: ZatcaBuyer;
  /** KSA-5 supply date (required for standard tax invoices). */
  supplyDate?: string;
  /** KSA-24 supply end date */
  supplyEndDate?: string;
  paymentMeansCode?: PaymentMeansCode;
  /** BG-3 preceding invoice reference (credit/debit notes). */
  billingReference?: { invoiceId: string };
  /** KSA-10 reason for issuing the credit/debit note. */
  noteReason?: string;
  /** BT-22 free-text note */
  note?: string;
  /** BG-25 invoice lines (at least one). */
  lines: ZatcaLineInput[];
}

/** VATEX codes per VAT category (ZATCA code list). */
export const EXEMPTION_REASONS: Record<"E" | "Z" | "O", Record<string, string>> = {
  E: {
    "VATEX-SA-29": "Financial services mentioned in Article 29 of the VAT Regulations",
    "VATEX-SA-29-7": "Life insurance services mentioned in Article 29 of the VAT Regulations",
    "VATEX-SA-30": "Real estate transactions mentioned in Article 30 of the VAT Regulations",
  },
  Z: {
    "VATEX-SA-32": "Export of goods",
    "VATEX-SA-33": "Export of services",
    "VATEX-SA-34-1": "The international transport of Goods",
    "VATEX-SA-34-2": "International transport of passengers",
    "VATEX-SA-34-3": "Services directly connected and incidental to a Supply of international passenger transport",
    "VATEX-SA-34-4": "Supply of a qualifying means of transport",
    "VATEX-SA-34-5": "Any services relating to Goods or passenger transportation, as defined in article twenty five of these Regulations",
    "VATEX-SA-35": "Medicines and medical equipment",
    "VATEX-SA-36": "Qualifying metals",
    "VATEX-SA-EDU": "Private education to citizen",
    "VATEX-SA-HEA": "Private healthcare to citizen",
    "VATEX-SA-MLTRY": "Supply of qualified military goods",
  },
  O: {
    "VATEX-SA-OOS": "Reason is free text, to be provided by the taxpayer on case to case basis.",
  },
};
