## Why

Organizers need to see uploaded presentations in the context of the actual conference program — which talk is in which session/room/slot, and whether its files have arrived — rather than as a flat table. They also need to correct submission details (especially a title that differs from the printed program) so uploads line up with the schedule.

## What Changes

- Add a **Program View** to `/admin/presentations`: a schedule grid (toggled via a `?view=` param, alongside the existing **Table** view) that lays out the conference program by day → time slot → session/room → talks, and renders each matched submission's **download buttons inline in the talk cell**. Talks with no matching upload show the title only.
- Match uploads to talks by **fuzzy title similarity** (normalized, ~90% threshold) — no paper numbers or manual mapping.
- Add an **admin-only program data file** `data/2026/admin-program.csv` (existing 17-column program format), read **server-side** so it never appears on the public `/2026/program` page. July 8 is transcribed now; July 9–10 added later.
- Add **Edit submission** on the detail page: an admin can edit `paperNumber`, `title`, `contactEmail`, and the external video link. Primary use: fix a title so it matches the program. Editing/adding/removing files is **out of scope**.

## Capabilities

### New Capabilities
<!-- None: this extends the existing admin-presentations capability. -->

### Modified Capabilities
- `admin-presentations`: Adds a Program View (schedule grid with fuzzy-title-matched inline downloads) alongside the existing table, and the ability to edit a submission's text details (paper number, title, contact email, video link).

## Impact

- **New code:** admin Program View components (grid + talk cell); a shared server-side CSV→schedule parser (`lib` reusing `types/conference-schedule.ts`); a normalized fuzzy-title matching helper; an `EditPresentation` dialog/form component; the data file `data/2026/admin-program.csv`.
- **Modified code:** `app/admin/(protected)/presentations/page.tsx` (view toggle + Program View), `app/admin/(protected)/presentations/[id]/page.tsx` (edit affordance), `modules/admin/presentations/actions.ts` (`updatePresentation`), `modules/admin/presentations/lib/queries.ts` (schedule load + matching).
- **Reused:** `PresentationFileLink`, `types/conference-schedule.ts`, existing admin session/auth guards.
- **Database:** none (no schema changes).
- **Public surface:** none — the program CSV lives under `data/` and is read server-side only.
