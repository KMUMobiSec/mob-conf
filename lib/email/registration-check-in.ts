import "server-only";

import { type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { publicBaseUrl, requirePublicBaseUrl } from "@/lib/routes/base-url";
import { gettingAroundUrl } from "@/lib/routes/getting-around";
import { registrationPassUrl } from "@/lib/routes/registration-pass";
import { emailLogoUrl } from "./assets";
import {
  type CheckInWelcomeEmailInput,
  checkInWelcomeSubject,
  registrationPassSubject,
  renderCheckInWelcomeHtml,
  renderRegistrationPassHtml,
} from "./registration-check-in.templates";
import { getResendClient } from "./resend";

function registrationFromAddress(): string {
  const from = process.env.RESEND_EMAIL_FROM_REGISTRATION;
  if (!from) {
    throw new Error(
      "RESEND_EMAIL_FROM_REGISTRATION is required to send registration check-in email.",
    );
  }
  return from;
}

export interface SendRegistrationPassInput {
  to: string | string[];
  year: ValidYear;
  name: string;
  registrationId: string;
}

export async function sendRegistrationPass(input: SendRegistrationPassInput): Promise<void> {
  const resend = getResendClient();
  const config = YEAR_CONFIG[input.year];
  const passUrl = registrationPassUrl(requirePublicBaseUrl(), input.registrationId);

  const { error } = await resend.emails.send({
    from: registrationFromAddress(),
    to: input.to,
    subject: registrationPassSubject(input.year),
    html: renderRegistrationPassHtml({
      year: input.year,
      name: input.name,
      venue: config.venue,
      dates: config.dates,
      passUrl,
      logoUrl: emailLogoUrl(),
    }),
  });

  if (error) {
    throw new Error(`Resend failed to send registration QR pass: ${error.message}`);
  }
}

export async function sendCheckInWelcome(
  input: CheckInWelcomeEmailInput & { to: string | string[] },
): Promise<void> {
  const resend = getResendClient();
  const baseUrl = publicBaseUrl();
  const { error } = await resend.emails.send({
    from: registrationFromAddress(),
    to: input.to,
    subject: checkInWelcomeSubject(input.year),
    html: renderCheckInWelcomeHtml({
      ...input,
      logoUrl: emailLogoUrl(),
      gettingAroundUrl: baseUrl ? gettingAroundUrl(baseUrl, input.year) : undefined,
    }),
  });

  if (error) {
    throw new Error(`Resend failed to send check-in welcome email: ${error.message}`);
  }
}
