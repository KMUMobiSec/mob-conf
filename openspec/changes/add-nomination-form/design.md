## Context

The MOBISEC site (`app/[year]/(public)/*`) renders read-only conference pages. Each public page is a server component that delegates to `modules/landing/<name>/components/<Name>Page.tsx`; the year segment is validated against `VALID_YEARS` in `constants/config.ts` and shared through `YearProvider`. Theming is token-driven (Tailwind v4 CSS-first in `styles/globals.css`, forest-green palette, IBM Plex), with light/dark/system handled by `next-themes` and the `ModeToggle` in the global `Navbar`.

The source of truth for the UI is the Claude Design handoff `Nomination Form.html` (+ `app.jsx` / `fields.jsx`): a single-file React prototype with six sections, award-driven conditional fields, hand-rolled validation, file-drop uploads, a best-effort PDF page counter, and a success recap. The handoff README directs us to recreate the *visual output* in the target stack — not copy the prototype's structure — and to skin it with our own theme.

Backend primitives already exist: a Drizzle client (`db` from `@/db`, postgres-js), a generic Supabase storage service bound to the service-role client (`lib/services/storage.server.ts`), and `RESEND_API_KEY` in the environment. The Supabase `nominations` bucket already exists. There is no `resend` dependency, no email module, and the only Drizzle tables are Better Auth's.

## Goals / Non-Goals

**Goals:**
- A pixel-faithful re-creation of the prototype's layout and behavior, rebuilt with shadcn/ui primitives and our design tokens so it is correct in light, dark, and system themes.
- Capture the year from the route and persist it with every nomination.
- Server actions that validate the submission, issue signed Supabase upload URLs, record browser-uploaded documents in the existing `nominations` bucket, write a `nominations` row (answers + file paths + year), and email a recap to the nominator.
- A single zod schema reused by client and server so validation rules live in one place.
- Reasonable abuse protection for a public, unauthenticated endpoint.

**Non-Goals:**
- Admin/committee UI to review or export nominations.
- Notifying the awards committee by email (nominator-only for now).
- Adding the page to the navigation menu.
- Korean / i18n localization (English only).
- Editing or withdrawing a submitted nomination.

## Decisions

### D1 — Validation: shared zod schema + hand-rolled controlled state (no react-hook-form)
`zod@^4` is installed; `react-hook-form` is not. The form has cross-field, award-conditional rules (self-nomination block, grad-only required fields, industry slide-page limit). We model these in a single `nominationSchema` built with `z.discriminatedUnion`/`superRefine`, and drive the UI with `useState` + a `useMemo` errors map — mirroring the prototype's proven approach. The same schema runs in the server action.
- *Alternative considered:* add `react-hook-form` + `@hookform/resolvers`. Rejected to avoid a new dependency and because the prototype's controlled-state model already handles the conditional logic cleanly; the shadcn `Field` primitive doesn't require RHF.

### D2 — Direct browser uploads with server-signed Supabase URLs
The client first posts a `FormData` containing text fields, Turnstile token, honeypot, and file metadata to a `"use server"` action. The action validates the metadata, creates server-generated storage paths, returns signed Supabase upload URLs, and signs the upload plan. The browser uploads file bytes directly to Supabase, then calls a final server action with the signed upload session to persist the row. This avoids Vercel Function request-body limits while keeping path generation and persistence server-controlled.
- *Alternative considered:* send files through the Server Action. Rejected because larger nomination documents can exceed platform request-body limits before the action can return helpful validation errors.

### D3 — Documents to Supabase Storage; metadata (paths) to Postgres
Each accepted file is uploaded directly from the browser to the existing `nominations` bucket at `${year}/${nominationId}/${fieldKey}/${safeFileName}` using a server-generated signed upload URL; the approved storage paths (with original name + size) are stored as a `jsonb` map on the `nominations` row. Binary stays in object storage; the row stays small and queryable.
- *Alternative considered:* store files as `bytea` in Postgres. Rejected — bloats the DB, no CDN, awkward size limits.

### D4 — `nominationId` generated before upload
The preparation action generates a UUID up front (`crypto.randomUUID()`) so it can namespace the storage path and use it as the row primary key, keeping files and record correlated even if the DB insert is retried.

### D5 — Email via Resend with a hand-written branded HTML template
Add the `resend` SDK. A `lib/email/` module exposes a lazily-initialized client and `sendNominationConfirmation()` that renders an inline-styled HTML email (forest-green header, IBM-Plex-ish system fallback stack) recapping the nomination. Sender = `RESEND_EMAIL_FROM_AWARDS` (`awards@mobisec-conference.com`). **Recap only** — no file links.
- *Alternative considered:* `react-email` / `@react-email/components`. Rejected to avoid extra dependencies for a single template; a typed HTML-string builder is sufficient.

### D6 — CAPTCHA: Cloudflare Turnstile
The client renders the Turnstile widget (hosted script, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and includes its token in the `FormData`. The server action verifies the token against `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `TURNSTILE_SECRET_KEY` before doing any upload/DB/email work; failure rejects the submission.
- *Alternative considered:* hCaptcha/reCAPTCHA. Turnstile chosen for free unlimited use, no PII, and the simplest no-SDK integration.

### D7 — Defense in depth beyond CAPTCHA
A visually-hidden honeypot input (must stay empty), a per-file **30 MB** cap, signed upload sessions, and a MIME + extension allow-list (`.pdf/.doc/.docx`, plus `.zip` for supporting docs; slides `.pdf` only) are enforced server-side. The file limit is also displayed beside every upload field.

### D8 — Slide PDF page limit: best-effort, client + server
Keep the prototype's latin1 `/Count`/`/Type/Page` scan to count pages. The client uses it for live feedback; after direct upload, the server downloads the uploaded slide deck and repeats the scan as a soft gate — if the count is unknown it warns rather than hard-blocks, but a detected count > 5 is rejected. (Matches the prototype's stated behavior.)

### D9 — Page composition (server shell + client form)
`app/[year]/(public)/nomination-form/page.tsx` (server) validates the year and sets metadata, then renders `NominationFormPage` (server: eyebrow/title/lede header) which renders `<NominationForm year={year} />` (`"use client"`). The server action lives in `modules/landing/nomination-form/actions.ts`. Theme switching needs no new code — the form uses semantic tokens and the global `Navbar` `ModeToggle`.

### D10 — Token mapping (prototype → our palette)
`--accent` (slate) → our `--primary` (forest green); `--accent-soft` → our `--accent` (pale green); section-number badge → `bg-primary text-primary-foreground`; selected radio → `border-primary bg-accent`; `--error` → `destructive`; focus → `ring`; surfaces → `bg-card` / `bg-muted`. This satisfies “use our theme” while preserving the prototype's hierarchy.

### D11 — Awards & conditional rules as typed constants
The four awards and their rule flags (`noSelfNomination`, `requiresSupervisorLetter`, `requiresSlides`, `recommendsTeaching`, `showsGradFields`) live in `lib/constants.ts` and feed both the schema and the UI, so logic and copy have one source.

## Risks / Trade-offs

- **Resend domain not verified** → emails silently fail/spam-folder. *Mitigation:* document the domain-verification step; treat email send as non-fatal (the nomination is still saved and the user still sees the success recap) and log failures.
- **Server-side PDF page counting is heuristic** → a valid deck could be miscounted. *Mitigation:* soft behavior — unknown count warns, only a confidently-detected `>5` blocks; the limit is restated in the UI.
- **Public endpoint abuse / large uploads** → cost and spam. *Mitigation:* Turnstile + honeypot + 30 MB/file cap + MIME allow-list + signed upload sessions; reject before issuing upload URLs.
- **Multi-file partial failure** (some direct uploads succeed, then DB insert fails) → orphaned objects. *Mitigation:* generate `nominationId` first, upload all files directly to approved paths, then insert once; on validation or insert failure, best-effort delete the just-uploaded objects and surface a retryable error. The client also asks the server to discard prepared uploads if a browser upload fails partway through.
- **Service-role client in the action** → must remain server-only. *Mitigation:* keep all storage/DB/email in `"use server"` / `server-only` modules; never import into client components.
- **Schema drift from hand-written migrations** → forbidden by policy. *Mitigation:* author the Drizzle table only; run `pnpm db:generate` then `pnpm db:migrate`.

## Migration Plan

1. Add the `resend` dependency (`pnpm add resend`).
2. Add `db/schema/nominations.ts` and export it from `db/schema/index.ts`.
3. Run `pnpm db:generate` to produce the migration, then `pnpm db:migrate` to apply it. (No manual SQL.)
4. Add env vars to `.env.example`: `RESEND_EMAIL_FROM_AWARDS`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (real values already/also set in `.env`).
5. Ensure the Resend sending domain (`mobisec-conference.com`) is verified and a Turnstile site/secret key pair is provisioned.
6. Confirm the existing `nominations` Supabase bucket's policy allows service-role uploads.
- **Rollback:** the change is additive (new table, new route, new files). Rolling back = removing the route/module and dropping the unused `nominations` table; existing pages are unaffected.

## Open Questions

- None blocking. Future follow-ups (explicitly out of scope now): an admin review/export view, a committee-notification email, and Korean localization.
