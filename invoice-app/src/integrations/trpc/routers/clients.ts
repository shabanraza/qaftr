import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { clients } from "#/db/schema";
import { createTRPCRouter, protectedProcedure } from "../init";
import { throwNotFound } from "../errors";

const clientInput = z.object({
  name: z.string().min(1),
  vatNumber: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const clientsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(clients).where(eq(clients.ownerId, ctx.userId));
  }),

  create: protectedProcedure.input(clientInput).mutation(async ({ ctx, input }) => {
    const [created] = await db
      .insert(clients)
      .values({ id: crypto.randomUUID(), ownerId: ctx.userId, ...input })
      .returning();
    return created;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: clientInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(clients)
        .set({ ...input.data, updatedAt: new Date() })
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
