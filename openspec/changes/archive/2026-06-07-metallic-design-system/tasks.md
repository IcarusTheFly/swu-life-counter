# Tasks

## 1. Design system (tokens + UI kit)
- [x] Expand `constants/theme.js` into the single token source: add a **gold** glow accent, **contrast text tiers** (primary/secondary/muted for light-metal and dark-space surfaces), a **type scale**, **surface + border** tokens, and **elevation**; keep the existing silver/gold/steel/crimson gradients, spacing, and radii.
- [x] Add `components/ui/MetalCard.jsx` — a brushed-silver beveled surface built from tokens.
- [x] Add `components/ui/MetalButton.jsx` — a silver metallic button built from tokens.
- [x] Add `components/ui/PrimaryButton.jsx` — a silver button with a **gold glow** for the primary CTA.
- [x] Add `components/ui/HeaderStat.jsx` — an icon + label + value stat cell.
- [x] Add `components/ui/SectionLabel.jsx` — a section heading (e.g. "YOUR DECKS").
- [x] Add `components/ui/SelectRow.jsx` — a full-width labeled dropdown row.
- [x] Add `components/ui/Sparkline.jsx` — a small recent-form chart driven by points.

## 2. Icons
- [x] Add `icons/CrownIcon.jsx` for the header's Top Deck cell.
- [x] Add a crossed-`icons/SabersIcon.jsx` for the header's Games cell (per the screenshot).
- [x] Reuse the existing `DeckIcon` for the header's Decks cell; keep the existing Home / Decks / Settings tab-bar icons unchanged.

## 3. Home dashboard
- [x] Replace the title banner + stat strip with a metallic **header stat bar** (Decks/Games/Top Deck + icons); remove the empty top space so the header sits just below the safe-area inset.
- [x] Render the **YOUR DECKS** list as metallic deck **cards**: aspect-colored edge, deck name (dark, high contrast), **numbers-only record** (`15-5-2`; `W-L` with no draws), a recent-form **sparkline**, and a **Test** action; do NOT show win% on the card.
- [x] Rename the matchup section (drop "Quick Test" → "New Test Game"); make **Player** and **Opponent** each a full-width `SelectRow` on its own line; place the gold-glow **Play Test Game** button below.
- [x] Implement the **empty state** (no decks → metallic "create your first deck" CTA; header Top Deck "—", Games `0`; Play still works with Random).
- [x] Implement the **overflow state** (cap the Home list to the top ~N by performance with a "See all N decks ›" affordance to the Decks tab).
- [x] Keep the shared space backdrop behind the metallic dashboard; verify portrait + landscape reachability.

## 4. Recent-form helper + record formatting (pure, tested)
- [x] Add `recentForm(deckId, games, limit)` to `context/deckStats.js` returning ordered recent-form points for the `Sparkline`.
- [x] Add Node tests for `recentForm` edge cases: 0 games, 1 game, all wins, all losses, draws, `limit` cap, and malformed records.
- [x] Add a Node test for the numbers-only record formatter (`15-5-2` with draws; `8-3` without; never the "W-L-D" letters).

## 5. App-wide restyle
- [x] Restyle `DecksScreen.jsx` with the design-system tokens + `components/ui` (silver surfaces, dark text, gold accent, high contrast).
- [x] Restyle `SettingsScreen.jsx` with the design system.
- [x] Restyle `DeckDetailScreen.jsx` with the design system.
- [x] Make the bottom tab bar metallic with dark-tinted icons; keep the Home/Decks/Settings glyphs.
- [x] Apply only **token-level** changes to the life counter (shared colors/typography); no layout, control, or initiative-bubble changes.

## 6. Back-navigation fix
- [x] Track the deck-detail **origin** (`"home"` vs `"decks"`) in `App.jsx` when a deck detail is opened.
- [x] Make the deck-detail Back control and the Android hardware back return to the origin; make the active tab reflect the origin (Home-opened → Home tab; Decks-opened → Decks tab); ensure sub-screens (game history) return to the deck detail, then to the origin.

## 7. Verification
- [x] `npm test` is green (including the new `recentForm` and record-formatter tests). — 194 pass / 0 fail.
- [x] Web portrait + landscape DOM checks: header bar with the 3 stats; numbers-only records; a sparkline present on cards; stacked full-width Player/Opponent rows; the empty state and the overflow (cap + see-all) states; opening a deck from Home → Back returns to Home; contrast of dark text on silver surfaces.
- [ ] Native (device) manual pass across Home, Decks, Settings, deck detail, and the life counter. — left for the user's device run (web verified here).

## 8. Post-review adjustments
- [x] Fix the header stat-bar **alignment**: `HeaderStat` uses a fixed two-band cell (icon + label band, then a value band indented under the label) and the header row top-aligns, so the Top Deck cell's extra record line no longer drags the Decks / Games cells out of line. Verified via DOM: labels share top, values share top, each value sits under its label.
- [x] Relocate the **Exit** control from Settings to **Home** (Android/web; omitted on iOS). Extracted `utils/exit.js` `platformSupportsExit(os)` (pure) + `__tests__/exit.test.js`; updated the `home-screen` and `settings` delta specs.
- [x] Fix the **header looking broken** (labels collapsed, cells crammed): rebuilt `HeaderStat` as label-on-top + icon/value row, gave the cells balanced widths (Decks/Games `flex 1`, Top Deck `flex 1.8`) so the **DECKS / GAMES labels always show**. Added a pure, tested `homeHeaderModel(decks, games)` (Home header data + placeholder logic) in `context/deckStats.js` + `__tests__/homeHeader.test.js`; updated the header spec (labels always visible).
- [x] Remove the per-card **rank number** from the Home YOUR DECKS list (visual noise); updated the deck-list spec + scenario.

## 9. Second-pass polish
- [x] **Home header → top app-bar**: linked to the top edge (full-bleed, not a floating card), restored the **"SWU PLAYTESTING"** brand heading, and made it **shorter** (86 → 74px). Updated the `home-screen` "app entry point" requirement + scenario.
- [x] **Player / Opponent rows shorter**: `SelectRow` trigger 48 → 42px (helps landscape a lot).
- [x] **Exit more opaque** (`rgba 0.06` → solid `#2c1618`) and **hidden in landscape** (it fell behind the tab bar). Added pure `homeExitVisible(os, isLandscape)` + tests; updated the `home-screen` exit scenarios.
- [x] **Landscape sweep (all views)**: DOM-verified Home / Decks / Settings / Deck Detail at 880×420 — no horizontal overflow, tab bar clear. Added a cross-cutting **landscape-integrity** requirement to `visual-design`.
- [x] **DeckDetail matchups**: removed the **"+ archetype"** inline field; matchup **notes are read-only until an explicit Edit** (Save/Cancel); recolored the off-theme blue Save button to gold. Updated the `decks` deck-detail requirement.
- [x] **Bulk Add — "Create" deck button**: fixed the misalignment (flexed input now `minWidth: 0` so the button stays on the row) and changed the off-theme **blue → gold** (also the picker's selected-row highlight + check).
- [x] **Settings — merged the two animation toggles** into one "Enable animations" switch that drives both `enableAnimations` and `animatedBackground`. Updated the `settings` "Animated background" requirement.

## 10. Header title + icon polish
- [x] **Brand title centered + emphasized** (15px, wider tracking) with a full-bleed **divider groove** separating it from the stat row. Header trimmed back to ~83px. Updated the `home-screen` "app entry point" requirement + scenario.
- [x] **Rebuilt the crossed-`SabersIcon`** so it reads as two lightsabers (thick hilt + thinner blade with a rounded tip + pommel per saber) instead of a plain "X".
- [x] **Active tab indicator** recolored from gold to the **same dark tone as the selected icon** (`TEXT.onMetal.primary`) and widened 30 → 44px, so the selected tab reads as one cohesive dark mark rather than a stray gold line.

## 11. Third-pass polish
- [x] **PrimaryButton**: dropped the gold ring/contour — now a **gold-metal surface** with a neutral bevel + dark text (the "golden touch" is the fill, not a surrounding outline). Updated the `design-system` spec.
- [x] **Deck selectors show ALL aspect dots** (not one): `SelectRow` + the shared `DropdownSheet` render every aspect dot from the option's `aspects`; Home passes them through. The special **Random** option renders in **italic**. Updated the `home-screen` spec.
- [x] **DeckDetail matchups → display-only**: removed the **"+ ADD" matchup** control and the **"Add notes"** affordance; existing notes stay read-only with an explicit **Edit**. Updated the `decks` spec.
- [x] **DeckDetail identity labels**: leader/archetype now render as **`Leader: …`** / **`Archetype: …`** (field name prefixed). Updated the `decks` spec.
- [x] **Landscape compaction**: compacted the **tab bar**, the **Home header**, and the **Player/Opponent** rows (`compact` `SelectRow`) so **Play Test Game stays visible** even at 760×360; bounded the landscape columns (`minHeight: 0` + `flex: 1` scrollers) so **panels don't grow outside the visible area**. Added pure landscape gate already covered by `homeExitVisible`; updated the `home-screen` orientation requirement.
- [x] **Thorough cross-screen verification (portrait + landscape)**: Home / Decks / Settings / DeckDetail / DeckEdit / GameHistory / Bulk Add / in-game — DOM-checked for horizontal overflow, off-screen panels, and the requested fixes. No console errors; 206 tests pass.
- [x] **"ui" text**: traced to an **event tag** the user entered on a game — the MATCHUPS list groups matchups under event headers, so "ui" was the user's own `game.event` value (opponent "yu"), not a UI bug.
- [x] **Labeled matchup event headers**: the event group header now reads **"Event: &lt;tag&gt;"** (muted `Event:` prefix + the tag), matching the `Leader:` / `Archetype:` identity labels; the untagged group stays "OTHER". Updated the `decks` spec.

## 12. Header naming + centering + README
- [x] **Centered header stats**: `HeaderStat` cells now center their label + icon/value, so the three stats read as a balanced, centered row (verified: labels centered on the cell, icon+value pairs centered).
- [x] **Crown is not gold**: the Best Deck crown uses the **same neutral dark tone** (`TEXT.onMetal.secondary`) as the Decks/Games icons (verified fill `#3b3e45`); dropped the now-unused `GOLD_DEEP` import from Home.
- [x] **"Top Deck" → "Best Deck"** (performance-based) header stat; **"Your Decks" → "Top Decks"** for the capped best-first Home list (empty-state CTA keeps "Your Decks").
- [x] **Specs updated**: `home-screen` (Best Deck, centered cells, crown-not-gold, TOP DECKS list) and `design-system` (gold no longer applied to the crown / active tab; reserved for the primary CTA + selections).
- [x] **README updated**: Home dashboard (top app-bar title + centered Decks/Games/Best Deck, Top Decks cards, New Test Game, Exit-on-Home), metallic deck cards (numbers-only record + sparkline), display-only matchups with labeled event headers, merged Animations toggle, and the silver+gold look & feel.
- [x] **README screenshots**: captured real phone-sized PNGs of the five main screens (Home, Decks, Deck detail, Settings, Life counter) via headless Chrome (`puppeteer-core`, no saved dependency) with seeded demo data, saved under `docs/screenshots/`, and embedded a preview table at the top of the README.
- [x] **Home deck list → top 4, no see-all**: lowered the Home cap from 6 → **4** decks and **removed the "See all N decks" link** (the Decks tab is already one tap away) so the **Play Test Game** button is never pushed off-screen. Removed the now-unused `MetalButton`/`onOpenDecks`/`seeAll` bits. Updated the `home-screen` spec (cap = top 4, no see-all) + README, and re-captured the Home screenshot.
