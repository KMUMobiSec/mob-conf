## ADDED Requirements

### Requirement: Registrations carry a participant ID number

Each registration SHALL have an optional participant ID number sourced from the official participant list's `No.` column, persisted as a nullable integer on the registration. A registration not present on the list (for example a walk-in) SHALL be allowed to have no ID number. The ID number SHALL NOT change a registration's identity — registrations remain keyed by year, email, and name — so re-importing the same person updates their ID number in place rather than creating a duplicate.

#### Scenario: Imported row carries its number

- **WHEN** a CSV with a `No.` column is imported and a row's participant number is a positive integer
- **THEN** the created or updated registration stores that number as its ID number

#### Scenario: Blank number leaves the ID empty

- **WHEN** a CSV row has an empty `No.` value (or the column is absent)
- **THEN** the registration is created or updated with no ID number

#### Scenario: Re-import updates the number in place

- **WHEN** a row matching an existing registration by email and name is imported with a `No.` value
- **THEN** the existing registration's ID number is set to that value and no duplicate registration is created

#### Scenario: Importing the official list keeps each row's address

- **WHEN** the official participant list — whose address column is headed `E-mail` — is imported
- **THEN** each row's email is read from that column and rows upsert by email and name, rather than importing as anonymous walk-ins

### Requirement: The 2026 participant list can be backfilled

An operations script SHALL assign ID numbers to the existing 2026 registrations from the reference participant list, matching each list row to a registration by email and name (falling back to name only for rows with no email). The script SHALL default to a non-destructive dry run that reports how many rows matched, which list rows did not match a registration, and which registrations were left without an ID; it SHALL write changes only when explicitly asked to apply them, and applying SHALL be idempotent.

#### Scenario: Dry run reports without writing

- **WHEN** the backfill script is run without the apply flag
- **THEN** it prints the matched count and the unmatched list rows and un-numbered registrations, and makes no database changes

#### Scenario: Apply assigns the numbers

- **WHEN** the backfill script is run with the apply flag against the 2026 registrations
- **THEN** each registration matched to a list row has its ID number set to that row's `No.`, and re-running makes no further changes

### Requirement: The scanner result shows the participant ID number

When a badge is scanned and the result is a successful check-in or an already-checked-in registration that has an ID number, the full-screen scanner SHALL display that ID number as a large, emphasized, zero-padded element (for example `012`) above the attendee's name. When the matched registration has no ID number, the result SHALL display the name without an ID number rather than a placeholder.

#### Scenario: Number shown on a fresh check-in

- **WHEN** a valid badge for a not-yet-checked-in registration that has ID number 12 is scanned
- **THEN** the success screen shows `012` prominently above the attendee's name

#### Scenario: Number shown on an already-checked-in scan

- **WHEN** a badge is re-scanned for a registration that already checked in and has an ID number
- **THEN** the already-checked-in result still shows that registration's ID number prominently

#### Scenario: No number degrades gracefully

- **WHEN** a valid badge for a registration with no ID number is scanned
- **THEN** the result screen shows the attendee's name with no ID number and no placeholder digits

### Requirement: A realtime check-in log lists arrivals newest first

The QR Check-Ins page SHALL provide a Logs view listing every checked-in registration for the selected year, ordered from most recent check-in to oldest. Each entry SHALL show the registration's ID number (emphasized), name and affiliation, the account that performed the check-in ("scanned by"), and the check-in time. The view SHALL update in realtime as check-ins occur, via Supabase Realtime Postgres changes on the registrations table, without requiring a manual refresh. When no registration has checked in for the year, the view SHALL show an empty state.

#### Scenario: New check-in appears at the top live

- **WHEN** the Logs view is open for a year and a badge is scanned for that year
- **THEN** the new check-in appears at the top of the log without a manual page reload

#### Scenario: Entry shows who scanned it

- **WHEN** a check-in was performed by an admin account
- **THEN** that check-in's log entry shows that account's email as the scanner

#### Scenario: Undo removes the entry live

- **WHEN** test mode is on, the Logs view is open, and an admin undoes a check-in for that year
- **THEN** that entry is removed from the log without a manual page reload

#### Scenario: Empty state

- **WHEN** the Logs view is open for a year with no check-ins
- **THEN** an empty state is shown instead of log entries
