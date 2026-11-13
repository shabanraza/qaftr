import { createTRPCRouter } from "./init";
import { businessRouter } from "./routers/business";
import { clientsRouter } from "./routers/clients";
import { invoicesRouter } from "./routers/invoices";
import { billingRouter } from "./routers/billing";
import { instantInvoiceRouter } from "./routers/instant-invoice";
import { quotesRouter } from "./routers/quotes";
import { zatcaRouter } from "./routers/zatca";

export const trpcRouter = createTRPCRouter({
  business: businessRouter,
  clients: clientsRouter,
  invoices: invoicesRouter,
  billing: billingRouter,
  instantInvoice: instantInvoiceRouter,
  quotes: quotesRouter,
  zatca: zatcaRouter,
});

export type TRPCRouter = typeof trpcRouter;
