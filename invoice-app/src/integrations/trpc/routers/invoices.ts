import { and, eq, gte, lt, max, sql, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "#/db";
import { invoices, lineItems, businesses, clients, entitlements } from "#/db/schema";
import { createTRPCRouter, protectedProcedure } from "../init";
import { throwNotFound } from "../errors";
import { FREE_INVOICE_LIMIT } from "./billing";

const lineItemInput = z.object({
  description: z.string().min(1),
  qty: z.string(),
  unitPrice: z.string(),
  lineTotal: z.string(),
  sortOrder: z.number().default(0),
});

const createInvoiceInput = z.object({
  businessId: z.string(),
  clientId: z.string().optional(),
  issueDate: z.string(), // ISO string
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default("SAR"),
  subtotal: z.string(),
  vatAmount: z.string(),
  total: z.string(),
  lineItems: z.array(lineItemInput).min(1),
});

export const invoicesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    try {
      await db
        .update(invoices)
        .set({ status: "overdue", updatedAt: now })
        .where(
          and(
            eq(invoices.ownerId, ctx.userId),
            eq(invoices.status, "unpaid"),
            isNotNull(invoices.dueDate),
            lt(invoices.dueDate, now),
          ),
        );
    } catch (err) {
      // Non-fatal: DB may be missing due_date/overdue enum until migration runs.
      console.error("[invoices.list] overdue auto-update failed:", err);
    }

    try {
      return await db
        .select()
        .from(invoices)
        .where(eq(invoices.ownerId, ctx.userId))
        .orderBy(sql`${invoices.createdAt} desc`);
    } catch (err) {
      console.error("[invoices.list] fetch failed:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "INVOICES_LOAD_FAILED",
      });
    }
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.ownerId, ctx.userId)))
        .limit(1);
      if (!invoice) throwNotFound("INVOICE_NOT_FOUND");

      const [items, businessRows, clientRows] = await Promise.all([
        db.select().from(lineItems).where(eq(lineItems.invoiceId, invoice.id))
          .orderBy(lineItems.sortOrder),
        db.select().from(businesses).where(eq(businesses.id, invoice.businessId)).limit(1),
        invoice.clientId
          ? db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1)
          : Promise.resolve([]),
      ]);

      return {
        ...invoice,
        lineItems: items,
        business: businessRows[0] ?? null,
        client: clientRows[0] ?? null,
      };
    }),

  create: protectedProcedure.input(createInvoiceInput).mutation(async ({ ctx, input }) => {
    const { lineItems: items, ...invoiceData } = input;

    const [entitlement] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.ownerId, ctx.userId))
      .limit(1);

    const isPro = entitlement?.plan === "pro" && entitlement.status === "active";
    if (!isPro) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(
          and(eq(invoices.ownerId, ctx.userId), gte(invoices.createdAt, monthStart)),
        );

      if ((countRow?.count ?? 0) >= FREE_INVOICE_LIMIT) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "FREE_INVOICE_LIMIT",
        });
      }
    }

    // Get next sequential number for this business inside a transaction
    const invoiceId = crypto.randomUUID();

    const [maxRow] = await db
      .select({ max: max(invoices.seqNumber) })
      .from(invoices)
      .where(eq(invoices.businessId, input.businessId));

    const seqNumber = (maxRow?.max ?? 0) + 1;

    const { issueDate, dueDate, ...rest } = invoiceData;
    const [created] = await db
      .insert(invoices)
      .values({
        id: invoiceId,
        ownerId: ctx.userId,
        seqNumber,
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "unpaid",
        ...rest,
      })
      .returning();

    if (items.length > 0) {
      await db.insert(lineItems).values(
        items.map((item, i) => ({
          id: crypto.randomUUID(),
          invoiceId,
          ...item,
          sortOrder: item.sortOrder ?? i,
        })),
      );
    }

    return created;
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "unpaid", "paid", "overdue"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(invoices)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(invoices.id, input.id), eq(invoices.ownerId, ctx.userId)))
        .returning();
      if (!updated) throwNotFound("INVOICE_NOT_FOUND");
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.ownerId, ctx.userId)));
    }),
});
