## MODIFIED Requirements

### Requirement: The Decks screen lists decks as stat cards
The Decks screen SHALL render the shared list, each deck as a **metallic card** showing: an **aspect-colored edge** (the first aspect's canonical color, neutral if none), the **name** in dark high-contrast text, **aspect dots**, the **archetype** tag (if set), the deck's **record as numbers only** (e.g. `2-1`; `W-L` form, `W-L-D` when there are draws — never the literal "W-L-D" letters), a recent-form **sparkline**, and a **streak** chip rendered as a colored arrow + count (▲ win / ▼ loss / = draw — no W/L/D letter) when the deck has games. The deck's **win percentage SHALL NOT be shown on the card**, and there is no win-rate bar. The list SHALL be ordered by the Filters panel's Sort/Order (default: by **name, ascending**); no deck is pinned to the top and no default-deck marker is shown on the list. A "+ NEW" affordance SHALL be present. An empty state SHALL invite creating the first deck.

#### Scenario: Card content
- **GIVEN** a deck "Bossk Vigilance" (aspects [Vigilance, Villainy]) with 2 wins, 1 loss
- **WHEN** the Decks screen renders
- **THEN** its card shows a Vigilance-blue edge, the aspect dots, the record `2-1` (numbers only), a recent-form sparkline, and a streak arrow
- **AND** it shows NO win percentage and NO win-rate bar
- **AND** no default marker is shown on the card

#### Scenario: Default ordering is alphabetical
- **GIVEN** several decks and no sort change
- **WHEN** the Decks screen renders
- **THEN** the decks are listed by name in ascending order (no deck pinned to the top)

#### Scenario: Zero-games deck
- **WHEN** a deck with no games renders
- **THEN** it shows a neutral "No games" state (no record numbers, no sparkline, no streak) rather than `0-0` or a win-rate

### Requirement: The deck detail screen shows stats, streak, and matchups grouped by event
Tapping a deck SHALL open a detail view: name + aspects + a **labeled leader** (`Leader: <value>`) + a **labeled archetype** (`Archetype: <value>`) + notes — each non-name identity field SHALL be prefixed with the **name of the field** it shows, so a bare value is never ambiguous. Below that: an overall card with the deck's **record (numbers only)** and recent form; and a **matchups** list grouped under **labeled event headers** (`Event: <tag>`; most-recent group first, an "OTHER" group for untagged games last). The matchups list SHALL be **display-only** — derived from recorded games — with **no option to add** anything in the deck view: there SHALL be **no "+ ADD" matchup control** and **no "Add notes" affordance**. Each matchup row SHALL show the opponent name (or "Random"), its **record (numbers only)** from this deck's perspective, and win%. A named-opponent row that ALREADY has strategy **notes** SHALL show them **read-only**, with an explicit **Edit** (then Save / Cancel) to modify the existing note; a row without notes shows stats only. There SHALL be **no per-matchup archetype tag** (a deck's archetype lives on the deck record).

The actions area SHALL include two side-by-side **default checkboxes** — one for the Player side (silver accent) and one for the Opponent side (gold accent) — followed by **Game History**, **Bulk Add Games**, **Edit**, and **Delete**. Each checkbox is a toggle: tapping it when **unchecked** sets this deck as the default for that side and immediately selects it in the corresponding loadout slot; tapping it when **checked** clears the stored default and resets that loadout slot to Random (`"__random__"`).

#### Scenario: Default checkbox toggles on and off
- **GIVEN** a deck that is not the Player or Opponent default
- **WHEN** the user taps "Default · Player"
- **THEN** `settings.defaultDeckId` is set to this deck and the Home Player dropdown updates
- **WHEN** the user taps "Default · Player" again (checkbox is now checked)
- **THEN** `settings.defaultDeckId` is cleared to `null` and the Player dropdown resets to Random

#### Scenario: Matchups grouped by labeled event headers
- **GIVEN** deck A has games tagged "PETRANAKI" (vs B) and "LOCALS" (vs C)
- **WHEN** the user opens A's detail
- **THEN** the matchups are grouped under headers reading **"Event: PETRANAKI"** and **"Event: LOCALS"** (the event tag is prefixed with its field name, like the identity labels)
- **AND** the untagged group's header reads "OTHER"
- **AND** each row shows the opponent, its numbers-only record, and win%

#### Scenario: Identity fields are labeled
- **GIVEN** a deck with leader "Darth Vader" and archetype "Aggro"
- **WHEN** the deck detail renders
- **THEN** the identity card shows "Leader: Darth Vader" and "Archetype: Aggro" (each value prefixed with its field name), not a bare "Darth Vader" / "Aggro"

#### Scenario: Matchups are display-only with no add option
- **WHEN** the deck detail renders the matchups list
- **THEN** there is NO "+ ADD" matchup control and NO "Add notes" affordance
- **AND** a matchup row WITHOUT notes shows only its stats (opponent, numbers-only record, win%)

#### Scenario: An existing matchup note is read-only until Edit, then persists
- **GIVEN** a named matchup that already has strategy notes
- **WHEN** the deck detail renders
- **THEN** the row shows its notes **read-only** (not an always-open editor) and exposes NO archetype field
- **WHEN** the user taps **Edit**, changes the notes, and confirms (Save)
- **THEN** the value is saved to that `(deck, opponent)` matchup record and survives reload
- **AND** the notes cannot be modified without first tapping Edit
- **AND** the Random row exposes no notes editor
