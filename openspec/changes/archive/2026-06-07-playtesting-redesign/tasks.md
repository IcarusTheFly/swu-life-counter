## 1. Rename to SWU Playtesting

- [x] 1.1 `app.json` `expo.name` → "SWU Playtesting" (slug + EAS unchanged)
- [x] 1.2 In-app brand title → "SWU PLAYTESTING" (compact header)

## 2. Bottom tab bar (navigation)

- [x] 2.1 `icons/HomeIcon.jsx` (house) for the Home tab
- [x] 2.2 `components/BottomTabBar.jsx` — Home / Decks / Settings, active highlight, bottom safe-area inset; no router
- [x] 2.3 `App.jsx` — render the bar below the active screen; `showTabBar` (hidden in-game + deck-edit/bulk-add); tabs ↔ `screen`; active tab from current screen
- [x] 2.4 Android hardware back stays consistent (non-Home tab → Home; game → Home/discard; Home → OS exit)

## 3. Home dashboard

- [x] 3.1 Pure `rankDecks(decks, games)` (+ `globalStats`) in `context/deckStats.js` with a `MIN_RANKED_GAMES` guard + tests
- [x] 3.2 Featured **top-performer** card (record, win%, "needs N+ games" when below the guard)
- [x] 3.3 Ranked **top-decks** list (rank badges + record + win% + ▶ Test); full list via the Decks tab
- [x] 3.4 **Play Now** loadout (Player/Opponent dropdowns + Play); decks open their detail
- [x] 3.5 Stat strip shows **counts only** (no global win rate); empty/sparse states handled
- [x] 3.6 Orientation: scrolls above the tab bar; landscape reachable; nothing clipped at 812×375

## 4. Space backdrop

- [x] 4.1 `constants/theme.js` — neutral near-black `SPACE_GRADIENT` / `SPACE_BASE` (no blue)
- [x] 4.2 `components/SpaceBackground.jsx` — denser starfield (~560), 3 animated drivers unchanged

## 5. Icon & brand

- [x] 5.1 Custom icon art (provided with the project) at `assets/icon.png` / `adaptive-icon.png` / `favicon.png` / `splash-icon.png`
- [x] 5.2 `public/favicon.ico` included so the custom favicon is served at the web root (dev + `expo export`)
- [x] 5.3 `app.json` splash + Android adaptive `backgroundColor` → dark

## 6. Exit → Settings

- [x] 6.1 Exit removed from Home; `SettingsScreen.jsx` gains an Exit row (Android/web; omitted on iOS)

## 7. Verification

- [x] 7.1 `npm test` green (incl. `globalStats` + `rankDecks`)
- [x] 7.2 Web — tab bar switches/highlights, hidden in-game; dashboard (top performer + ranked decks + Play Now); Settings Exit; landscape; no console errors
- [x] 7.3 Confirmation dialogs don't overflow with long deck names (truncate + wrap)
- [x] 7.4 Native-only checks (tab-bar safe-area, Android back, launcher icon/splash) — manual device pass
