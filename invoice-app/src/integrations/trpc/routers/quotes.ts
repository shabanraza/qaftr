import { and, eq, max, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "#/db";
import { quotes, quoteLineItems, businesses, clients, invoices, lineItems, invoiceEvents } from "#/db/schema";
import { computeInvoiceTotals, totalsMatch } from "@zatca/shared";
import { createTRPCRouter, protectedProcedure } from "../init";

const lineItemInput = z.object({
  description: z.string().min(1),
  qty: z.string(),
  unitPrice: z.string(),
  lineTotal: z.string(),
  sortOrder: z.number().default(0),
});

const createQuoteInput = z.object({
  businessId: z.string(),
  clientId: z.string().optional(),
  issueDate: z.string(), // ISO string
  validUntil: z.string().optional(),
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

export const quotesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await db
        .select()
        .from(quotes)
        .where(eq(quotes.ownerId, ctx.userId))
        .orderBy(sql`${quotes.createdAt} desc`);
    } catch (err) {
      console.error("[quotes.list] fetch failed:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "QUOTES_LOAD_FAILED",
      });
    }
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [quote] = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.id, input.id), eq(quotes.ownerId, ctx.userId)))
        .limit(1);
      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "QUOTE_NOT_FOUND" });
      }

      const [items, businessRows, clientRows] = await Promise.all([
        db
          .select()
          .from(quoteLineItems)
          .where(eq(quoteLineItems.quoteId, quote.id))
          .orderBy(quoteLineItems.sortOrder),
        db
          .select()
          .from(businesses)
          .where(
            and(eq(businesses.id, quote.businessId), eq(businesses.ownerId, ctx.userId)),
          )
          .limit(1),
        quote.clientId
          ? db
              .select()
              .from(clients)
              .where(and(eq(clients.id, quote.clientId), eq(clients.ownerId, ctx.userId)))
              .limit(1)
          : Promise.resolve([]),
      ]);

      return {
        ...quote,
        lineItems: items,
        business: businessRows[0] ?? null,
        client: clientRows[0] ?? null,
      };
    }),

  create: protectedProcedure.input(createQuoteInput).mutation(async ({ ctx, input }) => {
    const { lineItems: items, subtotal, vatAmount, total, ...quoteData } = input;

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

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "CLIENT_NOT_FOUND" });
      }
    }

    const computed = computeInvoiceTotals(items);
    if (!totalsMatch(computed, { subtotal, vatAmount, total })) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_QUOTE_TOTALS" });
    }

    const { issueDate, validUntil, ...rest } = quoteData;

    for (let attempt = 0; attempt < MAX_SEQ_RETRIES; attempt++) {
      const quoteId = crypto.randomUUID();

      const [maxRow] = await db
        .select({ max: max(quotes.seqNumber) })
        .from(quotes)
        .where(eq(quotes.businessId, input.businessId));

      const seqNumber = (maxRow?.max ?? 0) + 1;

      try {
        const [created] = await db
          .insert(quotes)
          .values({
            id: quoteId,
            ownerId: ctx.userId,
            seqNumber,
            issueDate: new Date(issueDate),
            validUntil: validUntil ? new Date(validUntil) : null,
            status: "draft",
            subtotal: computed.subtotal,
            vatAmount: computed.vatAmount,
            total: computed.total,
            ...rest,
          })
          .returning();

        try {
          await db.insert(quoteLineItems).values(
            computed.lineItems.map((item) => ({
              id: crypto.randomUUID(),
              quoteId,
              description: item.description,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              sortOrder: item.sortOrder,
            })),
          );
        } catch (lineErr) {
          await db.delete(quotes).where(eq(quotes.id, quoteId));
          throw lineErr;
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
      message: "QUOTE_CREATE_FAILED",
    });
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "pending", "accepted", "rejected", "converted"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(quotes)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(quotes.id, input.id), eq(quotes.ownerId, ctx.userId)))
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "QUOTE_NOT_FOUND" });
      }
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(quotes)
        .where(and(eq(quotes.id, input.id), eq(quotes.ownerId, ctx.userId)));
    }),

  convertToInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [quote] = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.id, input.id), eq(quotes.ownerId, ctx.userId)))
        .limit(1);
      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "QUOTE_NOT_FOUND" });
      }

      const items = await db
        .select()
        .from(quoteLineItems)
        .where(eq(quoteLineItems.quoteId, quote.id))
        .orderBy(quoteLineItems.sortOrder);

      if (!items.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "QUOTE_HAS_NO_ITEMS",
        });
      }

      for (let attempt = 0; attempt < MAX_SEQ_RETRIES; attempt++) {
        const invoiceId = crypto.randomUUID();
        const [maxRow] = await db
          .select({ max: max(invoices.seqNumber) })
          .from(invoices)
          .where(eq(invoices.businessId, quote.businessId));

        const seqNumber = (maxRow?.max ?? 0) + 1;

        try {
          const [createdInvoice] = await db
            .insert(invoices)
            .values({
              id: invoiceId,
              ownerId: ctx.userId,
              businessId: quote.businessId,
              clientId: quote.clientId,
              seqNumber,
              issueDate: new Date(),
              dueDate: null,
              status: "unpaid",
              subtotal: quote.subtotal,
              vatAmount: quote.vatAmount,
              total: quote.total,
              currency: quote.currency,
              notes: quote.notes,
            })
            .returning();

          await db.insert(lineItems).values(
            items.map((item) => ({
              id: crypto.randomUUID(),
              invoiceId,
              description: item.description,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              sortOrder: item.sortOrder,
            })),
          );

          await db.insert(invoiceEvents).values({
            id: crypto.randomUUID(),
            invoiceId,
            ownerId: ctx.userId,
            type: "created",
            channel: "system",
            notes: `Invoice created by converting Quote QTE-${String(quote.seqNumber).padStart(3, "0")}.`,
          });

          await db
            .update(quotes)
            .set({
              status: "converted",
              convertedToInvoiceId: invoiceId,
              updatedAt: new Date(),
            })
            .where(eq(quotes.id, quote.id));

          return createdInvoice;
        } catch (err) {
          if (isUniqueViolation(err) && attempt < MAX_SEQ_RETRIES - 1) {
            continue;
          }
          throw err;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "CONVERT_QUOTE_FAILED",
      });
    }),
});
