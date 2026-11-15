import { and, desc, eq, inArray, max, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "#/db";
import { businessMembers, businesses, egsUnits, invoices, user } from "#/db/schema";
import {
  INVITE_TTL_DAYS,
  acceptDecision,
  hashInviteToken,
  inviteState,
  newInviteToken,
  normalizeEmail,
} from "#/lib/accountant/seat";
import { withEffectiveStatus } from "#/lib/workspace/invoice-status";
import { createTRPCRouter, protectedProcedure } from "../init";

const MAX_SEATS_PER_BUSINESS = 10;

async function ownerBusinessId(userId: string): Promise<string> {
  const [row] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.ownerId, userId)).limit(1);
  if (!row) throw new TRPCError({ code: "BAD_REQUEST", message: "BUSINESS_REQUIRED" });
  return row.id;
}

/** The active membership that lets this user read the business, or FORBIDDEN. */
async function requireClientAccess(userId: string, businessId: string) {
  const [row] = await db
    .select({ ownerId: businesses.ownerId, id: businessMembers.id })
    .from(businessMembers)
    .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
    .where(
      and(
        eq(businessMembers.businessId, businessId),
        eq(businessMembers.accountantUserId, userId),
        eq(businessMembers.status, "active"),
      ),
    )
    .limit(1);
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "NO_ACCESS" });
  return row;
}

export const seatRouter = createTRPCRouter({
  // ----- Business owner: invite and manage accountants -----

  members: protectedProcedure.query(async ({ ctx }) => {
    const [biz] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.ownerId, ctx.userId)).limit(1);
    if (!biz) return [];
    const rows = await db
      .select({
        id: businessMembers.id,
        email: businessMembers.email,
        status: businessMembers.status,
        expiresAt: businessMembers.expiresAt,
        createdAt: businessMembers.createdAt,
        acceptedAt: businessMembers.acceptedAt,
        accountantName: user.name,
        accountantEmail: user.email,
      })
      .from(businessMembers)
      .leftJoin(user, eq(user.id, businessMembers.accountantUserId))
      .where(eq(businessMembers.businessId, biz.id))
      .orderBy(desc(businessMembers.createdAt));
    const now = new Date();
    return rows.map((r) => ({ ...r, state: inviteState(r, now) })).filter((r) => r.state !== "revoked");
  }),

  invite: protectedProcedure
    .input(z.object({ email: z.string().email().max(200).optional() }))
    .mutation(async ({ ctx, input }) => {
      const businessId = await ownerBusinessId(ctx.userId);
      const [count] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(businessMembers)
        .where(and(eq(businessMembers.businessId, businessId), inArray(businessMembers.status, ["pending", "active"])));
      if ((count?.n ?? 0) >= MAX_SEATS_PER_BUSINESS) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "TOO_MANY_ACCOUNTANTS" });
      }
      const { token, hash } = await newInviteToken();
      const id = crypto.randomUUID();
      await db.insert(businessMembers).values({
        id,
        businessId,
        email: input.email ? normalizeEmail(input.email) : null,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
      });
      // The raw token is returned once; only its hash is stored.
      return { id, token };
    }),

  revoke: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const businessId = await ownerBusinessId(ctx.userId);
    const updated = await db
      .update(businessMembers)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(and(eq(businessMembers.id, input.id), eq(businessMembers.businessId, businessId)))
      .returning({ id: businessMembers.id });
    if (!updated[0]) throw new TRPCError({ code: "NOT_FOUND", message: "SEAT_NOT_FOUND" });
    return { ok: true };
  }),

  // ----- Accountant: accept invites and read client books -----

  accept: protectedProcedure.input(z.object({ token: z.string().min(20).max(100) })).mutation(async ({ ctx, input }) => {
    const hash = await hashInviteToken(input.token);
    const [row] = await db
      .select({
        id: businessMembers.id,
        status: businessMembers.status,
        accountantUserId: businessMembers.accountantUserId,
        expiresAt: businessMembers.expiresAt,
        businessId: businessMembers.businessId,
        ownerId: businesses.ownerId,
        nameAr: businesses.nameAr,
        nameEn: businesses.nameEn,
      })
      .from(businessMembers)
      .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
      .where(eq(businessMembers.tokenHash, hash))
      .limit(1);
    const decision = acceptDecision({ row: row ?? null, userId: ctx.userId, ownerId: row?.ownerId, now: new Date() });
    if (!decision.ok) throw new TRPCError({ code: "BAD_REQUEST", message: `INVITE_${decision.reason.toUpperCase()}` });
    // Only a still-pending row flips, so two simultaneous accepts cannot both win.
    const flipped = await db
      .update(businessMembers)
      .set({ status: "active", accountantUserId: ctx.userId, acceptedAt: new Date() })
      .where(and(eq(businessMembers.id, row!.id), eq(businessMembers.status, "pending")))
      .returning({ id: businessMembers.id });
    if (!flipped[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "INVITE_ALREADY_USED" });
    return { businessId: row!.businessId, nameAr: row!.nameAr, nameEn: row!.nameEn };
  }),

  clients: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await db
      .select({
        membershipId: businessMembers.id,
        businessId: businesses.id,
        nameAr: businesses.nameAr,
        nameEn: businesses.nameEn,
        vatNumber: businesses.vatNumber,
        since: businessMembers.acceptedAt,
      })
      .from(businessMembers)
      .innerJoin(businesses, eq(businesses.id, businessMembers.businessId))
      .where(and(eq(businessMembers.accountantUserId, ctx.userId), eq(businessMembers.status, "active")))
      .orderBy(businesses.nameAr);
    if (memberships.length === 0) return [];
    const ids = memberships.map((m) => m.businessId);
    const stats = await db
      .select({
        businessId: invoices.businessId,
        count: sql<number>`count(*)::int`,
        lastIssued: max(invoices.issueDate),
      })
      .from(invoices)
      .where(inArray(invoices.businessId, ids))
      .groupBy(invoices.businessId);
    const egs = await db
      .select({ businessId: egsUnits.businessId, status: egsUnits.status })
      .from(egsUnits)
      .where(inArray(egsUnits.businessId, ids));
    return memberships.map((m) => {
      const s = stats.find((x) => x.businessId === m.businessId);
      const units = egs.filter((e) => e.businessId === m.businessId);
      return {
        ...m,
        invoiceCount: s?.count ?? 0,
        lastIssued: s?.lastIssued ?? null,
        // Phase 2 progress only: active once an EGS unit is onboarded, started before that.
        phase2: units.some((u) => u.status === "active")
          ? ("active" as const)
          : units.length > 0
            ? ("started" as const)
            : ("none" as const),
      };
    });
  }),

  clientInvoices: protectedProcedure.input(z.object({ businessId: z.string() })).query(async ({ ctx, input }) => {
    const access = await requireClientAccess(ctx.userId, input.businessId);
    const rows = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.businessId, input.businessId), eq(invoices.ownerId, access.ownerId)))
      .orderBy(sql`${invoices.createdAt} desc`);
    const now = new Date();
    return rows.map((row) => withEffectiveStatus(row, now));
  }),

  clientProfile: protectedProcedure.input(z.object({ businessId: z.string() })).query(async ({ ctx, input }) => {
    await requireClientAccess(ctx.userId, input.businessId);
    const [b] = await db
      .select({ id: businesses.id, nameAr: businesses.nameAr, nameEn: businesses.nameEn, vatNumber: businesses.vatNumber })
      .from(businesses)
      .where(eq(businesses.id, input.businessId))
      .limit(1);
    return b ?? null;
  }),

  leave: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const updated = await db
      .update(businessMembers)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(and(eq(businessMembers.id, input.id), eq(businessMembers.accountantUserId, ctx.userId)))
      .returning({ id: businessMembers.id });
    if (!updated[0]) throw new TRPCError({ code: "NOT_FOUND", message: "SEAT_NOT_FOUND" });
    return { ok: true };
  }),
});
