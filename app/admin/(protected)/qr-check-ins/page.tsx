import type { Metadata } from "next";
import { cn } from "@/lib/helpers/utils";
import { parseAdminYear } from "@/modules/admin/lib/year";
import { listCheckInLogs, listRegistrations } from "@/modules/admin/qr-check-ins/lib/queries";
import { getAppSettings } from "@/modules/admin/settings/lib/queries";
import { testModeRecipients } from "@/modules/admin/settings/lib/test-mode";
import { HeaderActionsSlot } from "../HeaderActionsSlot";
import { type CheckInLogEntry, CheckInLogs } from "./CheckInLogs";
import { QrCheckInsTabs } from "./QrCheckInsTabs";
import { RegistrationTable, type RegistrationTableRow } from "./RegistrationTable";
import { ScannerTab } from "./ScannerTab";
import { TestModeBanner } from "./TestModeBanner";
import { TestModeToggle } from "./TestModeToggle";

export const metadata: Metadata = { title: "QR Check Ins — Admin" };

type Tab = "registrations" | "check-in" | "logs";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseTab(value: string | undefined): Tab {
  if (value === "check-in") return "check-in";
  if (value === "logs") return "logs";
  return "registrations";
}

function serializeLogEntry(
  row: Awaited<ReturnType<typeof listCheckInLogs>>["rows"][number],
): CheckInLogEntry {
  return {
    id: row.id,
    idNumber: row.idNumber,
    name: row.name,
    affiliation: row.affiliation,
    checkedInAt: row.checkedInAt.toISOString(),
    checkedInBy: row.checkedInBy,
  };
}

function tabHref(tab: Tab, year: number): string {
  return `/admin/qr-check-ins?year=${year}&tab=${tab}`;
}

function serializeRow(
  row: Awaited<ReturnType<typeof listRegistrations>>["rows"][number],
): RegistrationTableRow {
  return {
    id: row.id,
    year: row.year,
    idNumber: row.idNumber,
    email: row.email,
    name: row.name,
    affiliation: row.affiliation,
    qrEmailSentAt: row.qrEmailSentAt?.toISOString() ?? null,
    qrEmailSentCount: row.qrEmailSentCount,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
  };
}

export default async function QrCheckInsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const year = parseAdminYear(first(sp.year));
  const tab = parseTab(first(sp.tab));
  const q = first(sp.q)?.trim() || undefined;
  const checkedInRaw = first(sp.checkedIn);
  const checkedIn = checkedInRaw === "1" ? true : checkedInRaw === "0" ? false : undefined;
  const requestedPage = Math.max(1, Number(first(sp.page)) || 1);
  const { rows, total, checkedInTotal, page, pageSize } = await listRegistrations({
    year,
    q,
    checkedIn,
    page: requestedPage,
  });
  const serializedRows = rows.map(serializeRow);
  const settings = await getAppSettings();
  const testMode = settings.checkInTestMode;
  const recipients = testModeRecipients(settings.testerEmails);
  const logs = tab === "logs" ? await listCheckInLogs({ year, page: requestedPage }) : null;

  return (
    // The registrations and logs tabs fill the viewport so their list scrolls internally (see the
    // layout shell); the scanner tab is a full-screen overlay and ignores this.
    <div
      className={cn(
        "flex flex-col gap-4 sm:gap-6",
        (tab === "registrations" || tab === "logs") && "h-full",
      )}
    >
      <HeaderActionsSlot>
        <TestModeToggle enabled={testMode} />
      </HeaderActionsSlot>
      <QrCheckInsTabs activeTab={tab} year={year}>
        {tab === "registrations" ? (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              testMode && "overflow-hidden rounded-lg border-2 border-amber-500",
            )}
          >
            {testMode ? <TestModeBanner recipients={recipients} /> : null}
            <div className={cn("flex min-h-0 flex-1 flex-col", testMode && "p-4")}>
              <RegistrationTable
                rows={serializedRows}
                year={year}
                page={page}
                pageSize={pageSize}
                total={total}
                checkedInTotal={checkedInTotal}
                testMode={testMode}
                params={{
                  year: String(year),
                  tab: "registrations",
                  q,
                  checkedIn: checkedInRaw,
                }}
              />
            </div>
          </div>
        ) : tab === "logs" && logs ? (
          <CheckInLogs
            rows={logs.rows.map(serializeLogEntry)}
            year={year}
            page={logs.page}
            pageSize={logs.pageSize}
            total={logs.total}
            params={{ year: String(year), tab: "logs" }}
          />
        ) : (
          <ScannerTab
            year={year}
            closeHref={tabHref("registrations", year)}
            testMode={testMode}
            recipients={recipients}
          />
        )}
      </QrCheckInsTabs>
    </div>
  );
}
