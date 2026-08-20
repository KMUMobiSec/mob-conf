## Context

The QR check-in admin (`app/admin/(protected)/qr-check-ins/RegistrationTable.tsx`) can send a registration QR pass per-row or for the current selection. Selection is bounded to the 20 rows rendered on the current page (`DEFAULT_PAGE_SIZE = 20`), so emailing an entire year means paging and re-clicking.

The server action `sendRegistrationQrPasses({ year, ids })` already accepts an arbitrary list of IDs, loops them sequentially, sends one Resend email per registration via `sendRegistrationPass(...)`, and stamps `qrEmailSentAt` / incremented `qrEmailSentCount` on each row (skipping tracking in test mode). It returns `{ ok, sent, failures }`. There is an unused `components/ui/progress.tsx` (Radix progress) and a Supabase `postgres_changes` subscription on `registrations` that already re-renders the table live on row updates.

## Goals / Non-Goals

**Goals:**
- One "Send to all" action that emails a QR pass to every registration for the selected year.
- Semantics: whole year, ignore the active search/check-in filter, re-send to everyone (no skip-already-sent).
- A live progress bar during the send and an aggregated result summary at the end.
- Throttle sends to respect the email provider's (Resend) rate limit.
- No schema change; reuse the existing send action and tracking columns.

**Non-Goals:**
- Skip-already-sent / "send to remaining" mode (explicitly declined).
- Respecting the current search/check-in filter for the bulk action.
- Streaming/SSE infrastructure or a persisted background-job model.
- Changing per-row "Send" / "Send selected" behavior.

## Decisions

### 1. Progress via client-side chunking (not SSE, not one big call)
The client fetches all target IDs for the year, splits them into small chunks, and calls the existing `sendRegistrationQrPasses({ year, ids, throttleMs })` once per chunk, advancing `<Progress>` and accumulating `sent`/`failures` between calls.

- **Why over one big server call:** a single call for hundreds of recipients cannot report incremental progress and would risk the serverless function timeout. Chunking makes each request short and gives a natural progress tick.
- **Why over SSE/streaming:** no streaming infra exists; server actions don't stream cleanly. Chunking reuses the existing action untouched and needs zero new infra.
- **Why not rely solely on Supabase realtime for progress:** the realtime subscription fires per-row `router.refresh()`, which is coarse and refetch-heavy for a live counter. The client already knows exactly how many chunks it has sent, giving an accurate bar for free. Realtime still updates the table's sent counts as a bonus.

### 2. Throttling lives server-side, applied per send
Add an optional `throttleMs` parameter to `sendRegistrationQrPasses`. When `> 0`, the loop awaits `throttleMs` before each `sendRegistrationPass` call. The bulk flow passes `SEND_THROTTLE_MS` (~550ms, ≈ under Resend's default 2 req/s); per-row and "Send selected" pass nothing (default `0`, preserving current snappy behavior).

- **Why server-side, per send:** the Resend burst happens inside the loop. Throttling there guarantees global spacing regardless of chunk size — even a large chunk stays within the rate limit. Client-side inter-chunk delay alone wouldn't throttle the burst *inside* a chunk.
- **Rate/chunk sizing:** `SEND_THROTTLE_MS ≈ 550ms` keeps the global rate under ~2/s. `CHUNK_SIZE ≈ 8` keeps each chunk's wall time (≈ 8 × 550ms ≈ 4.4s plus send latency) comfortably under a 10s serverless function limit, while still ticking the progress bar every few seconds. Both are named constants so they're trivially tunable if the Resend plan allows a higher limit.

### 3. Target set: all IDs for the year via a new query
Add `listRegistrationIdsForYear(year)` returning every registration ID for the year (createdAt desc, matching the table's order). A new auth-gated server action `getRegistrationSendTargets(year)` wraps it so the client can size the confirmation count and the progress total. Registrations without an email are handled by the existing action's per-row "No email on file" failure path (reported in the summary, not silently dropped).

### 4. UI flow
"Send to all" button → confirmation `AlertDialog` (reusing the email-blast confirm pattern) showing the real count and the re-send warning → on confirm, dialog shows the `<Progress>` bar with a live "Sending X of Y…" label → on completion, shows the summary (`sent`, `failed`, per-failure list). Buttons that mutate are disabled while a send is in flight.

## Risks / Trade-offs

- **[Serverless timeout on a chunk]** → Chunk wall time is bounded by `CHUNK_SIZE × SEND_THROTTLE_MS` (~4.4s), well under typical limits; constants are tunable if the deployment's function limit differs.
- **[Resend rate-limit assumption]** → `SEND_THROTTLE_MS` is set for the documented 2 req/s default and centralized as one constant; if 429s still occur, raise it (or add retry) without touching call sites.
- **[Client navigates away mid-send]** → Already-sent chunks are committed server-side (tracking stamped) and idempotent to re-run, so a re-send simply re-emails; no partial-state corruption. The progress bar is best-effort UI, not the source of truth.
- **[No cancel]** → v1 has no mid-run cancel. Acceptable; closing the tab stops further chunks. Can be added later since each chunk is an independent request.
- **[Duplicate emails by design]** → Re-send-to-everyone can email people twice if run repeatedly; the confirmation dialog's count + warning is the guard.
