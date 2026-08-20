# admin-forms Specification

## Purpose
TBD - created by archiving change add-banquet-survey. Update Purpose after archive.
## Requirements
### Requirement: Admin Forms Registry Page

The system SHALL provide an authenticated admin page at `/admin/forms` that lists
the known forms as cards, each linking to that form's management surface. The
registry SHALL include Presentation Upload (linking to `/admin/presentations`)
and Banquet Survey (linking to `/admin/banquet-survey`).

#### Scenario: Registry lists known forms

- **WHEN** an authenticated administrator opens `/admin/forms`
- **THEN** the system shows a card for Presentation Upload and a card for Banquet
  Survey

#### Scenario: Card navigates to the form surface

- **WHEN** the administrator clicks the Banquet Survey card
- **THEN** the system navigates to `/admin/banquet-survey`

#### Scenario: Requires authentication

- **WHEN** an unauthenticated visitor requests `/admin/forms`
- **THEN** the system does not render the registry and redirects to admin login

### Requirement: Forms Navigation Entry

The system SHALL add a Forms entry to the admin sidebar navigation that links to
`/admin/forms` and shows as active on that route, and SHALL show a matching
section title in the admin header for the forms and banquet survey routes.

#### Scenario: Sidebar shows Forms entry

- **WHEN** an administrator views any admin page
- **THEN** the sidebar shows a Forms navigation entry linking to `/admin/forms`

#### Scenario: Active state on forms route

- **WHEN** the administrator is on `/admin/forms` or `/admin/banquet-survey`
- **THEN** the Forms navigation entry renders in its active state and the header
  shows the corresponding section title

