"use client";

import { QrCode, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/helpers/utils";
import { RegistrationTableSkeleton } from "./RegistrationTableSkeleton";

type Tab = "registrations" | "check-in" | "logs";

const TABS = [
  { key: "registrations", icon: null, labelKey: "tabs.registrations" },
  { key: "check-in", icon: QrCode, labelKey: "tabs.checkIn" },
  { key: "logs", icon: ScrollText, labelKey: "tabs.logs" },
] as const;

// Client-side tab bar: navigation runs inside a transition so the current tab stays interactive
// while the next tab's server data streams in, and the table area swaps to a skeleton in the
// meantime instead of freezing or flashing blank.
export function QrCheckInsTabs({
  activeTab,
  year,
  children,
}: {
  activeTab: Tab;
  year: number;
  children: ReactNode;
}) {
  const tPage = useTranslations("Admin.qrCheckIns.page");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);

  function go(tab: Tab) {
    if (tab === activeTab) return;
    setPendingTab(tab);
    startTransition(() => {
      router.push(`/admin/qr-check-ins?year=${year}&tab=${tab}`);
    });
  }

  // Highlight the target tab immediately so the click feels instant.
  const shownTab = isPending && pendingTab ? pendingTab : activeTab;
  // The scanner tab is its own overlay; only the table-shaped tabs get the table skeleton.
  const showSkeleton = isPending && pendingTab !== null && pendingTab !== "check-in";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={tPage("tabListLabel")}
          className="inline-flex w-fit items-center rounded-lg bg-muted p-1"
        >
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="sm"
              aria-current={shownTab === key ? "page" : undefined}
              onClick={() => go(key)}
              className={cn(
                "rounded-md transition-all",
                shownTab === key
                  ? "bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground"
                  : "text-muted-foreground hover:bg-transparent hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {tPage(labelKey)}
            </Button>
          ))}
        </div>
      </div>

      {showSkeleton ? <RegistrationTableSkeleton /> : children}
    </>
  );
}
