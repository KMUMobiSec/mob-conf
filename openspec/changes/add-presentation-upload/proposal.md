## Why

Conference presenters currently have no first-party way to submit their final presentation files — the legacy flow asked them to upload to Google Drive and paste a public link, which is unreliable (broken/locked links) and gives organizers no audit trail. We need a per-year form that uploads the presentation directly to our own private storage and lets admins manage submissions.

## What Changes

- Add a public, per-year **presentation upload form** at `/[year]/presentation-upload` collecting Paper Number, Title, Contact Email, and a single presentation file (`.pdf`, `.ppt`, `.pptx`, ≤ 50 MB).
- Upload the file directly browser→Supabase Storage into a new **private** bucket `presentations` using two-phase signed URLs and an HMAC-signed upload session (same mechanism as nominations).
- Protect the form with the existing Cloudflare Turnstile CAPTCHA + honeypot.
- Persist each submission to a new `presentations` table.
- Send the submitter a **confirmation email** (Resend) with a recap of their submission.
- Add an **admin management section** (`/admin/presentations`): year-filtered, searchable, paginated list; detail view with signed-URL file download; a **Reviewed** status toggle; and delete (row + storage object). Register a "Presentations" item in the admin sidebar.

## Capabilities

### New Capabilities
- `presentation-upload`: Public per-year form that validates submitter input, uploads a single presentation file to the private `presentations` bucket, persists the submission, and emails a confirmation.
- `admin-presentations`: Admin dashboard to list, filter, search, view, download, mark-reviewed, and delete presentation submissions.

### Modified Capabilities
<!-- None: Turnstile verification and the Turnstile widget are extracted into shared helpers, but this is an implementation refactor with no change to existing nomination behavior. -->

## Impact

- **New code:** `db/schema/presentations.ts`; `modules/landing/presentation-form/*` (form, single-file drop field, validation, upload-session, server actions); `modules/admin/presentations/*` (queries, actions); `app/[year]/(public)/presentation-upload/page.tsx`; `app/admin/(protected)/presentations/{page.tsx,[id]/page.tsx}` + components; `lib/email/presentation-confirmation.ts`; `lib/security/turnstile.ts` (shared).
- **Modified code:** `db/schema/index.ts` (export new table); `app/admin/(protected)/AdminSidebar.tsx` (new nav item); nominations module updated to import the shared Turnstile helper + widget (one-line import changes, no behavior change).
- **Database:** new `presentations` table via `pnpm db:generate` + `pnpm db:migrate` (no hand-written SQL).
- **Infrastructure:** new private Supabase Storage bucket `presentations` (50 MB limit, restricted MIME types) — created as a one-time ops step.
- **Dependencies / env:** reuses existing `SUPABASE_*`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `BETTER_AUTH_SECRET`. Adds one new sender address `RESEND_EMAIL_FROM_NOREPLY` (e.g. `noreply@ebision.ifip-wg84.org`, same verified domain) for presentation confirmation emails. No new package dependencies.
