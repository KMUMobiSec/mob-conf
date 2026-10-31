import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import RegistrationFormPage from "@/modules/landing/registration-payment/components/RegistrationFormPage";
import { loadRegistrationYearData } from "@/modules/landing/registration-payment/lib/categories";
import {
  getRegistrationTokenSecret,
  parseRegistrationToken,
} from "@/modules/landing/registration-payment/lib/token";

interface PageProps {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: "Foreign Registration",
    alternates: { canonical: `/${year}/registration-payment/form` },
    robots: { index: false },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { year } = await params;
  const { token } = await searchParams;
  const t = await getTranslations("RegistrationPaymentPage");

  const parsed = token ? parseRegistrationToken(token, getRegistrationTokenSecret()) : null;

  if (!parsed) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h1 className="heading text-foreground">{t("formInvalidTitle")}</h1>
        <p className="body text-muted-foreground max-w-md">{t("formInvalidDescription")}</p>
        <Button asChild>
          <Link href={`/${year}/registration-payment`}>{t("formInvalidButton")}</Link>
        </Button>
      </div>
    );
  }

  const yearData = await loadRegistrationYearData(Number(year) as ValidYear);

  return (
    <RegistrationFormPage
      year={Number(year) as ValidYear}
      token={token as string}
      email={parsed.email}
      categories={yearData.categories}
      labels={{
        subtitle: t("formSubtitle"),
        fields: {
          firstName: t("fields.firstName"),
          lastName: t("fields.lastName"),
          affiliation: t("fields.affiliation"),
          phoneNumber: t("fields.phoneNumber"),
          country: t("fields.country"),
          countryPlaceholder: t("fields.countryPlaceholder"),
          category: t("fields.category"),
          paperId: t("fields.paperId"),
          paperTitle: t("fields.paperTitle"),
          billingHeading: t("fields.billingHeading"),
          billingOrganization: t("fields.billingOrganization"),
          billingDepartment: t("fields.billingDepartment"),
          billingAddress: t("fields.billingAddress"),
          billingCity: t("fields.billingCity"),
          billingState: t("fields.billingState"),
          billingZipCode: t("fields.billingZipCode"),
          billingCountry: t("fields.billingCountry"),
          billingVatNumber: t("fields.billingVatNumber"),
          billingContactName: t("fields.billingContactName"),
        },
        priceSummary: t("priceSummary"),
        submit: t("submit"),
        submitting: t("submitting"),
      }}
    />
  );
}
