import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "#/db";
import { businesses } from "#/db/schema";
import { createTRPCRouter, protectedProcedure } from "../init";

const upsertInput = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().optional(),
  vatNumber: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
  defaultLanguage: z.enum(["ar", "en"]).default("ar"),
});

const uploadLogoInput = z.object({
  /** Base64 data URL — max ~300KB */
  dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/),
});

export const businessRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, ctx.userId))
      .limit(1);
    return rows[0] ?? null;
  }),

  upsert: protectedProcedure.input(upsertInput).mutation(async ({ ctx, input }) => {
    const existing = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.ownerId, ctx.userId))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      const [updated] = await db
        .update(businesses)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(businesses.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(businesses)
      .values({ id: crypto.randomUUID(), ownerId: ctx.userId, ...input })
      .returning();
    return created;
  }),

  uploadLogo: protectedProcedure.input(uploadLogoInput).mutation(async ({ ctx, input }) => {
    if (input.dataUrl.length > 400_000) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "LOGO_TOO_LARGE" });
    }

    const existing = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.ownerId, ctx.userId))
      .limit(1);

    if (!existing[0]) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "BUSINESS_REQUIRED" });
    }

    const [updated] = await db
      .update(businesses)
      .set({ logoUrl: input.dataUrl, updatedAt: new Date() })
      .where(eq(businesses.id, existing[0].id))
      .returning();

    return updated;
  }),
});
