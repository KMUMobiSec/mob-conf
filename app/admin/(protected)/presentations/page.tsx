import { CheckCircle2, Video, XIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
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
import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { cn } from "@/lib/helpers/utils";
import { loadProgramSchedule } from "@/lib/program/schedule";
import { formatAdminDate } from "@/modules/admin/lib/intl";
import { buildAdminYearHref } from "@/modules/admin/lib/year";
import { parsePresentationListParams } from "@/modules/admin/presentations/lib/filters";
import {
  listPresentations,
  listPresentationsForMatching,
} from "@/modules/admin/presentations/lib/queries";
import { FilterSelect } from "../FilterSelect";
import { SearchInput } from "../SearchInput";
import { TablePagination } from "../TablePagination";
import { PresentationsViewTabs } from "./PresentationsViewTabs";
import { ProgramView } from "./ProgramView";
import { RosterStatusTable } from "./RosterStatusTable";

export const metadata: Metadata = { title: "Presentations — Admin" };

export default async function PresentationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const { year, reviewed, q } = parsePresentationListParams(sp);
  const view = sp.view === "program" ? "program" : "table";

  return (
    // Only the table view is table-shaped and needs the viewport-capped scroll region; the program
    // view is a normal document-flow list of sessions and scrolls with the page.
    <div className={cn("flex flex-col gap-6", view === "table" && "h-full")}>
      <PresentationsViewTabs activeView={view} year={year}>
        {view === "program" ? (
          <ProgramView
            schedule={await loadProgramSchedule(year)}
            presentations={await listPresentationsForMatching(year)}
          />
        ) : (
          <TableSection year={year} reviewed={reviewed} q={q} page={sp.page} />
        )}
      </PresentationsViewTabs>
    </div>
  );
}

async function TableSection({
  year,
  reviewed,
  q,
  page: pageParamRaw,
}: {
  year: ValidYear;
  reviewed: boolean | undefined;
  q: string | undefined;
  page: string | string[] | undefined;
}) {
  const pageParam = Array.isArray(pageParamRaw) ? pageParamRaw[0] : pageParamRaw;
  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const locale = await getLocale();
  const t = await getTranslations("Admin.presentations.list");
  const tCommon = await getTranslations("Admin.common");

  const { rows, total, page, pageSize } = await listPresentations({
    year,
    reviewed,
    q,
    page: requestedPage,
  });

  const reviewedParam = reviewed === undefined ? "" : reviewed ? "1" : "0";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <RosterStatusTable year={year} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder={t("searchPlaceholder")}
          ariaLabel={t("searchAriaLabel")}
          className="w-64"
        />
        <FilterSelect
          name="year"
          ariaLabel={t("filterYearAriaLabel")}
          fallback={String(year)}
          triggerClassName="w-[100px]"
          options={VALID_YEARS.map((y) => ({ value: String(y), label: String(y) }))}
        />
        <FilterSelect
          name="reviewed"
          ariaLabel={t("filterReviewedAriaLabel")}
          placeholder={t("allStatuses")}
          triggerClassName="w-[160px]"
          options={[
            { value: "", label: t("allStatuses") },
            { value: "1", label: t("reviewed") },
            { value: "0", label: t("notReviewed") },
          ]}
        />
        {(reviewed !== undefined || q) && (
          <Button asChild variant="ghost" size="sm">
            <Link href={buildAdminYearHref("/admin/presentations", year)}>
              <XIcon className="size-4" />
              {tCommon("clear")}
            </Link>
          </Button>
        )}
      </div>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
          <div className="min-h-0 flex-1 overflow-auto *:data-[slot=table-container]:overflow-visible">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>{t("columns.paperNumber")}</TableHead>
                  <TableHead>{t("columns.title")}</TableHead>
                  <TableHead>{t("columns.contact")}</TableHead>
                  <TableHead>{t("columns.year")}</TableHead>
                  <TableHead>{t("columns.files")}</TableHead>
                  <TableHead>{t("columns.submitted")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="tabular-nums">
                      <Link
                        href={`/admin/presentations/${p.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {p.paperNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <span className="block truncate text-foreground">{p.title}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.contactEmail}</TableCell>
                    <TableCell className="tabular-nums">{p.year}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="tabular-nums">
                          {t("fileCount", { count: p.materialCount })}
                        </span>
                        {p.hasVideo && (
                          <Badge variant="secondary">
                            <Video className="size-3" />
                            {t("video")}
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAdminDate(locale, p.createdAt)}
                    </TableCell>
                    <TableCell>
                      {p.isReviewed ? (
                        <Badge>
                          <CheckCircle2 className="size-3" />
                          {t("reviewed")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/presentations/${p.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {t("view")}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            path="/admin/presentations"
            params={{
              year: String(year),
              reviewed: reviewedParam,
              q,
            }}
            summary={t("summary", { total })}
          />
        </div>
      )}
    </div>
  );
}
