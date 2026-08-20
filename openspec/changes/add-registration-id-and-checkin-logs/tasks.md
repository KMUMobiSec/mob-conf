## 1. Schema & migration

- [x] 1.1 Add nullable `idNumber: integer("id_number")` to `registrations` in `db/schema/registrations.ts`
- [x] 1.2 `pnpm db:generate` → `db/migrations/0015_furry_cargill.sql` (`ALTER TABLE "registrations" ADD COLUMN "id_number" integer`). **Operator step:** `pnpm db:migrate` against the live DB.

## 2. ID number format helper

- [x] 2.1 `modules/admin/qr-check-ins/lib/format.ts`: `formatIdNumber(n: number): string` → zero-padded 3-digit (`012`); handle 4+ digit numbers without truncation

## 3. Importer supports the `No.` column

- [x] 3.1 `registration-input.ts`: add optional `idNumber: number | null` to `RegistrationInput`/`RegistrationCsvRow`; zod parses `no`/`id` (blank → null, must be a positive integer)
- [x] 3.2 `actions.ts` `importRegistrations`: set `id_number` on insert and on the update branch (update only overwrites when the row carries a number, so a numberless re-import never wipes a backfilled value); manual create/update leave `id_number` untouched
- [x] 3.3 Keep dedupe unchanged (identity is still email+name); `No.` is data carried on the surviving row
- [x] 3.4 Read the address from `email` **or** `e-mail` so the official list ("E-mail" header) upserts by (email, name) instead of importing anonymous duplicates (review finding)

## 4. One-time backfill

- [x] 4.1 `scripts/backfill-registration-ids.ts`: parse the reference CSV (`No.`, `Name`, `E-mail`); match `year=2026` registrations by `(email, name)` then name-only for blank-email rows via `personDedupeKey`/`normalizePersonName`; dry-run by default, `--apply` to write; print matched count, unmatched CSV rows, registrations left without an ID, and collisions (refuses to `--apply` on collision)
- [x] 4.2 `package.json`: `"registrations:backfill-ids": "tsx scripts/backfill-registration-ids.ts"`
- [ ] 4.3 **Operator step:** run `pnpm registrations:backfill-ids` (dry run), review the report, then `pnpm registrations:backfill-ids --apply`

## 5. Scanner success shows the big ID

- [x] 5.1 `check-in-result.ts`: add `idNumber: number | null` to the success `registration`; builders accept it
- [x] 5.2 `actions.ts` `checkInRegistration`: pass `idNumber: registration.idNumber` into both result builders; include `idNumber` in the broadcast payload
- [x] 5.3 `ScannerTab.tsx`: on success + already-checked-in, render `formatIdNumber` large + emphasized (`tabular-nums`, `text-7xl`/`8xl` bold) above the name, only when `idNumber != null`; ID also announced via `aria-label`

## 6. Realtime Logs tab

- [x] 6.1 `lib/queries.ts` `listCheckInLogs({ year, page, pageSize })`: registrations with `checkedInAt` not null for the year, `orderBy desc(checkedInAt)`, paginated; returns id, idNumber, name, affiliation, checkedInAt, checkedInBy + total
- [x] 6.2 `page.tsx`: add `"logs"` to the `Tab` union + a third tab button; when `tab === "logs"` fetch the logs and render `CheckInLogs`
- [x] 6.3 `CheckInLogs.tsx` (client): render each entry (big zero-padded ID · name + affiliation · "Scanned by {checkedInBy}" · formatted time), newest first, paginated via `TablePagination`; subscribe to the `check-ins` broadcast and `router.refresh()` on a matching-year `checked-in` event; empty state when no check-ins
- [x] 6.4 `actions.ts` `uncheckInRegistration`: publish a `checked-in` broadcast after clearing, so the feed refreshes on undo

## 7. Tests & verify

- [x] 7.1 `registration-input` test: `No.`/`id` column parsed to `idNumber`; blank/invalid → null / row error; `E-mail` header read
- [x] 7.2 `check-in-result` test: `idNumber` present on checked-in + already-checked-in results (+ null path)
- [x] 7.3 `format` test: `formatIdNumber` zero-pads 1/12/200 → `001`/`012`/`200`, leaves 4-digit intact
- [ ] 7.4 `listCheckInLogs` newest-first ordering — covered by the `desc(checkedInAt)` query; not unit-tested (no DB harness in the suite), guaranteed by SQL + review
- [x] 7.5 `pnpm check` clean; `pnpm vitest run __tests__/admin-qr-check-ins` green (38); `pnpm typecheck` clean except a pre-existing stale `.next/types` route error unrelated to this change
