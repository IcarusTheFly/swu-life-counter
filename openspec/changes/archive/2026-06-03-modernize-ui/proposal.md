## Why

The app works but looks unfinished: a baked space background appears **only** in-game while every other screen is flat black; the in-game dialog buttons use saturated blue/red that clash with the dark/space + metallic theme; the reset control reads as a "refresh" arrow rather than a menu; and the initiative indicator is a low-resolution bitmap that looks especially poor in landscape. With the deck-tracking feature complete, a cohesive visual modernization makes the app feel polished and on-brand — and gives the contest submission a strong, demonstrable "before → after".

## What Changes

- **Animated space background, app-wide.** A procedurally-rendered starfield over a deep-space gradient sits behind **every** screen (Home, Settings, Decks, Deck Detail, Game, etc.), replacing flat black off-game and the baked space on-game. Motion is gated by a new Settings toggle (and the existing reduce-motion preference); when off it renders as a **static** starfield so the look stays consistent.
- **In-game curved lines move on top of the space, game-only.** The team-colored curved light-lines are split out of the baked background and drawn as a **transparent overlay that appears only during a game**, layered above the shared animated space. (The asset pipeline already emits transparent line-only variants — `bg_separated_lines_<color>{,_landscape}.png` — so this reuses existing art.)
- **Dialogs modernized to metallic.** `ConfirmationModal` action buttons move from flat blue (`#4B79A1`) / red (`#8B0000`) to the app's metallic language — **silver** for neutral/affirmative actions and a **metallic crimson** for destructive ones — fixing the "Return to Home" dialog and every other confirmation (deck delete, outcome prompt).
- **Reset icon → hamburger menu.** The in-game divider's left control swaps the refresh-arrow `ResetIcon` for a **hamburger menu** icon (it opens a menu of options — Reset Life / Return to Home — so a menu glyph reads correctly).
- **Initiative indicator redesigned.** The bitmap-in-a-ring becomes a crisp, **vector metallic initiative token** with clear claimed/unclaimed states (the claiming side's color glows when held; dim when not), sized to look good in **both portrait and landscape** (fixing the cropped `resizeMode:"center"` look).
- **Light modernization pass** across screens — consistent metallic surfaces, spacing, and elevation — **visual only**: layouts, navigation, flows, and recorded behavior are unchanged.
- **Settings:** a new **Animated background** toggle (default on) in the Animations section.

This is a **visual refresh** (the agreed scope): no screen is added, removed, or restructured, and no recorded-data behavior changes.

## Capabilities

### New Capabilities
- `space-background`: the shared animated space backdrop (procedural starfield + deep-space gradient) rendered behind all screens, its motion gating (toggle + reduce-motion → static), and the in-game-only team-colored curved-line overlay layered on top.
- `game-screen`: the modernized in-game chrome — the divider's **menu (hamburger)** control and the redesigned **initiative token** (claimed/unclaimed states; portrait + landscape sizing).
- `visual-design`: the app's modernized **metallic design language** as shared requirements — specifically the dialog/confirmation buttons (silver / metallic-crimson, replacing flat blue/red) and the consistent metallic surface treatment applied across screens.

### Modified Capabilities
- `settings`: adds the persisted `animatedBackground` boolean (default `true`) and its toggle row in the Animations section; sanitized on read.
- `home-screen`: the Home layout becomes orientation-aware — a two-column layout in landscape (deck loadout on the left, menu buttons on the right) so the short landscape viewport no longer clips the menu. Content/flow unchanged.

## Impact

**New code:** `components/SpaceBackground.jsx` (procedural animated starfield, gated); `icons/MenuIcon.jsx` (hamburger); `constants/theme.js` (shared metallic gradient/spacing tokens + team-color button helpers); `utils/animation.js` (pure animation-gating policy — `animatedDuration` + `shouldAnimateBackground` — consumed by every animation-gated component so the reduce-motion behavior is DRY + unit-testable).

**Modified code:** `components/ScreenLayout.jsx` (mounts the global background behind all screens); `components/PlayerView.jsx` (transparent half so the global space shows through + render the line overlay); `components/InitiativeView.jsx` (vector token redesign + landscape sizing); `components/Divider.jsx` (use `MenuIcon`, relabel); `components/ConfirmationModal.jsx` (metallic button variants); `constants/teamColors.js` (add `lines:{portrait,landscape}` transparent overlays; `bg_complete_*` retired from rendering); `scripts/generate_color_variants.py` + its doc (promote the transparent line-only variants to first-class outputs); `constants/settings.js` + `context/sanitize.js` (`animatedBackground`); `components/SettingsScreen.jsx` (toggle row); `LifeCounter.jsx` (pass line overlays instead of baked bg).

**Dependencies:** none new — uses RN `Animated` + `expo-linear-gradient` + `react-native-svg`, all already present. No new runtime assets beyond promoting variants the pipeline already produces.

**Tests:** `__tests__/sanitize.test.js` (new `animatedBackground` field); `__tests__/teamColorAssets.test.js` (line-overlay assets exist on disk per color); `__tests__/animation.test.js` (the animation-gating policy — durations gated by `enableAnimations`, background drift gated by BOTH toggles, default-on for legacy/missing). Behavior/flows are otherwise unchanged, so existing suites stay green.

**Performance:** the starfield animates transform/opacity only, caps star count, uses the native driver on native, and falls back to static under reduce-motion / when the toggle is off — so it's cheap and battery-respectful.
