# Nomination Direct Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let nomination form users upload files up to 30 MB per file with clear per-field labels and detailed upload errors.

**Architecture:** Keep the nomination Server Action for validation, CAPTCHA, persistence, cleanup, and email, but stop sending file bytes through it. The browser requests server-generated Supabase signed upload URLs, uploads each file directly to storage, then submits a signed upload session token containing the server-approved file paths.

**Tech Stack:** Next.js Server Actions, React client components, Supabase Storage signed upload URLs, Vitest, Drizzle.

---

### Task 1: Shared Limits And Error Copy

**Files:**
- Modify: `modules/landing/nomination-form/lib/constants.ts`
- Modify: `modules/landing/nomination-form/lib/schema.ts`
- Modify: `modules/landing/nomination-form/components/FileDropField.tsx`
- Test: `__tests__/nomination-form/schema.test.ts`

- [ ] Write failing schema tests proving a 30 MB file is accepted, a file over 30 MB is rejected, and the rejection names the file and actual size.
- [ ] Update `MAX_FILE_BYTES` to 30 MB and expose a reusable `MAX_FILE_MB_LABEL`.
- [ ] Update file validation messages to include the file name, actual size, and `30 MB per file`.
- [ ] Render the max-size label in every file picker.

### Task 2: Storage Signed Upload Support

**Files:**
- Modify: `lib/services/storage.ts`
- Test: `__tests__/lib/storage-service.test.ts`

- [ ] Write a failing storage-service test for `createSignedUploadUrl`.
- [ ] Add the storage bucket client type and service wrapper for Supabase `createSignedUploadUrl(path, { upsert: false })`.
- [ ] Keep errors wrapped in `SupabaseStorageServiceError`.

### Task 3: Upload Session Integrity

**Files:**
- Create: `modules/landing/nomination-form/lib/upload-session.ts`
- Test: `__tests__/nomination-form/upload-session.test.ts`

- [ ] Write failing tests for signing, parsing, tamper rejection, and expiration rejection.
- [ ] Implement HMAC-signed JSON upload sessions using `BETTER_AUTH_SECRET`.
- [ ] Store only server-generated paths and file metadata in the session payload.

### Task 4: Direct Upload Server Actions

**Files:**
- Modify: `modules/landing/nomination-form/actions.ts`

- [ ] Replace file-byte reading with JSON file metadata reading.
- [ ] Add `prepareNominationUploads(formData)` to verify honeypot, Turnstile, year, values, and file metadata, then return signed upload URLs plus an upload session.
- [ ] Change `submitNomination(formData)` to consume the upload session, validate metadata again, count uploaded slide pages by downloading the stored slide deck when required, insert the nomination row, clean up uploaded files on failure, and send the recap email.

### Task 5: Client Upload Flow

**Files:**
- Modify: `modules/landing/nomination-form/components/NominationForm.tsx`

- [ ] Build a metadata manifest from selected files instead of appending files to the final Server Action `FormData`.
- [ ] Call `prepareNominationUploads`, upload every file to its signed URL with `fetch`, and then call `submitNomination` with the upload session.
- [ ] Show field-level errors for validation, server, and browser upload failures.
- [ ] Add detailed user-facing upload failure copy with the file name and size.

### Task 6: Verification

**Files:**
- Modify: `openspec/changes/add-nomination-form/specs/nomination-form/spec.md`
- Modify: `openspec/changes/add-nomination-form/design.md`
- Modify: `next.config.ts`

- [ ] Update OpenSpec/design text from 10 MB Server Action uploads to 30 MB direct storage uploads.
- [ ] Remove or correct stale `next.config.ts` comments about sending documents through Server Actions.
- [ ] Run targeted Vitest suites, `pnpm typecheck`, and `pnpm check`.
