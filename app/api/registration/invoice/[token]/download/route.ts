import { isValidYear, type ValidYear } from "@/constants/config";
import { invoiceFilename, renderInvoicePdf } from "@/modules/landing/invoice/lib/invoice-pdf";
import { getRegistrationOrderByToken } from "@/modules/landing/invoice/lib/queries";

// react-pdf renders with Node APIs, so this must not run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getRegistrationOrderByToken(token);
  if (!order || !isValidYear(order.year)) {
    return new Response("Invoice not found.", { status: 404 });
  }

  const buffer = await renderInvoicePdf({ order, year: order.year as ValidYear });
  const filename = invoiceFilename(order);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
