# navigation Specification

## Purpose

The `navigation` capability defines the app's top-level navigation: a persistent bottom tab bar exposing the Home, Decks, and Settings destinations, how the active destination is indicated (including on sub-screens), and when the tab bar is shown or hidden (hidden during a game and focused edit flows).

## Requirements

### Requirement: A persistent bottom tab bar exposes the top-level destinations
The app SHALL present a persistent **bottom tab bar** with the top-level destinations **Home**, **Decks**, and **Settings**, each rendered as an icon + label. Tapping a tab SHALL switch the app to that destination's root screen. The bar SHALL sit at the bottom of the screen above the OS bottom inset (safe-area), and SHALL NOT require a navigation library (it drives the existing screen state).

#### Scenario: Tabs switch destinations
- **WHEN** the user taps the **Decks** tab
- **THEN** the Decks screen is shown
- **WHEN** the user taps the **Settings** tab
- **THEN** the Settings screen is shown
- **WHEN** the user taps the **Home** tab
- **THEN** the Home screen is shown

#### Scenario: Tab bar clears the bottom safe area
- **WHEN** the tab bar is rendered on a device with a bottom inset (home indicator / gesture bar)
- **THEN** its touch targets sit above the inset, not under the system bar

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

### Requirement: The tab bar is hidden during a game and focused edit flows
The tab bar SHALL be shown on the browse screens (Home, Decks, a deck's detail, game history, Settings) and SHALL be hidden during a **game** (the immersive life counter) and during **focused edit flows** (deck editing, bulk-add games), so it does not compete with those screens' actions.

#### Scenario: Hidden in-game
- **WHEN** a game (life counter) is shown
- **THEN** the bottom tab bar is not rendered

#### Scenario: Shown while browsing
- **WHEN** the user is on Home, Decks, a deck's detail, or Settings
- **THEN** the bottom tab bar is rendered

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
