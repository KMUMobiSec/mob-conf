## 1. Data layer

- [x] 1.1 Add `listRegistrationIdsForYear(year)` to `modules/admin/qr-check-ins/lib/queries.ts` returning all registration IDs for the year (createdAt desc, matching table order)

## 2. Server actions

- [x] 2.1 Add optional `throttleMs` param to `sendRegistrationQrPasses` in `modules/admin/qr-check-ins/actions.ts`; when `> 0`, await the delay before each `sendRegistrationPass` call (default `0` preserves current per-row/selected behavior)
- [x] 2.2 Add auth-gated server action `getRegistrationSendTargets(year)` that returns `{ ids: string[] }` (or `{ ok: false, error }`) via `listRegistrationIdsForYear`
- [x] 2.3 Export `SEND_THROTTLE_MS` and `SEND_CHUNK_SIZE` constants (or define them in the module) for reuse by the client

## 3. UI: Send to all

- [x] 3.1 Add a "Send to all" button to the `RegistrationTable` toolbar in `app/admin/(protected)/qr-check-ins/RegistrationTable.tsx`, alongside the existing per-row "Send" and "Send selected" (both unchanged)
- [x] 3.2 On click, fetch targets via `getRegistrationSendTargets(year)` and open a confirmation `AlertDialog` showing the recipient count and the re-send warning
- [x] 3.3 On confirm, chunk IDs by `SEND_CHUNK_SIZE` and call `sendRegistrationQrPasses({ year, ids, throttleMs: SEND_THROTTLE_MS })` per chunk, accumulating `sent`/`failures`
- [x] 3.4 Render `<Progress>` (`components/ui/progress.tsx`) with a live "Sending X of Y…" label; disable mutating actions while the run is in flight
- [x] 3.5 On completion, render the result summary (sent count, failed count, per-failure list with reasons)

## 4. Verification

- [ ] 4.1 Run typecheck / lint (`pnpm typecheck`, `pnpm lint` or repo equivalents) and fix any issues
- [ ] 4.2 Drive the flow in the running app: confirm the count is correct, the progress bar advances, throttling paces sends, and the summary reports sent/failed accurately
