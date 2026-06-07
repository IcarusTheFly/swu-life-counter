## Why

The app works as a playtesting dashboard, but its styling is ad-hoc and a little flat. This change establishes a **design system** — shared metallic + gold tokens and reusable components — and applies a cohesive **metallic, compact, modern** restyle across the app, led by a redesigned Home (per the provided screenshot). The goal: every screen reads as one branded product, and future screens stay consistent by construction. It also fixes a back-navigation bug, improves contrast, and adds edge-case coverage.

## What Changes

**Design system (new):**
- One source of truth for design tokens — brushed-**silver** metallic gradients + a **gold** secondary / glow accent (matching the app icon), a spacing scale, corner radii, elevation, and a type scale — plus reusable components (metallic surface/card, metallic button, gold-glow primary button, header stat, section header, dropdown row, …). Screens consume these instead of bespoke styles.

**Home redesign** (keep the space backdrop and our bottom-tab icons; ignore the screenshot's flat metal background and its tab icons):
- A compact **metallic header bar** with three stats and icons — **Decks** (our existing decks icon, not the screenshot's card/poker icon) · **Games** (the crossed-sabers icon from the screenshot — kept as-is) · **Top Deck** (a **crown** icon + the top deck's name & record). The empty space above the header is removed.
- Metallic **deck cards** under YOUR DECKS: an aspect-colored edge, the deck name, its **record as numbers only** (e.g. `15-5-2` — drop the "W-L-D" letters), a recent-form **sparkline**, and a **TEST ›** action.
- The matchup section is **renamed** (no longer "Quick Test"), with **Player** and **Opponent** selectors on **separate full-width rows** (room to read long deck names), above the gold-glow **Play Test Game** button.
- Graceful **empty state** (no decks) and **overflow** (many decks) handling.

**App-wide:** Decks, Settings, and deck detail adopt the metallic + gold language. The **life counter** (in-game) gets only **minimal** token-level tweaks.

**Fix:** opening a deck from **Home** returns to **Home** on Back (today it always returns to the Decks tab); opening from Decks still returns to Decks.

**Quality:** improved **contrast** throughout, and **functional tests** for the new pure helpers and edge cases (no decks / single game / large libraries / sparkline / record formatting).

## Capabilities

### New Capabilities
- `design-system`: the shared metallic + gold design tokens and reusable UI components that every screen builds on.

### Modified Capabilities
- `home-screen`: the metallic dashboard — a header stat bar (Decks / Games / Top Deck with icons), metallic numbers-only deck cards with recent-form sparklines, a renamed matchup section with stacked Player/Opponent rows, empty/overflow states, and improved contrast.
- `visual-design`: the metallic + gold language applied app-wide (Decks, Settings, deck detail); the life-counter restyle stays minimal.
- `navigation`: a deck opened from Home returns to Home on Back (origin-aware deck-detail back), while a deck opened from Decks still returns to Decks.

## Impact

- **Code:** a new design-tokens module (expand `constants/theme.js` → a `designSystem`) + `components/ui/*` shared components; `HomeScreen.jsx` (header bar, metallic deck cards, sparkline, stacked Play rows, empty/overflow states); `DecksScreen.jsx`, `SettingsScreen.jsx`, `DeckDetailScreen.jsx` (adopt tokens); `App.jsx` (track deck-detail origin); new `icons/` (crown + crossed-sabers; reuse our decks icon); `context/deckStats.js` (a recent-form helper for the sparkline). The life counter changes are token-level only.
- **Tests:** new pure helpers (recent-form points, record formatting) + edge cases (Node test runner).
- **Dependencies / data:** none added; no migration; the shared space backdrop and bottom-tab icons are unchanged.
- **Verification:** web (portrait + landscape) via DOM measurement; native is a manual device pass.
