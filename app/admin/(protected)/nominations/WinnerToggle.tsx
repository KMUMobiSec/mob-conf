"use client";

import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setNominationWinner } from "@/modules/admin/nominations/actions";

export function WinnerToggle({ id, initialIsWinner }: { id: string; initialIsWinner: boolean }) {
  const t = useTranslations("Admin.nominations.actions");
  const [isWinner, setIsWinner] = useState(initialIsWinner);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !isWinner;
    setError(null);
    startTransition(async () => {
      const result = await setNominationWinner(id, next);
      if (result.ok) {
        setIsWinner(next);
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
        variant={isWinner ? "default" : "outline"}
        onClick={toggle}
        disabled={pending}
      >
        <Trophy className="size-4" />
        {pending ? t("saving") : isWinner ? t("removeWinner") : t("markWinner")}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
