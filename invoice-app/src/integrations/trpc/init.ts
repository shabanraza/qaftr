import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "#/lib/auth";
import { sanitizeClientMessage } from "./errors";

export interface TRPCContext {
  request: Request;
  userId: string | null;
}

export async function createTRPCContext(request: Request): Promise<TRPCContext> {
  const session = await auth.api.getSession({ headers: request.headers });
  return { request, userId: session?.user.id ?? null };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const safeMessage = sanitizeClientMessage(error.message);
    if (safeMessage !== error.message) {
      console.error("[trpc]", error.message);
    }
    return {
      ...shape,
      message: safeMessage,
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
