import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrationOrders } from "@/db/schema";
import { getPaypalAccessToken, paypalBaseUrl } from "@/lib/payments/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { invoiceToken?: string } | null;
  const invoiceToken = body?.invoiceToken;
  if (!invoiceToken) {
    return NextResponse.json({ error: "Missing invoiceToken" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(registrationOrders)
    .where(eq(registrationOrders.invoiceToken, invoiceToken))
    .limit(1);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
  }

  const accessToken = await getPaypalAccessToken();
  const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.id,
          description: `MOBISEC ${order.year} — ${order.categoryName}`,
          amount: {
            currency_code: order.categoryCurrency,
            value: Number(order.total).toFixed(2),
          },
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("PayPal create-order failed", data);
    return NextResponse.json({ error: "Could not create PayPal order" }, { status: 502 });
  }

  return NextResponse.json({ id: data.id });
}
