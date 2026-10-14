## Why

MOBISEC currently organizes public conference pages under year-specific routes, but there is no year-independent area for administrative work. Before adding admin management features, the app needs a dedicated admin authentication foundation that does not depend on a selected event year.

## What Changes

- Add a year-independent `/admin/login` page for administrator email/password login.
- Add a protected `/admin` route area that requires a valid administrator session.
- Configure Better Auth for email/password authentication backed by Drizzle and PostgreSQL.
- Add the database schema and migration path required for Better Auth user, session, account, and verification data.
- Add an admin management shell that can host the concrete management workflows defined in later changes.
- Keep the existing proceedings password flow separate from administrator authentication.

## Capabilities

### New Capabilities

- `admin-access`: Year-independent administrator login, session handling, route protection, and protected admin shell.

### Modified Capabilities

- None.

## Impact

- Affected routes: new `/admin/login`, `/admin`, and `/api/auth/[...all]` routes.
- Affected backend: Better Auth server/client configuration, Drizzle database client, auth schema, and migrations.
- Affected dependencies: add Better Auth and its Drizzle/PostgreSQL integration packages if they are not already installed.
- Affected env: uses existing `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_BASE_URL`.
- Existing year routes under `app/[year]` and the proceedings password cookie flow remain unchanged except where shared layout/provider wiring must support admin pages.
