## MODIFIED Requirements

### Requirement: Home screen is the app entry point
The app SHALL display a Home screen on launch (after font and settings load), instead of mounting the life counter directly. The Home screen SHALL lead with a **metallic top app-bar linked to the top edge** — full-bleed (spanning the full width, flush to the top below the safe-area inset), NOT a floating inset/rounded card. The bar SHALL carry a **centered "SWU PLAYTESTING" brand heading** that is visually separated from the stat cells by a **divider line**, and SHALL stay compact (a heading + one stat row, no large title banner and no empty space above it).

#### Scenario: Cold launch shows Home
- **WHEN** the user opens the app from a fresh launch
- **THEN** the Home screen is shown after fonts and persisted settings have loaded
- **AND** the life counter is not visible

#### Scenario: Home leads with a top-attached header bar
- **WHEN** the Home screen is rendered
- **THEN** the first content below the safe-area inset is a metallic top app-bar that spans the full width and is attached to the top edge (not a floating, inset, rounded card)
- **AND** the bar shows the **centered** "SWU PLAYTESTING" brand heading above the stat cells, with a **divider line** separating the title from the stats
- **AND** there is no large title banner or empty space above the bar

### Requirement: Home screen provides Start Game, Settings, and Exit options
The Home screen SHALL be a **metallic dashboard**, not a menu — surfacing the user's playtesting at a glance and offering a fast way to play. Its sections, top to bottom, SHALL be:
- a metallic **header stat bar** (see "Home shows an at-a-glance stats overview");
- the **TOP DECKS** metallic card list (see "The Home deck list shows each deck's test record");
- the **matchup section** (see "Home exposes inline deck dropdowns and a Decks entry point"); and
- an **Exit** control below the matchup section, on every platform **except iOS** (where Apple HIG forbids programmatic termination, so it SHALL be omitted), and only in **portrait** (the short landscape layout has no room for it above the tab bar, so it SHALL be hidden in landscape).

Navigation to **Decks** and **Settings** is provided by the **bottom tab bar** (see the `navigation` capability), NOT by controls on Home. **Exit** is provided by **Home** (Android/web only), NOT by Settings — Settings is a pure preferences surface. Tapping Exit SHALL close the app via the platform-appropriate mechanism — Android `BackHandler.exitApp()`, web `window.close()` (which may no-op for tabs the user opened themselves — a browser constraint, not a bug). All sections SHALL be metallic surfaces floating over the shared space backdrop. Home content SHALL be scrollable when it exceeds the viewport, and all tappable controls SHALL meet the minimum tap-target size.

#### Scenario: Home is a metallic dashboard
- **WHEN** the Home screen renders with decks + recorded games
- **THEN** a metallic header stat bar, a TOP DECKS metallic card list, and the matchup section are shown over the space backdrop

#### Scenario: Area navigation is the tab bar, not Home
- **WHEN** the Home screen renders
- **THEN** Home itself does NOT render Decks or Settings buttons (those live in the tab bar)

#### Scenario: Exit lives on Home (Android/web)
- **GIVEN** the app runs on Android or web
- **WHEN** the Home screen renders
- **THEN** an Exit control is shown below the matchup section
- **AND** Settings does NOT render an Exit control
- **WHEN** the user taps Exit
- **THEN** the app attempts to close via the platform mechanism (Android `exitApp()`, web `window.close()`)

#### Scenario: No Exit on iOS
- **GIVEN** the app runs on iOS
- **WHEN** the Home screen renders
- **THEN** no Exit control is rendered

#### Scenario: Exit is hidden in landscape
- **GIVEN** the app runs on Android or web in a landscape viewport
- **WHEN** the Home screen renders
- **THEN** the Exit control is NOT rendered (it would collide with the bottom tab bar in the short layout)
- **WHEN** the device returns to portrait
- **THEN** the Exit control is shown again

#### Scenario: Controls meet minimum tap-target size
- **WHEN** any Home control (a deck card's Test action, Play Test Game, or a dropdown) is rendered
- **THEN** its tappable area is at least 44 × 44 points

### Requirement: Home shows an at-a-glance stats overview
The Home screen SHALL display its at-a-glance overview as the **metallic header bar** — three compact, read-only stat cells, each with an icon: **Decks** (the existing decks icon, showing the deck count), **Games** (a crossed-sabers icon, showing the recorded-game count), and **Best Deck** (a **crown** icon plus the best deck's name and record). The "Best Deck" naming reflects that it is the **performance-ranked** best deck. The crown SHALL use the **same neutral dark tone as the other header icons** (it is **NOT** gold). The header SHALL NOT present a single global "win rate" across all decks (an aggregate win percentage over many decks and matchups is not meaningful). When there is no recorded data, the affected cells SHALL show a neutral placeholder ("—" for Best Deck, `0` for Games) rather than broken or misleading values. Each cell's content (label, icon, value) SHALL be **horizontally centered** within the cell, and the three cells SHALL be visually **aligned** — labels on a common top band, the icon+value centered below — so the cell carrying the most content (Best Deck, with a name plus a record) does NOT push the others out of alignment. Each cell SHALL **always render its label** in full: a narrow cell SHALL NOT clip or collapse its **DECKS** / **GAMES** label to zero width. The header is informational only and SHALL NOT alter recorded data.

#### Scenario: Header reflects tracked counts and the best deck
- **GIVEN** the user has 12 decks, 84 recorded games, and a clear best deck
- **WHEN** the Home screen renders
- **THEN** the header bar shows Decks `12`, Games `84`, and a Best Deck cell with the crown icon plus the best deck's name and record
- **AND** the crown is the same neutral tone as the Decks / Games icons (not gold)
- **AND** the three stat cells are horizontally centered
- **AND** it does NOT show a single global win-percentage figure

#### Scenario: Empty data shows neutral placeholders
- **GIVEN** no games have been recorded
- **WHEN** the Home screen renders
- **THEN** the header's Games cell shows `0` and the Best Deck cell shows "—" rather than broken values

#### Scenario: Header is read-only
- **WHEN** the header bar is displayed
- **THEN** it does not modify any deck, game, or setting (it only reflects stored data)

#### Scenario: Header cells stay aligned regardless of content
- **GIVEN** the Best Deck cell shows a deck name plus a record (more lines than the Decks and Games cells)
- **WHEN** the header bar renders
- **THEN** all three cells' labels share a common top line and their values share a common line below
- **AND** no cell is vertically misaligned relative to the others

#### Scenario: Every header cell shows its label
- **GIVEN** a narrow phone-width viewport
- **WHEN** the header bar renders
- **THEN** the Decks, Games, and Best Deck cells each show their label text in full
- **AND** no label is clipped or collapsed to zero width

### Requirement: Home features a top-performer deck
The Home dashboard SHALL surface the user's **top-performing deck** in the header bar's **Best Deck** cell — the crown icon plus the deck's name and record — NOT as a separate featured card. The top performer SHALL be the deck with the highest win percentage among decks with at least the minimum number of recorded games. When no deck has enough games to rank, the Best Deck cell SHALL fall back to the most-played deck (and, with no decks at all, show "—") rather than a misleading 100%.

#### Scenario: Best deck is surfaced in the header
- **GIVEN** several decks with enough recorded games, one with the highest win%
- **WHEN** the Home screen renders
- **THEN** the header's Best Deck cell shows that deck (crown + name + record)
- **AND** there is no separate featured top-performer card

#### Scenario: Sparse data does not fake a leader
- **GIVEN** no deck has reached the minimum ranked games
- **WHEN** the Home screen renders
- **THEN** the Best Deck cell shows the most-played deck (or "—" when there are no decks) instead of a misleading 100%-from-one-game deck

### Requirement: The Home deck list shows each deck's test record
The Home deck list SHALL be titled **"TOP DECKS"** (it shows only the **top 4** best-performing decks — the full list lives on the Decks tab, with no "see all" link). It SHALL render each deck as a **metallic card** showing, at minimum: an **aspect-colored edge**, the deck **name** in high-contrast (dark) text, the deck's **record as numbers only** (e.g. `15-5-2`; `W-L` form when there are no draws — never the literal "W-L-D" letters), a recent-form **sparkline**, and a **Test** action. The deck's **win percentage SHALL NOT be shown on the card** (win% still drives ranking and the header's Best Deck cell). The list is ordered best-first, but each card SHALL NOT display a numeric **rank badge** (the position number is visual noise and is omitted). A deck with no recorded games SHALL show a neutral "no games yet" indication rather than a misleading 0%.

#### Scenario: A deck card shows a numbers-only record
- **GIVEN** a deck with 15 wins, 5 losses, and 2 draws
- **WHEN** the Home TOP DECKS list renders that deck
- **THEN** the card shows the aspect-colored edge, the deck name, the record as `15-5-2`, a recent-form sparkline, and a Test action
- **AND** the card does NOT show the deck's win percentage

#### Scenario: Record without draws drops the draw figure
- **GIVEN** a deck with 8 wins, 3 losses, and no draws
- **WHEN** the Home TOP DECKS list renders that deck
- **THEN** the card shows the record as `8-3` (never the literal "W-L-D" letters)

#### Scenario: A deck with no games
- **GIVEN** a deck with no recorded games
- **WHEN** the Home TOP DECKS list renders that deck
- **THEN** the card shows a neutral "no games yet" state rather than "0%"

#### Scenario: Deck cards carry no rank number
- **GIVEN** several decks ordered best-first on Home
- **WHEN** the TOP DECKS list renders
- **THEN** no card shows a numeric rank badge (e.g. a leading "1", "2", "3")
- **AND** each card still shows its name, numbers-only record, sparkline, and Test action

### Requirement: Home exposes inline deck dropdowns and a Decks entry point
The Home screen's **matchup section** SHALL be named for starting a test (e.g. **"New Test Game"**) and SHALL NOT be labeled "Quick Test". It SHALL present **Player** and **Opponent** selectors, each as a **full-width row** (label + a wide dropdown) on its own line so long deck names read fully. Each selector draws from the single shared deck list and additionally offers **Random**; selecting in either persists `settings.activeLoadout`. Each **deck** option — both in the dropdown list and in the selected (collapsed) row — SHALL show **ALL of that deck's aspect color dots** (not just one), and the special **Random** option SHALL render in **italic**. A gold-metal **Play Test Game** button SHALL sit below the two rows. The decks shown on Home SHALL open their detail on tap (and Back returns to Home — see the `navigation` capability). The **full** deck list and deck creation are reached via the **Decks** tab, not a Home button. When no decks exist, the selectors SHALL still offer a "Create a deck" affordance and **Play Test Game** SHALL still work (an untracked test).

#### Scenario: The matchup section is renamed and not "Quick Test"
- **WHEN** the Home screen renders
- **THEN** the matchup section's heading reads "New Test Game" (or the settled equivalent), NOT "Quick Test"

#### Scenario: Player and Opponent are full-width rows on separate lines
- **WHEN** the Home screen renders with decks present
- **THEN** the Player selector and the Opponent selector each occupy a full-width row (label + wide dropdown) on its own line
- **AND** each dropdown's options include every deck plus "Random"
- **AND** a gold-metal Play Test Game button is shown below the two rows

#### Scenario: Deck options show all aspect dots; Random is italic
- **GIVEN** a deck with two aspects (e.g. Aggression + Cunning)
- **WHEN** a selector renders that deck (in the open dropdown or as the selected row)
- **THEN** it shows BOTH aspect color dots, not just one
- **AND** the "Random" option is rendered in italic

#### Scenario: Selecting decks updates the loadout
- **WHEN** the user picks Player = deck A and Opponent = deck B in the matchup section
- **THEN** `activeLoadout` becomes `{player1DeckId: A, player2DeckId: B}`
- **WHEN** the user taps Play Test Game
- **THEN** the test game starts with that matchup

#### Scenario: Opening a deck from Home
- **WHEN** the user taps a deck card shown on Home
- **THEN** that deck's detail screen is shown

#### Scenario: Empty state still lets you play
- **GIVEN** no decks exist
- **WHEN** the Home screen renders
- **THEN** the selectors offer a "Create a deck" affordance and Play Test Game still starts an untracked test

### Requirement: The Home screen layout adapts to orientation
The metallic Home dashboard SHALL lay out its content (the header stat bar, the TOP DECKS deck cards, and the matchup section) so it is reachable in BOTH orientations without permanent clipping, scrolling above the bottom tab bar as needed. Portrait MAY use a single scrollable column; landscape SHALL keep the header bar, the deck cards, and the matchup section reachable (e.g. a two-column or scrollable arrangement). In **landscape**, the header bar, the bottom tab bar, and the Player / Opponent selectors SHALL be **compacted** so the **Play Test Game** button stays visible without scrolling, and **no panel SHALL grow outside the visible area** (the scrollable columns clip; nothing renders off-screen or behind the tab bar). Content and behavior SHALL be identical across orientations (a layout adaptation only).

#### Scenario: Landscape keeps the dashboard reachable
- **GIVEN** a short landscape viewport (e.g. 812×375)
- **WHEN** the Home screen renders
- **THEN** the header stat bar, the deck cards, and the matchup section are all reachable (scrolling allowed; nothing permanently clipped) above the tab bar

#### Scenario: Landscape keeps Play Test Game visible and panels contained
- **GIVEN** a short landscape viewport (e.g. 760×360)
- **WHEN** the Home screen renders
- **THEN** the compacted header, tab bar, and selectors leave the **Play Test Game** button visible above the tab bar without scrolling
- **AND** no panel grows outside the visible area and there is no horizontal overflow

#### Scenario: Portrait is a scrollable column
- **GIVEN** a portrait viewport
- **WHEN** the Home screen renders
- **THEN** the dashboard sections are shown in a scrollable vertical stack above the tab bar

## ADDED Requirements

### Requirement: Home handles empty and large deck libraries
The Home dashboard SHALL degrade gracefully at both ends of the deck-library size. When **no decks** exist, Home SHALL show a metallic "create your first deck" call-to-action, the header's Best Deck cell SHALL show "—" and Games SHALL show `0`, and **Play Test Game** SHALL still work (using Random). When **many decks** exist, the Home TOP DECKS list SHALL be **capped to the top 4 decks** by performance so the list stays short and the **Play Test Game** button stays reachable. There SHALL be **no "see all" link** — the full deck list is already one tap away on the **Decks** tab.

#### Scenario: Empty library shows a create-first-deck CTA
- **GIVEN** no decks exist
- **WHEN** the Home screen renders
- **THEN** a metallic "create your first deck" call-to-action is shown in place of the deck card list
- **AND** the header's Best Deck cell shows "—" and Games shows `0`
- **AND** Play Test Game still starts an untracked test (using Random)

#### Scenario: Large library is capped at the top 4, with no see-all link
- **GIVEN** the user has more than 4 decks (e.g. 30 decks)
- **WHEN** the Home screen renders
- **THEN** the TOP DECKS list shows only the **top 4** decks by performance
- **AND** there is **no "See all N decks"** link (the full list lives on the Decks tab)
- **AND** the short list keeps the Play Test Game button reachable
