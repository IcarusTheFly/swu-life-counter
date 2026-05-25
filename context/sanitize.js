// Pure helper: validate persisted settings and merge with defaults.
//
// Extracted from SettingsContext.jsx so it can be exercised by `node --test`
// without pulling in React Native, AsyncStorage, or JSX. Keep this file free
// of React imports.

// Explicit `.js` extensions on the imports below so this module loads under
// Node ESM (used by the `npm test` runner) as well as Metro (which accepts
// either form).
import {DEFAULT_SETTINGS, LIFE_MODES, STARTING_LIFE_MAX, STARTING_LIFE_MIN} from "../constants/settings.js";
import {TEAM_COLOR_KEYS} from "../constants/teamColorKeys.js";

export function sanitize(raw) {
  const next = {...DEFAULT_SETTINGS};
  if (raw && typeof raw === "object") {
    if (TEAM_COLOR_KEYS.includes(raw.player1Color)) next.player1Color = raw.player1Color;
    if (TEAM_COLOR_KEYS.includes(raw.player2Color)) next.player2Color = raw.player2Color;
    if (LIFE_MODES.includes(raw.lifeMode)) next.lifeMode = raw.lifeMode;
    if (Number.isInteger(raw.startingLife) && raw.startingLife >= STARTING_LIFE_MIN && raw.startingLife <= STARTING_LIFE_MAX) {
      next.startingLife = raw.startingLife;
    }
  }
  return next;
}
