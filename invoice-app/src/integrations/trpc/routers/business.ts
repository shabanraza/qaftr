import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "#/db";
import { businesses } from "#/db/schema";
import { prepareBusinessProfile, profileErrorMessage } from "#/lib/zatca/party-input";
import { createTRPCRouter, protectedProcedure } from "../init";

const optionalText = z.string().max(200).nullish();

const upsertInput = z.object({
  nameAr: z.string().min(1).max(200),
  nameEn: optionalText,
  vatNumber: optionalText,
  address: z.string().max(500).optional(),
  logoUrl: z.string().optional(),
  defaultLanguage: z.enum(["ar", "en"]).default("ar"),
  // ZATCA Phase 2 seller identity and national address. Optional on save;
  // readiness is checked separately before onboarding.
  crNumber: optionalText,
  street: optionalText,
  buildingNumber: optionalText,
  additionalNumber: optionalText,
  district: optionalText,
  city: optionalText,
  postalCode: optionalText,
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

  upsert: protectedProcedure.input(upsertInput).mutation(async ({ ctx, input: raw }) => {
    const { nameAr, nameEn, vatNumber, crNumber, street, buildingNumber, additionalNumber, district, city, postalCode, ...rest } = raw;
    const prepared = prepareBusinessProfile({
      nameAr, nameEn, vatNumber, crNumber, street, buildingNumber, additionalNumber, district, city, postalCode,
    });
    if (!prepared.ok) {
      throw new TRPCError({ code: "BAD_REQUEST", message: profileErrorMessage(prepared.issues) });
    }
    const input = { ...rest, ...prepared.values, nameAr: prepared.values.nameAr ?? nameAr.trim() };

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
