// Whether the app should surface a self-quit "Exit" control on a given
// platform. iOS forbids programmatic termination (Apple HIG), so Exit is
// hidden there; Android (`BackHandler.exitApp()`) and web (`window.close()`)
// support it. Pure so the Node test runner can exercise the gating rule
// without the Metro bundler / `react-native`'s `Platform`.
//
// Explicit `.js` so Node ESM resolves it under `npm test` (same convention as
// `context/deckStats.js`).
export function platformSupportsExit(os) {
  return os !== "ios";
}

// Whether Home should render its Exit control. Exit lives on Home, but only in
// PORTRAIT: the short landscape layout has no room for it above the bottom tab
// bar (it would render behind the bar), so it is hidden there. Pure so the
// orientation + platform gating can be unit-tested.
export function homeExitVisible(platformOS, isLandscape) {
  return platformSupportsExit(platformOS) && !isLandscape;
}
