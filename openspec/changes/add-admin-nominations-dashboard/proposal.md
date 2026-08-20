## Why

Award nominations are now collected and stored, but administrators have no way to review them. The existing admin area is only a stub shell with a top header. Admins need an authenticated dashboard to read every submission and its answers, download the attached documents, and record which nominees win.

## What Changes

- Replace the admin shell's **top header** with a sleek, collapsible **sidebar** (shadcn `Sidebar`) — generous spacing, icons, an identity/footer area with theme toggle + sign out. For now it has a **single** navigation item: **Nominations**.
- Redirect `/admin` to `/admin/nominations` (the only section).
- Add **`/admin/nominations`** — a list/table of nominations with filters (year, award, winner) and search (nominee/nominator), newest first; each row opens the detail page.
- Add **`/admin/nominations/[id]`** — a dedicated detail page showing every answer (nominator, nominee, conditional fields, statement, consent, slide pages) and **per-file secure download links**.
- Add a **winner status**: a boolean on each nomination that admins can toggle on and off ("mark winner" / "unwinner"). **Multiple winners per award are allowed** (no uniqueness constraint). Requires a DB migration (new `is_winner` column, generated with `pnpm db:generate` + `pnpm db:migrate`).
- Documents live in a **private** Supabase bucket; admins access each file via a short-lived **signed URL** generated on demand.
- All nomination reads, the winner toggle, and signed-URL generation are **admin-only** (independently re-verify the admin session, not just the layout).

## Capabilities

### New Capabilities

- `admin-nominations`: Authenticated admin dashboard to browse nominations, read answers, securely access uploaded documents, and mark/unmark award winners, presented in a sidebar-based admin shell.

### Modified Capabilities

- None. The existing `admin-access` "Admin Management Shell" requirement (navigation/structure for future management areas) is satisfied by the sidebar; no spec-level requirement changes.

## Impact

- **Admin shell:** `app/admin/(protected)/layout.tsx` switches from a header to a sidebar layout; `app/admin/(protected)/page.tsx` redirects to `/admin/nominations`.
- **New routes:** `app/admin/(protected)/nominations/page.tsx` (list) and `app/admin/(protected)/nominations/[id]/page.tsx` (detail), plus admin-gated server actions for the winner toggle and signed-URL generation.
- **New UI:** an admin sidebar component, a nominations table, filter/search controls, a document list with secure links, and a winner toggle control.
- **Database:** one additive column `is_winner` (boolean, default `false`) on `nominations`; migration via `pnpm db:generate` / `pnpm db:migrate` (no hand-written SQL).
- **Reuses:** `requireAdminSession()` (`lib/auth/session.ts`), `storageService.createSignedUrl` (`lib/services/storage.server.ts`), `db` (`@/db`), the shadcn `Sidebar` primitive, and the existing `ModeToggle`.
- **Out of scope:** deleting nominations, editing answers, CSV export, bulk actions, email to nominees, a second admin section, and any change to the public nomination form.
