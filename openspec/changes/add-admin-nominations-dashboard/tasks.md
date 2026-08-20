## 1. Database — winner status

- [x] 1.1 Add `isWinner: boolean("is_winner").notNull().default(false)` to the `nominations` table in `db/schema/nominations.ts`
- [x] 1.2 Run `pnpm db:generate` then `pnpm db:migrate` to add the column (never hand-write migration SQL)

## 2. Admin sidebar shell

- [x] 2.1 Create `app/admin/(protected)/AdminSidebar.tsx` — shadcn `Sidebar` (`collapsible="icon"`) with brand header, a `SidebarMenu` containing one active-aware "Nominations" item (lucide icon) linking to `/admin/nominations`, and a `SidebarFooter` with the admin identity, `ModeToggle`, and `AdminSignOutButton`
- [x] 2.2 Rewrite `app/admin/(protected)/layout.tsx` (wrapped in `CookieProvider` so the sidebar's `useCookies` works) to wrap children in `SidebarProvider` + `<AdminSidebar session={…} />` + `SidebarInset`, with a slim top bar (`SidebarTrigger` + section title); keep `requireAdminSession()` gating
- [x] 2.3 Redirect `app/admin/(protected)/page.tsx` to `/admin/nominations`

## 3. Data access + admin actions

- [x] 3.1 Create `modules/admin/nominations/lib/queries.ts` (`server-only`) — `listNominations({ year, award, winner, q })` (Drizzle filters + `desc(createdAt)` + cap) and `getNomination(id)`
- [x] 3.2 Create `modules/admin/nominations/actions.ts` (`"use server"`) — `setNominationWinner(id, isWinner)`: re-verify admin session, update row, `revalidatePath` list + detail
- [x] 3.3 Add `getDocumentSignedUrl(path)` to the same actions file — re-verify admin session, confirm the path exists in some nomination's `documents`, return a short-lived signed URL via `storageService.createSignedUrl`

## 4. Nominations list page

- [x] 4.1 Create `app/admin/(protected)/nominations/page.tsx` (server) — read `searchParams` (year/award/winner/q), call `listNominations`, render header + filters + table
- [x] 4.2 Create the list UI (table with nominee/award/year/nominator/submitted/winner badge; rows link to detail) using shadcn `Table`/`Badge`, with filter controls (year + award `Select`, winner toggle) and a search input that updates the URL query
- [x] 4.3 Show an empty state when there are no nominations and a "showing first N" note when the cap is hit

## 5. Nomination detail page

- [x] 5.1 Create `app/admin/(protected)/nominations/[id]/page.tsx` (server) — `getNomination(id)` (`notFound()` if missing); render a back link + all answers (nominator, nominee, conditional fields, statement, consent, slide pages) in `Card` sections
- [x] 5.2 Create `DocumentLink` (client) — calls `getDocumentSignedUrl` on click and opens the URL in a new tab; render the documents list grouped by field with original name + size
- [x] 5.3 Create `WinnerToggle` (client) — shows winner state and calls `setNominationWinner` to mark/unmark winner; reflect pending/disabled state

## 6. Verification

- [x] 6.1 `pnpm typecheck` and `pnpm check` (Biome) pass for all new/changed files (typecheck clean; Biome clean; production build compiles all admin routes)
- [x] 6.2 Add unit tests — extracted `isKnownDocumentPath` (signed-URL path-membership) and `parseNominationListParams` (filter parsing); 8 new tests, full suite 55/55
- [ ] 6.3 Manual verify — smoke test done (all admin routes return 307→/admin/login unauthenticated, no 500s). REMAINING (needs an admin login + real data): sidebar render/collapse, list filters/search, detail answers, signed-URL document download, winner mark/unwinner persistence
- [x] 6.4 Run `openspec validate "add-admin-nominations-dashboard"` and confirm the change is apply-ready
