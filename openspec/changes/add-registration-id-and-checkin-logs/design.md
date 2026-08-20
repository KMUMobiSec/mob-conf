# Design notes

## ID number storage & identity

The participant number is **data on the registration**, not a new identity. Registrations remain keyed by `(year, email, name)` (see `registrations_year_email_name_idx`); `id_number` is a nullable integer carried alongside. This keeps dedupe/upsert untouched — a re-import that matches an existing person updates its `id_number` in place rather than creating a numbered duplicate.

`id_number` is **nullable** and intentionally **not unique**:
- Walk-ins and any registration not present on the official list stay `null` (rendered `—`).
- The reference list is authoritative for uniqueness; a DB unique constraint would turn a data-entry slip (two rows mapped to the same `No.`) into a hard import/backfill failure during a live event, which is the wrong trade-off. The backfill report surfaces collisions instead.

## Backfill matching

The reference CSV (`No., Name, Affiliation, E-mail, Backup Email, Status`) is matched to `year=2026` registrations using the **same** person-identity rules the importer already uses (`normalizePersonName`, `personDedupeKey`):
1. Row **with** an email → match the registration whose `(normalized email, normalized name)` equals the row's. This is the exact key the CSV import created rows under, so matches are precise.
2. Row **without** an email (e.g. `No.` 7, 18, 20) → match a **null-email** registration by normalized name for the year.

The script is **dry-run by default**: it prints how many rows matched, lists unmatched CSV rows (`No.` + name) and registrations that would remain without an ID, and only writes when passed `--apply`. Idempotent — re-running to `--apply` only sets rows whose `id_number` differs. This lets the maintainer eyeball the reconciliation against real data before committing, which matters because the DB is live during the event.

## Realtime: Postgres changes on the registrations table

> Updated 2026-07-07: the original broadcast approach never reached the browser (the server's
> `channel.send()` on an unsubscribed channel did not deliver), so realtime now uses Supabase
> **Postgres changes** on the `registrations` table — the mechanism enabled by toggling Realtime on
> the table in the Supabase dashboard.

Each client surface (`CheckInLogs`, `RegistrationTable`) subscribes to `postgres_changes` for
`public.registrations` filtered to `year=eq.<year>` and calls `router.refresh()` on any insert/update.
The server then re-runs its query (`listCheckInLogs` ordered `checked_in_at DESC`) and re-renders. The
DB write **is** the trigger: a scan sets `checked_in_at` (UPDATE) and a test-mode undo clears it
(UPDATE), both firing an event, so no server-side broadcast/publish is needed. Requires the table in
the `supabase_realtime` publication and RLS off (or a permissive policy) so the anon client receives
changes — both hold here.

## Scanner result

`CheckInRegistrationSuccessResult.registration` gains `idNumber: number | null`, populated from the registration row in both the fresh and already-checked-in branches. `ScannerTab` renders `formatIdNumber(idNumber)` as the dominant element on the result card (large, bold, `tabular-nums`) above the attendee name, shown only when a number exists so unmatched/walk-in scans degrade gracefully to the current name-only card.

## Non-goals

- No ID column added to the Registrations table view (kept to the scanner + Logs per product decision).
- No manual ID-number field in the Add/Edit dialogs (import + backfill are the assignment paths for now; the column accepts one if a future dialog sends it).
- No change to QR credential generation or the pass email/badge artwork.
