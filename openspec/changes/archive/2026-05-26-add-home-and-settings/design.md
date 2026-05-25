## Context

Today, `App.jsx` mounts `LifeCounter` directly. The game is a two-player life tracker with:
- Hardcoded starting life of **30** for both players ([`LifeCounter.jsx:12-13`](../../../components/LifeCounter.jsx)).
- Hardcoded press-feedback colors: opponent red `#FF634766`, player green `#42FF8466` ([`PlayerView.jsx:160-165`](../../../components/PlayerView.jsx)).
- Hardcoded reset-confirmation button colors `#8B0000` / `#4B79A1` ([`ConfirmationModal.jsx:71-74`](../../../components/ConfirmationModal.jsx)).
- A clamp of `-9 < life < 99` in `updateLife` ([`PlayerView.jsx:19`](../../../components/PlayerView.jsx)).
- Background images per side (`bg-space-player*.png`, `bg-space-opponent*.png`) — these stay unchanged.

The Expo SDK is **52** with React Native **0.76**. No navigation library is installed. No persistence library is installed.

This change introduces a home screen, a settings screen, and persisted user preferences for team colors and life mode.

## Goals / Non-Goals

**Goals:**
- Provide a discoverable Home screen so settings have an entry point that isn't "edit and rebuild."
- Let users pick from at least 4 team colors per side.
- Let users choose Count Down (with configurable start) or Count Up (start 0) life mode.
- Persist preferences across app launches.
- Preserve the existing game's look-and-feel and gestures — adding navigation should not regress the core counter.
- Keep dependency footprint small (this is a single-purpose utility app).

**Non-Goals:**
- Multiple game profiles or per-player names.
- Multi-player support beyond two (current app is two-player only).
- Cloud sync or accounts.
- Theming the backgrounds or fonts (only the *team color accents* are configurable).
- A full navigation library with stack history, deep links, gestures, or animated transitions.
- Mid-game settings changes (Settings is only reachable from Home, which naturally enforces this).
- Localization (no i18n today; not adding it).

## Decisions

### Decision 1: Simple state-driven screen switch instead of `react-navigation`

`App.jsx` will hold a `screen` state (`"home" | "game" | "settings"`) and render the corresponding component. No `NavigationContainer`, no stack, no params.

**Alternatives considered:**
- `@react-navigation/native` + `@react-navigation/native-stack`: industry standard, but pulls in `react-native-screens`, `react-native-safe-area-context` (already present), `@react-navigation/core`, etc. — significant surface for 3 screens with no deep linking, no real back-stack semantics, and no transition animations needed.
- `expo-router`: file-based routing, even heavier and changes project layout.

**Rationale:** With 3 flat screens and no need for stack history (back from Settings always goes to Home, back from Game always goes to Home), a `switch` on a state variable is ~10 lines, has zero new dependencies, and is trivial to refactor later if requirements grow.

**Revisit trigger:** If we add a 4th screen, or any screen needs deep linking, gestures, or transition animations, migrate to `react-navigation`.

### Decision 2: `@react-native-async-storage/async-storage` for persistence

Single key `@swu-life-counter:settings` storing JSON.

**Alternatives considered:**
- `expo-secure-store`: encrypted; overkill for non-sensitive UI preferences and has size limits.
- `react-native-mmkv`: faster, but requires native config and isn't a drop-in for managed Expo workflows.
- `expo-file-system`: works but is the wrong abstraction for tiny key-value data.

**Rationale:** AsyncStorage is the React Native standard for small KV preferences, supported by Expo SDK 52 without ejecting, and the data we store is trivial (~100 bytes).

### Decision 3: `SettingsContext` for read access, async hydration before first render

A `SettingsProvider` in `App.jsx` wraps the tree. On mount it reads from AsyncStorage; until the read resolves, the provider renders `null` (mirrors the existing font-loading pattern in `App.jsx:22-24` — users already see a brief black screen during font load, this just folds settings into the same gate).

The provider exposes `{ settings, updateSettings }`. `updateSettings` writes through to AsyncStorage on every change (fire-and-forget; a failed write logs but doesn't block UI — at worst the user re-picks next launch).

**Alternatives considered:**
- Prop-drilling from `App.jsx`: works for 3 levels but couples every component to the settings shape.
- Redux/Zustand: overkill for ~4 fields with no cross-component coordination.

**Rationale:** Context is the right tool for "small, read-mostly, app-wide config." No new dependency.

### Decision 4: Snapshot settings at game start, not live-read

When the user taps **Start Game**, `LifeCounter` mounts and receives the current settings as **props**. Resetting life inside the game restores to the values from those props (i.e., the values active when the game started). Mid-game settings changes aren't possible (Settings isn't reachable from in-game), so this is functionally equivalent to live-reading but more explicit.

**Rationale:** Props make the data flow obvious and make `LifeCounter` testable without context.

### Decision 5: Lightsaber-inspired palette of 8 colors, mapped from names to hex variants

Define in `constants/teamColors.js`. Each entry has `name`, `base` (full opacity), `press` (40% alpha) AND `bg.{portrait, landscape}` requires for the baked-in background variants:

```js
export const TEAM_COLORS = {
  red:    { name: "Red",    base: "#F54D00", press: "#F54D0066", bg: {...} },
  orange: { name: "Orange", base: "#FB8C00", press: "#FB8C0066", bg: {...} },
  yellow: { name: "Yellow", base: "#FDD835", press: "#FDD83566", bg: {...} },
  green:  { name: "Green",  base: "#22C55E", press: "#22C55E66", bg: {...} },
  blue:   { name: "Blue",   base: "#ADD8FF", press: "#ADD8FF66", bg: {...} },  // Skywalker icy-blue
  purple: { name: "Purple", base: "#C026D3", press: "#C026D366", bg: {...} },
  pink:   { name: "Pink",   base: "#FFC0CB", press: "#FFC0CB66", bg: {...} },  // soft pastel
  white:  { name: "White",  base: "#FFFFFF", press: "#FFFFFF66", bg: {...} },  // Ahsoka-style
};
export const TEAM_COLOR_KEYS = Object.keys(TEAM_COLORS); // stable order
```

Stored value is the **key** (e.g., `"green"`) not the hex — palette can change later without invalidating persisted data.

**Press tint** is the base color at 40% alpha (the existing `66` suffix convention from `PlayerView.jsx:161,164`).

**How the team color manifests on the in-game background:** The team color is baked into the per-side background image. See [Open Question #3 resolution below](#open-questions) — we ship per-color variants generated by `scripts/generate_color_variants.py` (approach #1).

**Defaults:** `player1Color: "green"`, `player2Color: "red"` — same keys as before; the actual hex values are slightly different (more vivid green, more orange-red) because the new palette emphasizes lightsaber-saturated tones.

**Same-color collision:** Allowed. Players are adults; the app does not enforce uniqueness. If both pick the same color, the only difference between the two sides is the orientation (opponent is rotated 180°) and the initiative indicator. This is acceptable.

**Why 8 (not 6):** The original 6-color palette covered the rainbow basics. Adding pink and white rounds out the lightsaber metaphor (Mara Jade pink, Ahsoka white). The picker still fits comfortably in a 4×2 grid in portrait. Pink needs a saturation-aware recolor (special-case for pastels), and white needs a desaturation special-case — both implemented in the asset pipeline.

### Decision 6: Life-mode semantics and clamping

Stored as `{ lifeMode: "down" | "up", startingLife: number }`. Defaults `"down"` and `30`.

| Mode  | Initial value | "+" button | "−" button | Min   | Max |
|-------|---------------|------------|------------|-------|-----|
| down  | `startingLife` (1–99) | +1 | −1 | −9 (unchanged) | 99 |
| up    | `0`           | +1 (damage) | −1 (correction) | **0** (new clamp) | 99 |

In **Count Up** mode the minimum is `0` rather than `−9` — going negative on a damage counter is meaningless. The 99 ceiling is preserved in both modes (matches today's behavior and the digit-width assumptions in the styling).

**Starting-life range:** 1–99. Picker uses −/+ steppers with quick presets at **20, 25, 30, 40**.

**Alternatives considered:** A "no clamp" mode for endless variants — not needed and would break the layout, which assumes 2 digits.

### Decision 7: Exit option is shown everywhere except iOS

`BackHandler.exitApp()` works on Android. iOS forbids programmatic termination (Apple HIG: "Don't quit programmatically — users perceive it as a crash"), so on iOS the Exit menu item is **not rendered** — a ghost button is worse UX than a missing one. On **web** we call `window.close()` (works for script-opened windows, harmless no-op otherwise; web is primarily a dev/testing target for this project, so a best-effort close is acceptable).

Logic: `SHOW_EXIT = Platform.OS !== "ios"`. The handler dispatches per-platform.

**Rationale:** During development the user tests on web first; hiding Exit on web made the menu look broken. The iOS-only hide is the real constraint; everywhere else, Exit should be present.

### Decision 8: Reset-confirmation modal grows a "Return to Home" action

The existing in-game reset icon (`Divider.jsx`) opens a confirmation modal. Today it has Yes/No. We extend it to three actions:

- **Reset Life** — resets life totals to the starting values (current behavior).
- **Return to Home** — exits the game back to the Home screen (no save; game state is ephemeral).
- **Cancel** — dismisses the modal.

Modal copy fixes today's misleading "restart the app" text (which doesn't restart the app — it resets life).

`ConfirmationModal` is **generalized**: it now accepts `title`, and an `actions` array of `{ label, onPress, variant }` rather than the hardcoded Yes/No buttons. Variant maps to a button tint (`destructive`, `primary`, `neutral`) defined in the modal, independent of team colors so the modal stays readable on any palette.

### Decision 9: Home and Settings screens are not rotated; respect device orientation

The game flips the opponent half 180° via a CSS rotate ([`PlayerView.jsx:107`](../../../components/PlayerView.jsx)). That's a game-specific affordance. Home and Settings render in standard upright orientation in both portrait and landscape — no per-side rotation.

Both screens use a centered single-column layout that works in both orientations without restyling, anchored with `react-native-safe-area-context` (already in the dependency tree via `ScreenLayout.jsx`).

### Decision 10: Visual language — match the existing space/dark aesthetic

- **Home**: black background (matches `ScreenLayout` container), app title in `FiraCode_700Bold` at the top, three large pill buttons stacked center-screen. Buttons use the same gradient style as the reset button on the divider (`["#3c3c3c", "#6e6e6e", "#a1a1a1", "#6e6e6e", "#3c3c3c"]`) so the visual vocabulary is consistent.
- **Settings**: black background, back chevron top-left, "Settings" title, two labeled sections ("Team Colors", "Life Mode") with generous spacing. Color swatches are 44pt circles (iOS HIG min tap target). Selected swatch gets a white 3pt ring. The Life Mode toggle uses a two-button segmented control; when "Count Down" is selected, a stepper appears below for Starting Life.
- **Fonts**: use `FiraCode_400Regular`/`FiraCode_700Bold` from `@expo-google-fonts/fira-code`, loaded once in `App.jsx` and gated until ready. (The original `App.jsx` referenced `assets/fonts/FiraCode-*.ttf` files that never existed in the repo; we switched to the Google Fonts package, which provides the same font and is web-compatible.)

## Risks / Trade-offs

- **AsyncStorage read failure on first launch** → Provider falls back to defaults and logs a warning. User sees default settings; no crash.
- **AsyncStorage write failure** → Settings appear to apply within the session but won't survive restart. Log a warning. Don't surface a UI error (extremely rare; not worth the modal noise).
- **No back-stack means no "back" gesture history** → Acceptable since the navigation graph is a star (Home is the hub; nothing is more than one hop from it). A user pressing the Android hardware back button from Game or Settings should return to Home — we'll wire `BackHandler` listeners in `LifeCounter` and `SettingsScreen` for this. From Home, hardware back exits the app on Android (default behavior; do not override).
- **Same-color allowed for both players** → Could confuse players. Mitigation: backgrounds and orientation still distinguish sides; documented as a deliberate choice in [Decision 5](#decision-5).
- **Settings snapshot at game start** → If a user wants to change starting life, they must Return to Home, change settings, Start Game again. This is intentional (per Goals/Non-Goals) but worth flagging in case it surfaces as a complaint.
- **Color palette is hex-defined, not theme-aware** → Colors aren't adjusted for the dark backgrounds; we chose vivid mid-tones that read well on both space backgrounds. If a future redesign introduces light backgrounds, the palette needs review.
- **Exit button on Android relies on `BackHandler.exitApp()`** → Some Android OEMs treat this as "minimize" rather than "kill." Users may expect different behavior. We won't try to force-kill — `BackHandler.exitApp()` is the platform-blessed call; behavior beyond that is OS-controlled.
- **No telemetry** → We won't know which colors users pick or which life mode is popular. Acceptable for a single-user utility app with no analytics infrastructure.

## Migration Plan

No data migration — there is no persisted state today. First launch after this change:
1. `SettingsProvider` reads AsyncStorage, finds nothing, populates with defaults (`green`/`red`/`down`/`30`).
2. User sees Home screen instead of going straight to the game.
3. Tapping Start Game produces the visually-identical game (same colors, same starting life) as before this change.

**Rollback:** Revert the commit(s). Persisted user settings become orphaned in AsyncStorage but are inert (a future re-introduction would read them again or ignore them).

## Open Questions

- Should the **Reset Life** action inside the in-game modal also re-read settings from AsyncStorage in case they changed (e.g., via OS-level "Clear app data")? Current decision is **no** — reset returns to the snapshot taken at game start. If users find this surprising, revisit.
- Should we add a small "Settings" shortcut on the Home screen via a gear icon in the corner *in addition* to the menu button, the way many games do? Current decision is **no** — three menu items isn't crowded, and a gear would just duplicate one of them.
- **How does the team color appear on the in-game background? — RESOLVED (approach #1: per-color variants).** We ship one PNG per (orientation × color) = 2 × 8 = **16 generated files** (`assets/bg_complete_<color>{,_landscape}.png`). The opponent side just uses the same image flipped 180° via the existing CSS rotation in `PlayerView`, so we do not need a separate "opponent" variant per color. Generation is done by `scripts/generate_color_variants.py` (Pillow + NumPy) and is reproducible — change a hex value and rerun the script. The pipeline:
  1. Takes a hand-authored `bg_separated_lines.png` (red lines on white background) + `bg_space_background.png` (clean starfield) as portrait sources.
  2. Derives equivalent landscape sources from `bg-space-opponent-landscape.png` via "redness extraction": isolating R minus mean(G,B) lets us pull out lines + their glow from the baked landscape image without needing a hand-authored landscape mask.
  3. For each target color: hue-rotates the source RGB, scales saturation proportionally to the *target's* saturation (so pastel targets stay pastel and white desaturates to silver), and overlays a small Gaussian glow in the target color.
  4. Composites the colored lines over the clean space background and saves the result.
  Alternatives considered and rejected:
  - **Two-layer assets with `tintColor`**: would mean 8 PNGs and infinite colors, but `Image` + `tintColor` recolors all opaque pixels uniformly, killing the line's internal shading (the ribbon gradient). The generated approach preserves shading.
  - **SVG line layer**: would mean 4 PNGs + redrawn paths, infinite colors, fully scalable, but requires manual artwork re-authoring and loses the painterly glow that the source PNG already has.
