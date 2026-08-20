> **DB apply status (done, with an incident + recovery).**
> `pnpm db:migrate` applies ALL pending migrations at once — so `0007` **and** `0008` were
> applied together, dropping the inline columns before the backfill (2.2) could read them.
> The 13 existing rows lost their DB file references (the storage objects were never touched).
> **Recovered** by `scripts/recover-presentation-files.ts --commit`, which rebuilt all 13
> `presentation_files` rows by listing the bucket. `presentations:backfill` (2.2) is now moot.
>
> Lesson for next time: a destructive column-drop must be a SEPARATE change, generated and
> applied only AFTER the data backfill has run — never generated in the same `db:migrate` batch
> as the additive migration.

## 1. Data model (additive migration)

- [x] 1.1 Add `db/schema/presentation-files.ts` defining the `presentation_files` table (id uuid pk, presentationId uuid FK → presentations.id on delete cascade, kind text 'material'|'video', fileName, filePath, fileSize integer, contentType text nullable, sortOrder integer, createdAt) with an index on presentationId; export select/insert types
- [x] 1.2 Add nullable `videoUrl` (`video_url` text) column to `presentations` in `db/schema/presentations.ts` (keep the inline file columns for now)
- [x] 1.3 Export the new table from `db/schema/index.ts`
- [x] 1.4 Run `pnpm db:generate` → additive migration `0007_aberrant_ben_grimm.sql`. **`pnpm db:migrate` deferred (remote DB).**

## 2. Backfill existing submissions

- [x] 2.1 Add `scripts/backfill-presentation-files.ts` (tsx, idempotent, raw SQL) that inserts one `kind='material'` child row per existing presentation from its inline columns
- [x] 2.2 Add `presentations:backfill` to `package.json`. **Superseded** — columns were dropped before it could run; recovery used `scripts/recover-presentation-files.ts` instead (rebuilds rows from storage). All 13 rows recovered.

## 3. Drop inline columns (destructive migration)

- [x] 3.1 Remove `fileName`/`filePath`/`fileSize` from `db/schema/presentations.ts`
- [x] 3.2 Run `pnpm db:generate` → drop migration `0008_lowly_reaper.sql`; applied via `pnpm db:migrate` (together with 0007 — see incident note above).

## 4. Shared validation & constants

- [x] 4.1 In `constants.ts` add material rules (max 5, 50 MB, PDF/PPT/PPTX), video rules (MP4/MOV/WEBM, 50 MB), `FileKind`, and per-kind accept/extension maps
- [x] 4.2 In `schema.ts` replace single-file validation with material-array validation, optional video (upload XOR https link), and the both-provided rejection; keep client/server parity

## 5. Upload session & server actions

- [x] 5.1 Extend `upload-session.ts` so the payload holds an array of files each with `{ path, name, size, type, kind }` (version bumped to 2)
- [x] 5.2 Rework `preparePresentationUpload` to accept manifests with kind, validate per category, issue one signed URL per file under kind-scoped paths, and return all uploads + one session
- [x] 5.3 Rework `submitPresentation` to verify the session, insert the row + all file rows + `videoUrl` in one transaction, and clean up every path on failure
- [x] 5.4 Update `discardPresentationUpload` / `cleanupUpload` to remove every path in the session

## 6. Public form UI

- [x] 6.1 Generalize `FileDropField.tsx` into a multi-file field with per-file remove and a per-file progress bar
- [x] 6.2 Add `VideoField.tsx`: optional single video dropfield + external-link input (mutually exclusive) with the view-and-download guidance callout
- [x] 6.3 Update `PresentationForm.tsx` to hold `materials: File[]` + video (file or url), build the manifest array, and drive prepare → per-file upload → submit
- [x] 6.4 Switch `uploadToSignedUrl` to `XMLHttpRequest` with per-file progress surfaced in the UI
- [x] 6.5 Update `SuccessView.tsx` to recap all material file names and the video file name or link

## 7. Admin UI & actions

- [x] 7.1 Update `queries.ts` so detail loads the related `presentation_files` and the list exposes `materialCount` + `hasVideo`
- [x] 7.2 Update `getPresentationFileSignedUrl` to key by file id; update `deletePresentation` to remove all child object paths
- [x] 7.3 Update the detail page (+ reuse `PresentationFileLink`) to render a Materials list and a Video entry (download when uploaded, external link with verify-access hint when linked)
- [x] 7.4 Add a material-count / video indicator column to the list page

## 8. Email

- [x] 8.1 Update `presentation-confirmation.ts` input + template to list all material file names and the video file name or link

## 9. Tests & verification

- [x] 9.1 Update unit tests for `schema.ts` (material array, video XOR link, limits) and `upload-session.ts` (multi-file payload round-trip)
- [x] 9.2 `pnpm typecheck`, `pnpm check`, `pnpm test:ci` all pass (130 tests). **Manual end-to-end verification deferred** — requires the migrations applied + a running app against the DB.
