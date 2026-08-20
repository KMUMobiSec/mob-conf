## 1. Program data

- [x] 1.1 Create `data/2026/admin-program.csv` (17-column format) with **all three days** transcribed — July 8 (21 talks), July 9 (17 talks incl. an empty 16:20–18:00 Poster Session block), July 10 (23 talks). 19 sessions total.

## 2. Schedule parsing (shared, server-side)

- [x] 2.1 `modules/admin/presentations/lib/schedule.ts`: `parseAdminSchedule(csv)` → Day → `TimeSlot` → `AdminSession(room)` → `Paper[]` (reuses `Paper` from `types/conference-schedule.ts`)
- [x] 2.2 `loadAdminSchedule(year)` reads + parses the file via `fs` (returns `null` when absent)

## 3. Fuzzy title matching

- [x] 3.1 `lib/match.ts`: `normalizeTitle`, Levenshtein-based `titleSimilarity`, tunable `TITLE_MATCH_THRESHOLD` (0.85)
- [x] 3.2 `listPresentationsForMatching(year)` in `queries.ts` (id, title, videoUrl, materials[], video)
- [x] 3.3 `bestTitleMatch(paperTitle, items, getTitle)` → best ≥ threshold or null
- [x] 3.4 Unit tests for normalize/similarity/best-match (exact, near-miss above, reworded below)

## 4. Program View UI

- [x] 4.1 `ProgramView` server component: day → slot → session(room) → talk rows (time · authors · title, presenter when present)
- [x] 4.2 Inline downloads per matched talk (reuse `PresentationFileLink` per material + video download/link); title-only when unmatched
- [x] 4.3 Empty state when the year has no program data
- [x] 4.4 Per-talk **View** link (matched talks) to the submission detail page, like the table's View
- [x] 4.5 Distinct session headers: gradient bar + left accent, time pill, prominent title, room pill; empty sessions (poster) render as a header-only card
- [x] 4.6 Day tabs (one per day, e.g. "Wednesday · Jul 8") — `ProgramView` is a client component using the `Tabs` primitive; `queries`/`schedule` are `import type` only so no server-only code reaches the client bundle

## 5. View toggle on the list page

- [x] 5.1 `page.tsx` reads `?view=`, renders a Table/Program toggle; Table keeps filters + table, Program renders `ProgramView` with schedule + matches loaded server-side

## 6. Edit submission

- [x] 6.1 `updatePresentation(id, {...})` in `actions.ts`: admin-guarded, validated (non-empty paperNumber/title, valid email, optional https videoUrl), sets `updatedAt`, revalidates; ignores videoUrl when an uploaded video exists
- [x] 6.2 `EditPresentationDialog` (client) with the four fields + Save/Cancel; video link disabled when an uploaded video exists
- [x] 6.3 Wired into the detail page (edit button in the Submission card header)

## 7b. Shared schedule + public program-flow (follow-up)

- [x] 7b.1 Move the CSV parser/loader to a neutral shared `lib/program/schedule.ts` (types `Program*`, `loadProgramSchedule`), sorting time slots chronologically; delete the admin-scoped copy and point the admin Program View at it
- [x] 7b.2 Rename the data file `data/2026/admin-program.csv` → `data/2026/program.csv` (now shared by admin + public); add break/lunch/ceremony/social/meeting/assembly rows from `program-flow.json` so the timeline is complete
- [x] 7b.3 Rewrite `modules/landing/program-flow/components/ScheduleTabs.tsx` to render the detailed schedule (day tabs → timeline of sessions with nested talks + breaks) from the CSV; wire `ProgramFlowPage` to `loadProgramSchedule(year)`. Note: this makes the full talk-level 2026 schedule public. Admin Program View filters to talk-bearing sessions (hides breaks).

## 7. Verification

- [x] 7.1 `pnpm typecheck`, `pnpm check`, `pnpm test:ci` (137 tests) and `pnpm build` all pass
- [x] 7.2 Verified matching end-to-end against real data: July 8 talks for papers 99 & 15 match at 1.00; drifted titles (e.g. paper 20) correctly do not match. **UI click-through** (viewing the grid, running the edit dialog) remains to be done in a running admin session.
