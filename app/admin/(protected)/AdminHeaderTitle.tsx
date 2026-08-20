"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

// Section title shown in the admin app-bar. Derived from the route (flash-free,
// since usePathname resolves during SSR) rather than per-page context.
const SECTION_TITLES: { prefix: string; key: string }[] = [
  { prefix: "/admin/nominations", key: "nominations" },
  { prefix: "/admin/presentations", key: "presentations" },
  { prefix: "/admin/qr-check-ins", key: "qrCheckIns" },
  { prefix: "/admin/email-blast", key: "emailBlast" },
  { prefix: "/admin/certificates", key: "certificates" },
  { prefix: "/admin/banquet-survey", key: "banquetSurvey" },
  { prefix: "/admin/forms", key: "forms" },
  { prefix: "/admin/setup", key: "setup" },
];

export function AdminHeaderTitle() {
  const pathname = usePathname();
  const t = useTranslations("Admin.header.sections");
  const titleKey = SECTION_TITLES.find((section) => pathname.startsWith(section.prefix))?.key;
  const title = titleKey ? t(titleKey) : t("admin");
  return <h1 className="text-sm font-semibold text-foreground">{title}</h1>;
}
