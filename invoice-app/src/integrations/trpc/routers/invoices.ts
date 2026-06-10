import { and, eq, gte, lt, max, sql, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "#/db";
import { invoices, lineItems, businesses, clients, entitlements, invoiceEvents } from "#/db/schema";
import { computeInvoiceTotals, totalsMatch } from "@zatca/shared";
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

const MAX_SEQ_RETRIES = 3;

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

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
        db
          .select()
          .from(businesses)
          .where(
            and(eq(businesses.id, invoice.businessId), eq(businesses.ownerId, ctx.userId)),
          )
          .limit(1),
        invoice.clientId
          ? db
              .select()
              .from(clients)
              .where(and(eq(clients.id, invoice.clientId), eq(clients.ownerId, ctx.userId)))
              .limit(1)
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
    const { lineItems: items, subtotal, vatAmount, total, ...invoiceData } = input;

    const [business] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.id, input.businessId), eq(businesses.ownerId, ctx.userId)))
      .limit(1);

    if (!business) {
      throw new TRPCError({ code: "NOT_FOUND", message: "BUSINESS_NOT_FOUND" });
    }

    if (input.clientId) {
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.ownerId, ctx.userId)))
        .limit(1);

      if (!client) throwNotFound("CLIENT_NOT_FOUND");
    }

    const computed = computeInvoiceTotals(items);
    if (!totalsMatch(computed, { subtotal, vatAmount, total })) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_INVOICE_TOTALS" });
    }

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

    const { issueDate, dueDate, ...rest } = invoiceData;

    for (let attempt = 0; attempt < MAX_SEQ_RETRIES; attempt++) {
      const invoiceId = crypto.randomUUID();

      const [maxRow] = await db
        .select({ max: max(invoices.seqNumber) })
        .from(invoices)
        .where(eq(invoices.businessId, input.businessId));

      const seqNumber = (maxRow?.max ?? 0) + 1;

      try {
        const [created] = await db
          .insert(invoices)
          .values({
            id: invoiceId,
            ownerId: ctx.userId,
            seqNumber,
            issueDate: new Date(issueDate),
            dueDate: dueDate ? new Date(dueDate) : null,
            status: "unpaid",
            subtotal: computed.subtotal,
            vatAmount: computed.vatAmount,
            total: computed.total,
            ...rest,
          })
          .returning();

        try {
          await db.insert(lineItems).values(
            computed.lineItems.map((item) => ({
              id: crypto.randomUUID(),
              invoiceId,
              description: item.description,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              sortOrder: item.sortOrder,
            })),
          );
        } catch (lineErr) {
          await db.delete(invoices).where(eq(invoices.id, invoiceId));
          throw lineErr;
        }

        try {
          await db.insert(invoiceEvents).values({
            id: crypto.randomUUID(),
            invoiceId,
            ownerId: ctx.userId,
            type: "created",
            channel: "system",
            notes: "Invoice created.",
          });
        } catch (eventErr) {
          console.error("Failed to log invoice creation event:", eventErr);
        }

        return created;
      } catch (err) {
        if (isUniqueViolation(err) && attempt < MAX_SEQ_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "INVOICE_CREATE_FAILED",
    });
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "unpaid", "paid", "overdue"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currInvoice] = await db
        .select({ status: invoices.status })
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.ownerId, ctx.userId)))
        .limit(1);

      const [updated] = await db
        .update(invoices)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(invoices.id, input.id), eq(invoices.ownerId, ctx.userId)))
        .returning();
      if (!updated) throwNotFound("INVOICE_NOT_FOUND");

      if (currInvoice && currInvoice.status !== input.status) {
        try {
          await db.insert(invoiceEvents).values({
            id: crypto.randomUUID(),
            invoiceId: input.id,
            ownerId: ctx.userId,
            type: "status_changed",
            channel: "system",
            notes: `Status changed from ${currInvoice.status} to ${input.status}.`,
          });
        } catch (eventErr) {
          console.error("Failed to log status change event:", eventErr);
        }
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.ownerId, ctx.userId)));
    }),

  logEvent: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        type: z.string(),
        channel: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await db.insert(invoiceEvents).values({
        id: crypto.randomUUID(),
        invoiceId: input.invoiceId,
        ownerId: ctx.userId,
        type: input.type,
        channel: input.channel ?? null,
        notes: input.notes ?? null,
      }).returning();
    }),

  getEvents: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await db
        .select()
        .from(invoiceEvents)
        .where(and(eq(invoiceEvents.invoiceId, input.invoiceId), eq(invoiceEvents.ownerId, ctx.userId)))
        .orderBy(invoiceEvents.createdAt);
    }),
});
