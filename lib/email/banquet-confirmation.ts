import "server-only";

import { banquetVenueImageUrl, emailLogoUrl } from "./assets";
import {
  type BanquetConfirmationEmailInput,
  banquetConfirmationSubject,
  renderBanquetConfirmationHtml,
  renderBanquetConfirmationText,
} from "./banquet-confirmation.templates";
import { getResendClient } from "./resend";

function banquetFromAddress(): string {
  const from = process.env.RESEND_EMAIL_FROM_BANQUET;
  if (!from) {
    throw new Error("RESEND_EMAIL_FROM_BANQUET is required to send banquet confirmation email.");
  }
  return from;
}

export async function sendBanquetConfirmation(
  input: BanquetConfirmationEmailInput & { to: string | string[] },
): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: banquetFromAddress(),
    to: input.to,
    subject: banquetConfirmationSubject(input.year),
    html: renderBanquetConfirmationHtml({
      ...input,
      logoUrl: emailLogoUrl(),
      venueImageUrl: banquetVenueImageUrl(input.year, input.banquetVenue),
    }),
    text: renderBanquetConfirmationText(input),
  });

  if (error) {
    throw new Error(`Resend failed to send banquet confirmation: ${error.message}`);
  }
}
