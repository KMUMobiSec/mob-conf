## Context

`/admin/presentations` today is a filterable table (`page.tsx` → `listPresentations`) with a detail page per submission. Presentations store `paperNumber`, `title`, `contactEmail`, `videoUrl`, and files in `presentation_files`. The repo already has a detailed schedule model (`types/conference-schedule.ts`: `ConferenceSchedule` → `ConferenceDay` → `TimeSlot` → `Session` → `Paper`) and a public `ScheduleGrid` fed by a client-side fetch of `/data/{year}/ebision-table.csv`. No 2026 program CSV exists yet.

Organizers want to view uploads against the real program and to fix mismatched titles.

## Goals / Non-Goals

**Goals:**
- A schedule-grid Program View on `/admin/presentations` with per-talk inline download controls.
- Fuzzy-title matching of uploads to talks (no paper numbers, no manual mapping).
- Keep the program data private (admin-only), not on the public program page.
- Let admins edit a submission's text details (notably the title).

**Non-Goals:**
- Publishing the 2026 program publicly (data stays under `data/`, read server-side).
- Editing, adding, or removing uploaded files from the admin UI.
- Changing the public program page or its CSV pipeline.
- Any DB schema change.

## Decisions

### D1: Admin-only CSV read server-side
Store the program at `data/2026/admin-program.csv` (17-column format) and read it with `fs` in a server component / server helper.

- *Why:* The public grid fetches from `public/` over HTTP; placing the file under `data/` keeps it off the public route while reusing the familiar CSV shape. Server-side read means no public exposure.
- *Alternatives:* Put it in `public/` (would light up the public program page — rejected per requirement); a DB table (overkill for a hand-maintained program).

### D2: Shared server-side parser, reuse schedule types
Extract a small CSV→`ConferenceSchedule` parser into a shared lib and reuse `Session`/`Paper`/`TimeSlot`/`ConferenceDay` from `types/conference-schedule.ts`.

- *Why:* One schedule model across the app; the admin grid consumes the same typed structure. The existing parser is entangled in a client component (`ProgramPage.tsx`) with i18n/filters, so a lean server parser avoids that coupling.
- *Alternatives:* Import the client parser directly (drags in client-only concerns); invent a new admin-specific type (duplicates the model).

### D3: Fuzzy title matching, server-side, best-match per talk
Normalize titles (lowercase, strip punctuation, collapse whitespace) and score similarity with a normalized ratio (Levenshtein-based). For each talk, attach the single best-matching presentation when its score ≥ a tunable constant (~0.9).

- *Why:* Titles are the only shared field and sometimes drift; a threshold tolerates minor edits while ignoring genuinely different talks. Best-match-per-talk avoids a loose title matching many cells.
- *Trade-off:* Titles that drift beyond the threshold won't match (accepted — admins can fix the title via Edit). A presentation could in principle match two similar talks; acceptable for an admin aid.
- *Alternatives:* Exact-title only (misses trailing punctuation/case — too brittle); paper-number key (program has none); manual mapping UI (more state + clicks, rejected).

### D4: View toggle via search param
Switch Table/Program with `?view=program` (server-rendered, no client state), consistent with the page's existing searchParam-driven filters. Table remains the default and keeps search/year/reviewed; Program uses the year only.

- *Why:* Matches the current server-component + searchParams pattern; shareable URLs; no added client state.

### D5: Edit via server action + dialog
Add `updatePresentation(id, { paperNumber, title, contactEmail, videoUrl })`, admin-guarded, validated (non-empty paperNumber/title, valid email, optional https videoUrl), updates the row + `updatedAt`, and `revalidatePath`s the detail and list. UI is a client edit dialog on the detail page, consistent with `DeletePresentationDialog`.

- *Why:* Mirrors existing admin action/component patterns (`setPresentationReviewed`, `DeletePresentationDialog`). `videoUrl` is editable only when no uploaded video exists, preserving the upload-XOR-link invariant.

## Risks / Trade-offs

- **False matches / misses from fuzzy titles** → Threshold is a named constant; admins can correct a title via Edit to force a match. Best-match-per-talk limits fan-out.
- **CSV transcription errors** (hand-entered program) → Keep the CSV in the repo for review; the grid renders exactly what's in the file, so errors are visible and correctable.
- **Editing a title changes matching** → Expected and desired; after an edit, the Program View reflects the new match on next load (paths are revalidated).
- **Video link vs uploaded video** → Edit disables the link field when an uploaded video exists, so the XOR invariant can't be violated from the admin form.

## Migration Plan

No migrations. Add the data file + code and deploy. Rollback = revert the code and remove the CSV; no data changes.

## Open Questions

- Fuzzy threshold exact value (start ~0.9, tune against the real July 8–10 program once matches are observed).
