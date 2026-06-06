import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "#/integrations/trpc/router";
import { createTRPCContext } from "#/integrations/trpc/init";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: "/api/trpc",
    createContext: () => createTRPCContext(request),
  });
}

export const Route = createFileRoute("/api/trpc/$")({
  // @ts-expect-error — server.handlers is a TanStack Start runtime feature, not yet typed
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
