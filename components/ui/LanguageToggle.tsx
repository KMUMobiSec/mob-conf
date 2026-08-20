"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCookies } from "react-cookie";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "kr", name: "한국어", flag: "🇰🇷" },
];

export function LanguageToggle() {
  const router = useRouter();
  const currentLocale = useLocale();
  const [, setCookie] = useCookies(["locale"]);
  const t = useTranslations("Navbar");

  const handleLanguageChange = (locale: string) => {
    // Set the locale cookie using react-cookie
    setCookie("locale", locale, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "strict",
    });

    // Refresh the page to apply the new locale
    router.refresh();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-2xl">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("toggleLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLocale === language.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
