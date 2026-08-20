import { existsSync } from "node:fs";
import path from "node:path";

// react-pdf's <Image> embeds a local file when given an absolute filesystem path (same approach as
// the banquet report's logo). Resolving from disk avoids a network round-trip to our own /public and
// works in every runtime the PDF is rendered in (route handler + server action).
const SEAL_CANDIDATE = path.join(process.cwd(), "public/assets/certificates/seal.jpeg");

/** Absolute path to the conference seal, or null when the asset is missing (seal is then omitted). */
export const SEAL_PATH: string | null = existsSync(SEAL_CANDIDATE) ? SEAL_CANDIDATE : null;
