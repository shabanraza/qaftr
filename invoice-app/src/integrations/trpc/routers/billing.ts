import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { entitlements, invoices, user } from "#/db/schema";
import { createPolarCheckout, createPolarPortalUrl, getPolarConfig } from "#/lib/billing/polar-server";
import { createTRPCRouter, protectedProcedure } from "../init";

export const FREE_INVOICE_LIMIT = 3;

function startOfCurrentMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const billingRouter = createTRPCRouter({
  getEntitlement: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.ownerId, ctx.userId))
      .limit(1);

    // No row = free plan by default
    return row ?? { ownerId: ctx.userId, plan: "free" as const, status: "active" as const };
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.ownerId, ctx.userId))
      .limit(1);

    const plan: "free" | "pro" = row?.plan === "pro" && row.status === "active" ? "pro" : "free";
    const monthStart = startOfCurrentMonth();

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(
        and(eq(invoices.ownerId, ctx.userId), gte(invoices.createdAt, monthStart), sql`coalesce(${invoices.zatcaKind}, 'invoice') = 'invoice'`),
      );

    const used = countRow?.count ?? 0;
    const limit = plan === "pro" ? null : FREE_INVOICE_LIMIT;

    return {
      plan,
      used,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - used),
      /** Pro bought on the web through Polar (can be managed in the Polar portal). */
      webSubscription: Boolean(row?.polarPro),
      currentPeriodEnd: row?.currentPeriodEnd ?? null,
      checkoutAvailable: getPolarConfig() !== null,
    };
  }),

  /** Starts a Polar checkout for Pro and returns its URL. */
  checkout: protectedProcedure
    .input(z.object({ interval: z.enum(["monthly", "yearly"]), lang: z.enum(["ar", "en"]).default("ar") }))
    .mutation(async ({ ctx, input }) => {
      const config = getPolarConfig();
      if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BILLING_UNAVAILABLE" });

      const [row] = await db.select().from(entitlements).where(eq(entitlements.ownerId, ctx.userId)).limit(1);
      if (row?.plan === "pro" && row.status === "active") {
        throw new TRPCError({ code: "CONFLICT", message: "ALREADY_PRO" });
      }

      const [account] = await db.select({ email: user.email }).from(user).where(eq(user.id, ctx.userId)).limit(1);
      const origin = new URL(ctx.request.url).origin;
      const successUrl = `${origin}/workspace/billing?checkout=success${input.lang === "en" ? "&lang=en" : ""}`;
      try {
        const url = await createPolarCheckout(config, {
          interval: input.interval,
          userId: ctx.userId,
          email: account?.email ?? null,
          successUrl,
          customerIp: ctx.request.headers.get("cf-connecting-ip"),
        });
        return { url };
      } catch {
        throw new TRPCError({ code: "BAD_GATEWAY", message: "BILLING_FAILED" });
      }
    }),

  /** Link to Polar's customer portal: cancel, change card, download receipts. */
  portal: protectedProcedure.mutation(async ({ ctx }) => {
    const config = getPolarConfig();
    if (!config) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "BILLING_UNAVAILABLE" });
    try {
      return { url: await createPolarPortalUrl(config, ctx.userId) };
    } catch {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "BILLING_FAILED" });
    }
  }),
});
