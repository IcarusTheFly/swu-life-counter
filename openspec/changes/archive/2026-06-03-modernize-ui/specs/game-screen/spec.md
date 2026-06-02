## ADDED Requirements

### Requirement: The in-game divider uses a hamburger menu control
The in-game divider's left control (which opens the in-game options dialog — Reset Life / Return to Home) SHALL display a **hamburger menu** icon (three horizontal lines) instead of a refresh/restart arrow. The control SHALL keep its existing position, metallic circular button, and tap-target size, and SHALL carry an accessibility label indicating it opens a menu.

#### Scenario: Menu icon is shown in-game
- **WHEN** a game is in progress
- **THEN** the left divider control shows a hamburger (three-line) menu icon
- **AND** no refresh/restart arrow icon is shown

#### Scenario: Menu control still opens the options dialog
- **WHEN** the user taps the hamburger control
- **THEN** the options dialog opens with "Reset Life", "Return to Home", and "Cancel"

#### Scenario: Accessible name reflects a menu
- **WHEN** a screen reader focuses the control
- **THEN** its accessible name conveys that it opens a menu (e.g. "Open menu: reset life or return home")

### Requirement: The initiative indicator is a labeled, transparent control with clear states
The in-game initiative indicator SHALL be a **transparent** control (a translucent pill, NOT a metallic surface) that **displays the word "INITIATIVE"** using resolution-independent text (not a bitmap image), so it stays crisp at any size and in any orientation. The bubble SHALL have its **own deep-space gradient fill** (a deep indigo/violet nebula), visually distinct from the navy app backdrop, so it reads as its own little space window. It SHALL show two clearly distinct states: **unclaimed** (dimmed, grey text + faint border) and **claimed** (the claiming side's team color for the text + a **single** border — no second ring). Tapping the (compact) bubble — and only the bubble, not the whole band — SHALL claim initiative for that side when unclaimed. Claiming SHALL run a one-shot **"pop"**: the bubble grows OVERSIZE slowly (animated) over roughly one second, then settles back to normal size and rests there. The pop is driven by the claim state-transition (so it reliably survives the re-render) and is **gated on the "Enable animations" (reduce-motion) toggle** — when off, the bubble becomes claimed instantly with no grow/settle.

The bubble SHALL be small and **centered within the RIGHT HALF** of the player's area (its horizontal center at ~75% of the width) — the opposite side from the bottom-left deck badge — so the two never overlap regardless of deck-name length or orientation, and so the bubble stays well clear of the screen edges even at its peak pop size. (The opponent half's 180° rotation flips this consistently for each player.)

#### Scenario: Claiming initiative
- **WHEN** the user taps an unclaimed side's initiative pill
- **THEN** that side's pill moves to the claimed state (team-color text + single border)
- **AND** the other side's pill returns to the unclaimed (dimmed) state

#### Scenario: Crisp in landscape
- **GIVEN** an in-game session in landscape orientation
- **WHEN** the initiative token renders
- **THEN** it is sharp text (not a cropped bitmap) and sized to read clearly without clipping

#### Scenario: Pop on claim
- **WHEN** the user taps an unclaimed initiative bubble (animations on)
- **THEN** the bubble grows oversize slowly over ~1 second and then settles back to normal size as it becomes claimed

#### Scenario: Pop respects reduce-motion
- **GIVEN** the global "Enable animations" setting is off
- **WHEN** the user claims initiative
- **THEN** the bubble becomes claimed instantly, with no grow/settle pop

#### Scenario: Initiative bubble never overlaps the deck badge
- **GIVEN** a deck with a long name on a side
- **WHEN** the game renders in either portrait or landscape
- **THEN** that side's deck badge (bottom-left) and its initiative bubble (centered in the right half) do not overlap

### Requirement: Recording a result indicates which deck is the player vs the opponent
Any flow that records a game result SHALL make it unambiguous which deck is the **player's** and which is the **opponent's**. The in-game end-game outcome prompt SHALL label its two win options by side — e.g. `You won · <player deck>` and `Opponent won · <opponent deck>` — rather than two bare `<deck> won` options, and SHALL **tint each win option with that side's TEAM color** (the player option uses the player's team color, the opponent option uses the opponent's), with text chosen for contrast, so the two are clearly different colours. These SHALL be **consistent with the in-game half tints**: the player's half (its lines, press-feedback, and the player's deck) uses the **Player** color and the opponent's half uses the **Opponent** color — the colour follows the physical side, so the "You won"/"Opponent won" buttons match the halves they refer to (not inverted). The **opponent's** win option SHALL appear **above** the player's, mirroring the table layout (the opponent's half is the top of the screen, the player's the bottom). When a side is **Random** (no real deck), its win button SHALL render the word "Random" in **italic** (consistent with the in-game deck badge and Game History). The prompt's remaining options SHALL be a **Draw** in its own distinct tone (NOT the same as Cancel) and a neutral **Cancel** (a plain "back out" — NOT a destructive-styled "Don't save"); the Cancel SHALL match the neutral Cancel of the in-game reset/menu dialog. The per-deck Game History add-game form SHALL present the deck whose history is shown as the player (a `YOU` chip with the deck name) versus a separate opponent picker, with the W/L/D result framed from that deck's perspective (e.g. a `Result for <deck>` label).

A long deck name SHALL NOT break the outcome prompt's layout: the button labels SHALL stay centered and wrap to (at most) a second line cleanly, and an overly long name MAY be truncated with an ellipsis.

#### Scenario: In-game outcome prompt is side-labeled
- **GIVEN** Player = Bossk and Opponent = Quinlan
- **WHEN** the user ends the game and the outcome prompt opens
- **THEN** the prompt lists, top to bottom: "Opponent won · Quinlan" (tinted the opponent's team color), "You won · Bossk" (tinted the player's team color), a distinct "Draw" tone, and a neutral "Cancel"

#### Scenario: Game History add form shows you-vs-opponent
- **WHEN** the user opens the add-game form in a deck's Game History
- **THEN** that deck is shown as the player (a "YOU" chip) alongside a separate opponent picker
- **AND** the result control is framed as that deck's (e.g. "Result for <deck>")

### Requirement: In-game chrome is legible over the animated space
With the shared animated space now showing behind the in-game halves, the life totals, +/− controls, deck badges, divider, and initiative token SHALL remain legible (e.g. via text shadows / translucent surfaces) over the moving backdrop.

#### Scenario: Readability over the backdrop
- **WHEN** a game is in progress with the animated background on
- **THEN** the life numbers, buttons, deck badges, and initiative token are clearly legible against the space + curved-line layers
