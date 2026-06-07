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

// ── Design system (metallic-design-system) ───────────────────────────────────
// The consolidated token set every screen builds on, alongside the gradients
// above. Pure data — safe to import anywhere.

// Gold — the SECONDARY accent paired with silver for glow/emphasis (per the app
// icon): the primary CTA glow, the crown, active/selected states.
export const GOLD = "#e8c45a";
export const GOLD_DEEP = "#caa23a";
export const GOLD_GLOW = "rgba(232, 196, 90, 0.55)";

// Brushed-silver surface gradients — LIGHT metal that DARK text rides on for
// high contrast (distinct from the dark `GRADIENTS.SILVER` used by dialogs).
export const METAL = {
  surface: ["#d2d5da", "#eef0f2", "#c5c9cf", "#aeb2b9"], // sheen highlight near the top
  surfacePressed: ["#bcc0c6", "#d4d7db", "#aeb2b9"],
  goldSurface: ["#e7cf86", "#f6e7b2", "#dcbb5e", "#c69e36"], // gold-tinted metal
  border: "#7c808a",
  bevelLight: "#fbfcfd",
  bevelDark: "#585b62"
};

// Text tiers by surface (contrast-first).
export const TEXT = {
  onMetal: {primary: "#191b1f", secondary: "#3b3e45", muted: "#5d616b"},
  onSpace: {primary: "#f1f2f4", secondary: "#b7bbc3", muted: "#7f828b"}
};

// Type scale (the app font is FiraCode).
export const TYPE = {
  display: {fontFamily: "FiraCode_700Bold", fontSize: 22, letterSpacing: 1.2},
  title: {fontFamily: "FiraCode_700Bold", fontSize: 17, letterSpacing: 0.3},
  stat: {fontFamily: "FiraCode_700Bold", fontSize: 15, letterSpacing: 0.3},
  label: {fontFamily: "FiraCode_700Bold", fontSize: 11, letterSpacing: 2},
  body: {fontFamily: "FiraCode_400Regular", fontSize: 14, letterSpacing: 0.2},
  caption: {fontFamily: "FiraCode_400Regular", fontSize: 11, letterSpacing: 0.3}
};

// Record W-L-D number colors. Two sets so the same wins/losses/draws read with
// good contrast on EITHER surface: dark, saturated tones on light metal; bright,
// lifted tones on the dark space backdrop. The sparkline accent shares onSpace.
export const RECORD = {
  onMetal: {win: "#1f7a47", loss: "#a8362e", draw: "#5d616b"},
  onSpace: {win: "#46d29a", loss: "#e8736b", draw: "#9a9da6"}
};
