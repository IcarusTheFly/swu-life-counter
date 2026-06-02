export const SETTINGS_STORAGE_KEY = "@swu-life-counter:settings";

// Deck-related defaults reference `RANDOM_DECK_ID` ("__random__") and the
// deck record shape defined in `constants/decks.js`. The shape lives there
// to keep the deck-feature constants colocated; we duplicate the sentinel
// string literal below to avoid this file having any imports.
export const DEFAULT_SETTINGS = {
  player1Color: "green",
  player2Color: "red",
  initialLife: 0,
  enableAnimations: true,
  // Whether the shared space backdrop animates (drifting starfield). Default
  // on; combined with `enableAnimations` (reduce-motion) — the backdrop moves
  // only when BOTH are true, otherwise it renders statically.
  animatedBackground: true,
  enableHaptics: false,
  // Id of the deck the user has marked as their default PLAYER deck, or null
  // when none is set. Populates the loadout's player1 (Player) side fallback.
  defaultDeckId: null,
  // Id of the user's default OPPONENT deck, or null when none is set. Set via
  // "Set as default for Opponent" on a deck's detail screen. Populates the
  // loadout's player2 (Opponent) side fallback (null → fall back to Random).
  defaultOpponentDeckId: null,
  // The deck pair selected for the next game. Both ids reference the single
  // shared `decks` list. EITHER side may be `null` (no deck — allowed) OR
  // `"__random__"` (a Random/untracked deck — a Random game still counts for
  // the OTHER deck if that one is real). A game can only be recorded when at
  // least one side is a real deck.
  activeLoadout: {
    player1DeckId: null,
    player2DeckId: "__random__"
  }
};

// Initial Life Points input range. Lower bound is 0 so "count up from 0" is a
// directly-pickable value (the legacy Count Up mode is gone — see the
// archived change `extend-settings` for the migration rationale).
export const INITIAL_LIFE_MIN = 0;
export const INITIAL_LIFE_MAX = 99;

// Static quick-pick presets shown beneath the stepper. Tapping a chip sets
// the value. The list itself is intentionally NOT user-editable — keeping it
// static avoids a maintenance burden for low real-world value.
export const INITIAL_LIFE_PRESETS = [0, 25, 30, 35];
