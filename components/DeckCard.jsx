import React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {ASPECTS} from "../constants/decks";
import {textShadow} from "../utils/textShadow";

// Shared deck-tracking visual primitive (v3 — design.md Decision 7).
//
// A rounded dark card with:
//   - a 4px left accent bar in the deck's FIRST-aspect color (neutral grey
//     when the deck has no aspects);
//   - the deck name (FiraCode_700Bold) with a ★ prefix for the default deck;
//   - up to three 8px aspect dots + a muted archetype tag;
//   - the right column: W-L-D, an emphasized win%, and a thin win-rate bar
//     whose green fill width is proportional to the win%.
//
// Props:
//   deck      — the deck record ({name, aspects, archetype, ...})
//   stats     — output of statsForDeck(deck.id, games): {wins,losses,draws,total,winPct}
//   streak    — output of streakForDeck (or null); rendered as a small badge
//   onPress   — row tap handler
//
// (There is no default-deck ★ on the list — the player/opponent defaults are
// shown on the deck detail screen, and the list is sorted by the user's chosen
// Sort/Order in the Filters panel.)
//
// Kept presentational + lean: no context, no hooks. The caller computes
// stats/streak once (DecksScreen memoizes them) and passes them down.

// First-aspect color drives the left accent + the dot ring tint. Falls back
// to a neutral grey when the deck has no aspects (design.md Decision 7).
export const NEUTRAL_ACCENT = "#555";

export function accentForDeck(deck) {
  const aspects = deck && Array.isArray(deck.aspects) ? deck.aspects : [];
  for (const a of aspects) {
    if (ASPECTS[a]) return ASPECTS[a].color;
  }
  return NEUTRAL_ACCENT;
}

// A thin win-rate bar: a green fill over a muted track, width = pct%.
// Exported so the matchup rows on DeckDetail can reuse the same affordance.
export function WinRateBar({pct, width}) {
  // `pct` may be null (no games) — render an empty track in that case.
  const clamped = typeof pct === "number" ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <View style={[styles.barTrack, width != null && {width}]}>
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

export default function DeckCard({deck, stats, streak, onPress}) {
  const accent = accentForDeck(deck);
  const total = stats ? stats.total : 0;
  const winPctLabel = !stats || stats.winPct === null ? "–" : stats.winPct.toFixed(1) + "%";

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${deck.name}`}
    >
      <View style={[styles.accent, {backgroundColor: accent}]} />
      <View style={styles.content}>
        {/* LEFT: name + dots + archetype */}
        <View style={styles.leftCol}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {deck.name}
            </Text>
          </View>
          <View style={styles.metaLine}>
            <AspectDots aspects={deck.aspects} />
            {deck.archetype ? (
              <Text style={styles.archetype} numberOfLines={1} ellipsizeMode="tail">
                {deck.archetype}
              </Text>
            ) : null}
          </View>
        </View>

        {/* RIGHT: win% (emphasized) + W-L-D + bar + streak */}
        <View style={styles.rightCol}>
          <View style={styles.pctRow}>
            <Text style={styles.winPct}>{winPctLabel}</Text>
            {streak ? (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>
                  {streak.kind}
                  {streak.count}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.wld}>
            {total === 0 ? "No games" : `${stats.wins}–${stats.losses}–${stats.draws}`}
          </Text>
          <WinRateBar pct={stats ? stats.winPct : null} width={96} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    overflow: "hidden",
    marginBottom: 12,
    minHeight: 72
  },
  cardPressed: {
    opacity: 0.82,
    backgroundColor: "#1b1b21"
  },
  accent: {
    width: 4
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12
  },
  leftCol: {
    flex: 1,
    minWidth: 0
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  name: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 16,
    letterSpacing: 0.5,
    flexShrink: 1
  },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 7
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  dot: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)"
  },
  archetype: {
    color: "#8a8a92",
    fontFamily: "FiraCode_400Regular",
    fontSize: 11,
    letterSpacing: 0.4,
    flexShrink: 1
  },
  rightCol: {
    alignItems: "flex-end"
  },
  pctRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  winPct: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 20,
    letterSpacing: 0.5,
    ...textShadow({color: "rgba(0,0,0,0.5)", offset: {width: 0, height: 1}, radius: 3})
  },
  streakBadge: {
    borderWidth: 1,
    borderColor: "#3a3a40",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  streakText: {
    color: "#CCC",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 0.6
  },
  wld: {
    color: "#9a9aa2",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: 3,
    marginBottom: 6
  },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2a2a2e",
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#22c55e"
  }
});
