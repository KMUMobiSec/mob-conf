"use client";

import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/helpers/utils";
import { setCheckInTestMode } from "@/modules/admin/settings/actions";

export function TestModeToggle({ enabled }: { enabled: boolean }) {
  const t = useTranslations("Admin.qrCheckIns.testMode");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(enabled);

  // Re-sync to the server value whenever it changes (e.g. a router.refresh from an
  // external check-in broadcast or a concurrent test-mode change).
  useEffect(() => {
    setChecked(enabled);
  }, [enabled]);

  function handleChange(next: boolean) {
    setChecked(next); // optimistic
    startTransition(async () => {
      const result = await setCheckInTestMode(next);
      if (!result.ok) {
        setChecked(!next); // revert on failure
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="check-in-test-mode"
        checked={checked}
        onCheckedChange={handleChange}
        disabled={isPending}
        aria-label={t("ariaLabel")}
        className="data-[state=checked]:bg-amber-500"
      />
      <Label htmlFor="check-in-test-mode" className="flex items-center gap-1.5 text-sm">
        <FlaskConical
          className={cn("size-4", checked ? "text-amber-500" : "text-muted-foreground")}
          aria-hidden="true"
        />
        {t("label")}
      </Label>
    </div>
  );
}
