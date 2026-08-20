## 1. Dependencies, env, and database

- [x] 1.1 Add the `resend` dependency with `pnpm add resend`
- [x] 1.2 Document new env vars in `.env.example`: `RESEND_EMAIL_FROM_AWARDS`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (and note reuse of existing `RESEND_API_KEY`, Supabase, and `DATABASE_URL`)
- [x] 1.3 Create `db/schema/nominations.ts` — `nominations` pgTable: `id` (uuid PK, defaultRandom), `year` (integer, notNull), `award` (text), nominator fields (name/email/affiliation/relationship), nominee fields (name/email/affiliation/position/country), `degree`/`enrollment` (text, nullable), `statement` (text), `consent` (boolean), `documents` (jsonb), `slidePages` (integer, nullable), and the shared `createdAt`/`updatedAt` timestamps
- [x] 1.4 Export the new schema from `db/schema/index.ts`
- [x] 1.5 Run `pnpm db:generate` to produce the migration, then `pnpm db:migrate` to apply it (never hand-write migration SQL)

## 2. Shared domain: awards, constants, schema, helpers

- [x] 2.1 Create `modules/landing/nomination-form/lib/constants.ts` — award definitions with rule flags (`noSelfNomination`, `showsGradFields`, `requiresSupervisorLetter`, `requiresSlides`, `recommendsTeaching`), document-field config (key, label, accept, multiple, required-by-award), size cap (30 MB), MIME/extension allow-lists, and English copy strings
- [x] 2.2 Create `modules/landing/nomination-form/lib/pdf-pages.ts` — best-effort PDF page counter (latin1 `/Count` and `/Type /Page` scan) usable on client and server
- [x] 2.3 Create `modules/landing/nomination-form/lib/schema.ts` — a zod schema covering all field rules: required fields, email format, self-nomination block (Lecturer + Young Researcher), grad-only required fields, statement ≥ 40 chars, consent required; export inferred types and a pure `validateNomination(values, files, slidePages)` helper reused by client and server

## 3. UI components (shadcn + our tokens)

- [x] 3.1 Create `modules/landing/nomination-form/components/FileDropField.tsx` — shadcn-styled upload field (single/multiple), file list with size + remove, error + status text, using semantic tokens
- [x] 3.2 Create `modules/landing/nomination-form/components/NominationForm.tsx` (`"use client"`) — six-section form using `Field`/`Input`/`Textarea`/`Select`/`RadioGroup`/`Checkbox`/`Label`/`Button`/`Card`/`Badge`, controlled state, award-driven conditional sections (animated collapse), live char counter, on-blur/on-submit error display, disabled-until-valid submit; accepts `year` prop
- [x] 3.3 Add the Cloudflare Turnstile widget to the form (hosted script via `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and a visually-hidden honeypot input; include both in the submitted `FormData`
- [x] 3.4 Create `modules/landing/nomination-form/components/SuccessView.tsx` — recap screen (award, nominator, nominee, statement, document names, consent) + "Submit another nomination"
- [x] 3.5 Create `modules/landing/nomination-form/components/NominationFormPage.tsx` (server) — eyebrow/title/lede header referencing the route year, rendering `<NominationForm year={year} />`
- [x] 3.6 Map prototype tokens to our palette per design D10 (all rendering uses semantic tokens — `bg-card`/`text-foreground`/`bg-primary`/`border-border`/`text-destructive`/`bg-accent`, no hard-coded prototype colors), so light/dark/system follow the global theme switcher

## 4. Email (Resend)

- [x] 4.1 Create `lib/email/resend.ts` — lazily-initialized Resend client from `RESEND_API_KEY`
- [x] 4.2 Create `lib/email/nomination-confirmation.ts` — branded, inline-styled HTML recap template (forest-green header) and `sendNominationConfirmation()` that sends to the nominator from `RESEND_EMAIL_FROM_AWARDS`; recap only, no file links

## 5. Server action (submit pipeline)

- [x] 5.1 Create `modules/landing/nomination-form/actions.ts` (`"use server"`) — accept `FormData`, reject if honeypot is non-empty
- [x] 5.2 Verify the Turnstile token against Cloudflare `siteverify` with `TURNSTILE_SECRET_KEY`; reject before any upload/DB/email work
- [x] 5.3 Enforce server-side file metadata checks (30 MB cap, MIME/extension allow-list) and re-validate all fields with the shared zod schema; for Industry Pioneer, re-run the page counter after direct upload as a soft gate (`>5` rejects)
- [x] 5.4 Generate a `nominationId` (uuid); create signed upload URLs for each file at `${year}/${nominationId}/${fieldKey}/${safeName}` via `storageService` from `lib/services/storage.server.ts`; sign the approved upload plan for finalization
- [x] 5.5 Insert the `nominations` row after browser direct uploads complete (answers + route year + documents jsonb of `{path,name,size}` + `slidePages`) using `db` from `@/db`; on validation or insert failure, best-effort delete the uploaded objects and return a retryable error
- [x] 5.6 Send the confirmation email (non-fatal — log and continue on failure); return a typed success/error result to the client

## 6. Route wiring

- [x] 6.1 Create `app/[year]/(public)/nomination-form/page.tsx` (server) — validate the year against `VALID_YEARS` (404 otherwise), implement `generateMetadata` (title/description/canonical like sibling public pages), and render `NominationFormPage`
- [x] 6.2 Confirm the page inherits the public layout chrome (Navbar with `ModeToggle`/`LanguageToggle`, Footer) and the form is reachable at `/2025/nomination-form` and `/2026/nomination-form` (production build lists the route under the `(public)` segment for both valid years)

## 7. Verification

- [x] 7.1 `pnpm typecheck` and `pnpm check` (Biome) pass for all new/changed files (typecheck clean; Biome clean on 16 files; production build compiles the route)
- [x] 7.2 Add unit tests (Vitest) for `schema.ts` (self-nomination block, grad/industry conditionals, statement length, consent) and `pdf-pages.ts` (23 tests, all passing; full suite 44/44)
- [ ] 7.3 Manually verify end-to-end for one award per branch: validation gating, Turnstile, upload to bucket, `nominations` row with correct year + paths, and receipt of the confirmation email; verify light/dark/system rendering — REQUIRES live Turnstile/Supabase/Resend credentials + a browser; pending
- [x] 7.4 Run `openspec validate "add-nomination-form"` and confirm the change is apply-ready
