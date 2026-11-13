import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sellerZatcaReadiness } from "@zatca/shared";
import { ZATCA_SANDBOX_OTP, createZatcaClient } from "@zatca/shared/zatca-phase2";
import { db } from "#/db";
import { businesses, egsUnits, entitlements, zatcaCredentials } from "#/db/schema";
import { keyRingFromProcessEnv } from "#/lib/zatca/credential-crypto";
import { onboardingGate, resolveZatcaEnv, toEgsRecords } from "#/lib/zatca/egs-records";
import { OnboardingError, onboardEgs } from "#/lib/zatca/onboarding";
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
});
