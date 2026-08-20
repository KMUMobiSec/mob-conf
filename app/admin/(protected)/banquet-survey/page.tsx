import { XIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE, parseBanquetListParams } from "@/modules/admin/banquet-survey/lib/filters";
import { listBanquetResponses } from "@/modules/admin/banquet-survey/lib/queries";
import { buildAdminYearHref } from "@/modules/admin/lib/year";
import { FilterSelect } from "../FilterSelect";
import { SearchInput } from "../SearchInput";
import { type BanquetResponseRow, BanquetResponsesTable } from "./BanquetResponsesTable";
import { BanquetStatsCards } from "./BanquetStatsCards";
import { ExportButton } from "./ExportButton";
import { ImportRegistrationsButton } from "./ImportRegistrationsButton";

export const metadata: Metadata = { title: "Banquet Survey — Admin" };

function serializeRow(
  row: Awaited<ReturnType<typeof listBanquetResponses>>["rows"][number],
): BanquetResponseRow {
  return {
    id: row.id,
    year: row.year,
    name: row.name,
    affiliation: row.affiliation,
    email: row.email,
    attending: row.attending,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    allergens: row.allergens,
    allergenOther: row.allergenOther,
    message: row.message,
    emailsSentCount: row.emailsSentCount,
    confirmationSentAt: row.confirmationSentAt?.toISOString() ?? null,
    invitationsSentCount: row.invitationsSentCount,
    invitationSentAt: row.invitationSentAt?.toISOString() ?? null,
  };
}

export default async function BanquetSurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("Admin.banquetSurvey.list");
  const tCommon = await getTranslations("Admin.common");
  const sp = await searchParams;
  const { year, q, status, page } = parseBanquetListParams(sp);

  const { rows, total } = await listBanquetResponses({ year, q, status, page });
  const serializedRows = rows.map(serializeRow);

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-6">
      <BanquetStatsCards year={year} />

      <div className="flex flex-row items-center gap-3">
        <SearchInput
          placeholder={t("searchPlaceholder")}
          ariaLabel={t("searchAriaLabel")}
          className="w-64"
        />
        <FilterSelect
          name="status"
          ariaLabel={t("filterStatusAriaLabel")}
          placeholder={t("allResponses")}
          triggerClassName="w-[180px]"
          options={[
            { value: "", label: t("allResponses") },
            { value: "invited", label: t("invited") },
            { value: "attending", label: t("attending") },
            { value: "not_attending", label: t("notAttending") },
          ]}
        />
        {(q || status) && (
          <Button asChild variant="ghost" size="sm">
            <Link href={buildAdminYearHref("/admin/banquet-survey", year)}>
              <XIcon className="size-4" />
              {tCommon("clear")}
            </Link>
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ExportButton year={year} />
          <ImportRegistrationsButton year={year} />
        </div>
      </div>

      <BanquetResponsesTable
        rows={serializedRows}
        year={year}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        params={{ year: String(year), q, status: status || undefined }}
        summary={t("summary", { total })}
      />
    </div>
  );
}
