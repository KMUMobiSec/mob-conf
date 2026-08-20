import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { closeDb, db } from "@/db";
import { presentationFiles, presentations } from "@/db/schema";

/**
 * Recovery script: rebuild `presentation_files` rows for submissions whose inline
 * file columns were dropped before the backfill could run.
 *
 * The uploaded objects were never deleted, so the file references are reconstructed
 * by listing the private `presentations` bucket under each `${year}/${id}/` prefix.
 * Old (single-file) submissions store objects at `${year}/${id}/1-${sanitizedName}`.
 *
 * Idempotent: presentations that already have any file row are skipped.
 *
 * Dry run (default):  pnpm tsx scripts/recover-presentation-files.ts
 * Apply:              pnpm tsx scripts/recover-presentation-files.ts --commit
 */
const BUCKET = "presentations";
const COMMIT = process.argv.includes("--commit");

function requireEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to recover presentation files.`);
  return value;
}

interface StorageObject {
  name: string;
  id: string | null;
  metadata: { size?: number; mimetype?: string } | null;
}

async function main() {
  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const rows = await db
    .select({ id: presentations.id, year: presentations.year })
    .from(presentations);

  const existingFiles = await db
    .select({ presentationId: presentationFiles.presentationId })
    .from(presentationFiles);
  const haveFiles = new Set(existingFiles.map((f) => f.presentationId));

  let planned = 0;
  const inserts: (typeof presentationFiles.$inferInsert)[] = [];

  for (const { id, year } of rows) {
    if (haveFiles.has(id)) continue;

    const prefix = `${year}/${id}`;
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100 });
    if (error) {
      console.error(`  ! list failed for ${prefix}: ${error.message}`);
      continue;
    }

    const objects = ((data ?? []) as StorageObject[]).filter(
      (o) => o.id !== null && o.name !== ".emptyFolderPlaceholder",
    );
    if (objects.length === 0) {
      console.warn(`  ? no objects found under ${prefix} — nothing to recover`);
      continue;
    }

    objects.forEach((object, index) => {
      const filePath = `${prefix}/${object.name}`;
      const fileName = object.name.replace(/^\d+-/, "");
      const fileSize = object.metadata?.size ?? 0;
      console.log(`  + ${prefix}: ${object.name} (${fileSize} bytes) -> ${fileName}`);
      planned += 1;
      inserts.push({
        presentationId: id,
        kind: "material",
        fileName,
        filePath,
        fileSize,
        contentType: object.metadata?.mimetype ?? null,
        sortOrder: index,
      });
    });
  }

  console.log(
    `\nPlanned ${planned} file row(s) across ${inserts.length ? "recoverable" : "0"} submissions.`,
  );

  if (!COMMIT) {
    console.log("Dry run — no changes written. Re-run with --commit to apply.");
    return;
  }
  if (inserts.length === 0) {
    console.log("Nothing to insert.");
    return;
  }

  await db.insert(presentationFiles).values(inserts);
  console.log(`Inserted ${inserts.length} presentation_files row(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
