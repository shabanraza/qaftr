import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "#/db";
import { entitlements, invoices } from "#/db/schema";
import { applyRevenueCatEvent } from "#/lib/revenuecat-webhook";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";

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

    const plan = row?.plan === "pro" && row.status === "active" ? "pro" : "free";
    const monthStart = startOfCurrentMonth();

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(
        and(eq(invoices.ownerId, ctx.userId), gte(invoices.createdAt, monthStart)),
      );

    const used = countRow?.count ?? 0;
    const limit = plan === "pro" ? null : FREE_INVOICE_LIMIT;

    return {
      plan,
      used,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - used),
    };
  }),

  // Called by RevenueCat webhook (server-to-server, verified by secret header)
  revenueCatWebhook: publicProcedure
    .input(
      z.object({
        event: z.object({
          type: z.string(),
          app_user_id: z.string(),
          product_id: z.string().optional(),
          period_type: z.string().optional(),
          expiration_at_ms: z.number().optional(),
        }),
        webhook_secret: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
      if (!expectedSecret || input.webhook_secret !== expectedSecret) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid webhook secret" });
      }

      await applyRevenueCatEvent(input.event);

      return { ok: true };
    }),
});
