import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time ops script: create (or update) the private `presentations` storage
 * bucket used by the presentation upload form.
 *
 * Settings: private (non-public), 50 MB per-file limit. File TYPE is NOT enforced
 * here: browsers report unreliable/empty MIME types for .ppt/.pptx, so a bucket
 * MIME allow-list would reject legitimate uploads. The allowed file types
 * (PDF / PPT / PPTX) are enforced by server-side extension validation in
 * preparePresentationUpload before any signed upload URL is issued.
 * `allowedMimeTypes: null` clears any previously-configured restriction.
 *
 * Re-running is safe — an existing bucket is updated in place.
 *
 * Run with: pnpm presentations:bucket
 */
const BUCKET = "presentations";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function requireEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to create the presentations bucket.`);
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
    console.log(
      `Updated private bucket "${BUCKET}" (50 MB limit; file type enforced server-side).`,
    );
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, options);
  if (error) throw new Error(`Could not create bucket "${BUCKET}": ${error.message}`);
  console.log(`Created private bucket "${BUCKET}" (50 MB limit; file type enforced server-side).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
