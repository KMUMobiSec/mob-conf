## Context

The app currently exposes public conference content through year-scoped routes such as `app/[year]/(public)` and a proceedings page protected by a separate static-password cookie. The repository already expects PostgreSQL and Drizzle through `DATABASE_URL`, `drizzle-orm`, `drizzle-kit`, and Docker Compose, but Better Auth is not yet implemented in the app code or dependency list.

Administrator access needs to live outside `[year]` so the admin area can manage cross-year resources and future year-specific content without requiring a selected conference year. The first step is a secure, minimal authentication foundation and a protected admin shell.

## Goals / Non-Goals

**Goals:**

- Provide a year-independent admin login at `/admin/login`.
- Protect `/admin` and future nested admin routes with Better Auth sessions.
- Use email/password authentication through Better Auth.
- Store auth data in PostgreSQL through Drizzle migrations.
- Create an admin shell that can host future management screens.
- Keep proceedings password access independent from administrator authentication.

**Non-Goals:**

- Define the concrete admin management workflows or CRUD resources.
- Add public user registration, social login, password reset, MFA, organizations, or role management.
- Convert proceedings access to Better Auth.
- Change the behavior of existing year-scoped public pages.

## Decisions

### Use `/admin` Outside `[year]`

Create `app/admin/login/page.tsx` and a protected `app/admin/(protected)` route group for the admin shell. This keeps admin navigation independent from `YearProvider`, `VALID_YEARS`, and conference-year validation.

Alternative considered: place admin routes under `app/[year]/admin`. That would simplify access to year context, but it would couple authentication and management to a selected conference edition and make cross-year management awkward.

### Use Better Auth Email/Password With Drizzle

Add a Better Auth server instance under a local auth module, mount it at `app/api/auth/[...all]/route.ts` with the Next.js handler, and create a client helper for login/logout/session usage. Configure Better Auth with email/password enabled and the Drizzle adapter using the PostgreSQL database connection.

Alternative considered: implement a custom credentials endpoint with manual password hashing. Better Auth is already the intended stack in the docs/env template and provides session handling, secure password storage, and client/server helpers.

### Store Only Administrator Accounts Initially

The initial auth system will be used only by administrators. Public sign-up will not be exposed. Admin accounts can be seeded or created manually through a controlled script/process during implementation, and later admin-user management can be added as its own capability.

Alternative considered: expose sign-up and then restrict access by a role field. That adds user lifecycle and authorization scope before the app needs it.

### Protect Admin Routes With Server-Side Session Checks

Admin protected pages/layouts should validate the Better Auth session on the server and redirect unauthenticated users to `/admin/login`. If a lightweight Next.js `proxy.ts` is added for early redirects, page/layout checks still remain the source of truth.

Alternative considered: rely only on client-side session checks. That would expose protected page shells to unauthenticated requests and make authorization easier to bypass.

### Keep Proceedings Auth Separate

The existing proceedings password flow remains a simple content gate backed by `PROCEEDINGS_PASSWORD` and an optional `PROCEEDINGS_SECRET`. Admin login does not replace it, and proceedings access does not grant admin access.

Alternative considered: migrate proceedings to Better Auth immediately. That would mix anonymous proceedings access with administrator identity management and broaden this change unnecessarily.

## Risks / Trade-offs

- Better Auth schema generation may differ from existing Drizzle naming conventions → Use the generated schema/migration as the source of truth, then adapt names only if required by local conventions.
- No public sign-up means the first admin account needs a controlled creation path → Add a documented seed/manual creation task during implementation.
- Session protection in page/layout code can be missed for new nested routes → Put future admin pages under the protected route group so the server-side guard is inherited.
- Adding auth tables introduces migration risk → Keep migrations limited to Better Auth tables and verify against local PostgreSQL before deployment.

## Migration Plan

1. Add Better Auth and Drizzle adapter dependencies.
2. Add the Drizzle database client/config if missing.
3. Add Better Auth schema and generate/apply migrations for auth tables.
4. Configure the Better Auth server/client modules and `/api/auth/[...all]` route.
5. Add `/admin/login`, protected admin layout, and `/admin` shell.
6. Add a controlled first-admin creation path.
7. Verify login, logout, authenticated access, unauthenticated redirect, and existing public/proceedings routes.

Rollback: remove the new admin routes/auth modules and revert the auth migration if no administrator data has been created. If data exists, back up auth tables before rollback.

## Open Questions

- What specific admin management workflows should be added after the auth foundation is in place?
- Should the first admin account be created through a one-time seed script, an environment-driven bootstrap command, or direct database insertion?
