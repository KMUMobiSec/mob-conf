"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { CURRENT_YEAR } from "@/constants/config";
import { db } from "@/db";
import { nominations } from "@/db/schema";
import { getCurrentAdminSession } from "@/lib/auth/session";
import {
  sendNominatorWinnerNotice,
  sendWinnerCongratulations,
} from "@/lib/email/winner-notification";
import { storageService } from "@/lib/services/storage.server";
import { getAward } from "@/modules/landing/nomination-form/lib/constants";
import { collectDocumentPaths, isKnownDocumentPath } from "./lib/documents";
import { getNomination, listPendingWinners } from "./lib/queries";

const BUCKET = "nominations";
const SIGNED_URL_TTL_SECONDS = 300;

export interface AdminActionResult {
  ok: boolean;
  error?: string;
  url?: string;
}

export async function setNominationWinner(
  id: string,
  isWinner: boolean,
): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  try {
    await db
      .update(nominations)
      .set({ isWinner, updatedAt: new Date() })
      .where(eq(nominations.id, id));
  } catch (error) {
    console.error("Failed to update winner status", error);
    return { ok: false, error: "Could not update the winner status." };
  }

  revalidatePath("/admin/nominations");
  revalidatePath(`/admin/nominations/${id}`);
  return { ok: true };
}

export async function getDocumentSignedUrl(
  nominationId: string,
  path: string,
): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  // Only sign paths that actually belong to this nomination's documents.
  const nomination = await getNomination(nominationId);
  if (!nomination) return { ok: false, error: "Nomination not found." };

  if (!isKnownDocumentPath(nomination.documents, path)) {
    return { ok: false, error: "Unknown document." };
  }

  try {
    const { signedUrl } = await storageService.createSignedUrl({
      bucket: BUCKET,
      path,
      expiresIn: SIGNED_URL_TTL_SECONDS,
      options: { download: true },
    });
    return { ok: true, url: signedUrl };
  } catch (error) {
    console.error("Failed to create signed URL", error);
    return { ok: false, error: "Could not generate a download link." };
  }
}

export interface NotifyWinnersResult {
  ok: boolean;
  scheduled: number;
  error?: string;
}

/**
 * Email every un-notified winner (and their nominator) for the given year.
 * Validates + snapshots synchronously, then sends in the background via
 * `after()` so the admin request is never blocked on Resend.
 */
export async function notifyWinners(year?: number): Promise<NotifyWinnersResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, scheduled: 0, error: "Not authorized." };

  const pending = await listPendingWinners(year);
  if (pending.length === 0) return { ok: true, scheduled: 0 };

  const targets = pending.map((n) => ({
    id: n.id,
    year: n.year,
    awardName: getAward(n.award)?.name ?? n.award,
    nomineeName: n.nomineeName,
    nomineeEmail: n.nomineeEmail,
    nominatorName: n.nominatorName,
    nominatorEmail: n.nominatorEmail,
  }));

  after(async () => {
    for (const target of targets) {
      let sent = 0;
      try {
        await sendWinnerCongratulations({
          to: target.nomineeEmail,
          year: target.year,
          awardName: target.awardName,
          nomineeName: target.nomineeName,
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send winner email ${target.id} (${target.nomineeEmail})`, error);
      }
      try {
        await sendNominatorWinnerNotice({
          to: target.nominatorEmail,
          year: target.year,
          awardName: target.awardName,
          nominatorName: target.nominatorName,
          nomineeName: target.nomineeName,
        });
        sent++;
      } catch (error) {
        console.error(
          `Failed to send nominator email ${target.id} (${target.nominatorEmail})`,
          error,
        );
      }
      if (sent > 0) {
        // Count every email that succeeded; mark notified only when both did.
        try {
          await db
            .update(nominations)
            .set({
              emailsSentCount: sql`${nominations.emailsSentCount} + ${sent}`,
              ...(sent === 2 ? { winnerNotifiedAt: new Date() } : {}),
              updatedAt: new Date(),
            })
            .where(eq(nominations.id, target.id));
        } catch (error) {
          console.error(`Failed to record send for nomination ${target.id}`, error);
        }
      }
    }
    try {
      revalidatePath("/admin/nominations");
    } catch (error) {
      console.error("Failed to revalidate nominations after notifying winners", error);
    }
  });

  return { ok: true, scheduled: targets.length };
}

export interface SendTestEmailResult {
  ok: boolean;
  to?: string;
  sent: number;
  failures: string[];
  error?: string;
}

/**
 * Send sample winner + nominator emails to the configured TEST_EMAIL address so
 * an admin can preview both before notifying real winners. Uses placeholder
 * names for the given year (defaults to the current edition).
 */
export async function sendTestWinnerEmails(year?: number): Promise<SendTestEmailResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, sent: 0, failures: [], error: "Not authorized." };

  const to = process.env.TEST_EMAIL;
  if (!to) {
    return { ok: false, sent: 0, failures: [], error: "TEST_EMAIL is not configured." };
  }

  const targetYear = year ?? CURRENT_YEAR;
  const awardName = "Sample Award";
  const nomineeName = "Sample Nominee";
  const nominatorName = "Sample Nominator";
  const failures: string[] = [];
  let sent = 0;

  try {
    await sendWinnerCongratulations({ to, year: targetYear, awardName, nomineeName });
    sent++;
  } catch (error) {
    console.error("Test winner email failed", error);
    failures.push("winner");
  }
  try {
    await sendNominatorWinnerNotice({
      to,
      year: targetYear,
      awardName,
      nominatorName,
      nomineeName,
    });
    sent++;
  } catch (error) {
    console.error("Test nominator email failed", error);
    failures.push("nominator");
  }

  return { ok: failures.length === 0, to, sent, failures };
}

export interface ResendWinnerResult {
  ok: boolean;
  sent: number;
  failures: string[];
  error?: string;
}

/**
 * Send (or re-send) the winner + nominator emails for a single nomination,
 * synchronously, regardless of prior notification. Reports per-email result and
 * counts the emails that actually succeeded.
 */
export async function resendWinnerEmails(id: string): Promise<ResendWinnerResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, sent: 0, failures: [], error: "Not authorized." };

  const nomination = await getNomination(id);
  if (!nomination) return { ok: false, sent: 0, failures: [], error: "Nomination not found." };

  const awardName = getAward(nomination.award)?.name ?? nomination.award;
  const failures: string[] = [];
  let sent = 0;

  try {
    await sendWinnerCongratulations({
      to: nomination.nomineeEmail,
      year: nomination.year,
      awardName,
      nomineeName: nomination.nomineeName,
    });
    sent++;
  } catch (error) {
    console.error(`Resend: winner email failed for ${id}`, error);
    failures.push("winner");
  }
  try {
    await sendNominatorWinnerNotice({
      to: nomination.nominatorEmail,
      year: nomination.year,
      awardName,
      nominatorName: nomination.nominatorName,
      nomineeName: nomination.nomineeName,
    });
    sent++;
  } catch (error) {
    console.error(`Resend: nominator email failed for ${id}`, error);
    failures.push("nominator");
  }

  if (sent > 0) {
    const markNotified = sent === 2 && !nomination.winnerNotifiedAt;
    await db
      .update(nominations)
      .set({
        emailsSentCount: sql`${nominations.emailsSentCount} + ${sent}`,
        ...(markNotified ? { winnerNotifiedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(nominations.id, id));
    revalidatePath("/admin/nominations");
    revalidatePath(`/admin/nominations/${id}`);
  }

  return { ok: failures.length === 0, sent, failures };
}

/**
 * Permanently delete a nomination and all of its uploaded documents from
 * storage. Files are removed first (best-effort); the record is then deleted.
 */
export async function deleteNomination(id: string): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const nomination = await getNomination(id);
  if (!nomination) return { ok: false, error: "Nomination not found." };

  const paths = collectDocumentPaths(nomination.documents);
  if (paths.length > 0) {
    try {
      await storageService.deleteFiles({ bucket: BUCKET, paths });
    } catch (error) {
      // Don't strand an undeletable record — log and still remove the row.
      console.error(`Failed to delete files for nomination ${id}`, error);
    }
  }

  try {
    await db.delete(nominations).where(eq(nominations.id, id));
  } catch (error) {
    console.error(`Failed to delete nomination ${id}`, error);
    return { ok: false, error: "Could not delete the nomination." };
  }

  revalidatePath("/admin/nominations");
  return { ok: true };
}
