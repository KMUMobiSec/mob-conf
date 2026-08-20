"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WayfinderStepsProps {
  stepIds: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

/** Step list + Back/Next controls. Selecting a row activates that step. */
export default function WayfinderSteps({
  stepIds,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
}: WayfinderStepsProps) {
  const t = useTranslations("Wayfinder");
  const total = stepIds.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="caption text-muted-foreground">
          {t("stepLabel", { current: activeIndex + 1, total })}
        </p>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={activeIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          <Button size="sm" onClick={onNext} disabled={activeIndex === total - 1}>
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stepIds.map((id, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={isActive ? "step" : undefined}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex h-full w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                  isActive
                    ? "border-primary/40 bg-card shadow-sm"
                    : "border-transparent bg-muted/40 hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground/80 text-background",
                  )}
                >
                  {index + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="small-heading text-foreground">{t(`steps.${id}.title`)}</span>
                  <span className="body text-muted-foreground">{t(`steps.${id}.body`)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
