## Context

Today the background is a per-half `ImageBackground` in `PlayerView`, sourced from opaque team-color PNGs (`bg_complete_<color>{,_landscape}.png`) that bake the deep-space art **and** the team-colored curved lines together. `ScreenLayout` (which wraps every screen) just paints flat black, so the space only ever appears in-game. The asset generator (`scripts/generate_color_variants.py`) already composes `space → glow → recolored line` as **separate stages** and already emits a diagnostic, transparent, **line-only** variant (`bg_separated_lines_<color>{,_landscape}.png`).

Other relevant current state:
- `ConfirmationModal` renders a metallic-silver dialog **container**, but its action buttons are flat `VARIANT_COLORS` (`primary:#4B79A1`, `destructive:#8B0000`, `neutral:#555`). The entry animation is already gated on `enableAnimations`.
- `Divider` uses `ResetIcon` (a refresh-arrow SVG) for the left "menu" control that opens the Reset/Return-to-Home dialog.
- `InitiativeView` is a metallic-ringed chip wrapping a static `assets/initiative-icon.png` `Image`; dim (`opacity:0.2`) until claimed, then full opacity with a 250ms scale/opacity shine. Landscape uses `resizeMode:"center"`, which crops the bitmap and reads as low-quality.
- `settings` already has `enableAnimations` (gates UI micro-animations) persisted + sanitized.

This change is a **visual refresh**: no new/removed/restructured screens, no recorded-data behavior change.

## Goals / Non-Goals

**Goals:**
- A single shared animated space backdrop behind all screens, gated to a static fallback.
- Team-color curved lines rendered as a transparent overlay **only during a game**, on top of the shared space.
- Replace flat blue/red dialog buttons with the metallic design language.
- Swap the in-game reset glyph for a hamburger menu icon.
- A crisp, vector initiative token that looks good in portrait **and** landscape.
- Keep web (react-native-web) working and performant; keep all tests green.

**Non-Goals:**
- No layout/IA/navigation changes; no new screens; no flow changes.
- No change to life math, recording, stats, migrations, or any persisted data shape **other than** adding one boolean (`animatedBackground`).
- No new dependencies; no Lottie/WebGL/canvas engines.
- Not redrawing the curved-line **art** itself — we reuse the pipeline's existing line geometry.

## Decisions

### Decision 1 — Procedural starfield, not a video/GIF/asset
Render the animated space in JS with RN `Animated` over an `expo-linear-gradient` deep-space base: 2–3 parallax layers of small star dots, each twinkling (opacity) and slowly drifting (translate). **Why:** zero new deps, works identically on web + native, is trivially gated to static, and scales to any screen size/orientation without per-resolution assets. **Alternatives rejected:** looping video (heavy, platform-quirky, hard to gate); animated GIF/APNG (large, can't recolor/scale cleanly); Lottie/Skia (new dep, overkill).

### Decision 2 — Mount the background once, globally, in `ScreenLayout`
`ScreenLayout` renders `<SpaceBackground/>` as an absolutely-positioned layer **behind** `children` (it sits inside the providers, so it can read settings). **Why:** one instance for the whole app means the starfield is continuous across navigation (no re-seed/flash on screen change) and there's a single performance surface. Screen content keeps transparent or translucent-dark surfaces so the backdrop shows through; cards/sheets keep their own opaque surfaces for legibility.

### Decision 3 — In-game lines = transparent overlay, game-only
Promote the generator's existing transparent `bg_separated_lines_<color>{,_landscape}.png` to first-class assets and add `lines:{portrait,landscape}` to each `TEAM_COLORS` entry. In-game, each `PlayerView` half becomes **transparent** (so the global animated space shows through) and renders the team's **line overlay** on top (same per-half color + 180° opponent rotation as today). The opaque `bg_complete_*` images are retired from rendering. **Why:** the curved lines are the one element that must be (a) team-colored, (b) on top of the space, and (c) present only during a game — a transparent overlay satisfies all three and reuses existing art. The generator change is additive (it already produces these as a "diagnostic" output).

### Decision 4 — Gate semantics: `animatedBackground` + reduce-motion
New persisted boolean `animatedBackground` (default `true`). The starfield **animates** only when `animatedBackground === true` **AND** `enableAnimations === true`; otherwise it renders the identical starfield **statically** (stars painted at rest, no timers). **Why:** the dedicated toggle gives users direct control over the headline new motion (battery/Distraction), while honoring the global reduce-motion preference keeps one consistent "no motion" contract. Static-not-hidden keeps the space backdrop on every screen regardless.

### Decision 5 — Metallic dialog buttons (fixes the "off" blue/red)
Replace `ConfirmationModal`'s flat `VARIANT_COLORS` with metallic gradients via `expo-linear-gradient`:
- `primary` / affirmative → **silver** `["#3c3c3c","#6e6e6e","#a1a1a1","#6e6e6e","#3c3c3c"]` (matches MenuButton / default buttons), white text.
- `destructive` → **metallic crimson** `["#3a1414","#7a2a2a","#a85454","#7a2a2a","#3a1414"]`, light text — clearly "danger" but desaturated and on-theme (no flat `#8B0000`).
- `neutral` → **dark steel** `["#2a2a2a","#3a3a3a","#2a2a2a"]`, muted text.

The `actions` API (label/variant/onPress) is unchanged, so every caller (Return-to-Home, outcome prompt, deck-delete) upgrades for free. Entry animation stays gated on `enableAnimations`.

### Decision 6 — Hamburger `MenuIcon`
Add `icons/MenuIcon.jsx` — three rounded horizontal lines (SVG, `stroke` prop, matching the existing icon conventions). `Divider` uses it in place of `ResetIcon`; the accessibility label becomes "Open menu" (it opens Reset Life / Return to Home). Tap target, position, and the metallic circle button are unchanged. `ResetIcon` stays in the repo (unused by the divider) in case it's wanted elsewhere.

### Decision 7 — Initiative as a labeled "INITIATIVE" pill (transparent, animated)
Redesign `InitiativeView` as a **transparent pill that spells out the word "INITIATIVE"** (restoring the wording the original carried) — NOT a metallic surface and NOT a bitmap/abstract glyph. The pill has only a faint translucent scrim (`rgba(8,8,14,0.32)`) for legibility over the busy backdrop. Text is resolution-independent, so it's crisp in portrait AND landscape (fixing the brittle `resizeMode:"center"` bitmap). States: **unclaimed** = dimmed, grey text, faint border; **claimed** = the claiming side's **team color** for both the text and a **single** border. There is NO second halo ring (that read as a double border). While claimed, the pill runs a continuous gentle **breathing pulse** (scale ~1 ↔ 1.07, looping) so it's clearly the active, animated element; the pulse loops only while claimed AND `enableAnimations` is on (reduce-motion → a static claimed state). Orientation sizing: the horizontal pill fits both the portrait (20% height) and landscape (30% height) areas; the label shrinks slightly in landscape. **Why:** an explicit word is the clearest affordance (direct user feedback — the abstract metallic token read as "terrible"), a transparent pill with one border keeps focus on the text over the space, and a continuous pulse makes "who has initiative" unmistakable and alive.

> **Verification note.** The Claude Preview tab runs **hidden**, which pauses `requestAnimationFrame` — so JS-driven (`useNativeDriver:false`) loop animations like this pulse and the background star-drift can't be *observed* there (their final/static state renders correctly, but motion doesn't tick). They run normally in a visible browser and on Android (native driver, independent of rAF). Static/structural aspects (single border, transparent fill, team-color claimed state, claim interaction) are verifiable and verified; the motion is confirmed by code review.

### Decision 8 — Shared theme tokens (light touch)
Introduce `constants/theme.js` exporting the recurring metallic gradients (`SILVER`, `GOLD`, `CRIMSON`, `STEEL`) and a few spacing/radius constants, and refactor the new/edited components to use them. Existing screens are migrated opportunistically where it reduces duplication; this is **not** a required big-bang refactor (visual-refresh scope), just a place for the modernized tokens to live.

### Decision 9 — Performance & cross-platform (web + Android)
Android is the primary target (web is only the dev/verify loop), so the backdrop must be cheap on a real phone:
- Animate **only** `opacity` + `translate` so the loops run on the **native UI thread** via `useNativeDriver: true` on Android (the project gate `Platform.OS !== "web"` resolves to native on Android/iOS, JS on web). Never animate layout/color/size props — those force JS-thread work + re-layout and can't use the native driver.
- Use a **dense** star field (~360 across layers — matching the original baked background's "heaps of stars" look) seeded **once** at mount (no `Math.random()` per render). Cost scales with the number of static leaf Views, NOT the animation: there are still only 3 drivers (one per parallax layer), so motion stays at 3 native-driven loops regardless of star count.
- Static mode starts no timers — the same stars are painted at rest, so the toggle / reduce-motion path is free and has no layout shift.
- One global mount means navigation never re-creates the animation.
- Web runs the same component with `useNativeDriver: false` (RN-web has no native module); the conservative star count keeps that JS-driven path smooth in a browser too.

### Decision 10 — Settings persistence
`animatedBackground` is added to `DEFAULT_SETTINGS` (`true`) and validated in `context/sanitize.js` (coerce to boolean, default `true`). Legacy blobs without the key read as `true`. This mirrors the existing `enableAnimations` handling exactly.

### Decision 11 — Build Android-correct, verify orientation on web
We will **not** device-test Android in this loop (no reliable way to view an emulator screen here), but the app ships and is played on Android, so the implementation still follows native-correct practices so it works well there anyway:
- **Full-bleed background.** `ScreenLayout` already hides the Android navigation bar + status bar. The backdrop SHALL fill the **entire** window — use `StyleSheet.absoluteFillObject` and let it bleed under the hidden system bars and around display cutouts/notches; screen *content* still respects safe-area insets, but the space paints edge-to-edge behind them.
- **Z-order via render order / `zIndex`, not `elevation`.** On Android `elevation` creates its own stacking context (and a shadow); the background must sit behind content by explicit order/`zIndex`, never elevation, or it can punch through cards.
- **Overdraw budget.** Backdrop + two transparent in-game halves + line overlays + text is heavily layered alpha. Keep layers minimal (one gradient, the star layers, one per-half line overlay) and avoid redundant translucent surfaces to limit Android overdraw.
- **Transparent halves + 180° rotation.** Confirm in **both web orientations** that the global space reads correctly *behind* the rotated opponent half (rotation + transparency compositing) with no seam at the divider; native compositing is expected to match.
- **Battery / thermals.** `expo-keep-awake` holds the screen on during a game, so an animated backdrop runs continuously for a whole match. Native-driver + low star count keep it light; the toggle and reduce-motion give a hard off; keep the default motion **subtle** (slow drift, gentle twinkle), not busy.
- **Densities & orientation.** Vector icons (MenuIcon, initiative token) are resolution-independent across densities — a concrete reason the initiative redesign drops the bitmap. Orientation is verified on web in **both portrait and landscape** (viewport resize); a real-device rotation differs slightly (system insets / aspect) and is left as an optional user check.

## Risks / Trade-offs

- **Per-frame cost of many `Animated` dots on web.** Mitigated by capping star count, animating only transform/opacity, and the static fallback. If web profiling shows jank, reduce layers/stars or drop to CSS-less static on web.
- **Transparent halves change in-game compositing.** Because the space now lives behind both halves globally, the per-half art must be genuinely transparent or the opponent half's 180° rotation could reveal seams. Mitigation: the line-overlay PNGs are already transparent; verify the global space reads correctly under both halves (including the rotated one) in browser.
- **Two "animation" toggles could confuse.** `enableAnimations` (UI micro-animations) vs `animatedBackground` (backdrop motion). Mitigation: clear labels + descriptions in Settings; reduce-motion (`enableAnimations` off) also stills the background, so the global "off" still wins.
- **Initiative redesign is subjective.** No mockup was provided, so the token design is our call (per the user's "do the whole job"). Mitigation: keep it conservative + on-theme (metallic ring already exists), and it's easily tuned during apply/verify.
- **Retiring `bg_complete_*`.** Removing them from `teamColors` could orphan the files. Mitigation: keep the PNGs on disk (the generator still produces them) but stop `require()`-ing them; the asset test switches to checking the line-overlay variants.
- **Android is built-for but not device-verified in this loop.** We follow native-correct practices (native-driver-only animation, full-bleed, `zIndex` not `elevation`, capped/subtle stars) and verify **both orientations on web**, but the automated loop can't certify a real Android device — that confirmation is deferred to the user as an optional check. Residual risk: a native-only rendering/perf quirk (e.g. rotated-half compositing or battery during a long game) could surface only on device.
