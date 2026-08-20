import "dotenv/config";
import { sql } from "drizzle-orm";
import { closeDb, db } from "@/db";

/**
 * One-time ops script: copy each existing presentation's inline file data
 * (`file_name` / `file_path` / `file_size`) into the new `presentation_files`
 * child table as a single `kind='material'` row.
 *
 * Run this AFTER the additive migration (which creates `presentation_files` and
 * adds `video_url`) and BEFORE the migration that drops the inline columns.
 *
 * Idempotent: presentations that already have any child file row are skipped, so
 * re-running is safe. Uses raw SQL (not the typed schema) so it keeps working
 * once the inline columns are removed from the Drizzle schema.
 *
 * Run with: pnpm presentations:backfill
 */
async function main() {
  const result = await db.execute(sql`
    INSERT INTO presentation_files (presentation_id, kind, file_name, file_path, file_size, sort_order)
    SELECT p.id, 'material', p.file_name, p.file_path, p.file_size, 0
    FROM presentations p
    WHERE p.file_path IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM presentation_files f WHERE f.presentation_id = p.id
      )
  `);

  const inserted = (result as unknown as { count?: number }).count ?? 0;
  console.log(`Backfilled ${inserted} presentation file row(s) from inline columns.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
