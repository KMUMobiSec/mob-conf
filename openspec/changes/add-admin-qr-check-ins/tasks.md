## 1. Dependencies and Environment

- [x] 1.1 Add QR, scanner, and CSV parsing dependencies (`qrcode`, `@zxing/browser`, `csv-parse`, plus types if required) and update `pnpm-lock.yaml`
- [x] 1.2 Document required environment variables for QR signing and realtime (`CHECK_IN_QR_SECRET`, public Supabase URL/anon key if not already documented)
- [x] 1.3 Add a browser-safe Supabase realtime client helper that never exposes the service-role key

## 2. Database and Schema

- [x] 2.1 Add a `registrations` Drizzle table with year, normalized email, name, optional affiliation, QR nonce, QR email tracking, check-in tracking, welcome email tracking, and timestamps
- [x] 2.2 Add indexes/constraints for selected-year reads, unique QR nonce, and one normalized email per year
- [x] 2.3 Export the registration schema from `db/schema/index.ts`
- [x] 2.4 Generate and apply the migration with `pnpm db:generate` and `pnpm db:migrate` (do not hand-write migration SQL)

## 3. Admin Year Context

- [x] 3.1 Create shared admin year parsing/link helpers that validate against `VALID_YEARS` and default to `CURRENT_YEAR`
- [x] 3.2 Update `AdminSidebar` to render a year selector and preserve the selected year in admin navigation links
- [x] 3.3 Add the QR Check Ins navigation item to the sidebar with an appropriate lucide icon and active state
- [x] 3.4 Update nominations list parsing and queries so nominations, pending winner counts, and winner notification actions default to the selected sidebar year
- [x] 3.5 Add/update unit tests for admin year parsing and nominations year scoping

## 4. Registration Backend

- [x] 4.1 Create `modules/admin/qr-check-ins/lib/qr.ts` for QR payload creation and verification using registration id, QR nonce, and `CHECK_IN_QR_SECRET`
- [x] 4.2 Create registration validators for manual form input and CSV rows using Zod
- [x] 4.3 Create server-only registration queries for list/search/filter by selected year and lookup by id/QR credential
- [x] 4.4 Create admin server actions for manual registration creation, CSV import/upsert, and registration list invalidation
- [x] 4.5 Ensure duplicate manual entries are rejected per year while CSV imports update existing name/affiliation without resetting QR/check-in/email state

## 5. Email Backend

- [x] 5.1 Create an MOBISEC-branded QR pass email template and sender that includes attendee name, selected year, venue/date context, and a button to the attendee's public QR pass page
- [x] 5.2 Create an MOBISEC-branded welcome email template and sender for successful first check-in
- [x] 5.3 Create admin server actions for single and bulk QR pass sends with per-registration success/failure results
- [x] 5.4 Record QR email sent timestamp/count only for successful sends; leave failed recipients eligible for retry
- [x] 5.5 Schedule welcome email sending after first check-in and record `welcomeEmailSentAt` only after successful send
- [x] 5.6 Create a public `/registration-pass/[id]` page that renders the attendee's QR code from the registration id

## 6. QR Check Ins Admin UI

- [x] 6.1 Add `/admin/qr-check-ins` as a protected admin route with Registrations and Check In tabs driven by the selected year
- [x] 6.2 Build the registrations table with name/email/affiliation, QR email state, check-in state, selected-year count, row checkboxes, multi-select, and select-all for the current result set
- [x] 6.3 Add a manual registration dialog wired to the create action with duplicate/error handling
- [x] 6.4 Add a CSV import control that uploads/parses CSV server-side and displays created/updated/invalid row counts
- [x] 6.5 Add single-send and bulk-send QR email controls with confirmation copy that distinguishes first sends from deliberate resends
- [x] 6.6 Build the scanner tab with camera scanning via `@zxing/browser`, clear success/error/already-checked-in states, and a manual QR payload fallback

## 7. Check-In and Realtime

- [x] 7.1 Create the `checkInRegistration({ year, qrPayload })` server action with admin auth, QR verification, selected-year enforcement, already-checked-in handling, and audit fields
- [x] 7.2 Publish successful first check-ins on the Supabase realtime channel named `check-ins` with selected year, registration id, and check-in timestamp
- [x] 7.3 Subscribe the registrations table to `check-ins` and refresh or patch rows only for events matching the selected year
- [x] 7.4 Ensure scanner repeats do not overwrite the original check-in time, send duplicate welcome emails, or publish duplicate realtime events

## 8. Verification

- [x] 8.1 Add unit tests for QR payload verification, invalid/tampered QR rejection, admin year parsing, and CSV row validation/upsert behavior
- [x] 8.2 Add focused tests for selection behavior where feasible (selected rows, select-all current result, year isolation)
- [x] 8.3 Run `pnpm typecheck`, `pnpm check`, and the relevant test suite
- [x] 8.4 Run `openspec validate "add-admin-qr-check-ins"` and confirm the change is valid/apply-ready
- [ ] 8.5 Manual verify with an admin session, Supabase realtime configured, and Resend configured: import CSV, manually add a registration, send QR email, scan QR, see table update through `check-ins`, confirm welcome email, and confirm other-year records stay hidden
