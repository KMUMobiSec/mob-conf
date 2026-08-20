import { Trophy, XIcon } from "lucide-react";
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
import { VALID_YEARS } from "@/constants/config";
import { formatAdminDate } from "@/modules/admin/lib/intl";
import { buildAdminYearHref } from "@/modules/admin/lib/year";
import { parseNominationListParams } from "@/modules/admin/nominations/lib/filters";
import { listNominations, listPendingWinners } from "@/modules/admin/nominations/lib/queries";
import { AWARDS, getAward } from "@/modules/landing/nomination-form/lib/constants";
import { FilterSelect } from "../FilterSelect";
import { SearchInput } from "../SearchInput";
import { TablePagination } from "../TablePagination";
import { NotifyWinnersButton } from "./NotifyWinnersButton";
import { TestEmailButton } from "./TestEmailButton";

export const metadata: Metadata = { title: "Nominations — Admin" };

export default async function NominationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("Admin.nominations.list");
  const tCommon = await getTranslations("Admin.common");
  const { year, award, winner, q } = parseNominationListParams(sp);

  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const { rows, total, page, pageSize } = await listNominations({
    year,
    award,
    winner: winner || undefined,
    q,
    page: requestedPage,
  });
  const pendingWinners = (await listPendingWinners(year)).length;

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-6">
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
          name="award"
          ariaLabel={t("filterAwardAriaLabel")}
          placeholder={t("allAwards")}
          triggerClassName="w-[180px]"
          options={[
            { value: "", label: t("allAwards") },
            ...AWARDS.map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
        <FilterSelect
          name="winner"
          ariaLabel={t("filterWinnerAriaLabel")}
          placeholder={t("allNominees")}
          triggerClassName="w-[150px]"
          options={[
            { value: "", label: t("allNominees") },
            { value: "1", label: t("winnersOnly") },
          ]}
        />
        {(award || winner || q) && (
          <Button asChild variant="ghost" size="sm">
            <Link href={buildAdminYearHref("/admin/nominations", year)}>
              <XIcon className="size-4" />
              {tCommon("clear")}
            </Link>
          </Button>
        )}
        <div className="ml-auto flex items-start gap-2">
          <TestEmailButton year={year} />
          <NotifyWinnersButton pendingCount={pendingWinners} year={year} />
        </div>
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
                  <TableHead>{t("columns.nominee")}</TableHead>
                  <TableHead>{t("columns.award")}</TableHead>
                  <TableHead>{t("columns.year")}</TableHead>
                  <TableHead>{t("columns.nominator")}</TableHead>
                  <TableHead>{t("columns.submitted")}</TableHead>
                  <TableHead>{t("columns.emails")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <Link
                        href={`/admin/nominations/${n.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {n.nomineeName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{n.nomineeEmail}</div>
                    </TableCell>
                    <TableCell>{getAward(n.award)?.name ?? n.award}</TableCell>
                    <TableCell className="tabular-nums">{n.year}</TableCell>
                    <TableCell>
                      <div>{n.nominatorName}</div>
                      <div className="text-xs text-muted-foreground">{n.nominatorEmail}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAdminDate(locale, n.createdAt)}
                    </TableCell>
                    <TableCell className="tabular-nums">{n.emailsSentCount}</TableCell>
                    <TableCell>
                      {n.isWinner ? (
                        <Badge>
                          <Trophy className="size-3" />
                          {t("winner")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/nominations/${n.id}`}
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
            path="/admin/nominations"
            params={{
              year: String(year),
              award,
              winner: winner ? "1" : undefined,
              q,
            }}
            summary={t("summary", { total })}
          />
        </div>
      )}
    </div>
  );
}
