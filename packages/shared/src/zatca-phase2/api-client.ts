/**
 * Fetch-based client for the ZATCA Fatoora gateway (API V2). No secrets live
 * here: callers pass OTPs and CSID credentials per call (load them from
 * Workers secrets / encrypted storage). `fetch` is injectable for tests.
 */

import { fromBase64, fromUtf8, toBase64, utf8 } from "./bytes";
import type { ZatcaEnvironment } from "./csr";

export const ZATCA_BASE_URLS: Record<ZatcaEnvironment, string> = {
  sandbox: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
  simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
  production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
};

/** Fixed OTP documented for the developer-portal sandbox only (not a secret). */
export const ZATCA_SANDBOX_OTP = "123345";

export interface ZatcaCredentials {
  binarySecurityToken: string;
  secret: string;
}

export interface CsidResult extends ZatcaCredentials {
  requestId: string;
  dispositionMessage?: string;
}

export interface ZatcaMessage {
  type: string;
  code: string;
  category: string;
  message: string;
  status: string;
}

export interface SubmissionResult {
  /** True for HTTP 200/202 (accepted, possibly with warnings). */
  ok: boolean;
  httpStatus: number;
  status: "PASS" | "WARNING" | "ERROR" | string;
  reportingStatus?: string;
  clearanceStatus?: string;
  clearedInvoiceXml?: string;
  info: ZatcaMessage[];
  warnings: ZatcaMessage[];
  errors: ZatcaMessage[];
  retryable: boolean;
}

export interface SubmitDocument {
  invoiceHash: string;
  uuid: string;
  signedXml: string;
}

export class ZatcaApiError extends Error {
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly body: unknown;
  constructor(message: string, httpStatus: number, retryable: boolean, body?: unknown) {
    super(message);
    this.name = "ZatcaApiError";
    this.httpStatus = httpStatus;
    this.retryable = retryable;
    this.body = body;
  }
}

export interface ZatcaClientOptions {
  environment: ZatcaEnvironment;
  fetch?: typeof fetch;
  language?: "en" | "ar";
  /** Override base URL (e.g. a mock server). */
  baseUrl?: string;
}

type Json = Record<string, unknown>;

function basicAuth(c: ZatcaCredentials): string {
  return `Basic ${toBase64(utf8(`${c.binarySecurityToken}:${c.secret}`))}`;
}

function messages(v: unknown): ZatcaMessage[] {
  if (!Array.isArray(v)) return [];
  return v.map((m: Json) => ({
    type: String(m.type ?? ""),
    code: String(m.code ?? ""),
    category: String(m.category ?? ""),
    message: String(m.message ?? ""),
    status: String(m.status ?? ""),
  }));
}

export function parseSubmission(httpStatus: number, body: Json): SubmissionResult {
  const vr = (body.validationResults ?? {}) as Json;
  const result: SubmissionResult = {
    ok: httpStatus === 200 || httpStatus === 202,
    httpStatus,
    status: String(vr.status ?? (httpStatus === 400 ? "ERROR" : "")),
    info: messages(vr.infoMessages),
    warnings: messages(vr.warningMessages),
    errors: messages(vr.errorMessages),
    retryable: false,
  };
  if (typeof body.reportingStatus === "string") result.reportingStatus = body.reportingStatus;
  if (typeof body.clearanceStatus === "string") result.clearanceStatus = body.clearanceStatus;
  if (typeof body.clearedInvoice === "string") result.clearedInvoiceXml = fromUtf8(fromBase64(body.clearedInvoice));
  return result;
}

function csid(body: Json): CsidResult {
  const r: CsidResult = {
    requestId: String(body.requestID ?? ""),
    binarySecurityToken: String(body.binarySecurityToken ?? ""),
    secret: String(body.secret ?? ""),
  };
  if (typeof body.dispositionMessage === "string") r.dispositionMessage = body.dispositionMessage;
  return r;
}

export function createZatcaClient(options: ZatcaClientOptions) {
  const base = options.baseUrl ?? ZATCA_BASE_URLS[options.environment];
  const doFetch = options.fetch ?? fetch;

  async function call(
    method: "POST" | "PATCH",
    path: string,
    body: Json,
    headers: Record<string, string>,
    acceptedStatuses: number[],
  ): Promise<{ status: number; json: Json }> {
    let res: Response;
    try {
      res = await doFetch(`${base}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Accept-Version": "V2",
          "Accept-Language": options.language ?? "en",
          ...headers,
        },
        body: JSON.stringify(body),
        // 303 on clearance means "clearance disabled, report instead": never follow it.
        redirect: "manual",
      });
    } catch (e) {
      throw new ZatcaApiError(`ZATCA network error: ${(e as Error).message}`, 0, true);
    }
    const text = await res.text();
    let json: Json = {};
    try {
      json = text ? (JSON.parse(text) as Json) : {};
    } catch {
      json = { raw: text };
    }
    if (!acceptedStatuses.includes(res.status)) {
      const retryable = res.status === 429 || res.status >= 500;
      throw new ZatcaApiError(`ZATCA ${method} ${path} failed with HTTP ${res.status}`, res.status, retryable, json);
    }
    return { status: res.status, json };
  }

  const submit = async (
    path: string,
    creds: ZatcaCredentials,
    doc: SubmitDocument,
    extra: Record<string, string> = {},
    extraStatuses: number[] = [],
  ) => {
    const { status, json } = await call(
      "POST",
      path,
      { invoiceHash: doc.invoiceHash, uuid: doc.uuid, invoice: toBase64(utf8(doc.signedXml)) },
      { Authorization: basicAuth(creds), ...extra },
      [200, 202, 400, 409, ...extraStatuses],
    );
    if (status === 303) {
      return { ok: false, httpStatus: 303, status: "CLEARANCE_DISABLED", info: [], warnings: [], errors: [], retryable: false };
    }
    return parseSubmission(status, json);
  };

  return {
    /** Step 1 of onboarding: OTP from the Fatoora portal + CSR. */
    async requestComplianceCsid(p: { csrBase64: string; otp: string }): Promise<CsidResult> {
      const { json } = await call("POST", "/compliance", { csr: p.csrBase64 }, { OTP: p.otp }, [200]);
      return csid(json);
    },
    /** Step 2: submit the required sample documents with the compliance CSID. */
    checkComplianceInvoice(creds: ZatcaCredentials, doc: SubmitDocument): Promise<SubmissionResult> {
      return submit("/compliance/invoices", creds, doc);
    },
    /** Step 3: exchange the compliance request id for a production CSID. */
    async requestProductionCsid(creds: ZatcaCredentials, p: { complianceRequestId: string }): Promise<CsidResult> {
      const { json } = await call(
        "POST",
        "/production/csids",
        { compliance_request_id: p.complianceRequestId },
        { Authorization: basicAuth(creds) },
        [200],
      );
      return csid(json);
    },
    /** Renew a production CSID (new CSR + OTP, authenticated with the current one). */
    async renewProductionCsid(creds: ZatcaCredentials, p: { csrBase64: string; otp: string }): Promise<CsidResult> {
      const { json } = await call(
        "PATCH",
        "/production/csids",
        { csr: p.csrBase64 },
        { Authorization: basicAuth(creds), OTP: p.otp },
        [200, 202],
      );
      return csid(json);
    },
    /** Simplified (B2C) invoices/notes: report within 24h. */
    reportInvoice(creds: ZatcaCredentials, doc: SubmitDocument): Promise<SubmissionResult> {
      return submit("/invoices/reporting/single", creds, doc, { "Clearance-Status": "0" });
    },
    /**
     * Standard (B2B) invoices/notes: clear before sharing with the buyer.
     * status "CLEARANCE_DISABLED" (HTTP 303) => submit via reportInvoice instead.
     */
    clearInvoice(creds: ZatcaCredentials, doc: SubmitDocument): Promise<SubmissionResult> {
      return submit("/invoices/clearance/single", creds, doc, { "Clearance-Status": "1" }, [303]);
    },
  };
}

export type ZatcaClient = ReturnType<typeof createZatcaClient>;
