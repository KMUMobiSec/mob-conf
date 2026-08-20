## ADDED Requirements

### Requirement: Admin Login Page

The system SHALL provide a year-independent administrator login page at `/admin/login` that accepts email and password credentials through Better Auth.

#### Scenario: Unauthenticated admin visits login

- **WHEN** an unauthenticated visitor requests `/admin/login`
- **THEN** the system displays an administrator login form without requiring a year route parameter

#### Scenario: Authenticated admin visits login

- **WHEN** an authenticated administrator requests `/admin/login`
- **THEN** the system redirects the administrator to `/admin`

#### Scenario: Invalid credentials

- **WHEN** a visitor submits invalid administrator credentials
- **THEN** the system keeps the visitor on `/admin/login` and displays an authentication error

### Requirement: Better Auth Session Handling

The system SHALL use Better Auth email/password authentication backed by Drizzle and PostgreSQL for administrator sessions.

#### Scenario: Valid credentials

- **WHEN** an administrator submits valid email and password credentials
- **THEN** Better Auth creates a session and the system redirects the administrator to `/admin`

#### Scenario: Session persistence

- **WHEN** an authenticated administrator refreshes an admin page before the session expires
- **THEN** the system recognizes the Better Auth session and keeps the administrator in the protected admin area

#### Scenario: Logout

- **WHEN** an authenticated administrator signs out
- **THEN** Better Auth clears the session and the system redirects the administrator to `/admin/login`

### Requirement: Protected Admin Area

The system SHALL protect `/admin` and nested admin management routes from unauthenticated access.

#### Scenario: Unauthenticated admin route request

- **WHEN** an unauthenticated visitor requests `/admin`
- **THEN** the system redirects the visitor to `/admin/login`

#### Scenario: Authenticated admin route request

- **WHEN** an authenticated administrator requests `/admin`
- **THEN** the system displays the protected admin management shell

#### Scenario: Nested admin route request

- **WHEN** an unauthenticated visitor requests any nested protected admin route
- **THEN** the system redirects the visitor to `/admin/login`

### Requirement: Admin Management Shell

The system SHALL provide a protected admin management shell that is ready to host future management features without defining those feature workflows in this change.

#### Scenario: Admin shell content

- **WHEN** an authenticated administrator opens `/admin`
- **THEN** the system displays an admin shell with navigation/structure for future management areas

#### Scenario: Year independence

- **WHEN** an authenticated administrator opens `/admin`
- **THEN** the system renders without requiring `YearProvider`, `VALID_YEARS`, or a `[year]` route parameter

### Requirement: Proceedings Auth Separation

The system SHALL keep proceedings password access separate from administrator authentication.

#### Scenario: Proceedings password does not grant admin access

- **WHEN** a visitor has a valid proceedings auth cookie but no Better Auth admin session
- **THEN** the system redirects the visitor from `/admin` to `/admin/login`

#### Scenario: Admin login does not change proceedings configuration

- **WHEN** an administrator signs in through `/admin/login`
- **THEN** the existing proceedings password behavior remains governed by `PROCEEDINGS_PASSWORD` and optional `PROCEEDINGS_SECRET`
