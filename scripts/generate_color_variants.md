# Tuning `generate_color_variants.py`

This script generates the colored background variants for the in-game life
counter. As of the `modernize-ui` change the app renders the **transparent,
line-only overlays** (`assets/bg_separated_lines_<color>{,_landscape}.png` —
line + glow on a transparent background) on top of the shared animated space,
so those are now the **first-class** in-game assets (required + checked by
`__tests__/teamColorAssets.test.js`). The opaque `bg_complete_<color>{,_landscape}.png`
(space + lines baked together) are still produced but are no longer rendered.
All tuning happens by editing the constants near the top of the script — there
are no CLI flags.

## Run it

```sh
py scripts/generate_color_variants.py
```

Then preview the result at <http://localhost:5734/openspec/changes/add-home-and-settings/mockup/colors/>
(launch the `colors-preview` configuration from `.claude/launch.json` if the
server isn't already running).

## Pipeline at a glance

For every color in `COLORS`, the script:

1. Builds a **line alpha mask** from the source's non-whiteness, shaped by
   `LINE_THRESHOLD` + `LINE_SHARPEN` (or hard-clamped if `BINARY_EDGES` is on).
2. Builds a **glow alpha mask** from a Gaussian-blurred version of the source's
   raw non-whiteness, scaled by `GLOW_INTENSITY` with a `GLOW_RADIUS` blur.
3. **Recolors** the source RGB by rotating its hue to the target color's hue
   and scaling saturation by `SAT_GAIN` × target's own saturation ratio
   (so pastel targets stay pastel; near-white targets desaturate to silver).
4. Composites `space → glow → recolored line` per side, both portrait
   (1024×1024 from hand-authored `bg_separated_lines.png`) and landscape
   (4800×1080, derived from `bg-space-opponent-landscape.png` via redness
   extraction — see `derive_landscape_sources()`).

## Knobs

| Constant | Current | What it does | Knob direction |
|---|---|---|---|
| `LINE_THRESHOLD` | `60` | Source pixels with non-whiteness below this are dropped from the line. Cuts away faint halo bleed in the source artwork. | ↑ thins the line, kills more soft edges. ↓ keeps softer/wider lines. |
| `LINE_SHARPEN` | `2.0` | Multiplier applied after the threshold subtraction; controls edge falloff. | ↑ sharper edges, more opaque cores (clips faster). ↓ softer anti-aliased edges. |
| `BINARY_EDGES` | `False` | If `True`, the alpha is binarized — every line pixel is either fully opaque or fully transparent. | `True` = crisp/pixelated edges. `False` = anti-aliased. |
| `BINARY_EDGE_CUTOFF` | `128` | When `BINARY_EDGES=True`, alphas ≥ this become `255`, others become `0`. | ↑ shrinks the line. ↓ widens it. |
| `GLOW_RADIUS` | `2` | Standard-deviation in pixels of the Gaussian blur applied to the raw line mask to produce the glow halo. | ↑ wider, softer halo. ↓ tighter, line-hugging halo. |
| `GLOW_INTENSITY` | `0.5` | Multiplier on the blurred glow alpha (clamped 0–255). | ↑ more visible halo. ↓ subtler. `0` = no glow. |
| `SAT_GAIN` | `2.0` | Multiplier on per-pixel saturation in the recolor step, scaled per target. | ↑ punchier vivid colors. ↓ closer to source saturation. |
| `SAT_FLOOR` | `60` | Additive saturation floor, scaled per target. Ensures source-white pixels still pick up a hint of the target tint. | ↑ stronger tint on highlights. ↓ highlights stay closer to white. |

The `SAT_GAIN` / `SAT_FLOOR` boost is **scaled by the target's own saturation
ratio** (`max-min)/max`). That means pastel targets (soft pink, light blue) get
a gentle tint; vivid targets (red, green, purple) get the full boost; near-white
targets (`_target_saturation_ratio < ~0.10` is enough) effectively skip the
boost altogether and render as bright silver/white.

## Adding or changing a color

1. Edit the `COLORS` dict near the top of the script. Use `(R, G, B)` integer
   tuples. Keys become filename suffixes — keep them lowercase, alphanumeric.

   ```py
   COLORS = {
       "red":    (0xF5, 0x4D, 0x00),
       # ...
       "cyan":   (0x00, 0xE5, 0xFF),   # new!
   }
   ```

2. Run the script. New files appear as `assets/bg_complete_cyan.png` and
   `assets/bg_complete_cyan_landscape.png` (plus the diagnostic
   `bg_separated_lines_cyan{,_landscape}.png` with transparent BGs).

3. Wire the new color into the app:
   - Add the matching entry to `constants/teamColors.js` (`base`, `press`, and
     **static** `require()`s for `bg.portrait` + `bg.landscape` — React Native
     can't compute paths at runtime).
   - The Settings color picker will pick it up automatically because it
     iterates `TEAM_COLOR_KEYS`.

4. If the new color is pastel/light, double-check the preview — the
   saturation-scaling should keep it pastel, but if not you may want to bump
   `SAT_FLOOR` down a touch (currently `60`) so highlights stay airy.

## Adding orientation/size variants

The portrait pass uses the hand-authored `assets/bg_separated_lines.png`
(1024×1024 RGB, red lines on white). The landscape pass *derives* its sources
from `assets/bg-space-opponent-landscape.png` (4800×1080) — see
`derive_landscape_sources()`. To add another size (e.g. tablet portrait
2048×2732), either:

- Hand-author a new "lines on white" source and add a third pass in `main()`
  calling `render_variants(lines, space, suffix="_tablet")`, or
- Provide another baked source for a new orientation and reuse
  `derive_landscape_sources()` (rename it if you generalize).

Don't forget to add the corresponding `bg.<key>` entry per color in
`constants/teamColors.js` and a selector in `LifeCounter.jsx`.
