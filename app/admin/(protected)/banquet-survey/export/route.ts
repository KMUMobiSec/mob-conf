import { getCurrentAdminSession } from "@/lib/auth/session";
import { toBanquetCsv } from "@/modules/admin/banquet-survey/lib/export-csv";
import {
  getBanquetStats,
  listAllBanquetResponses,
} from "@/modules/admin/banquet-survey/lib/queries";
import { renderBanquetReport } from "@/modules/admin/banquet-survey/lib/report-pdf";
import { parseAdminYear } from "@/modules/admin/lib/year";

// react-pdf renders with Node APIs, so this must not run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "2026-07-09 12:30 UTC" — stable, timezone-explicit label for the PDF header. */
function utcLabel(now: Date): string {
  return `${now.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/**
 * Download the full year's banquet responses. Route handlers under (protected) are NOT wrapped by
 * the admin layout guard, so we re-check the admin session here. Always exports every response for
 * the year (`?format=csv|pdf`).
 */
export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const year = parseAdminYear(url.searchParams.get("year") ?? undefined);

  const rows = await listAllBanquetResponses(year);

  if (format === "csv") {
    // Leading BOM (U+FEFF) so Excel detects UTF-8 and renders accented names correctly.
    const body = `﻿${toBanquetCsv(rows)}`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mobisec-${year}-banquet-responses.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const stats = await getBanquetStats(year);
  const pdf = await renderBanquetReport({
    year,
    rows,
    stats,
    generatedAtLabel: utcLabel(new Date()),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mobisec-${year}-banquet-report.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
