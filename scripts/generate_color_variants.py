"""Generate color variants of bg_separated_lines.png + bg_complete_<color>.png.

Hybrid pipeline (preserves source shading + adds a colored Gaussian glow):
  1. **Hue-shift** the source image from red baseline to the target color. This preserves
     the ribbon's internal shading (where the source is saturated -> target is saturated;
     where the source is pastel-red -> target is pastel-target_color).
  2. **Line alpha** = sharpened "non-whiteness" of the source. Cores fully opaque, edges
     anti-aliased, hard cut beyond the source's line extent.
  3. **Glow alpha** = the line alpha Gaussian-blurred and scaled down. Painted in solid
     target color (NOT source RGB), so the glow is the team color all the way out, with
     a smooth Gaussian falloff to zero (no hard cutoff).
  4. **Composite** order: space -> glow -> hue-shifted line.

This addresses every issue from the previous attempts:
  - Halos no longer "finish all of a sudden" (Gaussian falloff is continuous to zero).
  - Halos are no longer white (glow is the target color, not source RGB).
  - Lines are opaque at the core (sharpened mask).
  - Lines keep their ribbon shading (we DON'T discard source RGB for the line layer).
"""

from __future__ import annotations
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
PREVIEW_OUT = os.path.join(
    ROOT, "openspec", "changes", "add-home-and-settings", "mockup", "colors"
)
os.makedirs(PREVIEW_OUT, exist_ok=True)

# Colors agreed with user (palette_proposal.png "Main" column).
# Red uses the exact main color from the user's hand-authored red image.
# Green bumped from #43A047 (dark) to #22C55E (vivid). Purple pushed to magenta-side.
COLORS = {
    "red":    (0xF5, 0x4D, 0x00),
    "orange": (0xFB, 0x8C, 0x00),
    "yellow": (0xFD, 0xD8, 0x35),
    "green":  (0x22, 0xC5, 0x5E),
    "blue":   (0xAD, 0xD8, 0xFF),
    "purple": (0xC0, 0x26, 0xD3),
    "pink":   (0xFF, 0xC0, 0xCB),
    "white":  (0xFF, 0xFF, 0xFF),
}

# ---- Tuning knobs ----
LINE_THRESHOLD = 60      # source pixels below this "non-whiteness" don't contribute to the line
LINE_SHARPEN = 2.0       # higher -> sharper line edge, more opaque cores
# Binary mask: every line pixel is either fully opaque or fully transparent.
# Eliminates any soft fade at the line edge (which the eye reads as "glow").
# Trade-off: edges look pixelated at zoom; at native size they read as crisp.
BINARY_EDGES = False
BINARY_EDGE_CUTOFF = 128   # alpha above this -> 255, else -> 0
# Glow is now intentionally small — "just a touch around the line", not a halo.
GLOW_RADIUS = 2
GLOW_INTENSITY = 0.5
# Saturation: gentle additive boost only (no multiplier). Preserves the source's
# brightness *and* saturation variation = ribbon shading survives. White-ish pixels
# still get a slight tint so they don't read as pure white inside a colored line.
SAT_GAIN = 2.0
SAT_FLOOR = 60


def rgb_to_pil_hue_byte(r: int, g: int, b: int) -> int:
    rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
    cmax, cmin = max(rf, gf, bf), min(rf, gf, bf)
    d = cmax - cmin
    if d == 0:
        h = 0.0
    elif cmax == rf:
        h = ((gf - bf) / d) % 6
    elif cmax == gf:
        h = (bf - rf) / d + 2
    else:
        h = (rf - gf) / d + 4
    h_deg = (h * 60.0) % 360.0
    return int(round(h_deg * 256.0 / 360.0)) % 256


def shift_hue(img_rgb: Image.Image, target_hue_byte: int, source_hue_byte: int = 0) -> Image.Image:
    hsv = img_rgb.convert("HSV")
    arr = np.array(hsv)
    offset = (target_hue_byte - source_hue_byte) % 256
    arr[..., 0] = (arr[..., 0].astype(np.int16) + offset) % 256
    return Image.fromarray(arr, "HSV").convert("RGB")


def _target_saturation_ratio(color: tuple[int, int, int]) -> float:
    """Return 0.0 (white) to 1.0 (fully saturated) for the target color."""
    cmax = max(color)
    if cmax == 0:
        return 0.0
    return (cmax - min(color)) / cmax


def recolor_preserving_shading(img_rgb: Image.Image, target_color: tuple[int, int, int]) -> Image.Image:
    """Set hue to target's hue and scale saturation proportionally to how saturated
    the target color itself is.  Vivid targets (red, green) get the full SAT_GAIN
    boost; pastel targets (soft pink, light blue) get a gentle tint; near-white
    targets get almost no saturation — just enough for subtle shading."""
    target_hue = rgb_to_pil_hue_byte(*target_color)
    sat_ratio = _target_saturation_ratio(target_color)

    hsv = img_rgb.convert("HSV")
    arr = np.array(hsv).astype(np.float32)
    arr[..., 0] = target_hue

    # Scale the boost by how saturated the target is.
    # sat_ratio ~1.0 → full SAT_GAIN + SAT_FLOOR  (vivid colors)
    # sat_ratio ~0.3 → gentle tint                 (pastels)
    # sat_ratio ~0.0 → near-zero saturation         (white)
    effective_gain = SAT_GAIN * sat_ratio
    effective_floor = SAT_FLOOR * sat_ratio
    arr[..., 1] = np.clip(arr[..., 1] * effective_gain + effective_floor, 0, 255)

    return Image.fromarray(arr.astype(np.uint8), "HSV").convert("RGB")


def raw_alpha_from(source_rgb: Image.Image) -> np.ndarray:
    """Unfiltered non-whiteness of the source (uint8). Independent of any LINE_* knob.

    Used as the input to the glow Gaussian blur so that LINE_THRESHOLD / LINE_SHARPEN
    only affect the visible line, not the glow.
    """
    arr = np.array(source_rgb).astype(np.int16)
    return (255 - arr.min(axis=2)).clip(0, 255).astype(np.uint8)


def line_alpha_from(source_rgb: Image.Image) -> np.ndarray:
    """Line alpha mask (uint8). Either anti-aliased (LINE_SHARPEN) or binary (BINARY_EDGES)."""
    arr = np.array(source_rgb).astype(np.int16)
    raw = 255 - arr.min(axis=2)
    sharp = np.clip((raw - LINE_THRESHOLD) * LINE_SHARPEN, 0, 255)
    if BINARY_EDGES:
        return np.where(sharp >= BINARY_EDGE_CUTOFF, 255, 0).astype(np.uint8)
    return sharp.astype(np.uint8)


def colored_layer(alpha_mask: np.ndarray, color_rgb: tuple[int, int, int]) -> Image.Image:
    h, w = alpha_mask.shape
    rgb = np.broadcast_to(np.array(color_rgb, dtype=np.uint8), (h, w, 3)).copy()
    return Image.fromarray(np.dstack([rgb, alpha_mask]), "RGBA")


def make_colored_lines_rgba(source_rgb: Image.Image, color_rgb: tuple[int, int, int]) -> Image.Image:
    """Recolored source (preserves ribbon shading) + Gaussian glow underneath.

    - Line layer uses the source RGB recolored to the target hue with saturation
      boosted so source-white highlights become *light-target-color* tints (not
      pure white). Source's brightness variation is preserved -> ribbon shading.
      Shape controlled by LINE_THRESHOLD / LINE_SHARPEN / BINARY_EDGES.
    - Glow layer is solid target color with a Gaussian-blurred mask (smooth halo).
      Derived from the raw non-whiteness of the source (NOT from line_alpha), so
      GLOW_RADIUS / GLOW_INTENSITY are independent of the LINE_* knobs.
    """
    line_alpha = line_alpha_from(source_rgb)
    raw_alpha = raw_alpha_from(source_rgb)

    # Glow: blurred raw mask, painted in target color, scaled down.
    blurred = Image.fromarray(raw_alpha, "L").filter(ImageFilter.GaussianBlur(GLOW_RADIUS))
    glow_alpha = (np.array(blurred).astype(np.float32) * GLOW_INTENSITY).clip(0, 255).astype(np.uint8)
    glow_layer = colored_layer(glow_alpha, color_rgb)

    # Line: recolored source RGB with shading preserved, sharpened mask as alpha.
    recolored = recolor_preserving_shading(source_rgb, color_rgb)
    line_rgba = np.dstack([np.array(recolored), line_alpha])
    line_layer = Image.fromarray(line_rgba, "RGBA")

    base = Image.new("RGBA", source_rgb.size, (0, 0, 0, 0))
    base = Image.alpha_composite(base, glow_layer)
    base = Image.alpha_composite(base, line_layer)
    return base


def composite_over(fg_rgba: Image.Image, bg_rgb: Image.Image) -> Image.Image:
    return Image.alpha_composite(bg_rgb.convert("RGBA"), fg_rgba).convert("RGB")


def derive_landscape_sources(baked_path: str) -> tuple[Image.Image, Image.Image]:
    """Derive (lines_on_white, clean_space_bg) from a baked-in landscape image.

    The baked landscape image (e.g. `bg-space-opponent-landscape.png`) has red lines
    plus their glow rendered over a space starfield. There's no hand-authored "lines
    on white" equivalent at landscape size, so we synthesize one:

      1. Extract a "redness" mask = max(0, R - mean(G, B)). This isolates the red
         contribution (line cores + their soft glow) and ignores neutral pixels
         like stars, which have R ~= G ~= B.
      2. Use that mask to paint a synthetic "lines on white" source. Where redness
         is 0 -> white. Where redness is max -> source-red. Pixels in between are
         linearly interpolated, so the soft glow becomes a pink-on-white falloff
         and the pipeline's existing "non-whiteness" + sharpen logic handles it
         identically to the hand-authored portrait source.
      3. Build a clean space background by subtracting the redness mask from the
         R channel of the baked image. The red lines and their glow disappear,
         leaving just the underlying starfield.
    """
    baked = np.array(Image.open(baked_path).convert("RGB")).astype(np.int16)
    R, G, B = baked[..., 0], baked[..., 1], baked[..., 2]
    redness = np.clip(R - (G + B) // 2, 0, 255).astype(np.uint8)

    # 1. Synthetic lines-on-white source: lerp(white, source_red, redness/255).
    mask = (redness.astype(np.float32) / 255.0)[..., None]
    source_red = np.array([245, 77, 0], dtype=np.float32)
    white = np.array([255, 255, 255], dtype=np.float32)
    lines_on_white = (1.0 - mask) * white + mask * source_red
    lines_img = Image.fromarray(lines_on_white.astype(np.uint8), "RGB")

    # 2. Clean space: remove the red bias by subtracting redness from R.
    clean_R = np.clip(R - redness.astype(np.int16), 0, 255).astype(np.uint8)
    clean_space = np.stack([clean_R, G.astype(np.uint8), B.astype(np.uint8)], axis=-1)
    space_img = Image.fromarray(clean_space, "RGB")

    return lines_img, space_img


def render_variants(
    lines: Image.Image,
    space: Image.Image,
    suffix: str,
) -> dict[str, Image.Image]:
    """Render every color in COLORS against the given lines+space sources.

    `suffix` is appended to the output filenames (e.g. "" or "_landscape").
    Returns {color_name: composite_image}.
    """
    completes: dict[str, Image.Image] = {}
    for name, rgb in COLORS.items():
        lines_rgba = make_colored_lines_rgba(lines, rgb)
        composite = composite_over(lines_rgba, space)
        lines_path = os.path.join(ASSETS, f"bg_separated_lines_{name}{suffix}.png")
        complete_path = os.path.join(ASSETS, f"bg_complete_{name}{suffix}.png")
        lines_rgba.save(lines_path)
        composite.save(complete_path)
        completes[name] = composite
        print(f"  {name}: -> {lines_path}, {complete_path}")
    return completes


def label_image(img: Image.Image, text: str) -> Image.Image:
    band_h = 36
    out = Image.new("RGB", (img.width, img.height + band_h), (15, 15, 18))
    out.paste(img, (0, band_h))
    draw = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    draw.text(((img.width - (bbox[2] - bbox[0])) // 2, 5), text, fill="white", font=font)
    return out


def main() -> None:
    print(
        f"params: LINE_THRESHOLD={LINE_THRESHOLD} LINE_SHARPEN={LINE_SHARPEN} "
        f"GLOW_RADIUS={GLOW_RADIUS} GLOW_INTENSITY={GLOW_INTENSITY} "
        f"SAT_GAIN={SAT_GAIN} SAT_FLOOR={SAT_FLOOR}"
    )

    # ---- Portrait variants ----
    lines = Image.open(os.path.join(ASSETS, "bg_separated_lines.png")).convert("RGB")
    space = Image.open(os.path.join(ASSETS, "bg_space_background.png")).convert("RGB")
    print(f"\nportrait sources:")
    print(f"  lines:  {lines.size} {lines.mode}")
    print(f"  space:  {space.size} {space.mode}")
    completes = render_variants(lines, space, suffix="")

    # ---- Landscape variants (derived from the baked-in landscape image) ----
    baked_path = os.path.join(ASSETS, "bg-space-opponent-landscape.png")
    lines_l, space_l = derive_landscape_sources(baked_path)
    lines_l.save(os.path.join(ASSETS, "bg_separated_lines_landscape.png"))
    space_l.save(os.path.join(ASSETS, "bg_space_background_landscape.png"))
    print(f"\nlandscape sources derived from {os.path.basename(baked_path)}:")
    print(f"  lines:  {lines_l.size} -> bg_separated_lines_landscape.png")
    print(f"  space:  {space_l.size} -> bg_space_background_landscape.png")
    render_variants(lines_l, space_l, suffix="_landscape")

    # ---- Preview grid (portrait) ----
    thumb_size = 320
    cols, rows = 4, 2
    gap = 16
    label_band = 36
    grid = Image.new(
        "RGB",
        (cols * thumb_size + (cols + 1) * gap, rows * (thumb_size + label_band) + (rows + 1) * gap),
        (15, 15, 18),
    )
    for i, name in enumerate(["red", "green", "blue", "yellow", "purple", "orange", "pink", "white"]):
        col, row = i % cols, i // cols
        x = gap + col * (thumb_size + gap)
        y = gap + row * (thumb_size + label_band + gap)
        thumb = label_image(completes[name].resize((thumb_size, thumb_size), Image.LANCZOS), name.upper())
        grid.paste(thumb, (x, y))
    grid.save(os.path.join(PREVIEW_OUT, "preview_grid.png"))
    print(f"\npreview grid: {os.path.join(PREVIEW_OUT, 'preview_grid.png')}")


if __name__ == "__main__":
    main()
