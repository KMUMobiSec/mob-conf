import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { registrationOrders } from "@/db/schema";
import { getPaypalAccessToken, paypalBaseUrl } from "@/lib/payments/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    orderID?: string;
    invoiceToken?: string;
  } | null;
  const { orderID, invoiceToken } = body ?? {};
  if (!orderID || !invoiceToken) {
    return NextResponse.json({ error: "Missing orderID or invoiceToken" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(registrationOrders)
    .where(eq(registrationOrders.invoiceToken, invoiceToken))
    .limit(1);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const accessToken = await getPaypalAccessToken();
  const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${orderID}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      Prefer: "return=representation",
      "PayPal-Request-Id": `cap_${orderID}_${Date.now()}`,
    },
  });

  const data = await res.json();
  const captureStatus: string | undefined =
    data.status ?? data.purchase_units?.[0]?.payments?.captures?.[0]?.status;

  if (!res.ok || captureStatus !== "COMPLETED") {
    console.error("PayPal capture failed", data);
    return NextResponse.json({ error: "Capture failed", status: captureStatus }, { status: 502 });
  }

  const captureId: string | undefined = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;

  await db
    .update(registrationOrders)
    .set({
      status: "paid",
      paymentMethod: "paypal",
      paymentId: captureId ?? orderID,
      paymentPayload: JSON.stringify(data),
      paidAt: new Date(),
    })
    .where(eq(registrationOrders.invoiceToken, invoiceToken));

  return NextResponse.json({ status: "COMPLETED" });
}
