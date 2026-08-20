"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/helpers/utils";
import { PresentationsTableSkeleton } from "./PresentationsTableSkeleton";

type View = "table" | "program";

// Client-side view switcher: navigation runs inside a transition so the current view stays
// interactive while the next view's server data streams in. The table view swaps to a skeleton
// in the meantime instead of freezing or flashing blank; the program view has no table shape to
// mirror, so it just keeps showing the previous content until the new view is ready.
export function PresentationsViewTabs({
  activeView,
  year,
  children,
}: {
  activeView: View;
  year: number;
  children: ReactNode;
}) {
  const t = useTranslations("Admin.presentations.list");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingView, setPendingView] = useState<View | null>(null);

  function go(view: View) {
    if (view === activeView) return;
    setPendingView(view);
    startTransition(() => {
      const qs = view === "program" ? `?year=${year}&view=program` : `?year=${year}`;
      router.push(`/admin/presentations${qs}`);
    });
  }

  // Highlight the target view immediately so the click feels instant.
  const shownView = isPending && pendingView ? pendingView : activeView;
  // Only the table view has a table shape to mirror; the program view keeps showing whatever was
  // there before instead of a placeholder.
  const showSkeleton = isPending && pendingView === "table";

  return (
    <>
      <div
        role="tablist"
        aria-label={t("tabListLabel")}
        className="inline-flex w-fit gap-0.5 rounded-md border border-border bg-muted/50 p-0.5"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-current={shownView === "table" ? "page" : undefined}
          onClick={() => go("table")}
          className={cn(
            "rounded transition-colors",
            shownView === "table"
              ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
              : "text-muted-foreground hover:bg-transparent hover:text-foreground",
          )}
        >
          {t("tableView")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-current={shownView === "program" ? "page" : undefined}
          onClick={() => go("program")}
          className={cn(
            "rounded transition-colors",
            shownView === "program"
              ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground"
              : "text-muted-foreground hover:bg-transparent hover:text-foreground",
          )}
        >
          {t("programView")}
        </Button>
      </div>

      {showSkeleton ? <PresentationsTableSkeleton /> : children}
    </>
  );
}
