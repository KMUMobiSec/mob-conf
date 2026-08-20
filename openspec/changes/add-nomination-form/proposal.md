## Why

EBISION recognizes outstanding individuals through several awards, but there is no way for the community to submit nominations online — the existing `/[year]` site is read-only and submissions are handled off-platform. A public, per-year nomination form lets nominators submit candidates and supporting documents directly, recording each submission and confirming receipt by email.

## What Changes

- Add a public page at `/[year]/nomination-form` that captures the **year from the route** (validated against `VALID_YEARS`) and ties every nomination to that year.
- Reimplement the Claude Design `Nomination Form.html` prototype in our stack: shadcn/ui + Tailwind v4 on **our** forest-green palette and IBM Plex typography, with working **light/dark/system** theming through the existing `ModeToggle`.
- Provide a six-section form with **award-driven conditional logic**:
  1. Award selection (drives the rest of the form).
  2. Nominator details (name, email, affiliation, relationship).
  3. Nominee details (name, email, affiliation, position, country) — plus degree/enrollment when the award is Promising Graduate Student.
  4. Nomination statement (≥ 40 characters, live counter).
  5. Supporting documents (CV, achievements summary, supporting docs; conditional teaching record / supervisor letter / innovation slides per award).
  6. Consent + submit.
- Enforce the prototype's rules exactly: required fields, email format, **self-nomination block** (nominator ≠ nominee email) for Distinguished Lecturer and Young Researcher, required conditional uploads, and the Industry Pioneer **≤ 5-page** slide-deck limit. A single zod schema validates on both client and server.
- On submit: verify a **Cloudflare Turnstile** CAPTCHA, issue server-generated signed Supabase upload URLs, let the browser upload each document directly to the existing Supabase **`nominations`** storage bucket, persist the answers + stored file paths + year to a **new `nominations` database table**, then send a branded **recap-only confirmation email to the nominator** via **Resend**. Show a client-side recap screen on success.
- Add abuse protection appropriate for a public, no-auth endpoint: Turnstile CAPTCHA, a hidden honeypot field, a per-file **30 MB** size cap, server-signed upload sessions, and a MIME/extension allow-list.
- Add the `resend` dependency and document new env vars (`RESEND_EMAIL_FROM_AWARDS`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) in `.env.example`.
- Generate the database migration with `pnpm db:generate` and apply it with `pnpm db:migrate` (no hand-written migration SQL).

## Capabilities

### New Capabilities

- `nomination-form`: Public per-year award nomination submission — adaptive multi-section form, award-conditional fields and validation, document upload to object storage, database persistence, email confirmation, and CAPTCHA/abuse protection.

### Modified Capabilities

- None.

## Impact

- **New routes:** `app/[year]/(public)/nomination-form/page.tsx`.
- **New UI:** `modules/landing/nomination-form/**` (page, client form, file-drop field, success recap, shared zod schema + constants, server action).
- **New backend:** `db/schema/nominations.ts` (+ export from `db/schema/index.ts`); `lib/email/` Resend client + nomination confirmation template; reuse of `lib/services/storage.server.ts` and `db` from `@/db`.
- **New dependency:** `resend`. Cloudflare Turnstile is loaded via its hosted script (no SDK required); server verification uses `fetch`.
- **Env:** new `RESEND_EMAIL_FROM_AWARDS`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (documented in `.env.example`); reuses existing `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
- **Database:** one new `nominations` table; migration produced via `pnpm db:generate` / `pnpm db:migrate`.
- **External services:** Supabase Storage (existing `nominations` bucket), Resend (requires verified sending domain for `ebision.ifip-wg84.org`), Cloudflare Turnstile.
- **Out of scope:** admin list/review UI, committee-notification email, navigation-menu link, Korean/i18n localization (English only for now).
