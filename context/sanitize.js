// Pure helper: validate persisted settings and merge with defaults.
//
// Extracted from SettingsContext.jsx so it can be exercised by `node --test`
// without pulling in React Native, AsyncStorage, or JSX. Keep this file free
// of React imports.

// Explicit `.js` extensions on the imports below so this module loads under
// Node ESM (used by the `npm test` runner) as well as Metro (which accepts
// either form).
import {DEFAULT_SETTINGS, INITIAL_LIFE_MAX, INITIAL_LIFE_MIN} from "../constants/settings.js";
import {TEAM_COLOR_KEYS} from "../constants/teamColorKeys.js";
import {RANDOM_DECK_ID} from "../constants/decks.js";

function isValidInitialLife(n) {
  return Number.isInteger(n) && n >= INITIAL_LIFE_MIN && n <= INITIAL_LIFE_MAX;
}

// Resolve `initialLife` honoring three legacy persistence shapes:
//   1. New shape — `initialLife` is set and valid → use it.
//   2. Legacy Count Up — `lifeMode === "up"` → games used to start at 0 → use 0.
//   3. Legacy Count Down — `startingLife` valid → use it.
//   4. Otherwise → default.
function resolveInitialLife(raw) {
  if (isValidInitialLife(raw.initialLife)) return raw.initialLife;
  if (raw.lifeMode === "up") return 0;
  if (isValidInitialLife(raw.startingLife)) return raw.startingLife;
  return DEFAULT_SETTINGS.initialLife;
}

// `defaultDeckId` is either a string id or null. Anything else falls back to
// null (a no-op default — the cross-validation against the actual `decks`
// list happens later in App.jsx once both providers have hydrated).
//
// During the v2 → v3 migration window we also accept the legacy
// `defaultPlayerDeckId` field as a synonym, so a SettingsProvider hydrating
// against an unmigrated blob surfaces the value under the new key. The new
// key WINS when both are present. Only `defaultDeckId` is ever written back
// — the next `updateSettings` call drops the legacy key.
function resolveDefaultDeckId(raw) {
  // New key wins outright when set (including `null`). The `"__random__"`
  // sentinel is rejected — the player/default side is never random by design.
  if (raw.defaultDeckId === null) return null;
  if (
    typeof raw.defaultDeckId === "string" &&
    raw.defaultDeckId.length > 0 &&
    raw.defaultDeckId !== RANDOM_DECK_ID
  ) {
    return raw.defaultDeckId;
  }
  // Fall back to the legacy key — read once, surfaced under the new name.
  // Only consult the legacy key when the new one is genuinely absent
  // (undefined), not when it's present-but-invalid.
  if (raw.defaultDeckId === undefined) {
    if (raw.defaultPlayerDeckId === null) return null;
    if (
      typeof raw.defaultPlayerDeckId === "string" &&
      raw.defaultPlayerDeckId.length > 0 &&
      raw.defaultPlayerDeckId !== RANDOM_DECK_ID
    ) {
      return raw.defaultPlayerDeckId;
    }
  }
  return DEFAULT_SETTINGS.defaultDeckId;
}

// Default OPPONENT deck — a string deck id or null. The `"__random__"`
// sentinel is rejected (you set a specific deck as the opponent default; the
// "no default" state is plain null, which the loadout heals to Random). No
// legacy key to migrate. Cross-validation against the live `decks` list runs
// in App.jsx.
function resolveDefaultOpponentDeckId(raw) {
  if (raw.defaultOpponentDeckId === null) return null;
  if (
    typeof raw.defaultOpponentDeckId === "string" &&
    raw.defaultOpponentDeckId.length > 0 &&
    raw.defaultOpponentDeckId !== RANDOM_DECK_ID
  ) {
    return raw.defaultOpponentDeckId;
  }
  return DEFAULT_SETTINGS.defaultOpponentDeckId;
}

// `activeLoadout` validation rules at the sanitize layer (v3.1):
//   EITHER side may be `null` (no deck — allowed), a deck-id string, OR the
//   `"__random__"` sentinel. Both sides now accept Random (the player side is
//   no longer special). A non-string, non-null value falls back to that side's
//   default (player1 → null, player2 → `"__random__"`).
// The sanitize layer cannot cross-validate against the actual `decks` list
// (decks live in another provider); the self-heal runs in App.jsx once both
// providers have hydrated.
function resolveLoadoutSide(value, fallback) {
  if (value === null) return null;
  if (typeof value === "string" && value.length > 0) return value; // deck id OR "__random__"
  return fallback;
}

function resolveActiveLoadout(raw) {
  const fallback = DEFAULT_SETTINGS.activeLoadout;
  if (!raw.activeLoadout || typeof raw.activeLoadout !== "object") {
    return {...fallback};
  }
  return {
    player1DeckId: resolveLoadoutSide(raw.activeLoadout.player1DeckId, fallback.player1DeckId),
    player2DeckId: resolveLoadoutSide(raw.activeLoadout.player2DeckId, fallback.player2DeckId)
  };
}

export function sanitize(raw) {
  const next = {...DEFAULT_SETTINGS};
  if (raw && typeof raw === "object") {
    if (TEAM_COLOR_KEYS.includes(raw.player1Color)) next.player1Color = raw.player1Color;
    if (TEAM_COLOR_KEYS.includes(raw.player2Color)) next.player2Color = raw.player2Color;
    next.initialLife = resolveInitialLife(raw);
    if (typeof raw.enableAnimations === "boolean") next.enableAnimations = raw.enableAnimations;
    // Animated background: accept a real boolean; anything else (missing,
    // legacy blob, garbage) keeps the default (`true`) from the spread above.
    if (typeof raw.animatedBackground === "boolean") next.animatedBackground = raw.animatedBackground;
    if (typeof raw.enableHaptics === "boolean") next.enableHaptics = raw.enableHaptics;
    next.defaultDeckId = resolveDefaultDeckId(raw);
    next.defaultOpponentDeckId = resolveDefaultOpponentDeckId(raw);
    next.activeLoadout = resolveActiveLoadout(raw);
  }
  return next;
}
