# SWU Playtesting

A deck **playtesting** companion for *Star Wars Unlimited* — register your decks, run test games, and see which decks actually win. (It includes a full life counter for the games themselves.)

## Navigation

A persistent **bottom tab bar** — **Home · Decks · Settings** — is always one tap away. It hides during a game and in focused edit flows. **Exit** (Android/web only) lives in Settings.

## Home — the dashboard

Home leads with performance, not a menu:

- **Top performer** — a featured card for your best-performing deck (the highest win % among decks with enough recorded games; a most-played fallback otherwise) with its record + win %.
- **Top decks** — a short, **ranked** list (#2, #3, …), each with its record, win %, and a one-tap **▶ Test**.
- **Play Now** — two inline dropdowns, **Player** vs **Opponent** (either may be **Random**), and a **Play Test Game** button.
- A compact overview line of **counts** (decks · test games). There is deliberately **no single "win rate"** — an average across many decks and matchups isn't a meaningful number, so the ranking is the signal instead.

## Playing a game (the life counter)

Starting a test — **Play Test Game**, or a deck's **Test** — opens the life counter, initialized from your settings (team colors, initial life). Tap **+/−** to change life; values clamp to `[-9, 99]` so cosmic-damage situations stay expressible.

Each side shows its deck in a bottom-left bubble you can **tap to change mid-game**, an **INITIATIVE** control, and a divider with a **hamburger menu** (Return to Home / Reset Life) plus an **end-game** checkmark (enabled while at least one side is a real deck). The checkmark prompts for the outcome — **You won / Opponent won / Draw / Cancel** — and records it. Leaving via **Return to Home** is a deliberate exit: it records nothing.

## Decks & stats

The Decks tab is **one shared list** of decks, sorted alphabetically by default. Each deck has a name (≤ 50 chars), 0–3 aspects (Vigilance, Command, Aggression, Cunning, Heroism, Villainy), an optional leader, an optional **archetype** tag, and free-text notes. Decks render as cards with an aspect-colored accent, win %, streak, and a win-rate bar. A collapsible **Filters** panel narrows by name / aspect / archetype and sets the sort (Name or Games played) and order (Asc/Desc). The same deck can be chosen for both sides of a game (a mirror, which counts twice). From a deck's detail screen, two **default checkboxes** (silver = Player, gold = Opponent) pin that deck as the default for each side; tapping a checked box unchecks it and resets that side to Random.

**Stats are symmetric:** one recorded game updates BOTH decks (A beats B ⇒ A gains a win vs B and B gains a loss vs A). A game vs **Random** still counts toward the real deck and shows under a "Random" row in its matchups. Each deck's detail screen shows overall W-L-D + win % + streak and head-to-head **matchups grouped by event** (e.g. PETRANAKI / LOCALS), each with its own archetype tag + inline-editable strategy comments. **Bulk Add** backfills a season of playtesting in one go (pick a matchup, type W/L/D + an event tag). **Game History** lists every game a deck played, **grouped by opponent** — your record plus each individual game "against deck X" with a W/L/D chip, event, date, and notes — and lets you **add**, **edit**, or **delete** records inline.

Decks, matchups, and game history persist across launches. Deleting a deck cascades its matchups + games and self-heals the loadout. Storage migrates automatically across versions.

## Settings

- **Team Colors** — a dropdown per side (colored dot + name) from an 8-color lightsaber-inspired palette (red, orange, yellow, green, blue, purple, pink, white).
- **Initial Life Points** — default **0**; edit the number directly between `−`/`+`, or tap a quick-pick chip: **0 / 25 / 30 / 35**.
- **Animations** — toggles overlays / the initiative pop, plus a separate **Animated background** toggle for the starfield drift.
- **Haptic feedback** — for +/− presses (mobile only; hidden on web).
- **Exit** — closes the app (Android/web).

Settings persist across launches.

## Look & feel

A metallic-on-deep-space design: a shared **animated starfield** behind every screen (neutral near-black, no blue cast, toggleable), metallic confirmation dialogs and buttons, and the project's **custom app icon**. Layouts adapt to portrait and landscape.

## Development

```sh
npm install
npm run web        # browser preview (fastest dev loop)
npm run android    # Android emulator/device via Expo
npm run ios        # iOS simulator via Expo
npm test           # node-based unit tests (no install step)
```
