"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CookieProvider } from "@/components/cookie-provider";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type NavRouteKey, YEAR_CONFIG } from "@/constants/config";
import { useYear } from "@/providers/year-provider";
import { LanguageToggle } from "./LanguageToggle";
import { ModeToggle } from "./ModeToggle";

type NavItem = { key: NavRouteKey; href: string; disabled: boolean; labelKey?: string };

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Navbar");
  const [mobileOpen, setMobileOpen] = useState(false);
  const year = useYear();

  const yearConfig = YEAR_CONFIG[year];
  const disabledRoutes = yearConfig.disabledRoutes;
  const isDisabled = (key: NavRouteKey) => disabledRoutes.includes(key);
  const registrationUrl = yearConfig.registrationUrl;

  const HOME_SUBNAV: NavItem[] = [
    { key: "home", href: `/${year}`, disabled: isDisabled("home") },
    { key: "overview", href: `/${year}/overview`, disabled: isDisabled("overview") },
    { key: "proceedings", href: `/${year}/proceedings`, disabled: isDisabled("proceedings") },
    {
      key: "previousEvents",
      href: `/${year}/previous-events`,
      disabled: isDisabled("previousEvents"),
    },
  ];

  const ORGANIZATION_LINK: NavItem = {
    key: "organization",
    href: `/${year}/organization`,
    disabled: isDisabled("organization"),
  };

  // Single "Program Schedule" entry, pointing at whichever schedule route is active
  // for the year (2026 → /program-schedule, earlier years → /program).
  const scheduleItem: NavItem = isDisabled("programFlow")
    ? {
        key: "program",
        href: `/${year}/program`,
        disabled: isDisabled("program"),
        labelKey: "programSchedule",
      }
    : {
        key: "programFlow",
        href: `/${year}/program-schedule`,
        disabled: false,
        labelKey: "programSchedule",
      };

  // Program dropdown — speakers, the schedule and keynotes.
  const PROGRAM_SUBNAV: NavItem[] = [
    {
      key: "featuredSpeakers",
      href: `/${year}/featured-speakers`,
      disabled: isDisabled("featuredSpeakers"),
    },
    scheduleItem,
    { key: "keynotes", href: `/${year}/keynotes`, disabled: isDisabled("keynotes") },
  ];
  const programDisabled = PROGRAM_SUBNAV.every((item) => item.disabled);

  const AWARDS_SUBNAV: NavItem[] = [
    { key: "announcement", href: `/${year}/announcement`, disabled: isDisabled("announcement") },
    { key: "rollOfHonors", href: `/${year}/roll-of-honors`, disabled: isDisabled("rollOfHonors") },
  ];
  const awardsDisabled = AWARDS_SUBNAV.every((item) => item.disabled);

  // Remaining top-level links. Lifetime Achievement is hidden on desktop to save
  // space; it still appears in the mobile sheet and footer.
  const NAV_LINKS: NavItem[] = [
    {
      key: "lifetimeAchievement",
      href: `/${year}/lifetime-achievement`,
      disabled: isDisabled("lifetimeAchievement"),
    },
    {
      key: "authorInstructions",
      href: `/${year}/author-instruction`,
      disabled: isDisabled("authorInstructions"),
    },
    { key: "contact", href: `/${year}/contact`, disabled: isDisabled("contact") },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hash = href.split("#")[1];
    if (!hash) return;

    if (pathname === `/${year}`) {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      e.preventDefault();
      router.push(href);
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  // Shared desktop dropdown styling — compact popover anchored under each tab.
  const DROPDOWN_CONTENT_CLASS = "left-0 flex w-auto min-w-[12rem] flex-col gap-0.5 p-1";

  const renderDropdownItem = (item: NavItem, withAnchorScroll = false) => {
    const label = t(item.labelKey ?? item.key);
    return (
      <NavigationMenuLink
        asChild
        key={item.key}
        className={
          item.disabled
            ? "block rounded-sm px-3 py-2 text-nowrap text-muted-foreground/40 cursor-not-allowed pointer-events-none"
            : "block rounded-sm px-3 py-2 text-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        }
      >
        {item.disabled ? (
          <span aria-disabled="true">
            <span className="tag">{label}</span>
          </span>
        ) : (
          <Link
            href={item.href}
            onClick={withAnchorScroll ? (e) => handleAnchorClick(e, item.href) : undefined}
          >
            <span className="tag">{label}</span>
          </Link>
        )}
      </NavigationMenuLink>
    );
  };

  // Mobile sheet link — handles disabled state and closes the sheet on navigate.
  const renderMobileLink = (item: NavItem, className: string, withAnchorScroll = false) => {
    const label = t(item.labelKey ?? item.key);
    return (
      <SheetClose asChild key={item.key}>
        {item.disabled ? (
          <span
            role="link"
            tabIndex={-1}
            className={`${className} text-muted-foreground/50 cursor-not-allowed`}
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
            onKeyDown={(e) => e.preventDefault()}
          >
            {label}
          </span>
        ) : (
          <Link
            href={item.href}
            onClick={(e) => {
              if (withAnchorScroll) handleAnchorClick(e, item.href);
              setMobileOpen(false);
            }}
            className={`${className} text-muted-foreground hover:text-foreground hover:bg-accent transition-colors`}
          >
            {label}
          </Link>
        )}
      </SheetClose>
    );
  };

  const mobileTopClass = "px-3 py-2.5 rounded-md text-sm font-medium";
  const mobileSubClass = "block px-3 py-2 rounded-md text-sm font-medium ml-2";

  return (
    <CookieProvider>
      <div className="sticky top-0 z-999 bg-background w-full flex justify-between items-start">
        <div className="flex items-center min-w-0 flex-1">
          {/* ─── Mobile nav ─── */}
          <nav className="flex lg:hidden items-center justify-between w-full px-4 py-3">
            <Link href={`/${year}`} aria-label="Go to homepage">
              <Image
                src="/assets/logo/mobisec-logo.png"
                alt="MOBISEC Logo"
                width={120}
                height={90}
                className="h-8 w-auto dark:hidden"
                priority
              />
              <Image
                src="/assets/logo/mobisec-logo-white.png"
                alt="MOBISEC Logo"
                width={120}
                height={90}
                className="hidden h-8 w-auto dark:block"
                priority
              />
            </Link>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetContent side="right" className="w-72 pt-12">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t("home")}</SheetTitle>
                </SheetHeader>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-4">
                  <div className="flex flex-col gap-1 px-4">
                    <p className="tag px-3 py-1.5 text-muted-foreground">{t("home")}</p>
                    {HOME_SUBNAV.map((item) => renderMobileLink(item, mobileTopClass, true))}
                  </div>

                  <div className="flex flex-col gap-1 px-4">
                    <Separator className="my-2 w-auto" />

                    {/* Organization — separate tab */}
                    {renderMobileLink(ORGANIZATION_LINK, mobileTopClass)}

                    <Separator className="my-2 w-auto" />

                    {/* Program submenu */}
                    <div>
                      <p className="tag px-3 py-1.5 text-muted-foreground">{t("programMenu")}</p>
                      {PROGRAM_SUBNAV.map((item) => renderMobileLink(item, mobileSubClass))}
                    </div>

                    <Separator className="my-2 w-auto" />

                    {/* Awards submenu */}
                    <div>
                      <p className="tag px-3 py-1.5 text-muted-foreground">{t("awards")}</p>
                      {AWARDS_SUBNAV.map((item) => renderMobileLink(item, mobileSubClass))}
                    </div>

                    <Separator className="my-2 w-auto" />

                    {NAV_LINKS.map((item) => renderMobileLink(item, mobileTopClass))}

                    {registrationUrl && (
                      <SheetClose asChild>
                        <a
                          href={registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-2.5 rounded-md text-sm font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 transition-colors"
                        >
                          {t("registration")}
                        </a>
                      </SheetClose>
                    )}

                    {/* Admin sign-in — mobile menu only. */}
                    <SheetClose asChild>
                      <Link
                        href="/admin/login"
                        onClick={() => setMobileOpen(false)}
                        className="mt-1 flex items-center justify-center rounded-md border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        {t("adminLogin")}
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </nav>

          {/* ─── Desktop nav ─── */}
          <NavigationMenu
            viewport={false}
            className="hidden lg:flex justify-between items-center w-full shrink-0"
          >
            <NavigationMenuList className="flex-wrap flex-1">
              {/* Logo — links to home */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href={`/${year}`} aria-label="Go to homepage">
                    <Image
                      src="/assets/logo/mobisec-logo.png"
                      alt="MOBISEC Logo"
                      width={120}
                      height={90}
                      className="h-8 w-auto dark:hidden"
                    />
                    <Image
                      src="/assets/logo/mobisec-logo-white.png"
                      alt="MOBISEC Logo"
                      width={120}
                      height={90}
                      className="hidden h-8 w-auto dark:block"
                    />
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Home dropdown */}
              <NavigationMenuItem className="relative">
                <NavigationMenuTrigger>
                  <span className="tag">{t("home")}</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className={DROPDOWN_CONTENT_CLASS}>
                  {HOME_SUBNAV.map((item) => renderDropdownItem(item, true))}
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Organization — separate tab */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  {ORGANIZATION_LINK.disabled ? (
                    <span
                      className={`${navigationMenuTriggerStyle()} opacity-40 cursor-not-allowed pointer-events-none`}
                      aria-disabled="true"
                    >
                      <span className="tag">{t(ORGANIZATION_LINK.key)}</span>
                    </span>
                  ) : (
                    <Link href={ORGANIZATION_LINK.href}>
                      <span className="tag">{t(ORGANIZATION_LINK.key)}</span>
                    </Link>
                  )}
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Program dropdown */}
              <NavigationMenuItem className="relative">
                {programDisabled ? (
                  <span
                    className={`${navigationMenuTriggerStyle()} opacity-40 cursor-not-allowed pointer-events-none`}
                    aria-disabled="true"
                  >
                    <span className="tag">{t("programMenu")}</span>
                  </span>
                ) : (
                  <>
                    <NavigationMenuTrigger>
                      <span className="tag">{t("programMenu")}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className={DROPDOWN_CONTENT_CLASS}>
                      {PROGRAM_SUBNAV.map((item) => renderDropdownItem(item))}
                    </NavigationMenuContent>
                  </>
                )}
              </NavigationMenuItem>

              {/* Awards dropdown */}
              <NavigationMenuItem className="relative">
                {awardsDisabled ? (
                  <span
                    className={`${navigationMenuTriggerStyle()} opacity-40 cursor-not-allowed pointer-events-none`}
                    aria-disabled="true"
                  >
                    <span className="tag">{t("awards")}</span>
                  </span>
                ) : (
                  <>
                    <NavigationMenuTrigger>
                      <span className="tag">{t("awards")}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className={DROPDOWN_CONTENT_CLASS}>
                      {AWARDS_SUBNAV.map((item) => renderDropdownItem(item, false))}
                    </NavigationMenuContent>
                  </>
                )}
              </NavigationMenuItem>

              {/* Remaining top-level links (Lifetime Achievement hidden on desktop) */}
              {NAV_LINKS.filter((item) => !item.disabled && item.key !== "lifetimeAchievement").map(
                (item) => (
                  <NavigationMenuItem key={item.key}>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link href={item.href}>
                        <span className="tag">{t(item.key)}</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ),
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Language & mode toggles */}
        <div className="flex items-center gap-2 shrink-0 px-4 lg:px-0 lg:pr-4">
          {registrationUrl && (
            <Button asChild size="sm" className="hidden lg:inline-flex">
              <a href={registrationUrl} target="_blank" rel="noopener noreferrer">
                {t("registration")}
              </a>
            </Button>
          )}
          <LanguageToggle />
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon-2xl"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </CookieProvider>
  );
}
