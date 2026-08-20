# Admin Auth

The admin area is outside the year-scoped routes:

- Login: `/admin/login`
- Dashboard: `/admin`
- Auth API: `/api/auth/[...all]`

Public sign-up is disabled in Better Auth. Create the first administrator with:

```sh
pnpm admin:create
```

The CLI prompts for email and password. For a non-interactive run:

```sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='change-this-password' ADMIN_NAME='EBISION Admin' pnpm admin:create
```

Required runtime variables:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_BASE_URL`
- `CHECK_IN_QR_SECRET` for signing admin QR check-in credentials
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser realtime updates in QR Check Ins

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` are optional inputs for `pnpm admin:create`.
