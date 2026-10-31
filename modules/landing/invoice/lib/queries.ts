import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { registrationOrders } from "@/db/schema";

export async function getRegistrationOrderByToken(invoiceToken: string) {
  const [order] = await db
    .select()
    .from(registrationOrders)
    .where(eq(registrationOrders.invoiceToken, invoiceToken))
    .limit(1);
  return order ?? null;
}
