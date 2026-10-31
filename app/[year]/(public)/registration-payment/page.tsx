import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ValidYear } from "@/constants/config";
import EmailGatePage from "@/modules/landing/registration-payment/components/EmailGatePage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: "Foreign Registration",
    alternates: { canonical: `/${year}/registration-payment` },
    robots: { index: false },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  const t = await getTranslations("RegistrationPaymentPage");

  return (
    <EmailGatePage
      year={Number(year) as ValidYear}
      labels={{
        title: t("emailTitle"),
        subtitle: t("emailSubtitle"),
        fieldLabel: t("emailFieldLabel"),
        submit: t("emailSubmit"),
        submitting: t("emailSending"),
        sentTitle: t("emailSentTitle"),
        sentDescription: t("emailSentDescription"),
      }}
    />
  );
}
