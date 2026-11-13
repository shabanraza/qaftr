import { and, desc, eq, max, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { computeInvoiceTotals, sellerZatcaReadiness } from "@zatca/shared";
import { ZATCA_SANDBOX_OTP, createZatcaClient } from "@zatca/shared/zatca-phase2";
import { db } from "#/db";
import { businesses, clients, egsUnits, entitlements, invoices, lineItems, zatcaCredentials } from "#/db/schema";
import { keyRingFromProcessEnv } from "#/lib/zatca/credential-crypto";
import { onboardingGate, resolveZatcaEnv, toEgsRecords } from "#/lib/zatca/egs-records";
import { OnboardingError, onboardEgs } from "#/lib/zatca/onboarding";
import type { OnboardingEnv } from "#/lib/zatca/onboarding";
import { toZatcaDocument } from "#/lib/zatca/invoice-mapping";
import { documentNumber } from "#/lib/zatca/document-kind";
import { IssueError, issueInvoice } from "#/lib/zatca/issue";
import { resubmitInvoice } from "#/lib/zatca/resubmit";
import { claimChain, loadSigningCredential, readChain, saveOutcome, submissionCount } from "#/lib/zatca/egs-store";
import { r2XmlStore } from "#/lib/zatca/xml-store";
import { createTRPCRouter, protectedProcedure } from "../init";

const onboardInput = z.object({
  otp: z.string().max(12).optional(),
  industry: z.string().min(1).max(100),
  branchName: z.string().max(100).optional(),
});

async function loadBusiness(userId: string) {
  const [row] = await db.select().from(businesses).where(eq(businesses.ownerId, userId)).limit(1);
  return row;
}

async function requireEnabled(userId: string): Promise<OnboardingEnv> {
  const env = resolveZatcaEnv(process.env);
  const [entitlement] = await db.select().from(entitlements).where(eq(entitlements.ownerId, userId)).limit(1);
  const gate = onboardingGate({ env, entitlement });
  if (gate || !env) throw new TRPCError({ code: "FORBIDDEN", message: gate ?? "ZATCA_DISABLED" });
  return env;
}

async function loadOwnedInvoice(userId: string, invoiceId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.ownerId, userId)))
    .limit(1);
  if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "INVOICE_NOT_FOUND" });
  return invoice;
}

async function activeUnit(businessId: string, env: OnboardingEnv) {
  const [unit] = await db
    .select()
    .from(egsUnits)
    .where(and(eq(egsUnits.businessId, businessId), eq(egsUnits.env, env), eq(egsUnits.status, "active")))
    .orderBy(desc(egsUnits.createdAt))
    .limit(1);
  if (!unit || !unit.activeCredentialId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "EGS_NOT_ONBOARDED" });
  return { ...unit, activeCredentialId: unit.activeCredentialId };
}

const ISSUABLE = new Set(["not_required", "draft"]);
/** Invoices ZATCA has accepted (or will, once reachable) can be corrected by a note. */
const NOTEABLE = new Set(["signed", "pending_clearance", "reported", "reported_with_warnings", "cleared", "cleared_with_warnings"]);

const noteInput = z.object({
  invoiceId: z.string(),
  kind: z.enum(["credit-note", "debit-note"]),
  reason: z.string().trim().min(1).max(500),
  lines: z
    .array(z.object({ description: z.string().min(1).max(500), qty: z.string().max(20), unitPrice: z.string().max(20) }))
    .min(1)
    .max(200)
    .optional(),
});

type InvoiceRow = typeof invoices.$inferSelect;

/** Sign a stored invoice or note and send it to ZATCA. */
async function issueStored(userId: string, invoice: InvoiceRow, env: OnboardingEnv) {
  if (!ISSUABLE.has(invoice.zatcaStatus)) throw new TRPCError({ code: "CONFLICT", message: "INVOICE_ALREADY_SIGNED" });

  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, invoice.businessId), eq(businesses.ownerId, userId)))
    .limit(1);
  if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "BUSINESS_NOT_FOUND" });
  const [items, clientRows, originalRows] = await Promise.all([
    db.select().from(lineItems).where(eq(lineItems.invoiceId, invoice.id)).orderBy(lineItems.sortOrder),
    invoice.clientId
      ? db.select().from(clients).where(and(eq(clients.id, invoice.clientId), eq(clients.ownerId, userId))).limit(1)
      : Promise.resolve([]),
    invoice.billingReferenceInvoiceId
      ? db.select().from(invoices).where(and(eq(invoices.id, invoice.billingReferenceInvoiceId), eq(invoices.ownerId, userId))).limit(1)
      : Promise.resolve([]),
  ]);
  const kind = invoice.zatcaKind ?? "invoice";
  const original = originalRows[0];
  if (kind !== "invoice" && (!original?.zatcaSubtype || !invoice.adjustmentReason)) {
    throw new TRPCError({ code: "CONFLICT", message: "INVOICE_NOT_NOTEABLE" });
  }
  const unit = await activeUnit(business.id, env);
  const credential = await loadSigningCredential(unit.id, unit.activeCredentialId);
  const store = await r2XmlStore();

  try {
    const { status, claim } = await issueInvoice({
      credential,
      keyPrefix: `zatca/${business.id}/${unit.id}`,
      build: (chain, uuid, now) =>
        toZatcaDocument({
          env,
          invoice,
          items,
          business,
          client: clientRows[0] ?? null,
          chain,
          uuid,
          now,
          ...(kind !== "invoice" && original?.zatcaSubtype
            ? {
                note: {
                  kind,
                  originalNumber: documentNumber(original.seqNumber, original.zatcaKind),
                  originalSubtype: original.zatcaSubtype,
                  reason: invoice.adjustmentReason ?? "",
                },
              }
            : {}),
        }),
      deps: {
        readChain: () => readChain(unit.id),
        claim: (c) => claimChain(unit.id, invoice.id, c),
        putXml: (k, x) => store.put(k, x),
        client: createZatcaClient({ environment: env }),
        saveOutcome: (o) => saveOutcome(unit.id, invoice.id, o),
      },
    });
    return { status, icv: claim.icv, subtype: claim.subtype };
  } catch (e) {
    if (e instanceof IssueError) {
      console.warn("[zatca] issue failed", { code: e.code, invoiceId: invoice.id });
      throw new TRPCError({ code: e.code === "CHAIN_BUSY" ? "CONFLICT" : "PRECONDITION_FAILED", message: e.code });
    }
    throw e;
  }
}
const RETRYABLE = new Set(["signed", "pending_clearance"]);

export const zatcaRouter = createTRPCRouter({
  /** What the business page needs to show the onboarding card. */
  status: protectedProcedure.query(async ({ ctx }) => {
    const env = resolveZatcaEnv(process.env);
    const business = await loadBusiness(ctx.userId);
    const [entitlement] = await db.select().from(entitlements).where(eq(entitlements.ownerId, ctx.userId)).limit(1);
    const unit =
      business && env
        ? (
            await db
              .select({
                id: egsUnits.id,
                status: egsUnits.status,
                commonName: egsUnits.commonName,
                egsSerial: egsUnits.egsSerial,
                certNotAfter: egsUnits.certNotAfter,
                createdAt: egsUnits.createdAt,
              })
              .from(egsUnits)
              .where(and(eq(egsUnits.businessId, business.id), eq(egsUnits.env, env), eq(egsUnits.status, "active")))
              .orderBy(desc(egsUnits.createdAt))
              .limit(1)
          )[0] ?? null
        : null;
    return {
      env,
      gate: onboardingGate({ env, entitlement }),
      hasBusiness: Boolean(business),
      sellerReady: business ? sellerZatcaReadiness({ ...business, name: business.nameAr }).ready : false,
      sandboxOtp: env === "sandbox" ? ZATCA_SANDBOX_OTP : null,
      unit,
    };
  }),

  onboard: protectedProcedure.input(onboardInput).mutation(async ({ ctx, input }) => {
    const env = resolveZatcaEnv(process.env);
    const [entitlement] = await db.select().from(entitlements).where(eq(entitlements.ownerId, ctx.userId)).limit(1);
    const gate = onboardingGate({ env, entitlement });
    if (gate || !env) throw new TRPCError({ code: "FORBIDDEN", message: gate ?? "ZATCA_DISABLED" });

    const business = await loadBusiness(ctx.userId);
    if (!business) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BUSINESS_REQUIRED" });

    const [existing] = await db
      .select({ id: egsUnits.id })
      .from(egsUnits)
      .where(and(eq(egsUnits.businessId, business.id), eq(egsUnits.env, env), eq(egsUnits.status, "active")))
      .limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "EGS_ALREADY_ACTIVE" });

    // Fail before calling ZATCA if the KEK secrets are missing.
    const ring = keyRingFromProcessEnv();

    let result;
    try {
      result = await onboardEgs({
        seller: { ...business, businessId: business.id },
        env,
        otp: env === "sandbox" ? ZATCA_SANDBOX_OTP : (input.otp ?? ""),
        industry: input.industry,
        branchName: input.branchName,
        client: createZatcaClient({ environment: env }),
      });
    } catch (e) {
      if (e instanceof OnboardingError) {
        console.warn("[zatca] onboarding failed", { code: e.code, details: e.details, businessId: business.id, env });
        const code: TRPCError["code"] =
          e.code === "ZATCA_UNAVAILABLE" ? "SERVICE_UNAVAILABLE" : e.code === "SELLER_NOT_READY" ? "PRECONDITION_FAILED" : "BAD_REQUEST";
        throw new TRPCError({ code, message: e.code });
      }
      throw e;
    }

    const records = await toEgsRecords({ businessId: business.id, result, ring });
    await db.batch([db.insert(egsUnits).values(records.unit), db.insert(zatcaCredentials).values(records.credentials)]);
    return {
      id: records.unit.id,
      env,
      commonName: records.unit.commonName,
      certNotAfter: records.unit.certNotAfter,
      publicKeyMatches: result.production.publicKeyMatches,
    };
  }),

  /** Sign the invoice at the next ICV of the business's EGS, store it, then clear or report it. */
  issueInvoice: protectedProcedure.input(z.object({ invoiceId: z.string() })).mutation(async ({ ctx, input }) => {
    const env = await requireEnabled(ctx.userId);
    const invoice = await loadOwnedInvoice(ctx.userId, input.invoiceId);
    return issueStored(ctx.userId, invoice, env);
  }),

  /**
   * Credit or debit note against a signed invoice, signed and sent straight away.
   * Without lines, a credit note credits the whole invoice.
   */
  createNote: protectedProcedure.input(noteInput).mutation(async ({ ctx, input }) => {
    const env = await requireEnabled(ctx.userId);
    const original = await loadOwnedInvoice(ctx.userId, input.invoiceId);
    if ((original.zatcaKind ?? "invoice") !== "invoice" || !NOTEABLE.has(original.zatcaStatus)) {
      throw new TRPCError({ code: "CONFLICT", message: "INVOICE_NOT_NOTEABLE" });
    }
    let lines = input.lines;
    if (!lines) {
      if (input.kind === "debit-note") throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_INVOICE_DRAFT" });
      const items = await db.select().from(lineItems).where(eq(lineItems.invoiceId, original.id)).orderBy(lineItems.sortOrder);
      lines = items.map((i) => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice }));
    }
    const computed = computeInvoiceTotals(lines.map((l, i) => ({ ...l, sortOrder: i })));
    if (Number(computed.total) <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_INVOICE_TOTALS" });

    if (input.kind === "credit-note") {
      const [row] = await db
        .select({ credited: sql<string>`coalesce(sum(${invoices.total}), 0)::text` })
        .from(invoices)
        .where(
          and(
            eq(invoices.billingReferenceInvoiceId, original.id),
            eq(invoices.zatcaKind, "credit-note"),
            ne(invoices.zatcaStatus, "rejected"),
          ),
        );
      if (Number(row?.credited ?? 0) + Number(computed.total) > Number(original.total) + 0.001) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CREDIT_EXCEEDS_INVOICE" });
      }
    }

    let note: typeof invoices.$inferSelect | undefined;
    for (let attempt = 0; attempt < 3 && !note; attempt++) {
      const [maxRow] = await db
        .select({ max: max(invoices.seqNumber) })
        .from(invoices)
        .where(eq(invoices.businessId, original.businessId));
      const id = crypto.randomUUID();
      try {
        [note] = await db
          .insert(invoices)
          .values({
            id,
            ownerId: ctx.userId,
            businessId: original.businessId,
            clientId: original.clientId,
            seqNumber: (maxRow?.max ?? 0) + 1,
            issueDate: new Date(),
            // Notes carry no payment status of their own.
            status: "draft",
            subtotal: computed.subtotal,
            vatAmount: computed.vatAmount,
            total: computed.total,
            currency: original.currency,
            zatcaKind: input.kind,
            zatcaStatus: "draft",
            billingReferenceInvoiceId: original.id,
            adjustmentReason: input.reason.trim(),
          })
          .returning();
      } catch (e) {
        if ((e as { code?: string }).code === "23505" && attempt < 2) continue;
        throw e;
      }
      await db.insert(lineItems).values(
        computed.lineItems.map((item) => ({
          id: crypto.randomUUID(),
          invoiceId: id,
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          sortOrder: item.sortOrder,
        })),
      );
    }
    if (!note) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "INVOICE_CREATE_FAILED" });
    const issued = await issueStored(ctx.userId, note, env);
    return { noteId: note.id, ...issued };
  }),

  /** Re-send an already-signed invoice that ZATCA could not be reached for. Never re-signs. */
  retrySubmission: protectedProcedure.input(z.object({ invoiceId: z.string() })).mutation(async ({ ctx, input }) => {
    const env = await requireEnabled(ctx.userId);
    const invoice = await loadOwnedInvoice(ctx.userId, input.invoiceId);
    const { egsUnitId, signedXmlKey, invoiceHash, zatcaUuid, zatcaSubtype } = invoice;
    if (!RETRYABLE.has(invoice.zatcaStatus) || !egsUnitId || !signedXmlKey || !invoiceHash || !zatcaUuid || !zatcaSubtype) {
      throw new TRPCError({ code: "CONFLICT", message: "INVOICE_NOT_RETRYABLE" });
    }
    const unit = await activeUnit(invoice.businessId, env);
    if (unit.id !== egsUnitId) throw new TRPCError({ code: "CONFLICT", message: "INVOICE_NOT_RETRYABLE" });
    const status = await resubmitInvoice({
      ref: { invoiceId: invoice.id, egsUnitId, activeCredentialId: unit.activeCredentialId, signedXmlKey, invoiceHash, zatcaUuid, zatcaSubtype },
      env,
      store: await r2XmlStore(),
      attempt: (await submissionCount(invoice.id)) + 1,
    });
    return { status };
  }),
});
