import { ChevronRight, UtensilsCrossed, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Forms — Admin" };

interface FormEntry {
  href: string;
  titleKey: string;
  descriptionKey: string;
  icon: typeof Video;
}

const FORMS: FormEntry[] = [
  {
    href: "/admin/presentations",
    titleKey: "presentationUploadTitle",
    descriptionKey: "presentationUploadDescription",
    icon: Video,
  },
  {
    href: "/admin/banquet-survey",
    titleKey: "banquetSurveyTitle",
    descriptionKey: "banquetSurveyDescription",
    icon: UtensilsCrossed,
  },
];

export default async function FormsPage() {
  const t = await getTranslations("Admin.forms");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="subheading">{t("title")}</h2>
        <p className="caption text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FORMS.map((form) => {
          const Icon = form.icon;
          return (
            <Link
              key={form.href}
              href={form.href}
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full gap-4 transition-colors group-hover:border-primary/60">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="flex items-center gap-1">
                    {t(form.titleKey)}
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardTitle>
                  <CardDescription>{t(form.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm font-medium text-primary">{t("open")}</CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
