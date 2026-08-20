## Why

The presentation upload form currently accepts exactly one file per submission, which does not fit authors who have several materials (e.g. slides plus a handout) and provides no way to submit the recorded talk that online authors need for the virtual sessions. Videos also routinely exceed the 50 MB free-plan storage cap, so authors need a supported fallback for large recordings.

## What Changes

- Allow **multiple presentation-material files** per submission (PDF/PPT/PPTX, ≤ 50 MB each, up to 5, at least 1 required) instead of exactly one file. **BREAKING** (data model): the single inline file columns on `presentations` are replaced by a `presentation_files` child table.
- Add an **optional presentation video** for online authors: either **upload** a video file (MP4/MOV/WEBM, ≤ 50 MB) **or** paste an **external https link** (Google Drive, OneDrive, Dropbox, etc.) for videos larger than 50 MB. Upload and link are mutually exclusive.
- Show friendly, professional guidance in the video section emphasizing that a shared link must let the organizing committee **view and download** the recording.
- Extend the two-phase signed-URL upload to issue **one signed URL per uploaded file**, embedding all files in a single HMAC upload session, and persist the submission (materials + optional video + optional video link) in one transaction. Show **per-file upload progress**.
- Update the **admin** presentation views to list all material files and the video (download when uploaded, external link with a verify-access hint when linked), reflect this in the list indicator, and delete every stored object on removal.
- Update the **confirmation email** to list all material file names and the video file name or link.
- Storage bucket is **unchanged**: single private `presentations` bucket, 50 MB per-file cap (no limit raise).

## Capabilities

### New Capabilities
<!-- None: this extends the existing presentation-upload and admin-presentations capabilities. -->

### Modified Capabilities
- `presentation-upload`: The form accepts multiple material files and an optional presentation video (uploaded file or external link) instead of exactly one file; validation, the signed-URL upload flow, persistence, and the confirmation email change accordingly.
- `admin-presentations`: Detail and list views render multiple material files and the presentation video (uploaded or linked); deletion removes all stored objects; the file signed-URL action is keyed per file.

## Impact

- **New code:** `db/schema/presentation-files.ts` (`presentation_files` child table); `scripts/backfill-presentation-files.ts` (one-off tsx backfill of existing inline file data).
- **Modified code:** `db/schema/presentations.ts` (drop inline `file_name`/`file_path`/`file_size`, add nullable `video_url`), `db/schema/index.ts` (export new table); `modules/landing/presentation-form/*` (`actions.ts`, `lib/schema.ts`, `lib/constants.ts`, `lib/upload-session.ts`, `components/PresentationForm.tsx`, `FileDropField.tsx`, `SuccessView.tsx`); `modules/admin/presentations/*` (`actions.ts`, `lib/queries.ts`); `app/admin/(protected)/presentations/*` (list, detail, `PresentationFileLink.tsx`, delete/reviewed components); `lib/email/presentation-confirmation.ts`.
- **Database:** new `presentation_files` table + `presentations` column changes via `pnpm db:generate` + `pnpm db:migrate` (no hand-written SQL). Existing rows preserved by the backfill script, run before the inline columns are dropped.
- **Infrastructure:** none — the `presentations` bucket (50 MB) is reused unchanged.
- **Dependencies / env:** no new packages or environment variables.
