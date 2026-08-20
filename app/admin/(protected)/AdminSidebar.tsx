"use client";

import {
  Award,
  CalendarDays,
  Check,
  ChevronsUpDown,
  FileText,
  LogOut,
  Monitor,
  Moon,
  Presentation,
  QrCode,
  ScrollText,
  Send,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { VALID_YEARS } from "@/constants/config";
import { signOut } from "@/lib/auth/client";
import { buildAdminYearHref, parseAdminYear } from "@/modules/admin/lib/year";

const THEME_OPTIONS = [
  { value: "light", key: "light", icon: Sun },
  { value: "dark", key: "dark", icon: Moon },
  { value: "system", key: "system", icon: Monitor },
] as const;

function getInitials(name: string | null | undefined, email: string) {
  const source = name?.trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// Active nav tab: solid brand-green pill, clearly distinct from the faint hover state.
// Text is theme-aware — white on the darker green (light), near-black on the lighter green (dark).
const ACTIVE_NAV_CLASS =
  "data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-sm hover:data-[active=true]:bg-sidebar-primary dark:data-[active=true]:text-background";

export function AdminSidebar({ user }: { user: { name?: string | null; email: string } }) {
  const tNav = useTranslations("Admin.sidebar.nav");
  const tGroups = useTranslations("Admin.sidebar.groups");
  const tYear = useTranslations("Admin.sidebar.year");
  const tTheme = useTranslations("Admin.sidebar.theme");
  const tAccount = useTranslations("Admin.sidebar.account");
  const tLanguage = useTranslations("Admin.sidebar.language");
  const locale = useLocale();
  const [, setCookie] = useCookies(["locale"]);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedYear = parseAdminYear(searchParams.get("year") ?? undefined);
  const nominationsActive = pathname.startsWith("/admin/nominations");
  const presentationsActive = pathname.startsWith("/admin/presentations");
  const qrCheckInsActive = pathname.startsWith("/admin/qr-check-ins");
  const emailBlastActive = pathname.startsWith("/admin/email-blast");
  const certificatesActive = pathname.startsWith("/admin/certificates");
  const setupActive = pathname.startsWith("/admin/setup");
  const formsActive =
    pathname.startsWith("/admin/forms") || pathname.startsWith("/admin/banquet-survey");

  const navItems = [
    {
      key: "qr-check-ins",
      label: tNav("qrCheckIns"),
      icon: QrCode,
      href: buildAdminYearHref("/admin/qr-check-ins", selectedYear),
      isActive: qrCheckInsActive,
    },
    {
      key: "presentations",
      label: tNav("presentations"),
      icon: Presentation,
      href: buildAdminYearHref("/admin/presentations", selectedYear),
      isActive: presentationsActive,
    },
    {
      key: "email-blast",
      label: tNav("emailBlast"),
      icon: Send,
      href: buildAdminYearHref("/admin/email-blast", selectedYear),
      isActive: emailBlastActive,
    },
    {
      key: "certificates",
      label: tNav("certificates"),
      icon: ScrollText,
      href: buildAdminYearHref("/admin/certificates", selectedYear),
      isActive: certificatesActive,
    },
    {
      key: "nominations",
      label: tNav("nominations"),
      icon: Award,
      href: buildAdminYearHref("/admin/nominations", selectedYear),
      isActive: nominationsActive,
    },
    {
      key: "forms",
      label: tNav("forms"),
      icon: FileText,
      href: buildAdminYearHref("/admin/forms", selectedYear),
      isActive: formsActive,
    },
  ];

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = user.name?.trim() || user.email;
  const initials = getInitials(user.name, user.email);

  function handleYearChange(value: string) {
    const year = parseAdminYear(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleLanguageChange(nextLocale: "en" | "kr") {
    setCookie("locale", nextLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "strict",
    });
    router.refresh();
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={tYear("tooltip", { year: selectedYear })}
                  className=" data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <CalendarDays className="size-4" />
                  </span>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="text-xs text-muted-foreground">{tYear("label")}</span>
                    <span className="truncate text-sm font-semibold text-foreground">
                      {selectedYear}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="bottom"
                sideOffset={4}
                className="w-(--radix-dropdown-menu-trigger-width) min-w-48"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {tYear("label")}
                </DropdownMenuLabel>
                {VALID_YEARS.map((year) => (
                  <DropdownMenuItem
                    key={year}
                    onSelect={() => handleYearChange(String(year))}
                    className="gap-2"
                  >
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <span className="font-medium">{year}</span>
                    {year === selectedYear && <Check className="ml-auto size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{tGroups("management")}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  tooltip={item.label}
                  className={ACTIVE_NAV_CLASS}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{tGroups("system")}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={setupActive}
                tooltip={tNav("setup")}
                className={ACTIVE_NAV_CLASS}
              >
                <Link href="/admin/setup">
                  <Settings />
                  <span>{tNav("setup")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={displayName}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback className="rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {displayName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={4}
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <Avatar className="size-8 rounded-md">
                      <AvatarFallback className="rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-sm font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {tTheme("label")}
                </DropdownMenuLabel>
                {THEME_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={(event) => {
                      event.preventDefault();
                      setTheme(option.value);
                    }}
                    className="gap-2"
                  >
                    <option.icon className="size-4 text-muted-foreground" />
                    <span>{tTheme(option.key)}</span>
                    {mounted && theme === option.value && (
                      <Check className="ml-auto size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {tLanguage("label")}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLanguageChange("en");
                  }}
                  className="gap-2"
                >
                  <span>🇺🇸</span>
                  <span>{tLanguage("english")}</span>
                  {locale === "en" && <Check className="ml-auto size-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLanguageChange("kr");
                  }}
                  className="gap-2"
                >
                  <span>🇰🇷</span>
                  <span>{tLanguage("korean")}</span>
                  {locale === "kr" && <Check className="ml-auto size-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSigningOut}
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleSignOut();
                  }}
                  className="gap-2"
                >
                  <LogOut className="size-4" />
                  <span>{isSigningOut ? tAccount("signingOut") : tAccount("signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
