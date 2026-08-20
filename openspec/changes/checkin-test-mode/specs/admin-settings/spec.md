## ADDED Requirements

### Requirement: Global app settings are persisted and admin-editable

The system SHALL persist global, runtime-editable settings in a single-row `app_settings` store containing at least a `checkInTestMode` boolean and a `testerEmails` string list. Reading settings SHALL always return effective values, defaulting to `checkInTestMode = false` and `testerEmails = []` when no row exists yet. All settings mutations SHALL require an authenticated admin session.

#### Scenario: Defaults when unset

- **WHEN** app settings are read and no settings row exists
- **THEN** effective settings are returned as `checkInTestMode = false` and `testerEmails = []` (no error)

#### Scenario: Exactly one settings row

- **WHEN** settings are updated more than once
- **THEN** the store still contains a single settings row (the singleton is upserted, not duplicated)

#### Scenario: Mutations require admin

- **WHEN** a settings mutation is attempted without an admin session
- **THEN** the mutation is rejected and nothing is persisted

### Requirement: Admin can manage the tester email receiver list

The Admin Setup page SHALL let an admin view and edit the tester email receiver list. Submitted addresses SHALL be trimmed, lowercased, de-duplicated, and validated; invalid addresses SHALL be rejected with a message and the list left unchanged. An empty list SHALL be allowed.

#### Scenario: Save a valid list

- **WHEN** an admin submits two valid, differently-cased duplicate-containing addresses
- **THEN** the stored list contains the normalized, de-duplicated addresses

#### Scenario: Reject an invalid address

- **WHEN** an admin submits a list containing a malformed address
- **THEN** the save is rejected with an error and the stored list is unchanged

#### Scenario: Clear the list

- **WHEN** an admin submits an empty tester list
- **THEN** the stored list becomes empty

### Requirement: Admin Setup is reachable from the admin navigation

The admin sidebar SHALL include an "Admin Setup" item linking to `/admin/setup`, and the admin header SHALL show a matching title on that route. The page SHALL require an authenticated admin session.

#### Scenario: Navigate to Admin Setup

- **WHEN** an authenticated admin clicks the "Admin Setup" sidebar item
- **THEN** they land on `/admin/setup` with the header titled "Admin Setup"

#### Scenario: Unauthenticated access is redirected

- **WHEN** an unauthenticated visitor requests `/admin/setup`
- **THEN** they are redirected to the admin login
