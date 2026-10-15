import type { Metadata } from "next";
import { listRegistrationRecipients } from "@/modules/admin/email-blast/lib/queries";
import { parseAdminYear } from "@/modules/admin/lib/year";
import { EmailBlastComposer } from "./EmailBlastComposer";

export const metadata: Metadata = { title: "Email Blast — Admin" };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmailBlastPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const year = parseAdminYear(first(sp.year));
  const recipients = await listRegistrationRecipients(year);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Email blast</h2>
        <p className="text-sm text-muted-foreground">
          Compose a rich-text message and send it to selected {year} registrants from the no-reply
          address. Import registrations to add more recipients.
        </p>
      </div>
      <EmailBlastComposer year={year} recipients={recipients} />
    </div>
  );
}
