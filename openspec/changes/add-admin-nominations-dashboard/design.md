## Context

The admin area already exists: `app/admin/(protected)/` is gated by `requireAdminSession()` (Better Auth, `role === "admin"`), with `AdminSignOutButton` and a top-header layout that just shows the admin's name + sign out. The protected page is a stub. The public nomination form persists submissions to the `nominations` Drizzle table and uploads documents to a **private** Supabase `nominations` bucket (paths stored in a `documents` jsonb column). The repo ships the full shadcn `Sidebar` primitive (`SidebarProvider`, `Sidebar`, `SidebarInset`, header/content/footer/menu) and a generic storage service with `createSignedUrl`. The whole app is token-themed with a working `ModeToggle`.

## Goals / Non-Goals

**Goals:**
- A sleek, collapsible sidebar admin shell with one item (Nominations), good spacing and icons, identity + theme toggle + sign out.
- Browse all nominations (filter by year/award/winner, search), open a full detail page per nomination.
- Securely download each document from the private bucket.
- Mark/unmark a nomination as a **winner** (boolean), with multiple winners per award allowed.
- Keep everything admin-only and read-mostly.

**Non-Goals:**
- Deleting or editing nominations; CSV export; bulk actions; nominee emails; a second admin section; pagination beyond a simple cap; any change to the public form.

## Decisions

### D1 — Sidebar shell replaces the header
`app/admin/(protected)/layout.tsx` wraps children in `SidebarProvider` + a `Sidebar` + `SidebarInset`. The `Sidebar` has: a header with an MOBISEC/Admin brand, a `SidebarMenu` with one active-aware `SidebarMenuButton` linking to `/admin/nominations` (Trophy/Award icon), and a `SidebarFooter` with the admin identity, the existing `ModeToggle`, and `AdminSignOutButton`. `collapsible="icon"` for a sleek collapse. The inset holds a slim top bar (`SidebarTrigger` + page title) and the page content.
- *Alternative considered:* keep the header and add tabs. Rejected — the user explicitly wants a sidebar, and it scales to future admin items.

### D2 — Routes & navigation
- `/admin` (`page.tsx`) → `redirect("/admin/nominations")`.
- `/admin/nominations/page.tsx` — server component; reads filters from `searchParams` (`year`, `award`, `winner`, `q`), queries the DB, renders the table.
- `/admin/nominations/[id]/page.tsx` — server component; loads one nomination (`notFound()` if missing) and renders answers + documents + the winner toggle.

### D3 — Data access (server, read)
Query with Drizzle: `db.select().from(nominations)` filtered by `eq(year)`, `eq(award)`, `eq(isWinner, true)` and an `ilike` OR across nominee/nominator name+email for search, ordered `desc(createdAt)`, capped (e.g. 200) with a "showing N" note if truncated. The list shows: nominee, award, year, nominator, submitted date, winner badge.

### D4 — Winner status (schema + toggle)
Add `isWinner: boolean("is_winner").notNull().default(false)` to the `nominations` table; generate the migration with `pnpm db:generate` then `pnpm db:migrate` (no manual SQL). Multiple winners per award are allowed — **no** unique constraint. A `"use server"` action `setNominationWinner(id, isWinner)` updates the row and `revalidatePath`s the list + detail. The detail page renders a toggle (mark winner / unwinner) wired to the action.
- *Alternative considered:* an enum `status` column. Rejected — the user wants exactly one binary state (winner), so a boolean is simplest and supports multiple winners cleanly.

### D5 — Secure document access (signed URLs)
The bucket is private, so a `"use server"` action `getDocumentSignedUrl(path)` validates the admin session, confirms the path belongs to a stored nomination document, and returns a short-lived signed URL (~300s) via `storageService.createSignedUrl`. A small client `DocumentLink` calls the action on click and opens the URL in a new tab — always fresh, never expired in a long-open page.
- *Alternative considered:* render signed URLs at page load. Rejected — they expire while the page sits open. *Alternative:* a streaming route handler. Rejected — more surface area than needed.

### D6 — Authorization defense-in-depth
The `(protected)` layout already calls `requireAdminSession()`. Every admin **server action** (`setNominationWinner`, `getDocumentSignedUrl`) independently re-checks the admin session and rejects non-admins — actions are not protected by layouts. The signed-URL action also verifies the requested path actually exists in some nomination's `documents` (no arbitrary bucket reads).

### D7 — Theming
Admin reuses semantic tokens + the existing `ModeToggle` in the sidebar footer, so light/dark/system work in the dashboard too.

## Risks / Trade-offs

- **Signed URLs leak if shared** → keep expiry short (~5 min) and generate on demand; never embed long-lived links.
- **Action authorization** (actions bypass layouts) → every action re-verifies the admin session before any DB/storage work.
- **Arbitrary path access via the signed-URL action** → validate the requested path against stored `documents` before signing.
- **Large nomination volume** → cap the list query and show a "showing first N" note; real pagination is a future change.
- **Migration safety** → additive nullable-with-default column; generated via drizzle-kit, applied with `pnpm db:migrate`.

## Migration Plan

1. Add `isWinner` to `db/schema/nominations.ts`.
2. `pnpm db:generate` then `pnpm db:migrate` (no manual SQL).
3. Ship the sidebar shell + list + detail + actions.
- **Rollback:** additive only — revert the routes/layout and drop the unused `is_winner` column; the public form and auth are untouched.

## Open Questions

- None blocking. Future, out of scope now: CSV export, review notes/timestamps, "download all" zip, pagination, and additional admin sections.
