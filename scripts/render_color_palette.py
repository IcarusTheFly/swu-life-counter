"""Render a single PNG showing the 3-color palette per team color, for reference."""
from __future__ import annotations
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "openspec", "changes", "add-home-and-settings", "mockup", "colors", "palette_proposal.png")

PALETTE = [
    ("Red (your existing)", ["#F54D00", "#FD7001", "#FFFB06"]),
    ("Orange",              ["#F08020", "#FFAE3F", "#FFE85F"]),
    ("Yellow",              ["#FDD835", "#FFEC5F", "#FFFFCC"]),
    ("Green (brighter)",    ["#22C55E", "#84CC16", "#FDE047"]),
    ("Blue (no cyan)",      ["#1E88E5", "#60A5FA", "#DBEAFE"]),
    ("Purple (more magenta)", ["#C026D3", "#E879F9", "#FBCFE8"]),
]

ROW_H = 96
SWATCH = 80
GAP = 12
LABEL_W = 200
W = LABEL_W + 3 * (SWATCH + GAP) + GAP + 380  # extra space for hex labels
H = ROW_H * len(PALETTE) + GAP

img = Image.new("RGB", (W, H), (20, 20, 24))
draw = ImageDraw.Draw(img)
try:
    label_font = ImageFont.truetype("arial.ttf", 18)
    hex_font = ImageFont.truetype("consola.ttf", 14)
except OSError:
    label_font = ImageFont.load_default()
    hex_font = ImageFont.load_default()

for i, (name, hexes) in enumerate(PALETTE):
    y = i * ROW_H + GAP
    draw.text((GAP, y + (SWATCH - 18) // 2), name, fill="white", font=label_font)
    for j, hex_str in enumerate(hexes):
        x = LABEL_W + j * (SWATCH + GAP * 6)
        rgb = tuple(int(hex_str[k:k+2], 16) for k in (1, 3, 5))
        draw.rectangle([x, y, x + SWATCH, y + SWATCH], fill=rgb, outline=(80, 80, 80))
        draw.text((x + SWATCH + 6, y + (SWATCH - 14) // 2), hex_str.upper(), fill="white", font=hex_font)

img.save(OUT)
print(f"saved: {OUT}")
