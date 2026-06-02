import React, {useMemo} from "react";
import {BackHandler, Platform, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import MenuButton from "./MenuButton";
import Dropdown from "./Dropdown";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {RANDOM_DECK_ID} from "../constants/decks";
import {accentForDeck} from "./DeckCard";
import {textShadow} from "../utils/textShadow";

// Exit is hidden on iOS where Apple HIG forbids programmatic termination.
const SHOW_EXIT = Platform.OS !== "ios";

const KEY_RANDOM = RANDOM_DECK_ID;
const KEY_CREATE = "__create__";

function handleExit() {
  if (Platform.OS === "android") {
    BackHandler.exitApp();
  } else if (Platform.OS === "web" && typeof window !== "undefined") {
    window.close();
  }
}

// Home (v3). Two always-visible inline dropdowns — Player + Opponent — drive
// `activeLoadout`. Layout is orientation-aware: a centered vertical stack in
// portrait, and a TWO-COLUMN layout in landscape (brand + deck loadout on the
// left, menu buttons on the right) so the short landscape viewport never clips
// the buttons.
export default function HomeScreen({onStartGame, onOpenSettings, onOpenDecks, onOpenDeckEdit}) {
  const {settings, updateSettings} = useSettings();
  const {decks} = useDecks();
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

  const brand = (
    <View style={styles.brand}>
      <Text style={[styles.title, isLandscape && styles.titleLandscape]}>SWU LIFE COUNTER</Text>
      <Text style={styles.subtitle}>STAR WARS UNLIMITED</Text>
    </View>
  );

  const loadoutControls = (
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
  );

  const menuButtons = (
    <View style={styles.menuButtons}>
      <MenuButton label="Start Game" onPress={onStartGame} />
      <MenuButton label="Decks" onPress={onOpenDecks} />
      <MenuButton label="Settings" onPress={onOpenSettings} />
      {SHOW_EXIT ? <MenuButton label="Exit" onPress={handleExit} /> : null}
    </View>
  );

  // ── Landscape: two columns, vertically centered, minimal padding. ──
  if (isLandscape) {
    return (
      <View style={[styles.container, styles.containerLandscape]}>
        <View style={styles.landscapeRow}>
          <View style={styles.landscapeColLeft}>
            {brand}
            {loadoutControls}
          </View>
          <View style={styles.landscapeColRight}>{menuButtons}</View>
        </View>
      </View>
    );
  }

  // ── Portrait: centered vertical stack. ──
  return (
    <View style={styles.container}>
      {brand}
      <View style={styles.menuWrap}>
        <View style={styles.menu}>
          {loadoutControls}
          {menuButtons}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32
  },
  containerLandscape: {
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: "center"
  },
  landscapeRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32
  },
  landscapeColLeft: {
    flex: 1,
    maxWidth: 440,
    gap: 18,
    justifyContent: "center"
  },
  landscapeColRight: {
    flex: 1,
    maxWidth: 300,
    justifyContent: "center"
  },
  brand: {
    alignItems: "center",
    paddingTop: 24
  },
  title: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 24,
    letterSpacing: 1.4,
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 2}, radius: 6})
  },
  titleLandscape: {
    fontSize: 20
  },
  subtitle: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 6
  },
  menuWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  menu: {
    width: "100%",
    maxWidth: 360,
    gap: 18
  },
  menuButtons: {
    gap: 14
  },
  loadoutRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 4
  },
  versus: {
    color: "#777",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 1,
    paddingBottom: 13
  }
});
