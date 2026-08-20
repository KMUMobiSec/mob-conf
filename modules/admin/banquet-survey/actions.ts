"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { banquetResponses } from "@/db/schema";
import { getCurrentAdminSession } from "@/lib/auth/session";
import { sendBanquetConfirmation } from "@/lib/email/banquet-confirmation";
import { sendBanquetInvitation } from "@/lib/email/banquet-invitation";
import { banquetSurveyUrl } from "@/lib/routes/banquet-survey";
import { publicBaseUrl } from "@/lib/routes/base-url";
import { parseAdminYear } from "@/modules/admin/lib/year";
import { getAppSettings } from "@/modules/admin/settings/lib/queries";
import { resolveCheckInRecipients } from "@/modules/admin/settings/lib/test-mode";
import {
  allergenLabel,
  BANQUET_DATE_FALLBACK,
  BANQUET_VENUE_FALLBACK,
} from "@/modules/landing/banquet-survey/lib/constants";
import { type BanquetEditInput, clearedBanquetPatch, resolveBanquetUpdate } from "./lib/edit";
import { dedupeBanquetInvitees } from "./lib/import-dedupe";
import {
  countRegistrationsForYear,
  getBanquetResponse,
  listBanquetResponseKeys,
  listBanquetResponsesByIds,
  listInvitedBanquetResponseIds,
  listRegistrationInvitees,
  listRespondedBanquetResponseIds,
} from "./lib/queries";

const BANQUET_SURVEY_PATH = "/admin/banquet-survey";

export interface SendBanquetResult {
  ok: boolean;
  sent: number;
  failures: { id: string; email: string; error: string }[];
  error?: string;
}

export async function sendBanquetConfirmations(input: {
  year: number;
  ids: string[];
}): Promise<SendBanquetResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, sent: 0, failures: [], error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const ids = Array.from(new Set(input.ids)).filter(Boolean);
  if (ids.length === 0) return { ok: true, sent: 0, failures: [] };

  const settings = await getAppSettings();
  const banquetDate = settings.banquetDate ?? BANQUET_DATE_FALLBACK;
  const banquetVenue = settings.banquetVenue ?? BANQUET_VENUE_FALLBACK;

  const rows = await listBanquetResponsesByIds(year, ids);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const failures: SendBanquetResult["failures"] = [];
  let sent = 0;

  for (const id of ids) {
    const row = rowsById.get(id);
    if (!row) {
      failures.push({ id, email: "", error: "Response not found for selected year." });
      continue;
    }
    // Confirmations only make sense for people who actually responded. Skip invited
    // rows so a manual "to selected" never emails a "not attending" confirmation to
    // someone who never submitted the survey.
    if (!row.respondedAt) {
      failures.push({
        id,
        email: row.email,
        error: "Has not responded yet (send an invitation instead).",
      });
      continue;
    }

    // Test mode redirects the recipient to the tester list (fallback if empty). Normal
    // mode uses the real email on file.
    const recipients = resolveCheckInRecipients({
      testMode: settings.checkInTestMode,
      testerEmails: settings.testerEmails,
      intended: row.email,
    });
    if (!recipients) {
      failures.push({ id, email: "", error: "No email on file." });
      continue;
    }

    try {
      await sendBanquetConfirmation({
        to: recipients,
        year,
        name: row.name,
        attending: row.attending,
        banquetDate,
        banquetVenue,
        allergens: row.allergens.map(allergenLabel),
        allergenOther: row.allergenOther ?? undefined,
        message: row.message ?? undefined,
      });
      // Don't pollute real send tracking while redirecting to testers.
      if (!settings.checkInTestMode) {
        await db
          .update(banquetResponses)
          .set({
            emailsSentCount: sql`${banquetResponses.emailsSentCount} + 1`,
            confirmationSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(banquetResponses.id, row.id));
      }
      sent++;
    } catch (error) {
      console.error(`Failed to send banquet confirmation ${id}`, error);
      failures.push({ id, email: row.email, error: "Could not send confirmation email." });
    }
  }

  revalidatePath(BANQUET_SURVEY_PATH);
  return { ok: failures.length === 0, sent, failures };
}

export async function resendBanquetConfirmation(input: {
  year: number;
  id: string;
}): Promise<SendBanquetResult> {
  return sendBanquetConfirmations({ year: input.year, ids: [input.id] });
}

export async function sendAllBanquetConfirmations(input: {
  year: number;
}): Promise<SendBanquetResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, sent: 0, failures: [], error: "Not authorized." };

  const year = parseAdminYear(input.year);
  // Confirmations only go to people who actually responded, never to invitees.
  const ids = await listRespondedBanquetResponseIds(year);
  return sendBanquetConfirmations({ year, ids });
}

export interface ImportBanquetResult {
  ok: boolean;
  imported: number;
  skipped: number;
  error?: string;
}

/**
 * Import the year's registrations (those with an email) as banquet invitees.
 * Dedupes by (email + name) against existing banquet rows: a shared email with different names
 * imports as several distinct invitees, while an already-present name+email is skipped, never
 * overwritten. Registrations without an email are skipped.
 */
export async function importBanquetFromRegistrations(input: {
  year: number;
}): Promise<ImportBanquetResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, imported: 0, skipped: 0, error: "Not authorized." };

  const year = parseAdminYear(input.year);

  try {
    const totalRegistrations = await countRegistrationsForYear(year);
    const invitees = await listRegistrationInvitees(year);
    const existingKeys = await listBanquetResponseKeys(year);

    // Dedupe within the batch and against existing banquet rows, keyed by (email + name).
    const toInsert = dedupeBanquetInvitees(invitees, existingKeys);

    let imported = 0;
    if (toInsert.length > 0) {
      await db.transaction(async (tx) => {
        for (const invitee of toInsert) {
          // onConflictDoNothing makes the import idempotent even if a concurrent run inserted the
          // same (year, email, name) between our read and write.
          const inserted = await tx
            .insert(banquetResponses)
            .values({
              year,
              name: invitee.name,
              affiliation: invitee.affiliation,
              email: invitee.email,
              attending: false,
              // respondedAt stays null: an imported invitee has not responded yet.
            })
            .onConflictDoNothing({
              target: [banquetResponses.year, banquetResponses.email, banquetResponses.name],
            })
            .returning({ id: banquetResponses.id });
          if (inserted.length > 0) imported++;
        }
      });
    }

    revalidatePath(BANQUET_SURVEY_PATH);
    // Every registration is either imported or skipped (no email, or already present).
    return { ok: true, imported, skipped: Math.max(0, totalRegistrations - imported) };
  } catch (error) {
    console.error("Failed to import banquet invitees from registrations", error);
    return { ok: false, imported: 0, skipped: 0, error: "Could not import registrations." };
  }
}

export async function sendBanquetInvitations(input: {
  year: number;
  ids: string[];
}): Promise<SendBanquetResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, sent: 0, failures: [], error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const ids = Array.from(new Set(input.ids)).filter(Boolean);
  if (ids.length === 0) return { ok: true, sent: 0, failures: [] };

  const settings = await getAppSettings();
  const banquetDate = settings.banquetDate ?? BANQUET_DATE_FALLBACK;
  const banquetVenue = settings.banquetVenue ?? BANQUET_VENUE_FALLBACK;
  const baseUrl = publicBaseUrl();

  const rows = await listBanquetResponsesByIds(year, ids);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const failures: SendBanquetResult["failures"] = [];
  let sent = 0;

  for (const id of ids) {
    const row = rowsById.get(id);
    if (!row) {
      failures.push({ id, email: "", error: "Response not found for selected year." });
      continue;
    }
    // Invitations only make sense for people who have not responded yet. Skip
    // responders so a manual "to selected" never re-solicits an RSVP from someone
    // who already answered.
    if (row.respondedAt) {
      failures.push({ id, email: row.email, error: "Already responded." });
      continue;
    }
    if (!baseUrl) {
      failures.push({ id, email: row.email, error: "No public base URL is configured." });
      continue;
    }

    const recipients = resolveCheckInRecipients({
      testMode: settings.checkInTestMode,
      testerEmails: settings.testerEmails,
      intended: row.email,
    });
    if (!recipients) {
      failures.push({ id, email: "", error: "No email on file." });
      continue;
    }

    try {
      await sendBanquetInvitation({
        to: recipients,
        year,
        name: row.name,
        banquetDate,
        banquetVenue,
        surveyUrl: banquetSurveyUrl(baseUrl, year, {
          email: row.email,
          name: row.name,
          affiliation: row.affiliation ?? undefined,
        }),
      });
      // Don't pollute real send tracking while redirecting to testers.
      if (!settings.checkInTestMode) {
        await db
          .update(banquetResponses)
          .set({
            invitationsSentCount: sql`${banquetResponses.invitationsSentCount} + 1`,
            invitationSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(banquetResponses.id, row.id));
      }
      sent++;
    } catch (error) {
      console.error(`Failed to send banquet invitation ${id}`, error);
      failures.push({ id, email: row.email, error: "Could not send invitation email." });
    }
  }

  revalidatePath(BANQUET_SURVEY_PATH);
  return { ok: failures.length === 0, sent, failures };
}

export async function resendBanquetInvitation(input: {
  year: number;
  id: string;
}): Promise<SendBanquetResult> {
  return sendBanquetInvitations({ year: input.year, ids: [input.id] });
}

export async function sendAllBanquetInvitations(input: {
  year: number;
}): Promise<SendBanquetResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, sent: 0, failures: [], error: "Not authorized." };

  const year = parseAdminYear(input.year);
  // Invitations only go to people who have not responded yet.
  const ids = await listInvitedBanquetResponseIds(year);
  return sendBanquetInvitations({ year, ids });
}

export interface UpdateBanquetResult {
  ok: boolean;
  /** Top-level failure (auth, not-found, unexpected error). */
  error?: string;
  /** Per-field validation / conflict messages keyed by field name. */
  fieldErrors?: Record<string, string>;
}

/** True for a Postgres unique-constraint violation (SQLSTATE 23505), possibly wrapped in `cause`. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: string }).code;
  if (code === "23505") return true;
  const cause = (error as { cause?: { code?: string } }).cause;
  return cause?.code === "23505";
}

/**
 * Edit a single banquet response. Validates and normalizes via `resolveBanquetUpdate`, then guards
 * the (year, email, name) unique index so a clashing rename surfaces as a friendly field error
 * rather than a 500.
 */
export async function updateBanquetResponse(input: {
  year: number;
  id: string;
  values: BanquetEditInput;
}): Promise<UpdateBanquetResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const current = await getBanquetResponse(input.id);
  if (!current || current.year !== year) return { ok: false, error: "Response not found." };

  const resolved = resolveBanquetUpdate(
    input.values,
    { respondedAt: current.respondedAt },
    new Date(),
  );
  if (!resolved.ok) return { ok: false, fieldErrors: resolved.errors };

  try {
    await db
      .update(banquetResponses)
      .set(resolved.patch)
      .where(eq(banquetResponses.id, current.id));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        fieldErrors: { email: "Another response already uses this name and email." },
      };
    }
    console.error(`Failed to update banquet response ${current.id}`, error);
    return { ok: false, error: "Could not save changes." };
  }

  revalidatePath(BANQUET_SURVEY_PATH);
  return { ok: true };
}

/**
 * Clear a response's answers, reverting it to the invited state (used for test accounts). Keeps the
 * person's identity and email-send history; drops them from the attending and dietary counts.
 */
export async function clearBanquetResponse(input: {
  year: number;
  id: string;
}): Promise<UpdateBanquetResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const current = await getBanquetResponse(input.id);
  if (!current || current.year !== year) return { ok: false, error: "Response not found." };

  await db
    .update(banquetResponses)
    .set(clearedBanquetPatch(new Date()))
    .where(eq(banquetResponses.id, current.id));

  revalidatePath(BANQUET_SURVEY_PATH);
  return { ok: true };
}
