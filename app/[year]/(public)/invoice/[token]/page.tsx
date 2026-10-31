import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ValidYear } from "@/constants/config";
import InvoicePage from "@/modules/landing/invoice/components/InvoicePage";
import { getRegistrationOrderByToken } from "@/modules/landing/invoice/lib/queries";

interface PageProps {
  params: Promise<{ year: string; token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: "Invoice",
    alternates: { canonical: `/${year}/invoice` },
    robots: { index: false },
  };
}

export default async function Page({ params }: PageProps) {
  const { year, token } = await params;
  const t = await getTranslations("InvoicePage");
  const tCommon = await getTranslations("Common");
  const order = await getRegistrationOrderByToken(token);

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-24 text-center">
        <p className="body text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <InvoicePage
      year={Number(year) as ValidYear}
      order={{
        invoiceToken: order.invoiceToken,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        affiliation: order.affiliation,
        country: order.country,
        categoryName: order.categoryName,
        total: order.total,
        status: order.status,
        billingOrganization: order.billingOrganization,
        billingAddress: order.billingAddress,
        billingCity: order.billingCity,
        billingCountry: order.billingCountry,
      }}
      clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""}
      supportEmail={tCommon("email")}
      labels={{
        titleInvoice: t("titleInvoice"),
        titleReceipt: t("titleReceipt"),
        paidBadge: t("paidBadge"),
        unpaidBadge: t("unpaidBadge"),
        billTo: t("billTo"),
        category: t("category"),
        total: t("total"),
        payWithPaypal: t("payWithPaypal"),
        paypalError: t("paypalError"),
        bankTransfer: t("bankTransfer"),
        bankTransferNote: t("bankTransferNote"),
        bankName: t("bankName"),
        accountHolder: t("accountHolder"),
        accountNumber: t("accountNumber"),
        swiftCode: t("swiftCode"),
        bankAddress: t("bankAddress"),
        city: t("city"),
        zipCode: t("zipCode"),
        downloadPdf: t("downloadPdf"),
      }}
    />
  );
}
