## ADDED Requirements

### Requirement: Interactive route map
The system SHALL render an interactive Mapbox GL map showing a walking route from the Main Gate to the venue cluster, plus a marker for each anchor building. The user SHALL be able to pan and zoom the map.

#### Scenario: Map and route render
- **WHEN** the Campus Wayfinder is displayed and a valid map token is configured
- **THEN** an interactive map is shown centered on the campus
- **AND** a walking route is drawn from the Main Gate toward the primary venue
- **AND** markers appear for the Main Gate (#25), Paper Sessions (#1), Main Conference Hall (#11), and Lunch (#4)

#### Scenario: User can pan and zoom
- **WHEN** the user interacts with the map
- **THEN** they can pan and zoom within the configured zoom limits

### Requirement: Step-by-step guided navigation
The system SHALL present the route as an ordered sequence of steps with a visible active step, and SHALL let the user move between steps via Back and Next controls. Advancing MUST ease the map to the focused building and reveal the corresponding leg of the route.

#### Scenario: Advance through steps
- **WHEN** the user activates "Next"
- **THEN** the active step advances by one
- **AND** the map eases to the new step's focused building
- **AND** the route revealed for that step is shown
- **AND** the step's title and body text are shown

#### Scenario: Controls clamp at the ends
- **WHEN** the first step is active
- **THEN** "Back" is disabled
- **WHEN** the last step is active
- **THEN** "Next" is disabled

### Requirement: Two-way sync between steps and markers
The system SHALL keep the step list and the map markers in sync: selecting a step highlights and focuses its marker, and clicking a marker activates its associated step.

#### Scenario: Selecting a step focuses its marker
- **WHEN** the user selects a step in the list
- **THEN** that step becomes active and the map focuses its marker

#### Scenario: Clicking a marker activates its step
- **WHEN** the user clicks a marker on the map
- **THEN** the step associated with that marker becomes the active step

### Requirement: Localized content
The system SHALL source all user-visible wayfinder text (section label, title, step titles/bodies, control labels, marker labels, fallback message) from a `Wayfinder` i18n namespace present in both `messages/en.json` and `messages/kr.json`. Coordinates MUST NOT be stored in the translation files.

#### Scenario: Renders in the active locale
- **WHEN** the site locale is English or Korean
- **THEN** wayfinder text renders from the matching messages file

#### Scenario: Translation keys exist in both locales
- **WHEN** the `Wayfinder` namespace is inspected
- **THEN** every key used by the component exists in both `en.json` and `kr.json`

### Requirement: Map attribution
The system SHALL display map attribution (© Mapbox / © OpenStreetMap) via Mapbox's attribution control whenever the map is shown.

#### Scenario: Attribution present
- **WHEN** the map renders
- **THEN** the Mapbox attribution control is visible

### Requirement: Accessibility and reduced motion
The system SHALL be operable by keyboard and screen reader, and SHALL respect the user's reduced-motion preference. Markers MUST expose accessible labels; step controls MUST be real buttons; the step list MUST be keyboard navigable; the map container MUST be a labeled region.

#### Scenario: Keyboard operation
- **WHEN** a user navigates with the keyboard
- **THEN** step controls and markers are focusable and activatable
- **AND** each marker exposes an accessible label identifying its building and role

#### Scenario: Reduced motion honored
- **WHEN** the user's system requests reduced motion
- **THEN** the route animation and map camera easing are disabled (instant transitions)

### Requirement: Config-driven geometry
The system SHALL drive the map from a single typed configuration object describing the map view, the ordered walking route (lng/lat), the markers, and the steps. Changing the venue/coordinates MUST require only configuration changes, not component changes.

#### Scenario: Configuration is internally valid
- **WHEN** the configuration is validated
- **THEN** every step references an existing marker
- **AND** every marker and route coordinate is a valid longitude/latitude
- **AND** every step's route segment lies within the route bounds

### Requirement: Graceful fallback without a map token
The system SHALL render a localized fallback message instead of crashing when no map token is configured.

#### Scenario: Missing token
- **WHEN** `NEXT_PUBLIC_MAPBOX_TOKEN` is not set
- **THEN** the component shows a localized "map unavailable" message and does not throw

### Requirement: Placement within the venue section
The system SHALL embed the Campus Wayfinder within the existing venue presentation (`Venue.tsx`) as an additional block, without removing the existing Google Maps directions.

#### Scenario: Wayfinder appears alongside existing venue info
- **WHEN** the venue section renders
- **THEN** the Campus Wayfinder block is shown
- **AND** the existing Google Maps iframe / directions remain present
