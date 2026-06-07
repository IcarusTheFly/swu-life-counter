import React, {useMemo, useState} from "react";
import {BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import Svg, {Polyline} from "react-native-svg";
import MetalCard from "./ui/MetalCard";
import PrimaryButton from "./ui/PrimaryButton";
import SectionLabel from "./ui/SectionLabel";
import HeaderStat, {headerStatStyles} from "./ui/HeaderStat";
import SelectRow from "./ui/SelectRow";
import Sparkline from "./ui/Sparkline";
import RecordNumbers from "./ui/RecordNumbers";
import CrownIcon from "../icons/CrownIcon";
import SabersIcon from "../icons/SabersIcon";
import DeckIcon from "../icons/DeckIcon";
import PlayIcon from "../icons/PlayIcon";
import PowerIcon from "../icons/PowerIcon";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {homeHeaderModel, rankDecks, statsForDeck, recentForm} from "../context/deckStats";
import {RANDOM_DECK_ID} from "../constants/decks";
import {METAL, RADIUS, RECORD, TEXT, TYPE} from "../constants/theme";
import {accentForDeck} from "./DeckCard";
import {homeExitVisible} from "../utils/exit";

const KEY_RANDOM = RANDOM_DECK_ID;
const KEY_CREATE = "__create__";
// Home shows just the strongest few decks (so the Play button stays reachable);
// the full list lives on the Decks tab — no "see all" link needed.
const MAX_HOME_DECKS = 4;

// Exit lives on Home only (Android/web — iOS apps don't self-exit, and the App
// Store rejects a quit control; hidden in landscape, see homeExitVisible).
// Android closes the task; web closes the tab.
function handleExit() {
  if (Platform.OS === "android") {
    BackHandler.exitApp();
  } else if (Platform.OS === "web" && typeof window !== "undefined") {
    window.close();
  }
}

// An engraved frame that HUGS the brand title: a short horizontal line directly
// under the title that turns UP diagonally at both ends and finishes at the top,
// inset from the bar edges (＼___／). The flat run is the title width (+pad), and
// the diagonals splay out by `diagW` as they rise — so the whole shape frames
// just the title, never reaching the sides. Drawn as two offset polylines — a
// dark line with a light line 1px below — to read as a groove carved in metal.
function HeaderFrame({width, titleW, height, diagW, pad}) {
  const cx = width / 2;
  const top = 1; // diagonal tips sit at the very top edge of the bar
  const bot = height - 1.5;
  const flatHalf = Math.min(titleW / 2 + pad, cx - diagW - 2); // never exceed the bar
  const topHalf = flatHalf + diagW;
  const path = (shift) =>
    `${cx - topHalf},${top + shift} ${cx - flatHalf},${bot + shift} ` +
    `${cx + flatHalf},${bot + shift} ${cx + topHalf},${top + shift}`;
  return (
    <Svg width={width} height={height} style={styles.frameSvg}>
      <Polyline points={path(0)} fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <Polyline points={path(1)} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

// One deck in the Home "YOUR DECKS" list — a metallic card: aspect-colored
// edge, name (dark, high-contrast), a recent-form sparkline, numbers-only
// record, and a dark TEST pill. No win% (we rank, we don't rate). The card body
// (open detail) and the TEST pill are SIBLING pressables to avoid nesting a
// <button> in a <button> on web.
function HomeDeckCard({deck, games, onTest, onOpen}) {
  const accent = accentForDeck(deck) || "#6b6f78";
  const s = statsForDeck(deck.id, games);
  const hasGames = s.total > 0;
  const pts = recentForm(deck.id, games);
  const last = pts.length ? pts[pts.length - 1] : 0;
  const trend = last > 0 ? RECORD.onMetal.win : last < 0 ? RECORD.onMetal.loss : TEXT.onMetal.muted;
  const archetype = deck.archetype || (Array.isArray(deck.aspects) ? deck.aspects.join(" · ") : "");
  const name = deck.name || "Untitled deck";
  const a11y = `${name}, ${
    hasGames ? `record ${s.wins} wins ${s.losses} losses${s.draws ? ` ${s.draws} draws` : ""}` : "no games yet"
  }. Open deck.`;
  return (
    <MetalCard edge={accent} style={styles.deckCard}>
      <View style={styles.deckRow}>
        <Pressable
          style={({pressed}) => [styles.deckBody, pressed && styles.pressed]}
          onPress={() => onOpen(deck.id)}
          accessibilityRole="button"
          accessibilityLabel={a11y}
        >
          <View style={styles.deckInfo}>
            <Text style={styles.deckName} numberOfLines={1}>{name}</Text>
            {archetype ? <Text style={styles.deckArch} numberOfLines={1}>{archetype}</Text> : null}
          </View>
          <View style={styles.deckRight}>
            {hasGames ? <Sparkline points={pts} color={trend} width={52} height={20} /> : null}
            {hasGames ? <RecordNumbers stats={s} surface="onMetal" size={14} /> : <Text style={styles.noGames}>no games</Text>}
          </View>
        </Pressable>
        <Pressable
          style={({pressed}) => [styles.testPill, pressed && styles.pressed]}
          onPress={() => onTest(deck.id)}
          accessibilityRole="button"
          accessibilityLabel={`Test ${name}`}
        >
          <PlayIcon color="#f1f2f4" size={11} />
          <Text style={styles.testTxt}>TEST</Text>
        </Pressable>
      </View>
    </MetalCard>
  );
}

// Home (metallic-design-system). A compact metallic dashboard: a header stat
// bar (Decks / Games / Top Deck) → the YOUR DECKS list (best first) → a New
// Test Game loadout. Top-level navigation is the bottom tab bar (App.jsx), so
// Home has no footer/menu of its own. The shared space backdrop shows through.
export default function HomeScreen({onStartGame, onOpenDeckEdit, onOpenDeckDetail}) {
  const {settings, updateSettings} = useSettings();
  const {decks, games} = useDecks();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const showExit = homeExitVisible(Platform.OS, isLandscape);
  // Brand-frame geometry is measured (react-native-svg needs explicit sizes):
  // the bar width positions the SVG; the title width sizes the frame so it hugs
  // the title and the diagonals finish inset from the edges.
  const [headerW, setHeaderW] = useState(0);
  const [titleW, setTitleW] = useState(0);

  const loadout = settings.activeLoadout || {player1DeckId: null, player2DeckId: RANDOM_DECK_ID};
  const hasDecks = decks.length > 0;

  const deckOptions = useMemo(
    () =>
      decks.map((d) => ({
        key: d.id,
        label: d.name,
        aspects: Array.isArray(d.aspects) ? d.aspects : [],
        aspectColor: accentForDeck(d)
      })),
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

  const head = useMemo(() => homeHeaderModel(decks, games), [decks, games]);
  const ranking = useMemo(() => rankDecks(decks, games), [decks, games]);
  const ordered = useMemo(() => [ranking.top, ...ranking.rest].filter(Boolean), [ranking]);
  const shown = ordered.slice(0, MAX_HOME_DECKS);

  const testDeck = (deckId) => {
    updateSettings({activeLoadout: {player1DeckId: deckId, player2DeckId: loadout.player2DeckId || RANDOM_DECK_ID}});
    if (onStartGame) onStartGame();
  };
  const openDeck = (id) => onOpenDeckDetail && onOpenDeckDetail(id);
  const newDeck = () => onOpenDeckEdit && onOpenDeckEdit(null);

  // ── Metallic top app-bar: linked to the top edge, brand heading + compact
  // single-line stats (Decks / Games / Top Deck). ──
  const header = (
    <LinearGradient
      colors={METAL.surface}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={[styles.headerBar, isLandscape && styles.headerBarCompact]}
    >
      <View
        style={[styles.brandBlock, isLandscape && styles.brandBlockCompact]}
        onLayout={(e) => setHeaderW(Math.round(e.nativeEvent.layout.width))}
      >
        {headerW > 0 && titleW > 0 ? (
          <HeaderFrame
            width={headerW}
            titleW={titleW}
            height={isLandscape ? 24 : 30}
            diagW={isLandscape ? 16 : 20}
            pad={isLandscape ? 7 : 9}
          />
        ) : null}
        <Text
          style={[styles.brand, isLandscape && styles.brandCompact]}
          onLayout={(e) => setTitleW(Math.round(e.nativeEvent.layout.width))}
        >
          SWU PLAYTESTING
        </Text>
      </View>
      <View style={styles.headerRow}>
        <HeaderStat icon={<DeckIcon color={TEXT.onMetal.secondary} size={17} />} label="DECKS" style={styles.statSmall}>
          <Text style={headerStatStyles.value}>{head.deckCount}</Text>
        </HeaderStat>
        <View style={styles.vdiv} />
        <HeaderStat icon={<SabersIcon color={TEXT.onMetal.secondary} size={17} />} label="GAMES" style={styles.statSmall}>
          <Text style={headerStatStyles.value}>{head.gameCount}</Text>
        </HeaderStat>
        <View style={styles.vdiv} />
        <HeaderStat icon={<CrownIcon color={TEXT.onMetal.secondary} size={17} />} label="BEST DECK" style={styles.statWide}>
          {head.topDeck ? (
            <View style={styles.topRow}>
              <Text style={styles.topName} numberOfLines={1}>{head.topDeck.name}</Text>
              {head.topDeck.hasGames ? (
                <RecordNumbers stats={head.topDeck.stats} surface="onMetal" size={12} style={styles.topRecord} />
              ) : null}
            </View>
          ) : (
            <Text style={styles.topName}>—</Text>
          )}
        </HeaderStat>
      </View>
    </LinearGradient>
  );

  // ── YOUR DECKS (best first, capped) — or the empty-state CTA ──
  const decksSection = hasDecks ? (
    <View style={styles.section}>
      <SectionLabel>TOP DECKS</SectionLabel>
      {shown.map((d) => (
        <HomeDeckCard key={d.id} deck={d} games={games} onTest={testDeck} onOpen={openDeck} />
      ))}
    </View>
  ) : (
    <View style={styles.section}>
      <SectionLabel>YOUR DECKS</SectionLabel>
      <PrimaryButton
        label="Create your first deck"
        icon={<DeckIcon color={TEXT.onMetal.primary} size={18} />}
        onPress={newDeck}
      />
      <Text style={styles.emptyHint}>Register a deck to start logging playtests and tracking your top performer.</Text>
    </View>
  );

  // ── New Test Game — Player & Opponent on SEPARATE rows (room for names) ──
  const testSection = (
    <View style={styles.section}>
      <SectionLabel style={isLandscape ? styles.sectionLabelCompact : undefined}>NEW TEST GAME</SectionLabel>
      <SelectRow
        label="PLAYER"
        value={playerValue}
        options={sideOptions}
        onSelect={handlePlayerSelect}
        placeholder={hasDecks ? "Select a deck" : "Create a deck"}
        enableAnimations={settings.enableAnimations}
        compact={isLandscape}
      />
      <Text style={[styles.vs, isLandscape && styles.vsCompact]}>vs</Text>
      <SelectRow
        label="OPPONENT"
        value={opponentValue}
        options={sideOptions}
        onSelect={handleOpponentSelect}
        placeholder="Random"
        enableAnimations={settings.enableAnimations}
        compact={isLandscape}
      />
      <PrimaryButton
        label="Play Test Game"
        icon={<PlayIcon color={TEXT.onMetal.primary} size={20} />}
        onPress={onStartGame}
        style={[styles.playBtn, isLandscape && styles.playBtnCompact]}
      />
    </View>
  );

  const exitFooter = showExit ? (
    <Pressable
      onPress={handleExit}
      style={({pressed}) => [styles.exitRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Exit the app"
    >
      <PowerIcon color="#e8938c" size={18} />
      <Text style={styles.exitLabel}>Exit</Text>
    </Pressable>
  ) : null;

  // ── Landscape: header full-width, then decks (scroll) | New Test Game ──
  if (isLandscape) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.landscapeRow}>
          <View style={styles.landscapeColLeft}>
            <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftScrollContent}>
              {decksSection}
            </ScrollView>
          </View>
          <View style={styles.landscapeColRight}>
            {/* exitFooter is null in landscape (homeExitVisible) — no room above
                the tab bar. */}
            <ScrollView style={styles.rightScroll} contentContainerStyle={styles.rightScrollContent}>
              {testSection}
              {exitFooter}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  // ── Portrait: fixed top bar, then one scrollable column ──
  return (
    <View style={styles.container}>
      {header}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {decksSection}
        {testSection}
        {exitFooter}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: "transparent"},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24},
  landscapeRow: {flex: 1, minHeight: 0, flexDirection: "row", gap: 20, paddingHorizontal: 18, paddingTop: 12},
  landscapeColLeft: {flex: 1.3, minWidth: 0, minHeight: 0},
  landscapeColRight: {flex: 1, maxWidth: 360, minHeight: 0},
  leftScroll: {flex: 1},
  leftScrollContent: {paddingBottom: 8},
  rightScroll: {flex: 1},
  rightScrollContent: {paddingBottom: 8},

  // ── Metallic top app-bar (linked to the top edge) ──
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 0, // brand frame's diagonals run up to the very top edge
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: METAL.bevelDark
  },
  headerBarCompact: {paddingTop: 0, paddingBottom: 5},
  // Brand block: the title centered over a single engraved line that runs the
  // full width of the bar and turns UP diagonally at both ends (＼___／). The
  // block is full-bleed (cancels the 16px side padding) so the diagonal ends
  // reach the bar edges; HeaderFrame draws the line behind the title.
  brandBlock: {marginHorizontal: -16, height: 30, alignItems: "center", justifyContent: "center", marginBottom: 7},
  brandBlockCompact: {height: 24, marginBottom: 5},
  frameSvg: {position: "absolute", left: 0, top: 0, pointerEvents: "none"},
  brand: {
    fontFamily: "FiraCode_700Bold",
    fontSize: 15,
    letterSpacing: 3.5,
    color: TEXT.onMetal.primary,
    textAlign: "center"
  },
  brandCompact: {fontSize: 12, letterSpacing: 2.5},
  headerRow: {flexDirection: "row", alignItems: "flex-start"},
  statSmall: {flex: 1},
  statWide: {flex: 1.8, marginLeft: 2},
  vdiv: {width: 1, alignSelf: "stretch", marginHorizontal: 10, backgroundColor: "rgba(0,0,0,0.16)"},
  topRow: {flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0},
  topName: {...TYPE.stat, fontSize: 14, color: TEXT.onMetal.primary, flexShrink: 1},
  topRecord: {flexShrink: 0},

  // ── Sections ──
  section: {marginBottom: 18},
  sectionLabelCompact: {marginBottom: 5},

  // ── Deck card ──
  deckCard: {marginBottom: 9},
  deckRow: {flexDirection: "row", alignItems: "center", paddingVertical: 9, paddingLeft: 14, paddingRight: 9, gap: 9},
  deckBody: {flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0},
  pressed: {opacity: 0.7},
  deckInfo: {flex: 1, minWidth: 0},
  deckName: {...TYPE.title, fontSize: 15, color: TEXT.onMetal.primary},
  deckArch: {...TYPE.caption, color: TEXT.onMetal.muted, marginTop: 1},
  deckRight: {alignItems: "flex-end", gap: 3, minWidth: 52},
  noGames: {...TYPE.caption, color: TEXT.onMetal.muted, fontStyle: "italic"},
  testPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 38,
    minWidth: 66,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: "#23262c",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.32)"
  },
  testTxt: {color: "#f1f2f4", ...TYPE.label, fontSize: 11, letterSpacing: 1.5},

  // ── Empty state ──
  emptyHint: {...TYPE.caption, color: TEXT.onSpace.muted, marginTop: 10, textAlign: "center", lineHeight: 16},

  // ── New Test Game ──
  vs: {textAlign: "center", ...TYPE.caption, color: TEXT.onSpace.muted, marginVertical: 8, letterSpacing: 1},
  vsCompact: {marginVertical: 3},
  playBtn: {marginTop: 16},
  playBtnCompact: {marginTop: 10},

  // ── Exit (Home only; Android/web) ──
  exitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 48,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#7a3a3a",
    borderRadius: RADIUS.md,
    backgroundColor: "#2c1618"
  },
  exitLabel: {color: "#e8938c", fontFamily: "FiraCode_700Bold", fontSize: 14, letterSpacing: 1}
});
