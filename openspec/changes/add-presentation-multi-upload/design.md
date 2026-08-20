## Context

The presentation upload feature (`/[year]/presentation-upload`) persists exactly one file per submission by storing `file_name`/`file_path`/`file_size` directly on the `presentations` row, and uploads it browser→Supabase via a two-phase signed URL guarded by an HMAC upload-session token. Admins list/download the single file; a confirmation email echoes the one file name.

Two needs drive this change: authors often have more than one material file, and online authors must supply a recorded talk. The storage account is on the free plan with a **50 MB per-file cap**, which most talk recordings exceed — so large videos need a non-storage fallback.

## Goals / Non-Goals

**Goals:**
- Multiple presentation-material files per submission (PDF/PPT/PPTX, ≤ 50 MB each).
- An optional presentation video: uploaded (≤ 50 MB) or, for larger recordings, an external https link that organizers can view and download.
- Preserve the existing anti-spam, signed-URL, and confirmation-email guarantees.
- Preserve existing submission rows through the data-model change.

**Non-Goals:**
- Raising the 50 MB storage cap or adding a second bucket.
- Transcoding, streaming, or in-app playback of large linked videos.
- Verifying that an external video link is actually accessible/downloadable (we guide the author; we do not fetch the link).
- Editing an already-submitted presentation from the public form.

## Decisions

### D1: Child table for files, `video_url` on the parent
Replace the inline file columns with a `presentation_files` child table (`kind` = `material` | `video`, plus `file_name`/`file_path`/`file_size`/`content_type`/`sort_order`), FK to `presentations` with cascade delete. Add a nullable `video_url` on `presentations` for the external-link case.

- *Why:* A submission now owns 1..N files; a child table is the normalized fit and matches the repo's relational style. The external link is a single optional scalar with no file semantics, so it belongs on the parent rather than as a fake child row with null path/size.
- *Alternatives:* JSON column of files (harder to query/index, weaker typing); representing the link as a child row (forces `file_path`/`file_size` nullable and muddies "every file row has a real object").

### D2: Video is upload XOR link, both optional
The video is represented by **either** a `presentation_files` row with `kind='video'` **or** `presentations.video_url` — never both, and neither is required. Enforced in shared validation.

- *Why:* Matches the author's mental model ("small → upload, large → link") and keeps a single source of truth for "the video."

### D3: Reuse the two-phase signed-URL flow, one URL per file
`preparePresentationUpload` takes an array of file manifests (each tagged `material` or `video`), validates each against its category rules, issues one signed upload URL per file, and returns a single HMAC upload-session token embedding **all** files (path/name/size/type/kind). The browser PUTs each file to its URL; `submitPresentation` re-validates the token and writes the parent row + all child rows (+ `video_url`) in one DB transaction, cleaning up every uploaded object on failure.

- *Why:* Extends the proven mechanism rather than inventing a new one; keeping all files in one signed token preserves the "server approved exactly these files" guarantee already relied on.
- *Alternatives:* One token per file (more round-trips, partial-state cleanup harder); server-proxied multipart upload (would hit the Next.js body limit and defeats direct-to-storage).

### D4: Kind-scoped storage paths
Objects are stored at `{year}/{presentationId}/materials/{i}-{name}` and `{year}/{presentationId}/video/{name}`.

- *Why:* Human-readable grouping, no collisions across files in one submission, and a simple prefix to enumerate/delete a submission's objects.

### D5: Per-file upload progress via XHR
The direct upload switches from `fetch` PUT to `XMLHttpRequest` so each file (especially a ≤50 MB video) shows a real progress bar.

- *Why:* `fetch` cannot report upload progress; multi-file and video uploads make progress feedback worthwhile.

### D6: Data-preserving migration
Generate the schema change with `pnpm db:generate`, but sequence it so existing data survives: (1) generate + apply the additive migration (new `presentation_files` table, new `video_url` column) while the old inline columns still exist; (2) run a one-off `tsx` backfill script that inserts one `kind='material'` child row per existing presentation from its inline columns; (3) generate + apply a second migration that drops the inline columns.

- *Why:* Drizzle migrations are schema-only and must not be hand-written (project rule); a standalone backfill script (like `create-presentations-bucket.ts`) handles the data move. Splitting additive-then-destructive keeps every existing submission's file recoverable and makes rollback of step 3 the only risky step.

## Risks / Trade-offs

- **Declared vs. actual upload size** → The signed PUT is bounded only by the bucket's 50 MB cap, so a client could send a file larger than its declared manifest size (up to 50 MB). This matches the current single-file behavior and is acceptable behind CAPTCHA + honeypot; the bucket cap is the hard ceiling.
- **External video links can rot or be permission-locked** → We cannot guarantee access. Mitigation: prominent view-and-download guidance in the form and a "verify access" hint in the admin view; the link is stored verbatim for organizers to check.
- **Backfill/drop ordering** → Dropping inline columns before the backfill runs would lose file references. Mitigation: the destructive migration (step 3) is authored and applied only after the backfill script is confirmed run; document the order in tasks.
- **Partial multi-file upload failure** → If some files upload and a later one fails, orphaned objects could remain. Mitigation: on any prepare/upload/submit failure the client calls discard and the server best-effort deletes every path in the session.

## Migration Plan

1. Add `presentation_files` schema + `video_url` column; `pnpm db:generate` → additive migration; `pnpm db:migrate`.
2. Run `pnpm tsx scripts/backfill-presentation-files.ts` to populate child rows from existing inline columns.
3. Remove inline columns from the Drizzle schema; `pnpm db:generate` → drop migration; `pnpm db:migrate`.
4. Deploy application code (form, actions, admin, email) together with step 3.

Rollback: steps 1–2 are additive and safe to leave in place. If step 3/4 must be reverted, restore the inline columns from a DB backup taken before step 3; the child-table data remains intact.

## Open Questions

- None blocking. Max material file count is set to 5 (adjustable in `constants.ts`); revisit if authors legitimately need more.
