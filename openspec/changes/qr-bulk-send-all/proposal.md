## Why

In the QR check-in admin, sending registration QR passes is limited to the 20 rows on the current page ("Send selected" only acts on the visible page). Emailing everyone means paging through results and re-clicking on each page — a slow, error-prone chore for events with hundreds of registrations. Admins need a single action that sends to the entire year with visible progress.

## What Changes

- Add a **"Send to all"** button to the QR check-in registrations toolbar that emails a QR pass to **every registration for the selected year** that has an email address.
- Semantics: targets the **whole year regardless of the active search/check-in filter**, and **re-sends to everyone** including registrations already emailed (no skip-already-sent).
- Add a **confirmation dialog** showing the real recipient count before sending, warning that already-emailed people will receive the pass again.
- Add a **progress bar** that updates live as the send proceeds, followed by a **result summary** (sent count, failure count, and per-failure detail) reusing the existing send-result shape.
- Add **throttling** so the whole-year send stays within the email provider's (Resend) rate limits, replacing the current unthrottled sequential loop's behavior for large runs.
- Keep the existing per-row "Send" and "Send selected" buttons unchanged.

No database schema change: the existing `qrEmailSentAt` / `qrEmailSentCount` tracking columns are reused, and re-sending simply re-stamps them.

## Capabilities

### New Capabilities
- `qr-pass-bulk-send`: Bulk delivery of registration QR passes to all registrations for a year, with recipient-count confirmation, live progress, throttled sending, and an aggregated result summary.

### Modified Capabilities
<!-- None: no existing spec covers QR pass sending; this introduces the first spec for it. -->

## Impact

- **UI**: `app/admin/(protected)/qr-check-ins/RegistrationTable.tsx` — new "Send to all" button, confirmation dialog, progress bar (`components/ui/progress.tsx`, currently unused), chunked send loop, and result summary state.
- **Server actions**: `modules/admin/qr-check-ins/actions.ts` — new auth-gated action to fetch all send targets (IDs) for a year; the existing `sendRegistrationQrPasses({ year, ids })` action is reused per chunk (optionally given a throttle delay).
- **Queries**: `modules/admin/qr-check-ins/lib/queries.ts` — new `listRegistrationIdsForYear(year)` returning all registration IDs for a year.
- **Email**: relies on existing Resend integration (`lib/email/registration-check-in.ts`); adds inter-chunk throttling to respect provider rate limits.
- **Realtime**: no new infra — existing Supabase `postgres_changes` subscription on `registrations` already reflects per-row updates live.
