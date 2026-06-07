## Context

`modernize-ui` left a metallic, space-backed life counter with deck-tracking underneath (decks, win-rates, matchups, game history). Navigation was a `screen` state machine in `App.jsx` (no router); Home was a menu; `context/deckStats.js` exposed per-deck `statsForDeck`. This change turns the product into **SWU Playtesting**.

## Goals / Non-Goals

**Goals:** a standard bottom-tab shell; a Home dashboard centered on which decks perform best; an on-brand playtesting icon; a neutral, denser starfield; the SWU Playtesting name.

**Non-Goals:** a navigation library; a global stats/history screen; any change to game rules, deck/game data, or storage; re-toning the in-game initiative bubble.

## Decisions

**1. Custom bottom tab bar over the existing `screen` state — no router.** `BottomTabBar` (Home/Decks/Settings) is rendered in `App.jsx` below the active screen, inside `ScreenLayout` (for the bottom safe-area inset). Tabs map to screen roots; the active tab derives from the current screen; the bar is hidden during a game and in deck-edit / bulk-add. *Rejected: react-navigation* — heavy for an 8-screen machine that already works.

**2. Home dashboard ranks decks; no global win rate.** A pure `rankDecks(decks, games)` returns `{top, rest, topQualifies}` — best win% among decks with ≥ `MIN_RANKED_GAMES` (5), else the most-played as a non-qualifying fallback. The featured card shows the top performer; the list shows the next decks with explicit rank badges. The stat strip shows counts only — a single win rate averaged across all decks/matchups is not meaningful, so relative performance is expressed by the ranking. Per-deck win% (the ranking value) stays; per-opponent breakdowns live in deck detail.

**3. Exit relocates to Settings.** Home no longer hosts Exit; Settings gains an Exit row (Android/web; omitted on iOS), same `BackHandler.exitApp()` / `window.close()` behavior.

**4. Neutral backdrop, denser field.** `SPACE_GRADIENT`/`SPACE_BASE` → neutral near-black (no blue channel lift); `SpaceBackground` star counts raised (~370 → ~560) keeping the 3-driver animation contract.

**5. Custom-provided icon assets.** The icon / brand art is **custom-authored and provided with the project** (replacing an earlier generated placeholder). It is wired into `app.json` — `icon`, `adaptiveIcon` foreground, `favicon`, and `splash`. Because the Expo web dev server serves a *default* `/favicon.ico` (it does not derive it from `web.favicon`), a `public/favicon.ico` is included so the custom favicon is served at the web root in dev + `expo export`. `app.json` splash/adaptive backgrounds are set to a dark tone.

## Risks / Trade-offs

- **Top performer on sparse data** → `MIN_RANKED_GAMES` guard + a "needs N+ games" treatment instead of a fake 100%.
- **Bottom safe-area on devices** → the bar pads by `useSafeAreaInsets().bottom`; manual device check.
- **Denser starfield cost** → more static leaf views only; motion stays at 3 native-driven loops.
- **Dialog text with long deck names** → confirmation messages truncate the name/event and wrap full-width so they never overflow.

## Migration Plan

Pure UI/identity + assets; no data or storage migration. Rollback = revert the listed files + restore the prior icon assets.

## Open Questions

- Final app name (SWU Playtesting vs. SWU Scrim / Proving Grounds / …) — a future rename if desired.
- Whether the top-performer card should also surface a best/worst matchup signal.
