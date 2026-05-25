// Pure JS list of valid team color keys.
//
// Lives separately from `teamColors.js` because that file static-requires PNG
// assets, which Node can't resolve outside the React Native bundler. By keeping
// the key list here, the validation logic in `context/sanitize.js` (and the
// node-based tests that exercise it) can import the names without dragging in
// the PNG requires.
//
// `teamColors.js` re-exports this same array as `TEAM_COLOR_KEYS` for
// compatibility with existing call sites — and verifies at module load that
// the two stay in sync (see the assertion there).

export const TEAM_COLOR_KEYS = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "white"];
