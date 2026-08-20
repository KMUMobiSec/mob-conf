## 1. Dependencies And Database

- [x] 1.1 Add Better Auth, the Better Auth Drizzle adapter, and a PostgreSQL Drizzle driver dependency.
- [x] 1.2 Add or verify Drizzle configuration for `DATABASE_URL` and migration output.
- [x] 1.3 Add the database client module used by Better Auth.
- [x] 1.4 Add Better Auth Drizzle schema definitions for user, session, account, and verification tables.
- [x] 1.5 Generate and commit the auth table migration.

## 2. Better Auth Wiring

- [x] 2.1 Add the Better Auth server configuration with email/password enabled and Drizzle PostgreSQL storage.
- [x] 2.2 Add the Better Auth Next.js route handler at `/api/auth/[...all]`.
- [x] 2.3 Add a client auth helper for sign-in, sign-out, and session access.
- [x] 2.4 Add server helper(s) for reading the current admin session from request headers.

## 3. Admin Routes

- [x] 3.1 Add `/admin/login` with an email/password form using the Better Auth client helper.
- [x] 3.2 Redirect authenticated administrators from `/admin/login` to `/admin`.
- [x] 3.3 Add a protected admin layout/route group that redirects unauthenticated visitors to `/admin/login`.
- [x] 3.4 Add the `/admin` management shell outside `[year]` without depending on `YearProvider`.
- [x] 3.5 Add sign-out behavior from the admin shell.

## 4. Administrator Bootstrap

- [x] 4.1 Add a controlled first-admin creation path, such as a seed/bootstrap script or documented one-time command.
- [x] 4.2 Ensure public sign-up is not exposed through the admin UI.
- [x] 4.3 Document the first-admin bootstrap flow and required env vars.

## 5. Verification

- [ ] 5.1 Add focused tests or integration checks for unauthenticated redirects, login failure, login success, session persistence, and logout.
- [ ] 5.2 Verify a proceedings-authenticated visitor without a Better Auth session cannot access `/admin`.
- [ ] 5.3 Run lint, typecheck, tests, and a local build.
- [ ] 5.4 Manually verify existing year-scoped public pages and proceedings access still behave as before.
