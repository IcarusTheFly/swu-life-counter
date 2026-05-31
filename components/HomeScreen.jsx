import React, {useMemo} from "react";
import {BackHandler, Platform, StyleSheet, Text, View} from "react-native";
import MenuButton from "./MenuButton";
import Dropdown from "./Dropdown";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {RANDOM_DECK_ID} from "../constants/decks";
import {accentForDeck} from "./DeckCard";
import {textShadow} from "../utils/textShadow";

// Exit is hidden on iOS where Apple HIG forbids programmatic termination.
// Shown on Android (BackHandler.exitApp) and web (window.close, which may
// no-op in browsers if the tab wasn't script-opened — harmless).
const SHOW_EXIT = Platform.OS !== "ios";

// Sentinel keys for the dropdown's special rows (distinct from any deck id).
const KEY_RANDOM = RANDOM_DECK_ID;
const KEY_CREATE = "__create__";

function handleExit() {
  if (Platform.OS === "android") {
    BackHandler.exitApp();
  } else if (Platform.OS === "web" && typeof window !== "undefined") {
    window.close();
  }
}

// Home (v3 — design.md Decision 6). Two always-visible inline dropdowns —
// Player + Opponent — drive `activeLoadout`; both draw from the single
// shared `decks` list (Opponent also offers Random). When no decks exist,
// each dropdown shows a "Create a deck" row routing to deck-edit.
export default function HomeScreen({onStartGame, onOpenSettings, onOpenDecks, onOpenDeckEdit}) {
  const {settings, updateSettings} = useSettings();
  const {decks} = useDecks();

  const loadout = settings.activeLoadout || {player1DeckId: null, player2DeckId: RANDOM_DECK_ID};
  const hasDecks = decks.length > 0;

  // Build dropdown option lists from the shared pool. Each deck option
  // carries its first-aspect color for the dot prefix.
  const deckOptions = useMemo(
    () => decks.map((d) => ({key: d.id, label: d.name, aspectColor: accentForDeck(d)})),
    [decks]
  );

  // Both dropdowns offer Random + every deck (+ a Create action when the pool
  // is empty). Either side may be Random — a game still counts for whichever
  // side is a real deck.
  const random = {key: KEY_RANDOM, label: "Random", special: true};
  const sideOptions = useMemo(() => {
    if (!hasDecks) return [random, {key: KEY_CREATE, label: "+ Create a deck", special: true}];
    return [random, ...deckOptions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDecks, deckOptions]);

  // Resolve current ids to a key the Dropdown can match (Random → KEY_RANDOM).
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

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.title}>SWU LIFE COUNTER</Text>
        <Text style={styles.subtitle}>STAR WARS UNLIMITED</Text>
      </View>

      <View style={styles.menuWrap}>
        <View style={styles.menu}>
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

          <MenuButton label="Start Game" onPress={onStartGame} />
          <MenuButton label="Decks" onPress={onOpenDecks} />
          <MenuButton label="Settings" onPress={onOpenSettings} />
          {SHOW_EXIT ? <MenuButton label="Exit" onPress={handleExit} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32
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
