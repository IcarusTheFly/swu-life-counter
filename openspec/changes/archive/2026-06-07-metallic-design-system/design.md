## Context

The app's styling grew ad-hoc: `constants/theme.js` holds a few metallic gradients (silver/gold/steel/crimson) + spacing/radii, but screens hand-roll surfaces, borders, and text colors. Home is a dark dashboard (featured card + ranked rows + Play Now over the neutral starfield). The provided screenshot sets a new bar: **brushed-silver metallic surfaces with dark text and gold-glow accents**, a compact header stat bar, and metallic deck cards. We keep the space backdrop and the bottom-tab icons.

## Goals / Non-Goals

**Goals:** a reusable **design system** (tokens + components); a metallic + gold restyle applied app-wide; the Home redesign per the screenshot; better contrast; empty/overflow coverage; the deck-detail back-nav fix.

**Non-Goals:** changing game rules, deck/game data, or storage; replacing the space backdrop or the tab icons; a heavy life-counter redesign (minimal there); a navigation library.

## Decisions

**1. Design system = expanded tokens + a `components/ui/` kit.**
Grow `constants/theme.js` into the single token source: the metallic gradients, a **gold** secondary/glow accent, a **contrast-tiered text scale** (primary/secondary/muted on both light-metal and dark-space surfaces), surface + border tokens, a type scale, spacing (have), radii (have), and elevation. Add `components/ui/` with the recurring pieces: `MetalCard` (brushed-silver beveled surface), `MetalButton` (silver), `PrimaryButton` (silver with a **gold glow**), `HeaderStat` (icon + label + value), `SectionLabel`, `SelectRow` (full-width labeled dropdown), `Sparkline`. Screens compose these instead of bespoke styles. *Rejected: a separate design-system npm package* — overkill; in-repo tokens + components are enough and keep it pure/testable.

**2. Metallic-silver surfaces over the space backdrop; gold for emphasis; high contrast.**
Cards/header/buttons/tab-bar become brushed **silver** (light) with **dark** text — high contrast — floating over the **unchanged** dark starfield (gaps show space). **Gold** is the secondary accent: the primary CTA glow, the crown, and selected/active highlights (silver alone is flat). Tab-bar icons re-tint dark for the lighter bar; our Home/Decks/Settings glyphs stay.

**3. Home header = a compact metallic stat bar (no title banner, no empty top space).**
Replace the title line + stat strip with one **metallic header bar**: **Decks** (our `DeckIcon`) · **Games** (a crossed-**sabers** icon, per the screenshot) · **Top Deck** (a **crown** icon + the top deck's name & record). It sits just below the safe-area inset (the empty space above is removed). The app name now lives on the launcher/splash, not a Home banner. The header's Top Deck **replaces** the separate featured top-performer card.

**4. Metallic deck cards — numbers-only record + a recent-form sparkline.**
Each card: an aspect-colored edge, the deck **name** (dark, high contrast), its **record as numbers only** (`15-5-2`; W-L when no draws — never the "W-L-D" letters), a small **sparkline** of recent form, and a **TEST ›** action. Win% is not shown on the card (it still drives ranking + the header's Top Deck); per-opponent detail stays in deck detail.

**5. Matchup section renamed; Player/Opponent on separate rows.**
Drop the "Quick Test" name (→ **"New Test Game"**, settle in apply). The Player and Opponent selectors are each a **full-width `SelectRow`** (label + wide dropdown) on its own line, so long deck names read fully; the gold-glow **Play Test Game** button sits below.

**6. Empty & overflow coverage.**
No decks → a metallic "Create your first deck" CTA; the header shows "—" for Top Deck and 0 games; Play still works (Random). Large library → the YOUR DECKS list is capped on Home to the top ~8 (by performance) with a **"See all N decks ›"** → Decks tab, so Home stays compact and never runs away.

**7. Sparkline + record from pure, tested helpers.**
Add `recentForm(deckId, games, limit)` to `context/deckStats.js` → an ordered list of recent results (and/or a cumulative net-W/L series) the `Sparkline` renders. Reuse the existing record formatter (numbers-only). Unit-test edge cases: 0 games, 1 game, all-wins/all-losses, draws, limit cap, malformed records.

**8. Deck-detail back is origin-aware.**
`App.jsx` tracks where a deck detail was opened from (`"home"` vs `"decks"`). Back returns there, and the active tab reflects the origin (Home-opened deck → Home tab active; Decks-opened → Decks tab). Sub-screens (game history) still return to the deck detail, which then returns to the origin.

**9. Life counter stays minimal.**
The in-game screen only picks up token-level tweaks (shared colors/typography); its layout, controls, and the initiative bubble are unchanged.

## Risks / Trade-offs

- **Light-silver UI legibility over a dark starfield** → dark text on silver is high-contrast; reserve light/space-dark text only for on-backdrop labels. Verify contrast on web.
- **Big restyle touching many screens** → the design-system kit limits blast radius (screens change to *use* components, not restyle individually); the life counter is deliberately minimal.
- **Sparkline on sparse data** → the helper handles 0/1-game and draws; the card shows a flat/empty sparkline rather than a broken one.
- **Home list runaway with many decks** → cap + "see all" (logged, not silently truncated).

## Migration Plan

Pure UI + a pure helper; no data/storage migration. Rollback = revert the token/`ui` additions and the screen edits. The playtesting-redesign dashboard is the prior state.

## Open Questions

- Final name for the matchup section ("New Test Game" vs "Test a Matchup" / none).
- Sparkline semantics: last-N raw W/L line vs cumulative net trend — pick what reads best in apply.
- Home deck-list cap (default ~8) — tune to real libraries.
