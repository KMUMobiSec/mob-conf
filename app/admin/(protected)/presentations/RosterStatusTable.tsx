import { CheckCircle2, Download } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ValidYear } from "@/constants/config";
import { formatAdminDate } from "@/modules/admin/lib/intl";
import {
  listPresentationRosterStatus,
  summarizeRoster,
} from "@/modules/admin/presentations/lib/roster-queries";
import { RosterEmailDialog } from "./RosterEmailDialog";
import { RosterImportDialog } from "./RosterImportDialog";

export async function RosterStatusTable({ year }: { year: ValidYear }) {
  const [rows, locale] = await Promise.all([listPresentationRosterStatus(year), getLocale()]);
  const summary = summarizeRoster(rows);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-foreground">Presenter roster</h3>
          <p className="caption text-muted-foreground">
            Imported from a spreadsheet, matched to uploads by paper number.{" "}
            {summary.total > 0 ? (
              <>
                <strong className="text-foreground">{summary.uploaded}</strong> of{" "}
                <strong className="text-foreground">{summary.total}</strong> presenters have
                uploaded.
              </>
            ) : (
              "Import a roster to get started."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <a href={`/admin/presentations/roster-template?year=${year}`}>
              <Download className="size-4" />
              Download template
            </a>
          </Button>
          <RosterImportDialog year={year} />
          {rows.length > 0 ? <RosterEmailDialog year={year} rows={rows} /> : null}
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>Paper Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.rosterId}>
                    <TableCell className="tabular-nums font-medium text-foreground">
                      {row.paperNumber}
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <span className="block truncate text-foreground">{row.title}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.author}</TableCell>
                    <TableCell className="text-muted-foreground">{row.contactEmail}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.submittedAt ? formatAdminDate(locale, row.submittedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      {row.presentationId ? (
                        <Badge>
                          <CheckCircle2 className="size-3" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not uploaded</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
