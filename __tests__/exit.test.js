import test from "node:test";
import assert from "node:assert/strict";
import {platformSupportsExit, homeExitVisible} from "../utils/exit.js";

// The Exit control now lives on Home (relocated from Settings) and is gated by
// platform: Android/web get it, iOS omits it (Apple HIG forbids a quit button).
// These assert the gating rule that drives the "Exit on Android/web" and
// "No Exit on iOS" home-screen scenarios.

test("platformSupportsExit: Android shows Exit", () => {
  assert.equal(platformSupportsExit("android"), true);
});

test("platformSupportsExit: web shows Exit", () => {
  assert.equal(platformSupportsExit("web"), true);
});

test("platformSupportsExit: iOS hides Exit (Apple HIG forbids programmatic quit)", () => {
  assert.equal(platformSupportsExit("ios"), false);
});

test("platformSupportsExit: only iOS is excluded (unknown platforms default to showing Exit)", () => {
  assert.equal(platformSupportsExit("macos"), true);
  assert.equal(platformSupportsExit("windows"), true);
  assert.equal(platformSupportsExit(undefined), true);
});

// Home's Exit is portrait-only on supported platforms (it would render behind
// the bottom tab bar in the short landscape layout).
test("homeExitVisible: shown in portrait on Android/web", () => {
  assert.equal(homeExitVisible("android", false), true);
  assert.equal(homeExitVisible("web", false), true);
});

test("homeExitVisible: hidden in landscape even on supported platforms", () => {
  assert.equal(homeExitVisible("android", true), false);
  assert.equal(homeExitVisible("web", true), false);
});

test("homeExitVisible: never shown on iOS, either orientation", () => {
  assert.equal(homeExitVisible("ios", false), false);
  assert.equal(homeExitVisible("ios", true), false);
});
