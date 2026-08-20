## Why

Conference staff need a reliable way to manage attendee registrations, issue per-attendee QR credentials, and verify arrivals at the venue. The admin area also needs a single year context so awards, registrations, and check-ins consistently show the selected EBISION year.

## What Changes

- Add an admin **QR Check Ins** area with separate **Registrations** and **Check In** tabs.
- Let administrators create registrations manually or import them from CSV with `email`, `name`, and optional `affiliation`.
- Generate one unique QR credential per registration immediately after creation/import.
- Let administrators email QR passes manually per attendee or in bulk using checkbox selection, including select-all for the current result set.
- Track QR email delivery state on each registration so staff can see whether the pass has been sent.
- Add a professional EBISION-branded QR email template consistent with the existing site palette.
- Add a scanner-focused check-in page that reads QR codes, verifies the registration, marks it checked in, and reflects the status in the registrations table.
- Publish check-in events through the Supabase realtime channel named `check-ins` so scanners and registration tables stay synchronized.
- Send a welcome email after successful check-in: welcoming the attendee to **EBISION `<selected year>`**.
- Add a year selector to the admin sidebar and make year-scoped admin data render from the selected year, including awards/nominations and the new registration/check-in data.

## Capabilities

### New Capabilities

- `admin-qr-check-ins`: Admin-managed registration records, QR generation, QR email sending/tracking, scanner-based check-in, realtime check-in updates, and post-check-in welcome emails.
- `admin-year-context`: A sidebar-level year selector that scopes year-specific admin sections and actions to the selected EBISION year.

### Modified Capabilities

- None.

## Impact

- **Admin routes:** add `/admin/qr-check-ins` with registration and scanner tabs; update admin navigation/sidebar to include QR Check Ins and the year selector.
- **Database:** add a registrations/check-ins table or equivalent Drizzle schema for year, attendee identity, QR token/hash, QR email timestamps/counts, check-in timestamps, and audit metadata; generate migrations with `pnpm db:generate` / `pnpm db:migrate`.
- **Email:** add branded QR pass and welcome email senders using the existing Resend integration.
- **CSV import:** add server-side CSV parsing and validation with duplicate handling per selected year.
- **QR:** add server-side QR credential generation and browser scanner support.
- **Realtime:** add a Supabase realtime publisher/subscriber path using channel `check-ins`.
- **Security:** keep all reads/actions admin-only; QR payloads must be opaque, unguessable credentials rather than plain attendee emails.
- **Out of scope:** public self-registration, payment integration, attendee self-service editing, badge printing, and importing from external registration platforms beyond CSV.
