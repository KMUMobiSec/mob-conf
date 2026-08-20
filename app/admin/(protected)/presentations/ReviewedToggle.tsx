"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setPresentationReviewed } from "@/modules/admin/presentations/actions";

export function ReviewedToggle({
  id,
  initialIsReviewed,
}: {
  id: string;
  initialIsReviewed: boolean;
}) {
  const t = useTranslations("Admin.presentations.actions");
  const [isReviewed, setIsReviewed] = useState(initialIsReviewed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !isReviewed;
    setError(null);
    startTransition(async () => {
      const result = await setPresentationReviewed(id, next);
      if (result.ok) {
        setIsReviewed(next);
        router.refresh();
      } else {
        setError(result.error ?? t("updateError"));
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={isReviewed ? "default" : "outline"}
        onClick={toggle}
        disabled={pending}
      >
        <CheckCircle2 className="size-4" />
        {pending ? t("saving") : isReviewed ? t("undoReviewed") : t("markReviewed")}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
