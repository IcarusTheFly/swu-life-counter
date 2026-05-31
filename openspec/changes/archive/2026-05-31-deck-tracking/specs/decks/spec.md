## ADDED Requirements

### Requirement: Decks live in a single shared list
The app SHALL maintain ONE shared list of deck records. Each deck SHALL carry: `id` (app-generated, never `"__random__"`), `name` (required, ≤ 50 chars trimmed, unique case-insensitive within the list), `aspects` (0–3 distinct values from the fixed set Vigilance, Command, Aggression, Cunning, Heroism, Villainy), `leader` (optional, ≤ 80), `archetype` (optional, ≤ 40), `notes` (optional, ≤ 500), `createdAt` (ms). Both the Player and the Opponent selection draw from this one list; the same deck MAY be chosen for both sides.

#### Scenario: One list backs both sides
- **WHEN** the user opens the Player picker and the Opponent picker
- **THEN** both list every saved deck
- **AND** the Opponent picker additionally offers "Random"

#### Scenario: Name length and uniqueness
- **WHEN** the user saves a deck with a 50-character name
- **THEN** the deck is created
- **WHEN** the user enters a 51-character name, or a name already used by another deck (case-insensitive)
- **THEN** an inline error is shown and the deck is not saved

#### Scenario: Aspect picker capped at three
- **WHEN** the user taps a fourth aspect chip
- **THEN** it does not toggle on and an inline message indicates the maximum is three

### Requirement: Decks can be created, edited, and deleted
The user SHALL be able to create a deck (name required; aspects, leader, archetype, notes optional), edit any field, and delete a deck. Deletion SHALL require confirmation and SHALL cascade — removing every matchup and game record that references the deck on EITHER side. The first deck ever created SHALL become the default and SHALL be selected as the Player side of the loadout.

#### Scenario: First deck becomes default
- **GIVEN** no decks exist
- **WHEN** the user creates the first deck
- **THEN** it is set as `settings.defaultDeckId` and as the loadout's Player side

#### Scenario: Editing preserves history
- **GIVEN** a deck with recorded games
- **WHEN** the user renames it
- **THEN** the deck id is unchanged and all its games + matchups still resolve

#### Scenario: Deletion cascades and heals
- **GIVEN** a deck with N games and M matchups, set as the default
- **WHEN** the user confirms deletion (the confirmation notes N games + M matchups affected)
- **THEN** the deck, its M matchups, and its N games are removed
- **AND** `defaultDeckId` falls back to another deck (or null) and any loadout side referencing it self-heals

### Requirement: The Decks screen lists decks as stat cards
The Decks screen SHALL render the shared list, each deck as a card showing: an aspect-colored accent (the first aspect's canonical color, neutral if none), the name, aspect dots, the archetype tag (if set), the overall W-L-D, the win percentage to one decimal, a win-rate bar proportional to win%, and a streak badge (e.g. `W3`) when the deck has games. The list SHALL be ordered by the Filters panel's Sort/Order (default: by **name, ascending**); no deck is pinned to the top and no default-deck marker is shown on the list (the player/opponent defaults are surfaced on the deck detail screen). A "+ New Deck" affordance SHALL be present. An empty state SHALL invite creating the first deck.

#### Scenario: Card content
- **GIVEN** a deck "Bossk Vigilance" (aspects [Vigilance, Villainy]) with 2 wins, 1 loss
- **WHEN** the Decks screen renders
- **THEN** its card shows a Vigilance-blue accent, the aspect dots, `2–1–0`, `66.7%`, a ~66%-filled win-rate bar, and a streak badge
- **AND** no ★ / default marker is shown on the card

#### Scenario: Default ordering is alphabetical
- **GIVEN** several decks and no sort change
- **WHEN** the Decks screen renders
- **THEN** the decks are listed by name in ascending order (no deck pinned to the top)

#### Scenario: Zero-games deck
- **WHEN** a deck with no games renders
- **THEN** it shows `0–0–0`, no streak badge, and a placeholder/hidden win-rate

### Requirement: The Decks screen offers a collapsible Filters panel with sorting
The Decks screen SHALL provide a **Filters** control that is collapsed (hidden) by default and toggles a panel. When at least one narrowing filter is active, the control SHALL indicate how many are active and offer a **Clear** action that resets the panel to its defaults. The panel SHALL narrow the list by: deck **name** (case-insensitive substring), **aspect** (a deck matches if it contains any selected aspect), and **archetype** (a deck matches if its archetype is any selected value, case-insensitive; archetype chips are drawn from the archetypes present across the user's decks). Narrowing dimensions SHALL be combined with AND. The panel SHALL also set the list **Sort** (**Name** or **Games played**) and **Order** (**Ascending** or **Descending**); the default is Name / Ascending. Sort/Order are not narrowing filters and SHALL NOT count toward the active-filter indicator. When the active filters exclude every deck, the screen SHALL show a "no decks match" state with a Clear action instead of the list.

#### Scenario: Filters are hidden until opened
- **WHEN** the Decks screen first renders
- **THEN** the deck list is shown in full (alphabetical) and the filter controls are collapsed behind a "Filters" toggle

#### Scenario: Filtering by aspect narrows the list
- **GIVEN** decks with some Villainy decks and some non-Villainy decks
- **WHEN** the user opens Filters and selects the Villainy aspect
- **THEN** only decks that include Villainy are listed
- **AND** the Filters control shows one active filter with a Clear action

#### Scenario: Sorting by games played, descending
- **GIVEN** decks with differing game counts
- **WHEN** the user sets Sort = "Games played" and Order = "Descending"
- **THEN** the most-played deck is listed first
- **AND** the active-filter count is unchanged (sort is not a narrowing filter)

#### Scenario: Combined filter + sort
- **GIVEN** the user selects the Villainy aspect and Sort = "Games played" (Descending)
- **THEN** only Villainy decks are listed, ordered most-played first

#### Scenario: No matches shows a clear affordance
- **GIVEN** active narrowing filters that exclude every deck
- **WHEN** the list would be empty
- **THEN** a "no decks match your filters" message with a Clear action is shown
- **AND** tapping Clear restores the full list

### Requirement: Stats are symmetric across both decks in a game
Recording one game `{playerDeckId, opponentDeckId, outcome}` SHALL update BOTH decks' records. A deck's overall W-L-D, win%, streak, and matchups SHALL count games where it appears on EITHER side, read from its own perspective (player side: `player_win`=Win; opponent side: the mirror). Selecting one deck for both sides SHALL count the game twice for that deck.

#### Scenario: One game, both decks
- **WHEN** a game is recorded with A as player, B as opponent, outcome `player_win`
- **THEN** A gains a win vs B AND B gains a loss vs A
- **AND** the matchup appears (mirrored) on both decks' detail screens

#### Scenario: Mirror counts twice
- **WHEN** a decisive game is recorded with A as both player and opponent
- **THEN** A's totals gain one win AND one loss

### Requirement: A game versus Random counts for the real deck
`"__random__"` MAY be selected on EITHER side. When one side is Random and the other is a real deck, the game SHALL be recorded and SHALL count toward the real deck's overall W-L-D, win%, and streak (from that deck's perspective), and SHALL appear under a single **"Random"** row in that deck's matchups breakdown so the rows sum to the overall total. `"__random__"` SHALL accrue no record of its own. A game with Random on BOTH sides is not recordable.

#### Scenario: Random game counts + a Random row
- **GIVEN** deck A with no games
- **WHEN** a game is recorded with A as player, opponent Random, outcome `player_win`
- **THEN** A's overall record is `1–0–0`
- **AND** A's matchups show a "Random" row reading `1–0–0`
- **AND** no deck record exists for `"__random__"`

### Requirement: The deck detail screen shows stats, streak, and matchups grouped by event
Tapping a deck SHALL open a detail view: name + aspects + leader + archetype + notes; an overall card with the emphasized win%, W-L-D, and streak; and a **matchups** list grouped under event headers (most-recent group first, an "Other" group for untagged games last). Each matchup row SHALL show the opponent name (or "Random"), W-L-D from this deck's perspective, and win%. Named-opponent rows SHALL expose an inline-editable archetype tag and strategy comments persisted to the matchup record.

The actions area SHALL include two side-by-side **default checkboxes** — one for the Player side (silver accent) and one for the Opponent side (gold accent) — followed by **Game History**, **Bulk Add Games**, **Edit**, and **Delete**. Each checkbox is a toggle: tapping it when **unchecked** sets this deck as the default for that side and immediately selects it in the corresponding loadout slot; tapping it when **checked** clears the stored default and resets that loadout slot to Random (`"__random__"`).

#### Scenario: Default checkbox toggles on and off
- **GIVEN** a deck that is not the Player or Opponent default
- **WHEN** the user taps "Default · Player"
- **THEN** `settings.defaultDeckId` is set to this deck and the Home Player dropdown updates
- **WHEN** the user taps "Default · Player" again (checkbox is now checked)
- **THEN** `settings.defaultDeckId` is cleared to `null` and the Player dropdown resets to Random

#### Scenario: Matchups grouped by event
- **GIVEN** deck A has games tagged "PETRANAKI" (vs B) and "LOCALS" (vs C)
- **WHEN** the user opens A's detail
- **THEN** the matchups are grouped under PETRANAKI and LOCALS headers
- **AND** each row shows the opponent, W-L-D, and win%

#### Scenario: Inline matchup notes persist
- **WHEN** the user edits a named matchup's archetype or comments and confirms
- **THEN** the value is saved to that `(deck, opponent)` matchup record and survives reload
- **AND** the Random row exposes no notes editor

### Requirement: Games are recorded in-game and bulk-added
Game records SHALL be created two ways: by ending a game in the life counter (the outcome prompt), and via a **Bulk Add** flow that lets the user pick a player deck + an opponent (a deck or Random) and enter counts of Wins / Losses / Draws (plus an optional event tag + comment) to create that many records at once. There is no GLOBAL game-list/editor screen; instead each deck exposes a per-deck **Game History** view (a read-only log grouped by opponent, with per-game delete — see its own requirement). Game records are otherwise managed in aggregate (a deck's matchup stats are derived from them, and deleting a deck cascades its game records). Bulk Add SHALL return to the originating deck's detail screen.

#### Scenario: Bulk add backfills a matchup
- **GIVEN** deck A and opponent B
- **WHEN** the user bulk-adds 4 wins / 10 losses / 0 draws with event "PETRANAKI"
- **THEN** 14 game records are created for (A, B) with that event
- **AND** any existing matchup notes for (A, B) are NOT overwritten

#### Scenario: Bulk Add returns to the deck detail
- **GIVEN** the user opened Bulk Add from deck A's detail
- **WHEN** the user saves or cancels
- **THEN** the app returns to deck A's detail screen (not a games list)

### Requirement: A deck's Game History lists its games classified by opponent, with add and edit
The deck detail SHALL offer a **Game History** action opening a per-deck history of every recorded game involving that deck, **grouped by opponent** so the user can see their record "against deck X". Each opponent SHALL be one card showing the opponent name (or "Random"), the W-L-D + win% **from this deck's perspective**, a win-rate bar, and the individual games newest-first. Each game row SHALL show a Win/Loss/Draw result chip (from this deck's perspective), its event tag (if any), its date, and its comment (if any).

This view is a **game LOG**, distinct from the symmetric matchup stats: each game appears EXACTLY ONCE, keyed by its opponent, so an opponent group's W-L-D equals the count of its listed rows. A mirror (the deck on both sides) appears once under a self-group (rather than counting twice as the aggregate stats do). Groups SHALL be ordered by game count descending (opponent name ascending as a tie-break). A header SHALL summarize the total game count + overall log record. When the deck has no games, an empty-state message SHALL be shown.

**Add game:** A **"+ ADD"** button in the screen header SHALL open a single inline add-form (only one may be open at a time; the button is hidden while the form is open). The form accepts: **opponent** (all decks + Random; required to enable saving), **result** (W / L / D from this deck's perspective; required), optional **event tag**, and optional **comment**. On save, the game is recorded with this deck as the player side and the form closes. On cancel, no change is made.

**Edit game:** Each game row SHALL offer an **edit** (✎) affordance that expands the row in-place to show the current outcome (W / L / D chips), event, and comment, all editable. Saving patches the record and collapses the row; cancelling discards changes. The opponent stays fixed in edit mode (to change opponents, delete and re-add).

**Delete game:** Each game row SHALL offer a **delete** (✕) affordance that, after confirmation, removes the record (updating stats immediately) without deleting the matchup's strategy notes.

Back SHALL return to the deck detail.

#### Scenario: Games grouped by opponent with per-opponent record
- **GIVEN** deck A has 1 win + 1 loss vs B and 1 win vs C
- **WHEN** the user opens A's Game History
- **THEN** there is a "B" card reading 1–1–0 (50%) listing both games, and a "C" card reading 1–0–0 listing one game
- **AND** the B card (2 games) is ordered before the C card (1 game)

#### Scenario: Result is shown from this deck's perspective
- **GIVEN** a game where A was the opponent side and the player side lost (`opponent_win`)
- **WHEN** the user views A's Game History
- **THEN** that game shows a **W** chip for A under the player deck's group

#### Scenario: Deleting a game updates stats
- **GIVEN** A's Game History shows a game vs B
- **WHEN** the user deletes that game and confirms
- **THEN** the record is removed, A's and B's stats update immediately, and the (A, B) matchup notes are retained

#### Scenario: Adding a game inline
- **GIVEN** A's Game History is open
- **WHEN** the user taps "+ ADD", picks Opponent = B, selects L, types event "LOCALS", and confirms
- **THEN** a game `{playerDeckId: A, opponentDeckId: B, outcome: opponent_win, event: "LOCALS"}` is recorded
- **AND** the form closes, B's opponent group appears (or updates) in the view, and summary totals update
- **AND** the "+ ADD" button reappears

#### Scenario: Add Game is disabled until an opponent is chosen
- **GIVEN** the add form is open with no opponent selected
- **THEN** the "Add Game" save button is disabled

#### Scenario: Editing a game outcome in-place
- **GIVEN** a game row showing "L" (a recorded `opponent_win` where A was the player side)
- **WHEN** the user taps ✎, changes the result chip to W, and taps Save
- **THEN** the stored `outcome` becomes `player_win`, the chip shows "W", and the opponent group's record updates
- **AND** if the user had tapped Cancel instead, no change would be made

#### Scenario: Empty history
- **GIVEN** a deck with no recorded games
- **WHEN** the user opens its Game History
- **THEN** an empty-state message is shown instead of opponent cards
- **AND** the "+ ADD" button is still visible so the first game can be recorded

### Requirement: Games carry an optional event tag
A game record MAY carry a free-text `event` string (≤ 40 chars). The deck detail SHALL group matchups by event. Event entry SHALL offer suggestions drawn from events already used in the log (most-recent first), and bulk-add SHALL default the event to the most recently used one.

#### Scenario: Event suggestions
- **GIVEN** games already tagged "PETRANAKI" and "LOCALS"
- **WHEN** the user focuses the event field
- **THEN** both values are offered as suggestions, most-recent first

### Requirement: The in-game view shows each side's deck, allows mid-game changes, and gates recording
During a game, each side SHALL display its deck name + aspect dots in a bottom-left bubble (the opponent half's 180° rotation makes each player read their own badge upright); a Random side SHALL render "Random" in italic with no dots. Either side MAY be Random. The badge SHALL be tappable to **change that side's deck mid-game** via a picker listing every deck + Random; the change applies to what gets recorded (the persisted Home loadout is untouched). The divider SHALL show the reset control plus an **end-game** control on one continuous separator line. The end-game control SHALL be **enabled only when at least one side is a real deck** (not Random/unset) and disabled otherwise.

Recording an outcome SHALL be reached ONLY through the explicit **end-game** control, which opens a prompt — `<player>` won / `<opponent>` won / **Draw** / **Don't save** (a Random side reads "Random won"). Choosing a result records it against the current sides; **Don't save** writes no record and returns to the game (it cancels the end-game action). The reset modal's **Return to Home** SHALL exit straight to Home **without** an outcome prompt — leaving a game is a deliberate exit-without-saving, never a recording opportunity.

#### Scenario: Badges identify each side and are tappable
- **GIVEN** the loadout is Player = Bossk, Opponent = Boba4
- **WHEN** a game starts
- **THEN** the player half shows "Bossk" + aspect dots bottom-left and the opponent half shows "Boba4" (rotated upright for the opponent), each tappable to change the deck

#### Scenario: Mid-game deck change
- **GIVEN** an in-game side currently shows "Random"
- **WHEN** the user taps the badge and selects "Bossk"
- **THEN** that side shows "Bossk" and the next recorded game uses Bossk for that side

#### Scenario: End-game gated by at-least-one-real-deck
- **GIVEN** both sides are Random
- **THEN** the end-game control is disabled
- **WHEN** the user changes one side to a real deck
- **THEN** the end-game control becomes enabled

#### Scenario: Return to Home exits without prompting
- **GIVEN** a game is in progress with a real deck on at least one side
- **WHEN** the user opens the reset modal and taps "Return to Home"
- **THEN** the app returns to Home immediately
- **AND** no "How did this game end?" prompt is shown and no game record is written

#### Scenario: Don't save cancels the end-game action
- **GIVEN** the user tapped the end-game control and the outcome prompt is showing
- **WHEN** the user taps "Don't save"
- **THEN** the prompt closes, no record is written, and the game continues

#### Scenario: A Random opponent still records for the player
- **GIVEN** Player = Bossk, Opponent = Random
- **WHEN** the user ends the game and chooses "Bossk won"
- **THEN** a game `{playerDeckId: Bossk, opponentDeckId: "__random__", outcome: player_win}` is recorded (counting for Bossk), and the app returns Home

### Requirement: Decks, matchups, and games persist with versioned migration
Decks, matchups, and games SHALL persist in local storage (storage version 3) and restore on launch. A versioned migration SHALL upgrade earlier storage shapes (v1 single list with the legacy outcome enum; v2 split player/opponent collections) into the v3 single shared list, without data loss. Migration SHALL be idempotent and defensive: a corrupted slot falls back to empty, the version stamp is written only after all writes succeed, and on failure a recoverable backup of legacy keys is preserved and the app does not crash.

#### Scenario: Survives a restart
- **GIVEN** saved decks, matchups, and games
- **WHEN** the app is fully closed and reopened
- **THEN** all of them are restored

#### Scenario: v2 two-collection storage migrates to v3
- **GIVEN** persisted v2 storage with separate `playerDecks` + `opponentDecks`, matchups, and games
- **WHEN** the app launches
- **THEN** all decks merge into the single `decks` list, matchups + games still resolve, `defaultPlayerDeckId` becomes `defaultDeckId`, the legacy keys are removed, and the version stamp is 3

#### Scenario: Corrupted storage falls back safely
- **GIVEN** a corrupted decks value in storage
- **WHEN** the app launches
- **THEN** the in-memory list is empty, a recoverable backup is kept, a warning is logged, and the app does not crash
