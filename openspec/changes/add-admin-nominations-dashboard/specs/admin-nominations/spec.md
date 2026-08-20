## ADDED Requirements

### Requirement: Admin Sidebar Navigation Shell

The protected admin area SHALL present a collapsible sidebar (not a top navigation bar) containing the admin's identity, a theme toggle, a sign-out control, and the admin navigation. For now the navigation SHALL contain a single item, "Nominations", linking to `/admin/nominations`.

#### Scenario: Sidebar is shown in the admin area

- **WHEN** an authenticated administrator views any protected admin page
- **THEN** the system renders a sidebar with a "Nominations" navigation item and an identity/footer area containing a theme toggle and a sign-out control

#### Scenario: Active item is indicated

- **WHEN** an administrator is on `/admin/nominations` or a nomination detail page
- **THEN** the sidebar marks the "Nominations" item as active

#### Scenario: Theme toggle works in admin

- **WHEN** an administrator switches the theme from the sidebar
- **THEN** the admin dashboard updates to light, dark, or system per the selection

### Requirement: Admin Entry Redirect

The system SHALL redirect `/admin` to `/admin/nominations` so administrators land directly on the only available section.

#### Scenario: Admin root redirect

- **WHEN** an authenticated administrator navigates to `/admin`
- **THEN** the system redirects to `/admin/nominations`

### Requirement: Nominations List

The system SHALL provide `/admin/nominations` listing all submitted nominations, most recent first, showing at least the nominee, award, year, nominator, submission date, and winner state. The list SHALL support filtering by year, award, and winner state, and a text search across nominee and nominator name/email.

#### Scenario: List shows nominations

- **WHEN** an administrator opens `/admin/nominations`
- **THEN** the system displays the submitted nominations with nominee, award, year, nominator, submission date, and winner indicator

#### Scenario: Filter by award

- **WHEN** an administrator filters by a specific award
- **THEN** the list shows only nominations for that award

#### Scenario: Filter by winner

- **WHEN** an administrator filters to winners only
- **THEN** the list shows only nominations marked as winners

#### Scenario: Search by name

- **WHEN** an administrator searches for a nominee or nominator name or email
- **THEN** the list shows only nominations matching the query

#### Scenario: Open a nomination

- **WHEN** an administrator selects a nomination from the list
- **THEN** the system opens that nomination's detail page at `/admin/nominations/[id]`

### Requirement: Nomination Detail View

The system SHALL provide a detail page at `/admin/nominations/[id]` showing every captured answer for one nomination: award, year, nominator details, nominee details, any conditional fields (degree, enrollment), the nomination statement, consent, detected slide pages where applicable, and the list of uploaded documents.

#### Scenario: View full answers

- **WHEN** an administrator opens a nomination's detail page
- **THEN** the system displays all submitted answers and the list of attached documents

#### Scenario: Unknown nomination

- **WHEN** an administrator requests a detail page for an id that does not exist
- **THEN** the system responds with a not-found page

### Requirement: Secure Document Access

The system SHALL let administrators download each uploaded document via a short-lived signed URL generated on demand, keeping the storage bucket private. The signing operation SHALL only sign paths that belong to a stored nomination document.

#### Scenario: Download a document

- **WHEN** an administrator activates a document link on a nomination detail page
- **THEN** the system generates a short-lived signed URL for that file and opens it for download

#### Scenario: Bucket stays private

- **WHEN** a document signed URL expires or someone requests a file without a valid signed URL
- **THEN** the storage bucket does not serve the file publicly

#### Scenario: Only known paths are signed

- **WHEN** a signed-URL request references a path that is not part of any stored nomination's documents
- **THEN** the system refuses to sign it

### Requirement: Winner Status Management

The system SHALL let an administrator mark a nomination as a winner and remove that mark ("unwinner"). Multiple nominations MAY be winners for the same award (no uniqueness constraint). The winner state SHALL persist and be reflected in the list and detail views.

#### Scenario: Mark a winner

- **WHEN** an administrator marks a nomination as a winner
- **THEN** the system persists the winner state and shows the nomination as a winner in the list and detail views

#### Scenario: Remove the winner mark

- **WHEN** an administrator un-marks a nomination that was a winner
- **THEN** the system clears the winner state and the nomination is no longer shown as a winner

#### Scenario: Multiple winners per award

- **WHEN** an administrator marks two nominations for the same award as winners
- **THEN** the system accepts both as winners without conflict

### Requirement: Admin-Only Authorization

The nominations dashboard, its detail pages, and all its actions (winner toggle, signed-URL generation) SHALL require a valid administrator session, verified independently of page layouts.

#### Scenario: Non-admin blocked from the dashboard

- **WHEN** a visitor without an administrator session requests `/admin/nominations` or a nomination detail page
- **THEN** the system redirects the visitor to `/admin/login`

#### Scenario: Action requires admin

- **WHEN** a request to toggle winner state or to generate a document signed URL arrives without a valid administrator session
- **THEN** the system rejects the request and performs no database or storage operation
