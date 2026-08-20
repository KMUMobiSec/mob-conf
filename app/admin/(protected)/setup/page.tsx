import { FlaskConical, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { getAppSettings } from "@/modules/admin/settings/lib/queries";
import { BanquetDetailsForm } from "./BanquetDetailsForm";
import { TesterEmailsForm } from "./TesterEmailsForm";

export const metadata: Metadata = { title: "Admin Setup — Admin" };

export default async function AdminSetupPage() {
  const settings = await getAppSettings();
  const t = await getTranslations("Admin.setup");
  const tCommon = await getTranslations("Admin.common");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="subheading">{t("title")}</h2>
        <p className="caption text-muted-foreground">{t("description")}</p>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">{t("testModeTitle")}</h3>
          </div>
          <Badge variant={settings.checkInTestMode ? "default" : "secondary"}>
            {settings.checkInTestMode ? tCommon("on") : tCommon("off")}
          </Badge>
        </div>
        <p className="caption text-muted-foreground">{t("testModeDescription")}</p>
        <TesterEmailsForm testerEmails={settings.testerEmails} />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t("banquetTitle")}</h3>
        </div>
        <p className="caption text-muted-foreground">{t("banquetDescription")}</p>
        <BanquetDetailsForm
          banquetDate={settings.banquetDate}
          banquetVenue={settings.banquetVenue}
        />
      </section>
    </div>
  );
}
