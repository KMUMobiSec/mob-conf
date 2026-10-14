## Context

MOBISEC runs per-year conference sites under `app/[year]/(public)/...`. The existing **nominations** feature already implements the hard parts of a public file-submission flow:

- Two-phase upload: a `prepare*` server action validates input and returns Supabase **signed upload URLs** + an HMAC-signed **upload-session token**; the browser `PUT`s files directly to storage; a `submit*` server action verifies the token, persists the row, emails a confirmation, and cleans up orphaned objects on failure.
- Anti-spam via Cloudflare Turnstile (`verifyTurnstile`) + a hidden `company` honeypot.
- A private Supabase bucket accessed through `storageService` (service-role) with short-lived signed download URLs for admins.
- An admin module pattern: server-only `queries.ts`, server `actions.ts` guarded by `getCurrentAdminSession()`, list page with `FilterSelect`/`SearchInput`/`TablePagination`, and a detail page with row actions.

This change reuses that machinery for presentations. The form is simpler than nominations: 3 text fields + a single file, no award branching, no PDF page counting.

## Goals / Non-Goals

**Goals:**
- Public per-year form `/[year]/presentation-upload` (Paper Number, Title, Contact Email, single presentation file).
- Direct browser→Supabase upload to a new **private** `presentations` bucket; nothing large flows through a server action.
- Confirmation email to the contact email.
- Admin list/detail with signed-URL download, a Reviewed toggle, and delete (row + object).
- Reuse existing infrastructure; extract genuinely shared bits (Turnstile verify + widget) without changing nomination behavior.

**Non-Goals:**
- No multi-file / source-file / supplementary uploads (single presentation file only).
- No PDF page counting or content inspection.
- No public listing of submissions; no editing of a submission after it is sent.
- No new multi-state review workflow — a single boolean `Reviewed` toggle.

## Decisions

### Decision: Mirror the nominations two-phase signed-URL upload
**Why:** Files can be up to 50 MB; Next.js server actions cap request bodies (~1 MB by default), so streaming the file through `submitPresentation` is fragile. Signed URLs upload browser→storage directly and are already proven in this codebase.
**Alternatives considered:** (a) single server action receiving the file — rejected (body limits, server bandwidth); (b) a route handler accepting multipart — more code, still routes bytes through our server, and diverges from the existing pattern.

### Decision: New private bucket `presentations`, path `{year}/{presentationId}/{position}-{sanitized-filename}`
**Why:** Matches the nominations path scheme and keeps per-year/per-submission isolation. Private bucket + service-role + short-lived signed URLs keeps files non-public, as required.
**Alternatives considered:** reusing the `nominations` bucket — rejected (mixes unrelated data, complicates access rules and lifecycle).

### Decision: Store the file as discrete columns, not JSONB
**Why:** Exactly one file per submission, so `fileName`/`filePath`/`fileSize` columns are simpler to query and validate than the nominations JSONB `documents` map. Admin path validation is a direct `path === row.filePath` check.
**Alternatives considered:** JSONB `documents` map (nominations style) — unnecessary for a single file.

### Decision: HMAC upload-session token (presentation-local copy)
**Why:** Carries the server-approved file path + metadata between `prepare` and `submit` without trusting the client, signed with `BETTER_AUTH_SECRET`. A presentation-local `upload-session.ts` (single file, no `DocFieldKey`) is simpler than generalizing the nominations one.
**Alternatives considered:** server-side session store — heavier; stateless HMAC is sufficient and matches existing practice.

### Decision: Extract `verifyTurnstile` to `lib/security/turnstile.ts` and relocate `TurnstileWidget` to a shared component
**Why:** Both forms need identical CAPTCHA verification and widget; duplicating invites drift. Extraction is a pure-function move + import update with no behavior change to nominations.
**Alternatives considered:** copy into the presentation module — rejected (duplication); leave nominations untouched and only share for presentations — still leaves a duplicate verify implementation.

### Decision: Admin Reviewed status as boolean toggle mirroring `WinnerToggle`
**Why:** Matches existing admin UX (optimistic `useTransition` toggle + `router.refresh()`), minimal surface area.

## Risks / Trade-offs

- **Client-declared MIME/extension can be spoofed** → Validate extension + size on both client and server (in `prepare`, before any signed URL is issued); the bucket enforces a 50 MB size limit; files are private, download-only (Content-Disposition attachment), and never executed/served publicly. NOTE: a bucket MIME allow-list was intentionally NOT used — browsers report unreliable/empty MIME for `.ppt`/`.pptx`, so an allow-list rejects legitimate uploads (the proven nominations bucket has none); server-side extension validation is the authoritative type gate.
- **Orphaned objects if the browser uploads but never calls `submit`** → `submit` cleans up on validation/persist failure; a `discardPresentationUpload` action lets the client release a session on abandonment (as nominations does). Residual orphans are bounded by per-`{presentationId}` prefixes and can be swept later.
- **Bucket missing in an environment** → `prepare` surfaces a friendly error and logs; document the bucket as a required one-time ops step with exact settings.
- **Refactor touches nominations imports** → Keep the extraction to pure relocation; verify with typecheck/build and existing tests before merging.
- **Migration safety** → Generate with `pnpm db:generate` and review the SQL before `pnpm db:migrate`; the table is additive (no changes to existing tables), so rollback is a simple drop.

## Migration Plan

1. Add `db/schema/presentations.ts`, export from `db/schema/index.ts`.
2. `pnpm db:generate` → review generated SQL → `pnpm db:migrate`.
3. Create the private `presentations` Supabase bucket (50 MB limit, no MIME allow-list) — one-time ops step (`pnpm presentations:bucket`).
4. Deploy code. No data backfill. Rollback = remove nav item/routes and (optionally) drop the additive table.
