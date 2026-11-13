// Thin fetch client for the ZATCA Fatoora gateway. Same paths on all environments;
// only the base URL changes.
export const BASE_URLS = {
  developerPortal: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
  simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
  production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
} as const;

export interface ApiResult {
  status: number;
  body: any;
}

export class FatooraClient {
  private base: string;
  constructor(base: string) {
    this.base = base;
  }

  private async call(
    path: string,
    body: unknown,
    headers: Record<string, string>,
    auth?: { token: string; secret: string },
  ): Promise<ApiResult> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": "en",
      "Accept-Version": "V2",
      ...headers,
    };
    if (auth) {
      // Basic auth = base64( binarySecurityToken + ":" + secret )
      h.Authorization =
        "Basic " + Buffer.from(`${auth.token}:${auth.secret}`).toString("base64");
    }
    const res = await fetch(this.base + path, {
      method: "POST",
      headers: h,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: any = text;
    try {
      parsed = JSON.parse(text);
    } catch {}
    return { status: res.status, body: parsed };
  }

  /** POST /compliance  (OTP header + base64 PEM CSR) -> CCSID */
  complianceCsid(csrPemB64: string, otp: string) {
    return this.call("/compliance", { csr: csrPemB64 }, { OTP: otp });
  }

  /** POST /compliance/invoices  (auth with CCSID) */
  complianceInvoice(
    auth: { token: string; secret: string },
    doc: { invoiceHash: string; uuid: string; invoice: string },
  ) {
    return this.call("/compliance/invoices", doc, {}, auth);
  }

  /** POST /production/csids  (auth with CCSID, body = compliance requestID) -> PCSID */
  productionCsid(auth: { token: string; secret: string }, complianceRequestId: string) {
    return this.call(
      "/production/csids",
      { compliance_request_id: complianceRequestId },
      {},
      auth,
    );
  }

  /** POST /invoices/reporting/single  (simplified, auth with PCSID) */
  report(
    auth: { token: string; secret: string },
    doc: { invoiceHash: string; uuid: string; invoice: string },
  ) {
    return this.call("/invoices/reporting/single", doc, { "Clearance-Status": "0" }, auth);
  }

  /** POST /invoices/clearance/single  (standard B2B, auth with PCSID) */
  clear(
    auth: { token: string; secret: string },
    doc: { invoiceHash: string; uuid: string; invoice: string },
  ) {
    return this.call("/invoices/clearance/single", doc, { "Clearance-Status": "1" }, auth);
  }
}

/** Redact secrets/tokens/large blobs before printing or saving a response. */
export function redact(body: any): any {
  if (body == null || typeof body !== "object") return body;
  const out: any = Array.isArray(body) ? [] : {};
  for (const [k, v] of Object.entries(body)) {
    if (/token|secret|certificate|clearedInvoice/i.test(k) && typeof v === "string") {
      out[k] = `<redacted ${v.length} chars>`;
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}
