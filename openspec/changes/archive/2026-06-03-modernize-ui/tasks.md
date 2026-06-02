# Tasks

Scope: a **visual refresh** — restyle within existing layouts/flows. No screen is added, removed, or restructured; the only persisted-shape change is one new boolean. Keep all existing tests green.

## 1. Settings: animated-background toggle

- [x] 1.1 `constants/settings.js`: add `animatedBackground: true` to `DEFAULT_SETTINGS`.
- [x] 1.2 `context/sanitize.js`: validate `animatedBackground` (coerce to boolean; default `true`; legacy/missing → `true`). Mirror the `enableAnimations` handling.
- [x] 1.3 `components/SettingsScreen.jsx`: add an "Animated background" `SettingToggle` row in the Animations section (description e.g. "Drifting starfield behind every screen").
- [x] 1.4 `__tests__/sanitize.test.js`: cases for default, legacy-missing → true, non-boolean coercion, explicit false preserved.

## 2. Shared animated space background

- [x] 2.1 `components/SpaceBackground.jsx` (new): deep-space `expo-linear-gradient` base + 2–3 parallax layers of seeded star dots; twinkle (opacity) + slow drift (translate) via `Animated`. Animate **transform/opacity ONLY** (native-driver-safe — never layout/color/size). `useNativeDriver: Platform.OS !== "web"` (→ native thread on Android). Seed the layout once at mount (stable across renders). Cap total star count (~≤60). Keep motion **subtle** (slow drift / gentle twinkle) — Android keeps the screen awake in-game, so the backdrop runs continuously.
- [x] 2.2 Gate motion: animate only when `animatedBackground && enableAnimations`; otherwise render the identical stars statically (no timers started) — no layout shift either way.
- [x] 2.3 `components/ScreenLayout.jsx`: mount `<SpaceBackground/>` as a `StyleSheet.absoluteFillObject` layer behind `children` (inside the providers so it reads settings). On Android it MUST bleed full-screen under the hidden status/nav bars and around display cutouts; sit behind content via render order / `zIndex` (NOT `elevation`). Screen *content* keeps respecting safe-area insets.
- [x] 2.4 Audit screen containers (Home, Settings, Decks, Detail, Edit, Game History, Bulk Add): make their root backgrounds transparent/translucent-dark so the backdrop shows through, while keeping cards/sheets/dialogs opaque for legibility.

## 3. In-game curved lines as a transparent, game-only overlay

- [x] 3.1 Promote the transparent line-only variants (`bg_separated_lines_<color>{,_landscape}.png`) to first-class assets. (They were ALREADY on disk for all 8 colors — the generator emits them — so no Python regeneration was needed; the `.md` doc now documents them as the first-class in-game assets and the asset test checks them.)
- [x] 3.2 `constants/teamColors.js`: add `lines: {portrait, landscape}` (static `require()`s of the transparent overlays) per color. Stop `require()`-ing `bg_complete_*` for rendering (keep files on disk).
- [x] 3.3 `components/PlayerView.jsx`: make each half transparent (so the global space shows through) and render the team `lines` overlay on top — preserving per-half color + the opponent 180° rotation. Keep life/buttons/badge/initiative legibility (text shadows/translucent surfaces).
- [x] 3.4 `components/LifeCounter.jsx`: pass the orientation-appropriate `lines` overlay (portrait/landscape) per side instead of `bg.portrait/landscape`.

## 4. Metallic dialog buttons

- [x] 4.1 `components/ConfirmationModal.jsx`: replace flat `VARIANT_COLORS` with metallic gradients — `primary`→silver, `destructive`→metallic-crimson, `neutral`→dark steel (via `expo-linear-gradient`). Keep the `actions` API + entry-animation gate unchanged.
- [x] 4.2 Verify all callers upgrade cleanly: in-game Return-to-Home/Reset dialog, end-game outcome prompt, deck-delete confirmation, Game History delete.

## 5. Hamburger menu icon

- [x] 5.1 `icons/MenuIcon.jsx` (new): three rounded horizontal lines (SVG, `stroke` prop) matching existing icon conventions.
- [x] 5.2 `components/Divider.jsx`: use `MenuIcon` in place of `ResetIcon`; update the accessibility label to convey "open menu". Keep position/tap-target/metallic button unchanged. (Leave `icons/ResetIcon.jsx` in the repo, unused.)

## 6. Initiative token redesign

- [x] 6.1 `components/InitiativeView.jsx`: replace the bitmap `Image` with a vector token (SVG glyph inside the existing metallic ring). Unclaimed = dimmed/muted; claimed = full opacity + brightened ring + glow in the claiming side's team color (pass the side's color in).
- [x] 6.2 Define explicit portrait vs landscape sizing so the token reads clearly and is never cropped (removes the `resizeMode:"center"` bitmap path). Keep the claim shine gated on `enableAnimations`.
- [x] 6.3 Retire `assets/initiative-icon.png` usage (keep the file). Pass team color from `LifeCounter`/`PlayerView` into `InitiativeView`.

## 7. Shared theme tokens + modernization pass

- [x] 7.1 `constants/theme.js` (new): export recurring metallic gradients (`SILVER`, `GOLD`, `CRIMSON`, `STEEL`) + a few spacing/radius constants. Refactor the components edited above to consume them.
- [x] 7.2 Light modernization pass across screens (surfaces/spacing/elevation consistency) — visual only; do NOT change layout structure, navigation, flows, or behavior.

## 8. Tests

- [x] 8.1 `__tests__/teamColorAssets.test.js`: assert each color's transparent line-overlay assets exist on disk (portrait + landscape); adjust/replace the `bg_complete_*` assertions.
- [x] 8.2 `__tests__/sanitize.test.js`: `animatedBackground` validation (from 1.4).
- [x] 8.3 (N/A) No pure helper was extracted — the seeded starfield layout stays inline in `SpaceBackground.jsx` (trivial + random); nothing new to unit-test beyond the sanitize/asset coverage above.
- [x] 8.4 `utils/animation.js` (pure): `animatedDuration(base, enableAnimations)` (→ base when on, 0 when off) and `shouldAnimateBackground(settings)` (→ true only when BOTH toggles on). The animation-gated components (ConfirmationModal, DropdownSheet, Divider, PlayerView, InitiativeView, SpaceBackground) consume these so the policy is DRY + testable. Covered by `__tests__/animation.test.js`.
- [x] 8.5 `npm test` green (171 passing).

## 9. Verification

> Verified on **web in both orientations** (portrait + landscape via viewport resize). Android isn't device-tested in this loop — the code is written Android-correct (native-driver-only animation, full-bleed, `zIndex` over `elevation`); a real-device check is left as an optional user pass.

- [x] 9.1 Web smoke (Claude Preview): space backdrop visible on Home/Settings/Decks; animates by default; toggling "Animated background" off → static, no layout shift; reduce-motion (`enableAnimations` off) also stills it.
- [x] 9.2 In-game: animated space behind both halves; team-colored curved lines overlay each half (and ONLY in-game); legible life/buttons/badges; portrait + landscape both correct.
- [x] 9.3 Dialogs: Return-to-Home / outcome / deck-delete render metallic (silver / crimson / steel) — no flat blue/red; behavior unchanged.
- [x] 9.4 Divider shows the hamburger menu icon and still opens the options dialog.
- [x] 9.5 Initiative token crisp in portrait AND landscape; claimed state glows in the team color; shine respects reduce-motion.
- [x] 9.6 Console clean (no new warnings); confirm no regressions in deck/game flows.
- [x] 9.7 **Both orientations on web** (`preview_resize`): check **portrait** (~390×844) and **landscape** (~844×390) for the in-game screen — full-screen space fill, per-half line-overlay orientation, initiative-token sizing + crispness, divider/menu placement, dialog centering, and the global space showing behind the **rotated** opponent half with no divider seam. Spot-check Home / Decks / Settings reflow in both.
- [x] 9.8 Code check (web-verifiable, protects Android): every new/edited animation animates **only** transform/opacity and is gated on the animation settings — no animated layout/color/size props that would silently drop off the native driver.

## 10. Archival

- [ ] 10.1 Archive `modernize-ui` — promote `space-background`, `game-screen`, `visual-design`, and the `settings` delta to the live specs.
