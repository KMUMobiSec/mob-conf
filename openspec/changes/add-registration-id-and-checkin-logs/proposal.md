## Why

Each MOBISEC participant has a printed badge/ID number (the `No.` column of the official participant list, 1–200 for 2026). At the desk, when a badge is scanned the staffer needs to know **which numbered ID to hand the attendee**, and organizers want a live, auditable record of who checked in, in what order, and **which account scanned them**. Today the check-in surface shows names only, has no participant number anywhere, and offers no running log — so there is no way to reconcile the physical numbered IDs against check-ins, and no at-a-glance feed of arrivals.

## What Changes

- New **participant ID number** on registrations, sourced from the participant-list `No.` column and persisted per registration (`registrations.id_number`, nullable — walk-ins / unmatched stay blank).
- **One-time backfill** of the 2026 registrations from the reference CSV, matching by email (falling back to name for blank-email rows), with a reconciliation report and a safe dry-run default.
- The **CSV importer learns the `No.` column**, so future re-imports carry the ID number forward instead of dropping it.
- The full-screen **scanner success screen shows the ID number large and emphasized** (zero-padded, e.g. `012`) on both a fresh check-in and an already-checked-in result, so the staffer knows which numbered ID to give out.
- A new **Logs tab** on `/admin/qr-check-ins` — a realtime feed of check-ins ordered **newest first**, each row showing the **emphasized ID number**, name + affiliation, the **account that scanned it** ("Scanned by …"), and the check-in time. It updates live using the **existing** Supabase broadcast channel (`check-ins`, event `checked-in`) already emitted on every scan; the test-mode undo now emits the same event so removals also drop from the feed.

## Capabilities

### Modified Capabilities
- `qr-check-in-registrations` (extended): participant ID numbers (storage, backfill, import), the ID number on the scanner result, and the realtime check-in Logs feed.

<!-- qr-check-in-registrations exists only as change-scoped specs (add-admin-qr-check-ins, nullable-registration-email, checkin-test-mode), not yet archived under openspec/specs/, so these requirements are ADDED here rather than as MODIFIED deltas. -->

## Impact

- **Schema / migration:** add nullable `id_number` integer to `db/schema/registrations.ts`; generated Drizzle migration via `pnpm db:generate` / `pnpm db:migrate` (never hand-written). Purely additive — no ordering hazard.
- **Backfill (ops):** new `scripts/backfill-registration-ids.ts` + `registrations:backfill-ids` package script. Dry-run by default (prints matched / unmatched report); `--apply` to commit. Matches CSV rows to `year=2026` registrations via the shared person-identity rules.
- **Importer:** `modules/admin/qr-check-ins/lib/registration-input.ts` parses an optional `no`/`id` column; `importRegistrations` sets `id_number` on insert and update.
- **Check-in result:** `modules/admin/qr-check-ins/lib/check-in-result.ts` + `checkInRegistration` carry `idNumber` into the scan result; new `lib/format.ts` `formatIdNumber` (zero-pad) helper.
- **UI:** `qr-check-ins/page.tsx` (new Logs tab + query wiring), `ScannerTab.tsx` (big ID on result), new `CheckInLogs.tsx` (realtime feed). New `listCheckInLogs` query in `lib/queries.ts`. `uncheckInRegistration` emits a `checked-in` broadcast so the feed refreshes on undo.
- **No new realtime infrastructure:** reuses the existing broadcast channel and the `router.refresh()` pattern already used by `RegistrationTable`; no Postgres logical replication or RLS changes.
