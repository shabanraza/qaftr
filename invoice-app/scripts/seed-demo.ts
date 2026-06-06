/**
 * Seed demo business, clients, and invoices for a user by email.
 * Usage: bun --env-file=.env.local scripts/seed-demo.ts [email]
 */
import { eq, max, and } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import {
  user,
  businesses,
  clients,
  invoices,
  lineItems,
} from "../src/db/schema.ts";

const EMAIL = process.argv[2] ?? "shaban.razaa@gmail.com";

async function main() {
  const [account] = await db
    .select()
    .from(user)
    .where(eq(user.email, EMAIL))
    .limit(1);

  if (!account) {
    console.error(`No user found for ${EMAIL}`);
    process.exit(1);
  }

  const ownerId = account.id;
  console.log(`Seeding for ${account.name} <${EMAIL}> (${ownerId})`);

  // Business
  const existingBiz = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, ownerId))
    .limit(1);

  let businessId: string;
  if (existingBiz[0]) {
    businessId = existingBiz[0].id;
    await db
      .update(businesses)
      .set({
        nameAr: "استوديو شبان للتصميم",
        nameEn: "Shaban Design Studio",
        vatNumber: "300000000000003",
        address: "الرياض، المملكة العربية السعودية",
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));
    console.log("Updated business:", businessId);
  } else {
    businessId = crypto.randomUUID();
    await db.insert(businesses).values({
      id: businessId,
      ownerId,
      nameAr: "استوديو شبان للتصميم",
      nameEn: "Shaban Design Studio",
      vatNumber: "300000000000003",
      address: "الرياض، المملكة العربية السعودية",
      defaultLanguage: "ar",
    });
    console.log("Created business:", businessId);
  }

  // Clients (skip if already seeded 2+)
  const existingClients = await db
    .select()
    .from(clients)
    .where(eq(clients.ownerId, ownerId));

  const clientSeeds = [
    {
      name: "شركة النور للتجارة",
      vatNumber: "310000000000001",
      email: "info@alnoor.sa",
      phone: "0501234567",
    },
    {
      name: "مؤسسة الأفق",
      vatNumber: "310000000000002",
      email: "contact@alofuq.sa",
      phone: "0559876543",
    },
  ];

  const clientIds: string[] = [...existingClients.map((c) => c.id)];

  for (const seed of clientSeeds) {
    const found = existingClients.find((c) => c.name === seed.name);
    if (found) continue;
    const id = crypto.randomUUID();
    await db.insert(clients).values({ id, ownerId, ...seed });
    clientIds.push(id);
    console.log("Created client:", seed.name);
  }

  if (clientIds.length === 0) {
    console.error("No clients available");
    process.exit(1);
  }

  // Invoices (skip if already 2+)
  const existingInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.ownerId, ownerId));

  if (existingInvoices.length >= 2) {
    console.log(`Already has ${existingInvoices.length} invoices — skipping invoice seed`);
    console.log("DONE");
    return;
  }

  const invoiceSeeds = [
    {
      clientId: clientIds[0]!,
      status: "unpaid" as const,
      subtotal: "2500.00",
      vatAmount: "375.00",
      total: "2875.00",
      notes: "تصميم هوية بصرية كاملة",
      items: [
        { description: "تصميم شعار وهوية بصرية", qty: "1", unitPrice: "2000.00", lineTotal: "2000.00" },
        { description: "بطاقات عمل (تصميم)", qty: "1", unitPrice: "500.00", lineTotal: "500.00" },
      ],
    },
    {
      clientId: clientIds[1] ?? clientIds[0]!,
      status: "paid" as const,
      subtotal: "1200.00",
      vatAmount: "180.00",
      total: "1380.00",
      notes: null,
      items: [
        { description: "تصميم واجهة تطبيق جوال", qty: "1", unitPrice: "1200.00", lineTotal: "1200.00" },
      ],
    },
    {
      clientId: clientIds[0]!,
      status: "draft" as const,
      subtotal: "800.00",
      vatAmount: "120.00",
      total: "920.00",
      notes: "مسودة — بانتظار الموافقة",
      items: [
        { description: "استشارة تصميم UX", qty: "4", unitPrice: "200.00", lineTotal: "800.00" },
      ],
    },
  ];

  for (const seed of invoiceSeeds) {
    const [maxRow] = await db
      .select({ max: max(invoices.seqNumber) })
      .from(invoices)
      .where(eq(invoices.businessId, businessId));
    const seqNumber = (maxRow?.max ?? 0) + 1;
    const invoiceId = crypto.randomUUID();

    await db.insert(invoices).values({
      id: invoiceId,
      ownerId,
      businessId,
      clientId: seed.clientId,
      seqNumber,
      issueDate: new Date(),
      status: seed.status,
      subtotal: seed.subtotal,
      vatAmount: seed.vatAmount,
      total: seed.total,
      currency: "SAR",
      notes: seed.notes,
    });

    await db.insert(lineItems).values(
      seed.items.map((item, i) => ({
        id: crypto.randomUUID(),
        invoiceId,
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        sortOrder: i,
      })),
    );

    console.log(`Created invoice INV-${String(seqNumber).padStart(3, "0")} (${seed.status})`);
  }

  console.log("DONE — sample data ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
