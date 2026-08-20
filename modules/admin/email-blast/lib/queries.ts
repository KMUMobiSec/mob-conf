import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { registrations } from "@/db/schema";

export interface RegistrationRecipient {
  id: string;
  idNumber: number | null;
  name: string;
  email: string | null;
}

/**
 * Candidate blast recipients for a year: every registration, ordered by name. Null-email rows are
 * included so the picker can show them as unreachable (disabled) rather than hiding them.
 */
export async function listRegistrationRecipients(year: number): Promise<RegistrationRecipient[]> {
  return db
    .select({
      id: registrations.id,
      idNumber: registrations.idNumber,
      name: registrations.name,
      email: registrations.email,
    })
    .from(registrations)
    .where(eq(registrations.year, year))
    .orderBy(asc(registrations.name));
}
