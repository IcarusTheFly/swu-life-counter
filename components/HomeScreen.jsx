import React, {useMemo} from "react";
import {Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import MenuButton from "./MenuButton";
import Dropdown from "./Dropdown";
import PlayIcon from "../icons/PlayIcon";
import DeckIcon from "../icons/DeckIcon";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {globalStats, statsForDeck, rankDecks, MIN_RANKED_GAMES} from "../context/deckStats";
import {RANDOM_DECK_ID} from "../constants/decks";
import {GRADIENTS} from "../constants/theme";
import {accentForDeck} from "./DeckCard";
import {textShadow} from "../utils/textShadow";

const KEY_RANDOM = RANDOM_DECK_ID;
const KEY_CREATE = "__create__";
const MAX_TOP_DECKS = 3;

function winColor(pct) {
  if (pct == null) return "#6f727a";
  return pct >= 60 ? "#46d29a" : pct >= 45 ? "#d8c45a" : "#d86a6a";
}
function fmtRecord(s) {
  return s.draws > 0 ? `${s.wins}–${s.losses}–${s.draws}` : `${s.wins}–${s.losses}`;
}

// Featured top-performer card. The card body (open detail) and the Test button
// are SIBLING pressables (never nested) to avoid the web <button>-in-<button>.
function FeaturedDeck({deck, games, qualifies, onTest, onOpen}) {
  const accent = accentForDeck(deck);
  const s = statsForDeck(deck.id, games);
  const pct = s.total > 0 ? Math.round(s.winPct) : null;
  const color = winColor(pct);
  const showPct = qualifies && pct != null;
  const archetype = deck.archetype || (Array.isArray(deck.aspects) ? deck.aspects.join(" · ") : "");
  return (
    <View style={styles.featuredWrap}>
      <Pressable
        onPress={() => onOpen(deck.id)}
        style={({pressed}) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Top performer: ${deck.name || "deck"}. Open deck.`}
      >
        <LinearGradient colors={["#1a1a23", "#101016"]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.featured}>
          <Text style={styles.featuredLabel}>★ TOP PERFORMER</Text>
          <View style={styles.featuredRow}>
            <View style={[styles.featuredDot, {backgroundColor: accent || "#666"}]} />
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredName} numberOfLines={1}>{deck.name || "Untitled deck"}</Text>
              {archetype ? <Text style={styles.featuredArch} numberOfLines={1}>{archetype}</Text> : null}
            </View>
            <View style={styles.featuredStats}>
              {showPct ? (
                <Text style={[styles.featuredPct, {color}]}>{pct}%</Text>
              ) : (
                <Text style={styles.featuredNeeds}>needs {MIN_RANKED_GAMES}+ games</Text>
              )}
              <Text style={styles.featuredRecord}>{fmtRecord(s)}</Text>
            </View>
          </View>
          {showPct ? (
            <View style={styles.featuredBar}>
              <View style={[styles.featuredBarFill, {width: `${pct}%`, backgroundColor: color}]} />
            </View>
          ) : null}
        </LinearGradient>
      </Pressable>
      <Pressable
        onPress={() => onTest(deck.id)}
        style={({pressed}) => [styles.featuredTest, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Test ${deck.name || "deck"}`}
      >
        <PlayIcon color="#e8e8ee" size={14} />
        <Text style={styles.featuredTestTxt}>Test this deck</Text>
      </Pressable>
    </View>
  );
}

// Compact deck row — the top-decks list.
function DeckRow({deck, games, rank, onTest, onOpen}) {
  const accent = accentForDeck(deck);
  const s = statsForDeck(deck.id, games);
  const hasGames = s.total > 0;
  const pct = hasGames ? Math.round(s.winPct) : null;
  const color = winColor(pct);
  const archetype = deck.archetype || (Array.isArray(deck.aspects) ? deck.aspects.join(" · ") : "");
  return (
    <View style={styles.deckRow}>
      <Pressable
        style={({pressed}) => [styles.deckMain, pressed && styles.pressed]}
        onPress={() => onOpen(deck.id)}
        accessibilityRole="button"
        accessibilityLabel={`${deck.name || "Untitled deck"}, ${hasGames ? `${fmtRecord(s)}, ${pct} percent win` : "no games yet"}. Open deck.`}
      >
        {rank ? <Text style={styles.deckRank}>#{rank}</Text> : null}
        <View style={[styles.deckDot, {backgroundColor: accent || "#666"}]} />
        <View style={styles.deckInfo}>
          <Text style={styles.deckName} numberOfLines={1}>{deck.name || "Untitled deck"}</Text>
          {archetype ? <Text style={styles.deckArch} numberOfLines={1}>{archetype}</Text> : null}
        </View>
        <View style={styles.deckStats}>
          {hasGames ? (
            <>
              <Text style={styles.deckWl}>{fmtRecord(s)}</Text>
              <Text style={[styles.deckPct, {color}]}>{pct}%</Text>
            </>
          ) : (
            <Text style={styles.deckNoGames}>no games yet</Text>
          )}
        </View>
      </Pressable>
      <Pressable
        style={({pressed}) => [styles.testBtn, pressed && styles.pressed]}
        onPress={() => onTest(deck.id)}
        accessibilityRole="button"
        accessibilityLabel={`Test ${deck.name || "deck"}`}
      >
        <Text style={styles.testTxt}>▶ Test</Text>
      </Pressable>
    </View>
  );
}

// Home (v6 — bottom-nav-and-dashboard). A dashboard: a featured top-performer
// deck → a short top-decks list → a Play Now loadout. Top-level navigation is
// the bottom tab bar (App.jsx), so Home has no footer/menu of its own.
export default function HomeScreen({onStartGame, onOpenDeckEdit, onOpenDeckDetail}) {
  const {settings, updateSettings} = useSettings();
  const {decks, games} = useDecks();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  const loadout = settings.activeLoadout || {player1DeckId: null, player2DeckId: RANDOM_DECK_ID};
  const hasDecks = decks.length > 0;

  const deckOptions = useMemo(
    () => decks.map((d) => ({key: d.id, label: d.name, aspectColor: accentForDeck(d)})),
    [decks]
  );
  const random = {key: KEY_RANDOM, label: "Random", special: true};
  const sideOptions = useMemo(() => {
    if (!hasDecks) return [random, {key: KEY_CREATE, label: "+ Create a deck", special: true}];
    return [random, ...deckOptions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDecks, deckOptions]);

  const toKey = (id) => (id === RANDOM_DECK_ID ? KEY_RANDOM : id);
  const playerValue = toKey(loadout.player1DeckId);
  const opponentValue = toKey(loadout.player2DeckId);

  const makeHandler = (side) => (key) => {
    if (key === KEY_CREATE) {
      if (onOpenDeckEdit) onOpenDeckEdit(null);
      return;
    }
    updateSettings({activeLoadout: {...loadout, [side]: key}});
  };
  const handlePlayerSelect = makeHandler("player1DeckId");
  const handleOpponentSelect = makeHandler("player2DeckId");

  const stats = useMemo(() => globalStats(decks, games), [decks, games]);
  const ranking = useMemo(() => rankDecks(decks, games), [decks, games]);
  const topDecks = ranking.rest.slice(0, MAX_TOP_DECKS);

  const testDeck = (deckId) => {
    updateSettings({activeLoadout: {player1DeckId: deckId, player2DeckId: loadout.player2DeckId || RANDOM_DECK_ID}});
    if (onStartGame) onStartGame();
  };
  const openDeck = (id) => onOpenDeckDetail && onOpenDeckDetail(id);
  const newDeck = () => onOpenDeckEdit && onOpenDeckEdit(null);

  const brand = <Text style={[styles.title, isLandscape && styles.titleLandscape]}>SWU PLAYTESTING</Text>;

  const statStrip = (
    <View style={styles.statStrip}>
      {stats.gameCount === 0 ? (
        <Text style={styles.statCta} numberOfLines={1}>Play a test game to start your stats</Text>
      ) : (
        <Text style={styles.statText} numberOfLines={1}>
          <Text style={styles.statNum}>{stats.deckCount}</Text>
          <Text style={styles.statLabel}>{stats.deckCount === 1 ? " deck" : " decks"}</Text>
          <Text style={styles.statDot}>{" · "}</Text>
          <Text style={styles.statNum}>{stats.gameCount}</Text>
          <Text style={styles.statLabel}>{stats.gameCount === 1 ? " test game" : " test games"}</Text>
        </Text>
      )}
    </View>
  );

  const featured = hasDecks && ranking.top ? (
    <FeaturedDeck deck={ranking.top} games={games} qualifies={ranking.topQualifies} onTest={testDeck} onOpen={openDeck} />
  ) : (
    <Pressable
      style={({pressed}) => [styles.emptyWrap, pressed && styles.pressed]}
      onPress={newDeck}
      accessibilityRole="button"
      accessibilityLabel="Create your first deck"
    >
      <LinearGradient colors={GRADIENTS.STEEL} start={{x: 0, y: 0}} end={{x: 0, y: 1}} style={styles.emptyBtn}>
        <DeckIcon color="#e8e8ee" size={20} />
        <Text style={styles.emptyText}>Create your first deck</Text>
      </LinearGradient>
    </Pressable>
  );

  const topDecksSection = topDecks.length > 0 ? (
    <View style={styles.topSection}>
      <Text style={styles.sectionTitle}>TOP DECKS</Text>
      {topDecks.map((d, i) => (
        <DeckRow key={d.id} deck={d} games={games} rank={i + 2} onTest={testDeck} onOpen={openDeck} />
      ))}
    </View>
  ) : null;

  const playNow = (
    <View style={styles.playNow}>
      <Text style={styles.sectionTitle}>PLAY NOW</Text>
      <View style={styles.loadoutRow}>
        <Dropdown
          label="PLAYER"
          value={playerValue}
          options={sideOptions}
          onSelect={handlePlayerSelect}
          placeholder={hasDecks ? "Select a deck" : "Create a deck"}
          enableAnimations={settings.enableAnimations}
        />
        <Text style={styles.versus}>vs</Text>
        <Dropdown
          label="OPPONENT"
          value={opponentValue}
          options={sideOptions}
          onSelect={handleOpponentSelect}
          placeholder="Random"
          enableAnimations={settings.enableAnimations}
        />
      </View>
      <MenuButton label="Play Test Game" variant="hero" icon={<PlayIcon color="#FFFFFF" size={22} />} onPress={onStartGame} />
    </View>
  );

  // ── Landscape: two columns — featured + top decks (scroll) left, Play Now right. ──
  if (isLandscape) {
    return (
      <View style={styles.containerLandscape}>
        <View style={styles.landscapeRow}>
          <View style={styles.landscapeColLeft}>
            {brand}
            {statStrip}
            <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftScrollContent}>
              {featured}
              {topDecksSection}
            </ScrollView>
          </View>
          <View style={styles.landscapeColRight}>{playNow}</View>
        </View>
      </View>
    );
  }

  // ── Portrait: one scrollable column. ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {brand}
      {statStrip}
      {featured}
      {topDecksSection}
      {playNow}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: "transparent"},
  scrollContent: {paddingHorizontal: 20, paddingTop: 30, paddingBottom: 24},
  containerLandscape: {flex: 1, backgroundColor: "transparent", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10},
  landscapeRow: {flex: 1, flexDirection: "row", gap: 24},
  landscapeColLeft: {flex: 1.25, minWidth: 0},
  landscapeColRight: {flex: 1, maxWidth: 330, justifyContent: "center"},
  leftScroll: {flex: 1},
  leftScrollContent: {paddingBottom: 8},

  title: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 21,
    letterSpacing: 1.6,
    textAlign: "center",
    paddingTop: 2,
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 2}, radius: 6})
  },
  titleLandscape: {fontSize: 18},

  statStrip: {alignItems: "center", marginTop: 8, marginBottom: 16},
  statText: {fontFamily: "FiraCode_400Regular", fontSize: 12.5, letterSpacing: 0.2},
  statNum: {color: "#d7dae1", fontFamily: "FiraCode_700Bold"},
  statLabel: {color: "#8b8f99"},
  statDot: {color: "#55585f"},
  statCta: {color: "#8b8f99", fontFamily: "FiraCode_400Regular", fontSize: 12.5},

  // ── Featured top-performer ──
  featuredWrap: {marginBottom: 18},
  featured: {borderRadius: 16, borderWidth: 1, borderColor: "#ffffff1f", padding: 15, borderBottomLeftRadius: 0, borderBottomRightRadius: 0},
  featuredLabel: {color: "#d8b24a", fontFamily: "FiraCode_700Bold", fontSize: 10, letterSpacing: 2.5, marginBottom: 9},
  featuredRow: {flexDirection: "row", alignItems: "center", gap: 12},
  featuredDot: {width: 13, height: 13, borderRadius: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)"},
  featuredInfo: {flex: 1, minWidth: 0},
  featuredName: {color: "#fff", fontFamily: "FiraCode_700Bold", fontSize: 18},
  featuredArch: {color: "#9a9da6", fontFamily: "FiraCode_400Regular", fontSize: 11, marginTop: 2},
  featuredStats: {alignItems: "flex-end"},
  featuredPct: {fontFamily: "FiraCode_700Bold", fontSize: 26},
  featuredNeeds: {color: "#9a9da6", fontFamily: "FiraCode_400Regular", fontSize: 10.5, fontStyle: "italic"},
  featuredRecord: {color: "#c8ccd4", fontFamily: "FiraCode_400Regular", fontSize: 12, marginTop: 1},
  featuredBar: {height: 5, borderRadius: 3, backgroundColor: "#2a2a30", marginTop: 12, overflow: "hidden"},
  featuredBarFill: {height: "100%", borderRadius: 3},
  featuredTest: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "#ffffff1f",
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  featuredTestTxt: {color: "#e8e8ee", fontFamily: "FiraCode_700Bold", fontSize: 13, letterSpacing: 0.5},

  // ── Top decks ──
  topSection: {marginBottom: 18},
  sectionTitle: {color: "#7e8290", fontFamily: "FiraCode_700Bold", fontSize: 11, letterSpacing: 2, marginBottom: 10, marginLeft: 2},

  deckRow: {flexDirection: "row", alignItems: "stretch", gap: 8, marginBottom: 9},
  deckMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "#ffffff12",
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 58
  },
  deckRank: {color: "#7e8290", fontFamily: "FiraCode_700Bold", fontSize: 12, width: 20, textAlign: "center"},
  deckDot: {width: 11, height: 11, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)"},
  deckInfo: {flex: 1, minWidth: 0},
  deckName: {color: "#fff", fontFamily: "FiraCode_700Bold", fontSize: 14},
  deckArch: {color: "#83868f", fontFamily: "FiraCode_400Regular", fontSize: 10.5, marginTop: 2},
  deckStats: {width: 64, alignItems: "flex-end"},
  deckWl: {color: "#c8ccd4", fontFamily: "FiraCode_400Regular", fontSize: 11},
  deckPct: {fontFamily: "FiraCode_700Bold", fontSize: 15, marginTop: 1},
  deckNoGames: {color: "#6f727a", fontFamily: "FiraCode_400Regular", fontSize: 10.5, fontStyle: "italic"},
  testBtn: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    minWidth: 66,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#ffffff26",
    backgroundColor: "#242424"
  },
  testTxt: {color: "#e8e8ee", fontFamily: "FiraCode_700Bold", fontSize: 12},
  pressed: {opacity: 0.7},

  // ── Empty (no decks) ──
  emptyWrap: {borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#ffffff30", marginBottom: 18},
  emptyBtn: {flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11, minHeight: 66, paddingHorizontal: 16},
  emptyText: {color: "#fff", fontFamily: "FiraCode_700Bold", fontSize: 14.5, letterSpacing: 0.3},

  // ── Play Now ──
  playNow: {borderWidth: 1, borderColor: "#ffffff14", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.03)", padding: 13},
  loadoutRow: {flexDirection: "row", alignItems: "flex-end", gap: 9, marginBottom: 12},
  versus: {color: "#777", fontFamily: "FiraCode_700Bold", fontSize: 13, paddingBottom: 13}
});
