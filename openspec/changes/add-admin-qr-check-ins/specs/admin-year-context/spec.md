## ADDED Requirements

### Requirement: Sidebar Year Selector

The protected admin sidebar SHALL provide a year selector populated from the configured MOBISEC years. The selected year SHALL default to the current MOBISEC year when no valid year is provided.

#### Scenario: Default selected year
- **WHEN** an authenticated administrator opens a year-scoped admin page without a valid selected year
- **THEN** the system uses the configured current MOBISEC year as the selected year

#### Scenario: Administrator changes selected year
- **WHEN** an authenticated administrator chooses a different valid year from the sidebar selector
- **THEN** the current admin page reloads or navigates using that selected year

#### Scenario: Invalid year rejected
- **WHEN** an admin route receives a year value that is not one of the configured MOBISEC years
- **THEN** the system ignores or rejects that value and does not query year-scoped data with it

### Requirement: Year-Scoped Admin Navigation

The protected admin navigation SHALL preserve the selected year when moving between year-scoped admin sections.

#### Scenario: Navigate from nominations to QR Check Ins
- **WHEN** an administrator selects year `2026` and navigates from Nominations to QR Check Ins
- **THEN** QR Check Ins renders data for year `2026`

#### Scenario: Navigate from QR Check Ins to nominations
- **WHEN** an administrator selects year `2025` and navigates from QR Check Ins to Nominations
- **THEN** Nominations renders data for year `2025`

### Requirement: Year-Scoped Admin Data

Year-scoped admin sections SHALL render and mutate data only for the selected year unless a page explicitly documents a different scope.

#### Scenario: Nominations scoped by selected year
- **WHEN** an administrator views nominations with selected year `2026`
- **THEN** the nominations table, winner notification count, and nomination actions operate on `2026` nominations

#### Scenario: Registrations scoped by selected year
- **WHEN** an administrator views QR Check Ins with selected year `2026`
- **THEN** the registration table, CSV import, QR email sends, scanner, and check-in actions operate on `2026` registrations

#### Scenario: Other-year data hidden
- **WHEN** an administrator is viewing a year-scoped table for one selected year
- **THEN** records from other years are not shown in that table
