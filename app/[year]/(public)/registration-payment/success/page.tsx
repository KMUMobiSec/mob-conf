import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ invoice?: string; email?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: "Registration Received",
    alternates: { canonical: `/${year}/registration-payment/success` },
    robots: { index: false },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { year } = await params;
  const { invoice, email } = await searchParams;
  const t = await getTranslations("RegistrationPaymentPage");

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-24 text-center">
      <CheckCircle2 className="h-12 w-12 text-primary" />
      <div className="flex flex-col gap-2">
        <h1 className="heading text-foreground">{t("successTitle")}</h1>
        <p className="body text-muted-foreground max-w-md">
          {t("successDescription").replace("{email}", email ?? "")}
        </p>
      </div>

      {email && (
        <Card className="flex flex-wrap items-center justify-center gap-2 p-4">
          <Badge variant="secondary">{email}</Badge>
          {invoice && <Badge variant="secondary">{invoice}</Badge>}
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {invoice && (
          <Button asChild size="lg">
            <Link href={`/${year}/invoice/${invoice}`}>{t("viewInvoice")}</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="lg">
          <Link href={`/${year}/registration-guide`}>{t("backToGuide")}</Link>
        </Button>
      </div>
    </div>
  );
}
