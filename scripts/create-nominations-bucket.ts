import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time ops script: create (or update) the private `nominations` storage
 * bucket used by the award nomination form. File type is validated
 * server-side (see modules/landing/nomination-form/lib/schema.ts), so no
 * MIME allow-list is enforced on the bucket itself.
 *
 * Re-running is safe — an existing bucket is updated in place.
 *
 * Run with: pnpm tsx scripts/create-nominations-bucket.ts
 */
const BUCKET = "nominations";
const MAX_FILE_BYTES = 30 * 1024 * 1024;

function requireEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to create the nominations bucket.`);
  return value;
}

async function main() {
  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const options = {
    public: false,
    fileSizeLimit: MAX_FILE_BYTES,
    allowedMimeTypes: null,
  };

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Could not list storage buckets: ${listError.message}`);

  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    const { error } = await supabase.storage.updateBucket(BUCKET, options);
    if (error) throw new Error(`Could not update bucket "${BUCKET}": ${error.message}`);
    console.log(`Updated private bucket "${BUCKET}" (30 MB limit).`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, options);
  if (error) throw new Error(`Could not create bucket "${BUCKET}": ${error.message}`);
  console.log(`Created private bucket "${BUCKET}" (30 MB limit).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
