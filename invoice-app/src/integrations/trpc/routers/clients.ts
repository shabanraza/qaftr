import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { clients } from "#/db/schema";
import { createTRPCRouter, protectedProcedure } from "../init";
import { throwNotFound } from "../errors";
import { TRPCError } from "@trpc/server";
import { prepareClientProfile, profileErrorMessage } from "#/lib/zatca/party-input";

const optionalText = z.string().max(200).nullish();

const clientInput = z.object({
  name: z.string().min(1).max(200),
  vatNumber: optionalText,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  // Needed for standard (B2B) ZATCA invoices; all optional on save.
  country: optionalText,
  idScheme: optionalText,
  idValue: optionalText,
  street: optionalText,
  buildingNumber: optionalText,
  additionalNumber: optionalText,
  district: optionalText,
  city: optionalText,
  postalCode: optionalText,
});

function prepare<T extends Partial<z.infer<typeof clientInput>>>(input: T) {
  const { email, phone, ...profile } = input;
  const prepared = prepareClientProfile(profile);
  if (!prepared.ok) {
    throw new TRPCError({ code: "BAD_REQUEST", message: profileErrorMessage(prepared.issues) });
  }
  // name is required (min 1) whenever it is sent, so it is never cleared.
  return { ...prepared.values, name: prepared.values.name ?? undefined, email, phone };
}

export const clientsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(clients).where(eq(clients.ownerId, ctx.userId));
  }),

  create: protectedProcedure.input(clientInput).mutation(async ({ ctx, input }) => {
    const [created] = await db
      .insert(clients)
      .values({ id: crypto.randomUUID(), ownerId: ctx.userId, ...prepare(input), name: input.name.trim() })
      .returning();
    return created;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: clientInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(clients)
        .set({ ...prepare(input.data), updatedAt: new Date() })
        .where(and(eq(clients.id, input.id), eq(clients.ownerId, ctx.userId)))
        .returning();
      if (!updated) throwNotFound("CLIENT_NOT_FOUND");
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(clients)
        .where(and(eq(clients.id, input.id), eq(clients.ownerId, ctx.userId)));
    }),
});
