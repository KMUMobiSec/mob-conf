import "server-only";

import { db } from "@/db";
import { appSettings } from "@/db/schema";

export interface EffectiveAppSettings {
  checkInTestMode: boolean;
  testerEmails: string[];
  banquetDate: string | null;
  banquetVenue: string | null;
}

/** Read the singleton settings row, defaulting to a safe production state when unset. */
export async function getAppSettings(): Promise<EffectiveAppSettings> {
  const [row] = await db.select().from(appSettings).limit(1);
  return {
    checkInTestMode: row?.checkInTestMode ?? false,
    testerEmails: row?.testerEmails ?? [],
    banquetDate: row?.banquetDate ?? null,
    banquetVenue: row?.banquetVenue ?? null,
  };
}
