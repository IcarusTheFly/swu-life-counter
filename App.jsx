import React, {useCallback, useEffect, useState} from "react";
import {useFonts, FiraCode_400Regular, FiraCode_700Bold} from "@expo-google-fonts/fira-code";
import ScreenLayout from "./components/ScreenLayout";
import HomeScreen from "./components/HomeScreen";
import SettingsScreen from "./components/SettingsScreen";
import LifeCounter from "./components/LifeCounter";
import DecksScreen from "./components/DecksScreen";
import DeckDetailScreen from "./components/DeckDetailScreen";
import DeckEditScreen from "./components/DeckEditScreen";
import BulkAddGamesScreen from "./components/BulkAddGamesScreen";
import GameHistoryScreen from "./components/GameHistoryScreen";
import {SettingsProvider, useSettings} from "./context/SettingsContext";
import {DecksProvider, useDecks} from "./context/DecksContext";
import {RANDOM_DECK_ID} from "./constants/decks";

// The screen state machine + cross-validation effect live inside
// `<AppContent>` because they read from both providers. SettingsProvider
// mounts first so DecksProvider's delete cascades can call
// `updateSettings`. Both providers gate their children on hydration, so
// by the time AppContent renders, both stores are ready.
//
// NOTE: hardware back routing for the deck/game screens is owned by the
// screens themselves — they each install their own `BackHandler`
// listener. App.jsx intentionally does not centralize it.
function AppContent() {
  const [screen, setScreen] = useState("home");
  // `activeDeckId` drives the deck-detail + deck-edit routes (the single
  // shared pool — no collection split, so one id state is enough).
  const [activeDeckId, setActiveDeckId] = useState(null);
  // Bulk-add prefill context: {playerDeckId, opponentDeckId|null} captured
  // when the user opens Bulk Add from a deck (or a matchup row).
  const [activeGamesFilter, setActiveGamesFilter] = useState(null);

  const {settings, updateSettings} = useSettings();
  const {decks} = useDecks();

  const goHome = useCallback(() => setScreen("home"), []);
  const goGame = useCallback(() => setScreen("game"), []);
  const goSettings = useCallback(() => setScreen("settings"), []);
  const goDecks = useCallback(() => setScreen("decks"), []);

  const openDeckDetail = useCallback((id) => {
    setActiveDeckId(id);
    setScreen("deck-detail");
  }, []);
  const openDeckEdit = useCallback((id) => {
    // `id === null` means "create a new deck".
    setActiveDeckId(id);
    setScreen("deck-edit");
  }, []);

  const openBulkAddGames = useCallback((playerDeckId = null, opponentDeckId = null) => {
    setActiveGamesFilter({playerDeckId, opponentDeckId});
    setScreen("bulk-add-games");
  }, []);
  // Bulk Add returns to the deck detail it was opened from (never a bare
  // games list — see issue #5). Falls back to the Decks list if somehow no
  // deck is active.
  const closeBulkAddGames = useCallback(() => {
    if (activeDeckId) {
      setScreen("deck-detail");
    } else {
      setScreen("decks");
    }
  }, [activeDeckId]);

  // Game History — the recorded game log for one deck, grouped by opponent.
  // Opened from Deck Detail; Back returns there (activeDeckId is preserved).
  // Falls back to the Decks list in the unlikely event activeDeckId is lost.
  const openGameHistory = useCallback((id) => {
    setActiveDeckId(id);
    setScreen("game-history");
  }, []);
  const closeGameHistory = useCallback(() => {
    setScreen(activeDeckId ? "deck-detail" : "decks");
  }, [activeDeckId]);

  // Cross-validation: once both providers have hydrated, heal any loadout
  // entries whose decks no longer exist. Runs whenever the deck list or the
  // loadout changes — covers both the initial hydration race and any
  // out-of-band deletion (e.g. the user clears AsyncStorage from DevTools
  // and reloads).
  //
  // v3.1 single shared pool — both sides validate against the SAME `decks`
  // list. EITHER side may be null or the random sentinel (both allowed); only
  // a value that LOOKS like a deck id but no longer resolves needs healing:
  //   player1DeckId → heal a dangling id to the default deck (or null)
  //   player2DeckId → heal a dangling id to the default opponent deck (or random)
  useEffect(() => {
    const loadout = settings.activeLoadout;
    if (!loadout) return;
    const ids = new Set(decks.map((d) => d.id));
    const isDangling = (v) => v !== null && v !== RANDOM_DECK_ID && !ids.has(v);
    let needsUpdate = false;
    let nextP1 = loadout.player1DeckId;
    let nextP2 = loadout.player2DeckId;

    if (isDangling(nextP1)) {
      nextP1 = settings.defaultDeckId && ids.has(settings.defaultDeckId) ? settings.defaultDeckId : null;
      needsUpdate = true;
    }
    if (isDangling(nextP2)) {
      nextP2 =
        settings.defaultOpponentDeckId && ids.has(settings.defaultOpponentDeckId)
          ? settings.defaultOpponentDeckId
          : RANDOM_DECK_ID;
      needsUpdate = true;
    }
    if (needsUpdate) {
      updateSettings({activeLoadout: {player1DeckId: nextP1, player2DeckId: nextP2}});
    }
  }, [decks, settings.activeLoadout, settings.defaultDeckId, settings.defaultOpponentDeckId, updateSettings]);

  return (
    <ScreenLayout>
      {screen === "home" && (
        <HomeScreen
          onStartGame={goGame}
          onOpenSettings={goSettings}
          onOpenDecks={goDecks}
          onOpenDeckEdit={openDeckEdit}
        />
      )}
      {screen === "settings" && <SettingsScreen onBack={goHome} />}
      {screen === "game" && <LifeCounter onReturnHome={goHome} />}
      {screen === "decks" && (
        <DecksScreen onBack={goHome} onOpenDeckDetail={openDeckDetail} onOpenDeckEdit={openDeckEdit} />
      )}
      {screen === "deck-detail" && (
        <DeckDetailScreen
          deckId={activeDeckId}
          onBack={goDecks}
          onOpenDeckEdit={openDeckEdit}
          onOpenBulkAddGames={openBulkAddGames}
          onOpenGameHistory={openGameHistory}
          onDeleted={goDecks}
        />
      )}
      {screen === "game-history" && (
        <GameHistoryScreen deckId={activeDeckId} onBack={closeGameHistory} />
      )}
      {screen === "deck-edit" && (
        <DeckEditScreen deckId={activeDeckId} onBack={goDecks} onSaved={goDecks} />
      )}
      {screen === "bulk-add-games" && (
        <BulkAddGamesScreen
          prefillPlayerDeckId={activeGamesFilter ? activeGamesFilter.playerDeckId : null}
          prefillOpponentDeckId={activeGamesFilter ? activeGamesFilter.opponentDeckId : null}
          onBack={closeBulkAddGames}
          onSaved={closeBulkAddGames}
        />
      )}
    </ScreenLayout>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({FiraCode_400Regular, FiraCode_700Bold});

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SettingsProvider>
      <DecksProvider>
        <AppContent />
      </DecksProvider>
    </SettingsProvider>
  );
}
