import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { TRPCRouter } from "invoice-app/src/integrations/trpc/router";
import { getSessionToken } from "./auth";
import { getApiUrl } from "./api-url";

export type { TRPCRouter };

const API_URL = getApiUrl() + "/api/trpc";

export const trpc = createTRPCReact<TRPCRouter>();

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: API_URL,
        transformer: superjson,
        async headers() {
          const token = await getSessionToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
