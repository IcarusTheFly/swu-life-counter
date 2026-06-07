import React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import MetalCard from "./ui/MetalCard";
import Sparkline from "./ui/Sparkline";
import RecordNumbers from "./ui/RecordNumbers";
import {ASPECTS} from "../constants/decks";
import {RADIUS, RECORD, TEXT, TYPE} from "../constants/theme";

// Shared deck-tracking visual primitive (v3 — metallic-design-system).
//
// A brushed-silver MetalCard with:
//   - a 4px left accent bar in the deck's FIRST-aspect color (neutral grey
//     when the deck has no aspects);
//   - the deck name in dark, high-contrast metal text;
//   - up to three aspect dots + a muted archetype tag;
//   - the right column: a recent-form sparkline, a NUMBERS-ONLY record
//     (`15-5-2`), and a small streak chip (arrow + count, no W/L/D letter).
//
// Props:
//   deck    — the deck record ({name, aspects, archetype, ...})
//   stats   — output of statsForDeck(deck.id, games): {wins,losses,draws,total,winPct}
//   streak  — output of streakForDeck (or null); rendered as a small chip
//   points  — output of recentForm(deck.id, games) for the sparkline (optional)
//   onPress — row tap handler
//
// Kept presentational + lean: no context, no hooks. The caller computes
// stats/streak/points once (DecksScreen memoizes them) and passes them down.

// First-aspect color drives the left accent + the dot ring tint. Falls back
// to a neutral grey when the deck has no aspects.
export const NEUTRAL_ACCENT = "#6b6f78";

export function accentForDeck(deck) {
  const aspects = deck && Array.isArray(deck.aspects) ? deck.aspects : [];
  for (const a of aspects) {
    if (ASPECTS[a]) return ASPECTS[a].color;
  }
  return NEUTRAL_ACCENT;
}

// A thin win-rate bar: a green fill over a muted track, width = pct%. Used by
// the matchup rows on DeckDetail / GameHistory. `onMetal` darkens the track so
// it reads on a silver surface (default track suits dark surfaces).
export function WinRateBar({pct, width, onMetal = false}) {
  // `pct` may be null (no games) — render an empty track in that case.
  const clamped = typeof pct === "number" ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <View style={[onMetal ? styles.barTrackMetal : styles.barTrack, width != null && {width}]}>
      <View style={[styles.barFill, {width: `${clamped}%`}]} />
    </View>
  );
}

export function AspectDots({aspects, size = 8}) {
  const list = Array.isArray(aspects) ? aspects : [];
  if (list.length === 0) return null;
  return (
    <View style={styles.dotsRow}>
      {list.map((aspect) => {
        const spec = ASPECTS[aspect];
        if (!spec) return null;
        return (
          <View
            key={aspect}
            style={[styles.dot, {width: size, height: size, borderRadius: size / 2, backgroundColor: spec.color}]}
          />
        );
      })}
    </View>
  );
}

// A streak as a colored arrow + count — no W/L/D letter (▲ win, ▼ loss, = draw).
function streakGlyph(kind) {
  return kind === "W" ? "▲" : kind === "L" ? "▼" : "=";
}
function streakColor(kind) {
  return kind === "W" ? RECORD.onMetal.win : kind === "L" ? RECORD.onMetal.loss : TEXT.onMetal.muted;
}

export default function DeckCard({deck, stats, streak, points, onPress}) {
  const accent = accentForDeck(deck);
  const total = stats ? stats.total : 0;
  const hasGames = total > 0;
  const pts = Array.isArray(points) ? points : [];
  const last = pts.length ? pts[pts.length - 1] : 0;
  const trend = last > 0 ? RECORD.onMetal.win : last < 0 ? RECORD.onMetal.loss : TEXT.onMetal.muted;

  return (
    <MetalCard edge={accent} style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({pressed}) => [styles.body, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${deck.name}`}
      >
        {/* LEFT: name + dots + archetype */}
        <View style={styles.leftCol}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {deck.name}
          </Text>
          <View style={styles.metaLine}>
            <AspectDots aspects={deck.aspects} />
            {deck.archetype ? (
              <Text style={styles.archetype} numberOfLines={1} ellipsizeMode="tail">
                {deck.archetype}
              </Text>
            ) : null}
          </View>
        </View>

        {/* RIGHT: sparkline + numbers-only record + streak chip */}
        <View style={styles.rightCol}>
          {hasGames && pts.length ? <Sparkline points={pts} color={trend} width={56} height={20} /> : null}
          <View style={styles.recordRow}>
            {hasGames ? (
              <RecordNumbers stats={stats} surface="onMetal" size={15} />
            ) : (
              <Text style={styles.noGames}>No games</Text>
            )}
            {streak ? (
              <Text style={[styles.streak, {color: streakColor(streak.kind)}]}>
                {streakGlyph(streak.kind)}
                {streak.count}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </MetalCard>
  );
}

const styles = StyleSheet.create({
  card: {marginBottom: 12},
  body: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 12,
    minHeight: 72
  },
  pressed: {opacity: 0.78},
  leftCol: {flex: 1, minWidth: 0},
  name: {...TYPE.title, fontSize: 16, color: TEXT.onMetal.primary, flexShrink: 1},
  metaLine: {flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7},
  dotsRow: {flexDirection: "row", alignItems: "center", gap: 4},
  dot: {borderWidth: 1, borderColor: "rgba(0,0,0,0.3)"},
  archetype: {...TYPE.caption, color: TEXT.onMetal.muted, flexShrink: 1},
  rightCol: {alignItems: "flex-end", gap: 4},
  recordRow: {flexDirection: "row", alignItems: "center", gap: 8},
  noGames: {...TYPE.caption, color: TEXT.onMetal.muted, fontStyle: "italic"},
  streak: {fontFamily: "FiraCode_700Bold", fontSize: 12, letterSpacing: 0.3},

  // Win-rate bar (shared with DeckDetail / GameHistory matchup rows).
  barTrack: {height: 5, borderRadius: 3, backgroundColor: "#2a2a2e", overflow: "hidden"},
  barTrackMetal: {height: 5, borderRadius: RADIUS.sm, backgroundColor: "rgba(0,0,0,0.16)", overflow: "hidden"},
  barFill: {height: "100%", borderRadius: 3, backgroundColor: "#22c55e"}
});
