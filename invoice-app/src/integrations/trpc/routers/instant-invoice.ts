import { and, eq, gte, max, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  computeInvoiceTotals,
  normalizeSaudiVatNumber,
  totalsMatch,
  validateInstantInvoiceDraft,
  validateSaudiVatNumber,
} from "@zatca/shared";
import { db } from "#/db";
import { businesses, clients, entitlements, invoices, lineItems } from "#/db/schema";
import { createTRPCRouter, protectedProcedure } from "../init";
import { FREE_INVOICE_LIMIT } from "./billing";

const lineItemInput = z.object({
  description: z.string().min(1),
  qty: z.string(),
  unitPrice: z.string(),
  lineTotal: z.string(),
  sortOrder: z.number().default(0),
});

const saveDraftInput = z.object({
  sellerName: z.string().min(1),
  sellerVat: z.string().min(1),
  sellerAddress: z.string().optional(),
  clientName: z.string().min(1),
  clientVat: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemInput).min(1),
  subtotal: z.string(),
  vatAmount: z.string(),
  total: z.string(),
  issueDate: z.string(),
});

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

export const instantInvoiceRouter = createTRPCRouter({
  save: protectedProcedure.input(saveDraftInput).mutation(async ({ ctx, input }) => {
    const vat = normalizeSaudiVatNumber(input.sellerVat);
    if (!validateSaudiVatNumber(vat)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "SELLER_VAT_INVALID" });
    }

    const draft = {
      sellerName: input.sellerName,
      sellerVat: vat,
      sellerAddress: input.sellerAddress ?? "",
      clientName: input.clientName,
      clientVat: input.clientVat ?? "",
      notes: input.notes ?? "",
      lineItems: input.lineItems.map((item, index) => ({
        id: String(index),
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
      })),
    };

    const validation = validateInstantInvoiceDraft(draft);
    if (!validation.ok) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_INVOICE_DRAFT" });
    }

    const computed = computeInvoiceTotals(
      input.lineItems.map((item, index) => ({
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        sortOrder: index,
      })),
    );

    if (!totalsMatch(computed, input)) {
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
        .where(and(eq(invoices.ownerId, ctx.userId), gte(invoices.createdAt, monthStart)));

      if ((countRow?.count ?? 0) >= FREE_INVOICE_LIMIT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "FREE_INVOICE_LIMIT" });
      }
    }

    const [existingBusiness] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, ctx.userId))
      .limit(1);

    let businessId: string;
    if (existingBusiness) {
      const [updated] = await db
        .update(businesses)
        .set({
          nameAr: input.sellerName.trim(),
          vatNumber: vat,
          address: input.sellerAddress?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, existingBusiness.id))
        .returning();
      businessId = updated!.id;
    } else {
      const [created] = await db
        .insert(businesses)
        .values({
          id: crypto.randomUUID(),
          ownerId: ctx.userId,
          nameAr: input.sellerName.trim(),
          vatNumber: vat,
          address: input.sellerAddress?.trim() || null,
          defaultLanguage: "ar",
        })
        .returning();
      businessId = created!.id;
    }

    const [client] = await db
      .insert(clients)
      .values({
        id: crypto.randomUUID(),
        ownerId: ctx.userId,
        name: input.clientName.trim(),
        vatNumber: input.clientVat?.trim() || null,
      })
      .returning();

    const dueDate = new Date(input.issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    for (let attempt = 0; attempt < 3; attempt++) {
      const invoiceId = crypto.randomUUID();
      const [maxRow] = await db
        .select({ max: max(invoices.seqNumber) })
        .from(invoices)
        .where(eq(invoices.businessId, businessId));

      const seqNumber = (maxRow?.max ?? 0) + 1;

      try {
        const [created] = await db
          .insert(invoices)
          .values({
            id: invoiceId,
            ownerId: ctx.userId,
            businessId,
            clientId: client!.id,
            seqNumber,
            issueDate: new Date(input.issueDate),
            dueDate,
            status: "unpaid",
            notes: input.notes?.trim() || null,
            currency: "SAR",
            subtotal: computed.subtotal,
            vatAmount: computed.vatAmount,
            total: computed.total,
          })
          .returning();

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

        return created!;
      } catch (err) {
        if (isUniqueViolation(err) && attempt < 2) continue;
        throw err;
      }
    }

    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "INVOICE_CREATE_FAILED" });
  }),
});
