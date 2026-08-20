"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { getCurrentAdminSession } from "@/lib/auth/session";
import { sendCheckInWelcome, sendRegistrationPass } from "@/lib/email/registration-check-in";
import { parseAdminYear } from "@/modules/admin/lib/year";
import { getAppSettings } from "@/modules/admin/settings/lib/queries";
import { resolveCheckInRecipients } from "@/modules/admin/settings/lib/test-mode";
import {
  buildAlreadyCheckedInResult,
  buildCheckedInResult,
  type CheckInRegistrationResult,
} from "./lib/check-in-result";
import { requireCheckInQrSecret } from "./lib/env";
import { generateQrNonce, verifyQrPayload } from "./lib/qr";
import {
  getRegistration,
  getRegistrationByEmail,
  getRegistrationByQrParts,
  listRegistrationIdsForYear,
  listRegistrationsByEmails,
  listRegistrationsByIds,
} from "./lib/queries";
import {
  dedupeRegistrationCsvRows,
  parseManualRegistrationInput,
  parseRegistrationCsv,
  type RegistrationCsvRow,
  registrationDedupeKey,
} from "./lib/registration-input";

const QR_CHECK_INS_PATH = "/admin/qr-check-ins";

export type { CheckInRegistrationResult } from "./lib/check-in-result";

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

export interface CreateRegistrationResult extends AdminActionResult {
  id?: string;
  errors?: Record<string, string>;
}

export async function createRegistration(input: {
  year: number;
  email?: string | null;
  name: string;
  affiliation?: string | null;
}): Promise<CreateRegistrationResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const parsed = parseManualRegistrationInput(input);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  if (parsed.data.email !== null) {
    const existing = await getRegistrationByEmail(year, parsed.data.email);
    if (existing) return { ok: false, error: "A registration already exists for this email." };
  }

  try {
    const [created] = await db
      .insert(registrations)
      .values({
        year,
        email: parsed.data.email,
        name: parsed.data.name,
        affiliation: parsed.data.affiliation,
        qrNonce: generateQrNonce(),
      })
      .returning({ id: registrations.id });

    revalidatePath(QR_CHECK_INS_PATH);
    return { ok: true, id: created?.id };
  } catch (error) {
    console.error("Failed to create registration", error);
    return { ok: false, error: "Could not create the registration." };
  }
}

export async function updateRegistration(input: {
  year: number;
  id: string;
  email?: string | null;
  name: string;
  affiliation?: string | null;
}): Promise<CreateRegistrationResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const parsed = parseManualRegistrationInput({
    email: input.email,
    name: input.name,
    affiliation: input.affiliation,
  });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const existing = await getRegistration(input.id);
  if (!existing || existing.year !== year) {
    return { ok: false, error: "Registration not found for the selected year." };
  }

  if (parsed.data.email !== null) {
    // A shared email can hold several distinct people (one per name), so a conflict is another
    // registration with the same email AND name — not merely the same email. Matching by email
    // alone would spuriously block editing an imported row that shares its email with a sibling.
    const targetKey = registrationDedupeKey(parsed.data.email, parsed.data.name);
    const sameEmail = await listRegistrationsByEmails(year, [parsed.data.email]);
    const conflict = sameEmail.find(
      (row) =>
        row.id !== input.id &&
        row.email !== null &&
        registrationDedupeKey(row.email, row.name) === targetKey,
    );
    if (conflict) {
      return { ok: false, error: "A registration already exists with this name and email." };
    }
  }

  try {
    await db
      .update(registrations)
      .set({
        email: parsed.data.email,
        name: parsed.data.name,
        affiliation: parsed.data.affiliation,
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, input.id));

    revalidatePath(QR_CHECK_INS_PATH);
    return { ok: true, id: input.id };
  } catch (error) {
    console.error("Failed to update registration", error);
    return { ok: false, error: "Could not update the registration." };
  }
}

export interface ImportRegistrationsResult extends AdminActionResult {
  created: number;
  updated: number;
  invalidRows: { rowNumber: number; error: string }[];
}

export async function importRegistrations(input: {
  year: number;
  csv: string;
}): Promise<ImportRegistrationsResult> {
  const session = await getCurrentAdminSession();
  if (!session)
    return { ok: false, created: 0, updated: 0, invalidRows: [], error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const parsed = parseRegistrationCsv(input.csv);
  const rows = dedupeRegistrationCsvRows(parsed.validRows);
  if (rows.length === 0) {
    return {
      ok: parsed.invalidRows.length === 0,
      created: 0,
      updated: 0,
      invalidRows: parsed.invalidRows,
    };
  }

  // Rows with a real email upsert by (year, email, name): a shared email can hold several distinct
  // people, so only a matching name+email updates in place — a new name inserts a fresh record.
  // Rows without an email are distinct walk-ins that always insert (never deduped or matched).
  const emailedRows = rows.filter(
    (row): row is RegistrationCsvRow & { email: string } => row.email !== null,
  );
  const anonymousRows = rows.filter((row) => row.email === null);

  const existing = await listRegistrationsByEmails(
    year,
    emailedRows.map((row) => row.email),
  );
  const existingByKey = new Map<string, (typeof existing)[number]>();
  for (const row of existing) {
    if (row.email === null) continue;
    existingByKey.set(registrationDedupeKey(row.email, row.name), row);
  }

  let created = 0;
  let updated = 0;

  try {
    await db.transaction(async (tx) => {
      for (const row of emailedRows) {
        const match = existingByKey.get(registrationDedupeKey(row.email, row.name));
        if (match) {
          await tx
            .update(registrations)
            .set({
              name: row.name,
              affiliation: row.affiliation,
              // Only overwrite the ID number when the CSV actually carries one, so a re-import
              // from a list without a `No.` column doesn't wipe backfilled numbers.
              ...(row.idNumber !== null ? { idNumber: row.idNumber } : {}),
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, match.id));
          updated++;
        } else {
          await tx.insert(registrations).values({
            year,
            email: row.email,
            name: row.name,
            affiliation: row.affiliation,
            idNumber: row.idNumber,
            qrNonce: generateQrNonce(),
          });
          created++;
        }
      }

      for (const row of anonymousRows) {
        await tx.insert(registrations).values({
          year,
          email: null,
          name: row.name,
          affiliation: row.affiliation,
          idNumber: row.idNumber,
          qrNonce: generateQrNonce(),
        });
        created++;
      }
    });
  } catch (error) {
    console.error("Failed to import registrations", error);
    return {
      ok: false,
      created: 0,
      updated: 0,
      invalidRows: parsed.invalidRows,
      error: "Could not import registrations.",
    };
  }

  revalidatePath(QR_CHECK_INS_PATH);
  return { ok: true, created, updated, invalidRows: parsed.invalidRows };
}

export interface SendQrPassesResult extends AdminActionResult {
  sent: number;
  failures: { id: string; email: string; error: string }[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendRegistrationQrPass(input: {
  year: number;
  id: string;
}): Promise<SendQrPassesResult> {
  return sendRegistrationQrPasses({ year: input.year, ids: [input.id] });
}

export async function sendRegistrationQrPasses(input: {
  year: number;
  ids: string[];
  /**
   * Delay (ms) awaited before each send. Bulk "Send to all" passes SEND_THROTTLE_MS to stay under
   * the provider rate limit; per-row and "Send selected" omit it (default 0 = current behavior).
   */
  throttleMs?: number;
}): Promise<SendQrPassesResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, sent: 0, failures: [], error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const ids = Array.from(new Set(input.ids)).filter(Boolean);
  if (ids.length === 0) return { ok: true, sent: 0, failures: [] };

  const throttleMs = input.throttleMs ?? 0;
  const settings = await getAppSettings();
  const rows = await listRegistrationsByIds(year, ids);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const failures: SendQrPassesResult["failures"] = [];
  let sent = 0;

  for (const id of ids) {
    // Throttle before each send (including the first) so spacing holds across chunk boundaries.
    if (throttleMs > 0) await sleep(throttleMs);
    const row = rowsById.get(id);
    if (!row) {
      failures.push({ id, email: "", error: "Registration not found for selected year." });
      continue;
    }

    // Test mode redirects the recipient to the tester list (fallback if empty), so a
    // registration with no email on file can still be sent to. Normal mode requires a real email.
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
      await sendRegistrationPass({
        to: recipients,
        year,
        name: row.name,
        registrationId: row.id,
      });
      // Don't pollute real send tracking while redirecting to testers.
      if (!settings.checkInTestMode) {
        await db
          .update(registrations)
          .set({
            qrEmailSentAt: new Date(),
            qrEmailSentCount: row.qrEmailSentCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, row.id));
      }
      sent++;
    } catch (error) {
      console.error(`Failed to send registration QR pass ${id}`, error);
      failures.push({ id, email: row.email ?? "", error: "Could not send QR pass email." });
    }
  }

  revalidatePath(QR_CHECK_INS_PATH);
  return { ok: failures.length === 0, sent, failures };
}

export interface RegistrationSendTargetsResult extends AdminActionResult {
  ids: string[];
}

/**
 * All registration IDs for a year, for the bulk "Send to all" flow. The client chunks these and
 * calls sendRegistrationQrPasses per chunk to drive the progress bar and stay within the send rate.
 */
export async function getRegistrationSendTargets(input: {
  year: number;
}): Promise<RegistrationSendTargetsResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, ids: [], error: "Not authorized." };
  const year = parseAdminYear(input.year);
  const ids = await listRegistrationIdsForYear(year);
  return { ok: true, ids };
}

export async function checkInRegistration(input: {
  year: number;
  qrPayload: string;
}): Promise<CheckInRegistrationResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const verified = verifyQrPayload(input.qrPayload, requireCheckInQrSecret());
  if (!verified.ok) return { ok: false, error: "Invalid QR credential." };

  const registration = await getRegistrationByQrParts(verified.id, verified.qrNonce);
  if (!registration || registration.year !== year) {
    return { ok: false, error: "QR credential does not belong to the selected year." };
  }

  if (registration.checkedInAt) {
    return buildAlreadyCheckedInResult({
      id: registration.id,
      name: registration.name,
      email: registration.email,
      idNumber: registration.idNumber,
      checkedInAt: registration.checkedInAt,
    });
  }

  const checkedInAt = new Date();
  const [updated] = await db
    .update(registrations)
    .set({
      checkedInAt,
      checkedInBy: session.user.email,
      updatedAt: checkedInAt,
    })
    .where(and(eq(registrations.id, registration.id), isNull(registrations.checkedInAt)))
    .returning();

  if (!updated) {
    const latest = await getRegistration(registration.id);
    if (!latest?.checkedInAt) {
      return { ok: false, error: "Could not confirm the check-in state. Please try again." };
    }
    return buildAlreadyCheckedInResult({
      id: latest.id,
      name: latest.name,
      email: latest.email,
      idNumber: latest.idNumber,
      checkedInAt: latest.checkedInAt,
    });
  }

  // Test mode redirects the welcome to the tester list (even for null-email rows) and
  // does not mark the real registration as welcomed. Normal mode sends only if there's an email.
  // The check-in is already committed above, so a settings-read failure here must not fail the
  // action — it only means we skip the (best-effort) welcome email.
  try {
    const settings = await getAppSettings();
    const welcomeRecipients = resolveCheckInRecipients({
      testMode: settings.checkInTestMode,
      testerEmails: settings.testerEmails,
      intended: registration.email,
    });
    if (welcomeRecipients) {
      after(async () => {
        try {
          await sendCheckInWelcome({
            to: welcomeRecipients,
            year,
            name: registration.name,
          });
          if (!settings.checkInTestMode) {
            await db
              .update(registrations)
              .set({ welcomeEmailSentAt: new Date(), updatedAt: new Date() })
              .where(eq(registrations.id, registration.id));
          }
        } catch (error) {
          console.error(`Failed to send check-in welcome email ${registration.id}`, error);
        }
      });
    }
  } catch (error) {
    console.error(`Failed to resolve welcome email settings ${registration.id}`, error);
  }

  // The registrations UPDATE above drives every open Logs/Registrations view live via Supabase
  // Postgres changes — the DB write is the trigger, no server-side send needed.
  revalidatePath(QR_CHECK_INS_PATH);
  return buildCheckedInResult({
    id: registration.id,
    name: registration.name,
    email: registration.email,
    idNumber: registration.idNumber,
    checkedInAt,
  });
}

/**
 * Manually set a registration's check-in state — the fallback for when the QR scanner can't be used
 * (device down, damaged badge, walk-in). Available to any authenticated admin in any mode (this is
 * the deliberate replacement for the old test-mode-only uncheck guard): running the door means
 * setting attendance by hand.
 *
 * Checking in records `checkedInBy` for the audit trail; clearing it resets both fields. No welcome
 * email is sent — manual check-in only records attendance (use sendRegistrationQrPass to email). The
 * write drives open Logs/Registrations views live via Postgres changes, same as a QR scan.
 */
export async function setRegistrationCheckIn(input: {
  year: number;
  id: string;
  checkedIn: boolean;
}): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const year = parseAdminYear(input.year);
  const registration = await getRegistration(input.id);
  if (!registration || registration.year !== year) {
    return { ok: false, error: "Registration not found for the selected year." };
  }

  const now = new Date();
  const values = input.checkedIn
    ? { checkedInAt: now, checkedInBy: session.user.email, updatedAt: now }
    : { checkedInAt: null, checkedInBy: null, updatedAt: now };

  try {
    await db.update(registrations).set(values).where(eq(registrations.id, input.id));

    // The write drives open Logs/Registrations views live via Postgres changes.
    revalidatePath(QR_CHECK_INS_PATH);
    return { ok: true };
  } catch (error) {
    console.error(`Failed to set check-in=${input.checkedIn} for registration ${input.id}`, error);
    return { ok: false, error: "Could not update the check-in." };
  }
}
