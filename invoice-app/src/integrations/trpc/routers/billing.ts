import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "#/db";
import { entitlements, invoices } from "#/db/schema";
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
});
