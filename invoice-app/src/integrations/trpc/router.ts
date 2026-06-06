import { createTRPCRouter } from "./init";
import { businessRouter } from "./routers/business";
import { clientsRouter } from "./routers/clients";
import { invoicesRouter } from "./routers/invoices";
import { billingRouter } from "./routers/billing";

export const trpcRouter = createTRPCRouter({
  business: businessRouter,
  clients: clientsRouter,
  invoices: invoicesRouter,
  billing: billingRouter,
});

export type TRPCRouter = typeof trpcRouter;
