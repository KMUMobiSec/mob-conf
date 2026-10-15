import * as XLSX from "xlsx";
import { getCurrentAdminSession } from "@/lib/auth/session";
import { parseAdminYear } from "@/modules/admin/lib/year";

export const dynamic = "force-dynamic";

const HEADERS = ["Paper Number", "Title", "Author", "Contact Email"];
const EXAMPLE_ROW = ["12A", "An Example Paper Title", "Jane Doe", "jane.doe@example.com"];

/**
 * Download a blank roster import template (one header row + one example row) for the given year.
 * Route handlers under (protected) are NOT wrapped by the admin layout guard, so the admin session
 * is re-checked here.
 */
export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const year = parseAdminYear(url.searchParams.get("year") ?? undefined);

  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW]);
  sheet["!cols"] = [{ wch: 14 }, { wch: 48 }, { wch: 24 }, { wch: 28 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Presenters");
  const buffer: Buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mobisec-${year}-presenter-roster-template.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
