import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/helpers/utils";

/**
 * Solid amber "warning tape" bar shown while check-in test mode is on. Solid amber +
 * black text reads on any background (light app surface or the dark scanner portal) and
 * conveys meaning by icon + text, not color alone.
 */
export function TestModeBanner({
  recipients,
  className,
  compact = false,
}: {
  recipients: string[];
  className?: string;
  /** Show a short "TEST MODE" label without the recipient list (for tight spaces like the scanner). */
  compact?: boolean;
}) {
  const t = useTranslations("Admin.qrCheckIns.testMode");
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black",
        className,
      )}
    >
      <FlaskConical className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">
        {compact ? t("compact") : t("full", { recipients: recipients.join(", ") })}
      </span>
    </div>
  );
}
