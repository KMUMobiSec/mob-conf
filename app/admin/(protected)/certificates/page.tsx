import type { Metadata } from "next";
import { listCertificateRecipients } from "@/modules/admin/certificates/lib/queries";
import { parseAdminYear } from "@/modules/admin/lib/year";
import { CertificatesTable } from "./CertificatesTable";

export const metadata: Metadata = { title: "Certificates — Admin" };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const year = parseAdminYear(first(sp.year));
  const recipients = await listCertificateRecipients(year);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Certificates</h2>
        <p className="text-sm text-muted-foreground">
          Generate and email EBISION {year} Certificates of Appreciation. Registrants who authored a
          submitted paper (matched by email) can receive an author certificate instead.
        </p>
      </div>
      <CertificatesTable year={year} recipients={recipients} />
    </div>
  );
}
