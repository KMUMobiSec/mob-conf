import { getCurrentAdminSession } from "@/lib/auth/session";
import {
  type CertificateInput,
  certificateFilename,
  renderCertificate,
} from "@/modules/admin/certificates/lib/certificate-pdf";
import { getCertificateRecipient } from "@/modules/admin/certificates/lib/queries";
import { parseAdminYear } from "@/modules/admin/lib/year";

// react-pdf renders with Node APIs, so this must not run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Download a single certificate PDF. Route handlers under (protected) are NOT wrapped by the admin
 * layout guard, so we re-check the admin session here.
 *
 *  - Roster row:  ?year=&id=<uuid>&author=true|false&title=<optional chosen paper title>
 *  - Custom cert: ?year=&custom=1&name=&affiliation=&author=true|false&title=&recognition=
 */
export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const year = parseAdminYear(url.searchParams.get("year") ?? undefined);
  const asAuthor = url.searchParams.get("author") === "true";

  let input: CertificateInput;
  let recipientName: string;

  if (url.searchParams.get("custom") === "1") {
    recipientName = (url.searchParams.get("name") ?? "").trim();
    const affiliation = (url.searchParams.get("affiliation") ?? "").trim();
    if (!recipientName || !affiliation) {
      return new Response("Name and affiliation are required.", { status: 400 });
    }
    if (asAuthor) {
      const paperTitle = (url.searchParams.get("title") ?? "").trim();
      if (!paperTitle) return new Response("Paper title is required.", { status: 400 });
      input = { kind: "author", year, recipientName, affiliation, paperTitle };
    } else {
      const recognitionTitle = (url.searchParams.get("recognition") ?? "").trim();
      if (!recognitionTitle) return new Response("Recognition title is required.", { status: 400 });
      input = { kind: "participant", year, recipientName, affiliation, recognitionTitle };
    }
  } else {
    const id = url.searchParams.get("id") ?? "";
    const recipient = await getCertificateRecipient(year, id);
    if (!recipient) return new Response("Registrant not found.", { status: 404 });
    recipientName = recipient.name;
    const affiliation = recipient.affiliation ?? "";
    const chosenTitle = (url.searchParams.get("title") ?? "").trim();

    if (asAuthor && recipient.paperTitles.length > 0) {
      const paperTitle =
        chosenTitle && recipient.paperTitles.includes(chosenTitle)
          ? chosenTitle
          : recipient.paperTitles[0];
      input = { kind: "author", year, recipientName, affiliation, paperTitle };
    } else {
      input = {
        kind: "participant",
        year,
        recipientName,
        affiliation,
        recognitionTitle: "Participant",
      };
    }
  }

  const pdf = await renderCertificate(input);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificateFilename(year, recipientName)}"`,
      "Cache-Control": "no-store",
    },
  });
}
