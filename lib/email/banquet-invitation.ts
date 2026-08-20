import "server-only";

import { banquetVenueImageUrl, emailLogoUrl } from "./assets";
import {
  type BanquetInvitationEmailInput,
  banquetInvitationSubject,
  renderBanquetInvitationHtml,
  renderBanquetInvitationText,
} from "./banquet-invitation.templates";
import { getResendClient } from "./resend";

function banquetFromAddress(): string {
  const from = process.env.RESEND_EMAIL_FROM_BANQUET;
  if (!from) {
    throw new Error("RESEND_EMAIL_FROM_BANQUET is required to send banquet invitation email.");
  }
  return from;
}

export async function sendBanquetInvitation(
  input: BanquetInvitationEmailInput & { to: string | string[] },
): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: banquetFromAddress(),
    to: input.to,
    subject: banquetInvitationSubject(input.year),
    html: renderBanquetInvitationHtml({
      ...input,
      logoUrl: emailLogoUrl(),
      venueImageUrl: banquetVenueImageUrl(input.year, input.banquetVenue),
    }),
    text: renderBanquetInvitationText(input),
  });

  if (error) {
    throw new Error(`Resend failed to send banquet invitation: ${error.message}`);
  }
}
