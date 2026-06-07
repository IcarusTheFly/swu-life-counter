// Shared visual tokens for the modernized UI (the `modernize-ui` change).
//
// Centralizes the recurring metallic gradients + the deep-space backdrop
// gradient so the dialog, divider, default buttons, and background don't each
// hard-code their own copies. Pure data — no React, no imports — so it's safe
// to use anywhere (and importable by Node tests if needed).

// Metallic gradient stops (left→right or top→bottom; callers set start/end).
export const GRADIENTS = {
  // Brushed silver — the app's primary metallic (MenuButton / default-player /
  // affirmative dialog actions).
  SILVER: ["#3c3c3c", "#6e6e6e", "#a1a1a1", "#6e6e6e", "#3c3c3c"],
  // Warm gold — the opponent-default accent.
  GOLD: ["#6b4f12", "#caa23a", "#f3dd86", "#caa23a", "#6b4f12"],
  // Metallic crimson — destructive actions. Desaturated + dark so it reads as
  // "danger" without the flat, off-theme `#8B0000`.
  CRIMSON: ["#3a1414", "#7a2a2a", "#a85454", "#7a2a2a", "#3a1414"],
  // Muted dark steel — neutral / cancel actions.
  STEEL: ["#2a2a2a", "#3a3a3a", "#2a2a2a"]
};

// Deep-space vertical gradient behind every screen (top → bottom). Neutral
// near-black greys — intentionally NO blue/indigo cast (redesign-home-and-visuals).
export const SPACE_GRADIENT = ["#050505", "#0b0b0b", "#0e0e0e", "#060606"];

// A DIFFERENT, richer deep-space gradient used as the fill of the in-game
// "INITIATIVE" bubble (a deep indigo/violet nebula) so the bubble reads as its
// own little space window, distinct from the navy app backdrop.
export const SPACE_BUBBLE_GRADIENT = ["#0b0920", "#1b1248", "#0b0920"];

// A safe solid fallback that matches the darkest space tone — used as the base
// background color so there's never a white flash before the gradient paints.
export const SPACE_BASE = "#050505";

export const RADIUS = {sm: 8, md: 10, lg: 14, pill: 999};
export const SPACING = {xs: 4, sm: 8, md: 12, lg: 16, xl: 20};

// ── Team-color button helpers ───────────────────────────────────────────────
// Used by the in-game outcome prompt so each win button is tinted with that
// side's team color (player color for "You won", opponent for "Opponent won").

function parseHex(hex) {
  const h = String(hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return {r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255};
}

function clampByte(x) {
  return Math.max(0, Math.min(255, Math.round(x)));
}

function toHex(r, g, b) {
  return "#" + [r, g, b].map((v) => clampByte(v).toString(16).padStart(2, "0")).join("");
}

// Shade a hex toward black (pct < 0) or white (pct > 0). |pct| in [0, 1].
function shade(hex, pct) {
  const {r, g, b} = parseHex(hex);
  const target = pct < 0 ? 0 : 255;
  const p = Math.abs(pct);
  return toHex(r + (target - r) * p, g + (target - g) * p, b + (target - b) * p);
}

// A subtle metallic-ish 5-stop gradient from a base color (dark edges + a light
// highlight) for team-color buttons.
export function gradientFromBase(base) {
  return [shade(base, -0.45), base, shade(base, 0.28), base, shade(base, -0.45)];
}

// Pick a legible text color (near-black or white) for a background color, by
// perceived luminance. Light team colors (yellow, white, pink, light blue) get
// dark text; darker ones get white.
export function textOnColor(base) {
  const {r, g, b} = parseHex(base);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 150 ? "#1a1a1f" : "#FFFFFF";
}
