## MODIFIED Requirements

### Requirement: The active tab reflects the current area
The tab bar SHALL indicate the **active** destination (e.g. an accent-tinted icon + label). A sub-screen SHALL keep active the tab of the destination it was opened **from**, not a fixed tab: a deck detail opened from **Home** SHALL keep the **Home** tab active, and a deck detail opened from **Decks** SHALL keep the **Decks** tab active. A deck's game history (a sub-screen of the deck detail) SHALL keep the same origin tab active as its deck detail.

#### Scenario: Active tab on a deck detail opened from Home
- **GIVEN** the user opened a deck's detail from the Home tab
- **WHEN** the detail screen is shown
- **THEN** the **Home** tab is the active (highlighted) tab

#### Scenario: Active tab on a deck detail opened from Decks
- **GIVEN** the user opened a deck's detail from the Decks tab
- **WHEN** the detail screen is shown
- **THEN** the **Decks** tab is the active (highlighted) tab

## ADDED Requirements

### Requirement: Deck detail returns to the screen it was opened from
A deck detail SHALL be **origin-aware**: the Back control (and the Android hardware back button) from a deck detail SHALL return to the screen the detail was opened from — a Home-opened deck detail returns to **Home**, and a Decks-opened deck detail returns to **Decks**. A sub-screen of the deck detail (e.g. its game history) SHALL return to the deck detail, which then returns to its origin.

#### Scenario: Open from Home, Back returns to Home
- **GIVEN** the user opened a deck's detail from the Home tab
- **WHEN** the user taps Back (or presses the Android hardware back button)
- **THEN** the Home screen is shown

#### Scenario: Open from Decks, Back returns to Decks
- **GIVEN** the user opened a deck's detail from the Decks tab
- **WHEN** the user taps Back (or presses the Android hardware back button)
- **THEN** the Decks screen is shown

#### Scenario: A sub-screen returns to the deck detail, then to the origin
- **GIVEN** the user opened a deck's detail from Home and then opened its game history
- **WHEN** the user taps Back from the game history
- **THEN** the deck detail is shown
- **WHEN** the user taps Back from the deck detail
- **THEN** the Home screen is shown
