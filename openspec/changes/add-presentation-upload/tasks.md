## 1. Shared helpers (refactor, no behavior change)

- [x] 1.1 Create `lib/security/turnstile.ts` exporting `verifyTurnstile(token)` (moved from nominations `actions.ts`)
- [x] 1.2 Move `TurnstileWidget` to a shared path (e.g. `components/security/turnstile-widget.tsx`)
- [x] 1.3 Update nominations `actions.ts` to import `verifyTurnstile` from the shared helper (remove local copy)
- [x] 1.4 Update nominations form to import `TurnstileWidget` from the shared path
- [x] 1.5 Typecheck/build to confirm nominations behavior is unchanged (build + nomination tests pass)

## 2. Database

- [x] 2.1 Add `db/schema/presentations.ts` table: `id`, `year`, `paperNumber`, `title`, `contactEmail`, `fileName`, `filePath`, `fileSize`, `isReviewed`, `reviewedAt`, `createdAt`, `updatedAt`; index on `year`
- [x] 2.2 Export the new table from `db/schema/index.ts`
- [x] 2.3 Run `pnpm db:generate`, review the generated SQL, then `pnpm db:migrate` (migration `0006_slimy_the_executioner.sql` applied)

## 3. Storage bucket (ops)

- [x] 3.1 Create the private `presentations` Supabase bucket (50 MB file size limit, allowed MIME types: PDF + PPT + PPTX); document exact settings and provide an optional one-off script (`pnpm presentations:bucket`)

## 4. Public presentation form module

- [x] 4.1 Create `modules/landing/presentation-form/lib/constants.ts` (allowed extensions, `MAX_FILE_BYTES = 50MB`, `MAX_FILE_MB_LABEL`)
- [x] 4.2 Create `modules/landing/presentation-form/lib/schema.ts` (Zod validation for paper number, title, contact email, and file metadata)
- [x] 4.3 Create `modules/landing/presentation-form/lib/upload-session.ts` (single-file HMAC session: sign/parse/create, `BETTER_AUTH_SECRET`)
- [x] 4.4 Create `modules/landing/presentation-form/components/FileDropField.tsx` (single-file, 50 MB label)
- [x] 4.5 Create `modules/landing/presentation-form/actions.ts`: `preparePresentationUpload` (honeypot → Turnstile → year → validate → signed URL + session) and `submitPresentation` (verify session → insert → email → cleanup on failure) and `discardPresentationUpload`
- [x] 4.6 Create `modules/landing/presentation-form/components/PresentationForm.tsx` (client: validate → prepare → PUT to signed URL → submit → success)
- [x] 4.7 Create `modules/landing/presentation-form/components/PresentationFormPage.tsx` and `SuccessView.tsx`

## 5. Public route

- [x] 5.1 Create `app/[year]/(public)/presentation-upload/page.tsx` with year validation (404 for invalid years) and `generateMetadata`

## 6. Confirmation email

- [x] 6.1 Create `lib/email/presentation-confirmation.ts` (mirror nomination-confirmation template; recap paper number, title, file name; `RESEND_EMAIL_FROM_AWARDS`)

## 7. Admin module

- [x] 7.1 Create `modules/admin/presentations/lib/queries.ts` (`listPresentations` with year/search/pagination, `getPresentation`)
- [x] 7.2 Create `modules/admin/presentations/lib/filters.ts` (parse list params: year, reviewed, q)
- [x] 7.3 Create `modules/admin/presentations/actions.ts`: `getPresentationFileSignedUrl`, `setPresentationReviewed`, `deletePresentation` — all guarded by `getCurrentAdminSession()`

## 8. Admin UI

- [x] 8.1 Create `app/admin/(protected)/presentations/page.tsx` (list with `FilterSelect`/`SearchInput`/`TablePagination`)
- [x] 8.2 Create `app/admin/(protected)/presentations/[id]/page.tsx` (detail: fields + download + reviewed toggle + delete)
- [x] 8.3 Create row-action components: `PresentationFileLink` (file-download), `ReviewedToggle`, `DeletePresentationDialog`
- [x] 8.4 Register the "Presentations" item in `app/admin/(protected)/AdminSidebar.tsx` (lucide `Presentation` icon + active-path check)

## 9. Verification

- [x] 9.1 Run lint, typecheck, and build; fix any issues (all pass)
- [x] 9.2 Run existing tests; add focused tests for `upload-session`, validation schema, and admin filters (43 tests pass)
- [x] 9.3 Runtime smoke test: public form renders (200), invalid year → 404, `/admin/presentations` → redirect to login. NOTE: full interactive upload→storage→DB→email cycle not exercised here (requires a live browser + Turnstile token); ready for manual QA in a deployed/dev environment.
