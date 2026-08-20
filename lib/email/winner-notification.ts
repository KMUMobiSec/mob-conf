import "server-only";

import { publicBaseUrl } from "@/lib/routes/base-url";
import { rollOfHonorsUrl } from "@/lib/routes/roll-of-honors";
import { getResendClient } from "./resend";
import {
  type NominatorWinnerEmailInput,
  nominatorWinnerNoticeSubject,
  renderNominatorWinnerNoticeHtml,
  renderWinnerCongratulationsHtml,
  type WinnerEmailInput,
  winnerCongratulationsSubject,
} from "./winner-notification.templates";

function fromAddress(): string {
  const from = process.env.RESEND_EMAIL_FROM_AWARDS;
  if (!from) {
    throw new Error("RESEND_EMAIL_FROM_AWARDS is required to send winner notification email.");
  }
  return from;
}

/** Absolute URL to the year's public Roll of Honors, or undefined if no base URL is set. */
function publicRollOfHonorsUrl(year: number): string | undefined {
  const baseUrl = publicBaseUrl();
  if (!baseUrl) return undefined;
  return rollOfHonorsUrl(baseUrl, year);
}

/** Warm congratulations to the winner (nominee). Throws on Resend error. */
export async function sendWinnerCongratulations(
  input: WinnerEmailInput & { to: string },
): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: winnerCongratulationsSubject(input.year),
    html: renderWinnerCongratulationsHtml({
      ...input,
      rollOfHonorsUrl: publicRollOfHonorsUrl(input.year),
    }),
  });
  if (error) {
    throw new Error(`Resend failed to send winner congratulations: ${error.message}`);
  }
}

/** Warm notice to the nominator that their nominee won. Throws on Resend error. */
export async function sendNominatorWinnerNotice(
  input: NominatorWinnerEmailInput & { to: string },
): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: nominatorWinnerNoticeSubject(input.year),
    html: renderNominatorWinnerNoticeHtml({
      ...input,
      rollOfHonorsUrl: publicRollOfHonorsUrl(input.year),
    }),
  });
  if (error) {
    throw new Error(`Resend failed to send nominator winner notice: ${error.message}`);
  }
}
