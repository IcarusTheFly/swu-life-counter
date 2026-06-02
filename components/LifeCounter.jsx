import React, {useCallback, useEffect, useMemo, useState} from "react";
import {BackHandler, Platform, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import PlayerView from "./PlayerView";
import Divider from "./Divider";
import ConfirmationModal from "./ConfirmationModal";
import {DropdownSheet} from "./Dropdown";
import {accentForDeck} from "./DeckCard";
import {useSettings} from "../context/SettingsContext";
import {useDecks} from "../context/DecksContext";
import {TEAM_COLORS} from "../constants/teamColors";
import {RANDOM_DECK_ID} from "../constants/decks";
import {gradientFromBase, textOnColor} from "../constants/theme";

const PLAYER1_ID = 1;
const PLAYER2_ID = 2;

// A "real deck" is anything that's neither unset (null) nor the Random
// sentinel — only real decks accrue stats, so recording is meaningful only
// when at least one side is real.
const isRealDeck = (id) => id !== null && id !== RANDOM_DECK_ID;

// Normalize a loadout side for in-game use: an unset (null) side is treated
// as Random so the recorded id is always a string (the stats layer ignores
// `__random__`).
const normalizeSide = (id) => (id === RANDOM_DECK_ID || !isRealDeck(id) ? RANDOM_DECK_ID : id);

// Cap a deck name in the compact outcome-prompt buttons so a long name wraps to
// at most ~2 lines instead of blowing out the dialog layout.
const shortName = (name) => {
  const s = String(name || "");
  return s.length > 22 ? s.slice(0, 21).trimEnd() + "…" : s;
};

export default function LifeCounter({onReturnHome}) {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const {settings} = useSettings();
  const {decks, getDeckById, recordGame} = useDecks();

  // Snapshot the non-deck game config (life total, team colors, toggles) at
  // mount — these are locked for the game. The DECK loadout, by contrast, is
  // now held in STATE so either side can be re-picked mid-game (Issue 4).
  const startConfig = useMemo(
    () => ({
      initialLife: settings.initialLife,
      player1Color: TEAM_COLORS[settings.player1Color] || TEAM_COLORS.green,
      player2Color: TEAM_COLORS[settings.player2Color] || TEAM_COLORS.red,
      enableAnimations: settings.enableAnimations,
      enableHaptics: settings.enableHaptics
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // In-game loadout, initialized from the active loadout with each side
  // normalized so a null side becomes Random. Recorded ids are therefore
  // always strings (real deck id or `__random__`). Mid-game deck changes
  // mutate THIS, not settings — the persisted loadout is untouched.
  const [gameLoadout, setGameLoadout] = useState(() => {
    const loadout = settings.activeLoadout || {player1DeckId: null, player2DeckId: RANDOM_DECK_ID};
    return {
      player1DeckId: normalizeSide(loadout.player1DeckId),
      player2DeckId: normalizeSide(loadout.player2DeckId)
    };
  });

  // Resolve each side to a deck record (null when that side is Random).
  const player1Deck = getDeckById(gameLoadout.player1DeckId);
  const player2Deck = getDeckById(gameLoadout.player2DeckId);

  // End-game is recordable when AT LEAST ONE side is a real deck (Issue 3).
  const isRecordable = isRealDeck(gameLoadout.player1DeckId) || isRealDeck(gameLoadout.player2DeckId);

  const [player1Life, setPlayer1Life] = useState(startConfig.initialLife);
  const [player2Life, setPlayer2Life] = useState(startConfig.initialLife);
  const [initiativePlayer, setInitiativePlayer] = useState(PLAYER2_ID);
  const [dialogVisible, setDialogVisible] = useState(false);
  // Which loadout side's deck picker is open: null (closed), "player1DeckId",
  // or "player2DeckId". One shared DropdownSheet is reconfigured per side.
  const [pickerSide, setPickerSide] = useState(null);
  // Outcome modal — opened ONLY by the end-game (✓) button on the Divider,
  // i.e. the explicit "I want to record this game" action. "Return to Home"
  // is a deliberate exit-without-saving and SHALL NOT prompt for an outcome.
  const [outcomeModalVisible, setOutcomeModalVisible] = useState(false);

  const resetLife = useCallback(() => {
    setInitiativePlayer(PLAYER2_ID);
    setPlayer1Life(startConfig.initialLife);
    setPlayer2Life(startConfig.initialLife);
    setDialogVisible(false);
  }, [startConfig.initialLife]);

  const returnHome = useCallback(() => {
    setDialogVisible(false);
    setOutcomeModalVisible(false);
    if (onReturnHome) onReturnHome();
  }, [onReturnHome]);

  // The reset modal's "Return to Home" row exits straight to Home — no outcome
  // prompt (the user is leaving without saving; recording is done via the
  // end-game ✓ button instead).
  const handleReturnToHomeAction = returnHome;

  // From the divider's end-game button — the explicit "record this game" path.
  const openOutcomeModal = useCallback(() => {
    setOutcomeModalVisible(true);
  }, []);

  // "Don't save" in the outcome modal cancels the end-game action and stays in
  // the game (the user opened the prompt themselves and backed out).
  const handleDontSave = useCallback(() => {
    setOutcomeModalVisible(false);
  }, []);

  // Record an outcome for the CURRENT loadout, then route home. The loadout's
  // player1 side maps to the PLAYER deck, player2 to the OPPONENT deck — the
  // `recordGame` API takes {playerDeckId, opponentDeckId}. A `__random__` id
  // on either side is passed through verbatim; the stats layer ignores it.
  const finishWithOutcome = useCallback(
    (outcome) => {
      if (isRecordable) {
        recordGame({
          playerDeckId: gameLoadout.player1DeckId,
          opponentDeckId: gameLoadout.player2DeckId,
          outcome
        });
      }
      returnHome();
    },
    [recordGame, returnHome, isRecordable, gameLoadout]
  );

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (pickerSide !== null) {
        setPickerSide(null);
        return true;
      }
      if (outcomeModalVisible) {
        // Hardware back over the outcome modal acts like "Don't save" —
        // close the modal but stay in the game.
        setOutcomeModalVisible(false);
        return true;
      }
      if (dialogVisible) {
        setDialogVisible(false);
        return true;
      }
      returnHome();
      return true;
    });
    return () => sub.remove();
  }, [dialogVisible, outcomeModalVisible, pickerSide, returnHome]);

  // Outcome modal actions — labels reflect the CURRENT loadout (resolved deck
  // name, or "Random" when that side is the sentinel).
  const outcomeActions = useMemo(() => {
    // Tint each win button with that side's TEAM color (player color for "You
    // won", opponent color for "Opponent won"); text color picked for contrast.
    const p1Base = startConfig.player1Color.base;
    const p2Base = startConfig.player2Color.base;
    // Build a win-button label. A Random side (no real deck) renders the word
    // "Random" in ITALIC, matching the in-game badge + Game History styling.
    // (A plain string for real decks; a node only when Random.)
    const winLabel = (prefix, deck) =>
      deck ? (
        `${prefix} · ${shortName(deck.name)}`
      ) : (
        <>
          {`${prefix} · `}
          <Text style={styles.outcomeRandom}>Random</Text>
        </>
      );
    return [
      // Opponent FIRST (top button) so the prompt mirrors the table layout: the
      // opponent's half is the TOP of the screen, the player's is the bottom.
      {
        label: winLabel("Opponent won", player2Deck),
        accessibilityLabel: `Opponent won · ${player2Deck ? player2Deck.name : "Random"}`,
        colors: gradientFromBase(p2Base),
        textColor: textOnColor(p2Base),
        onPress: () => finishWithOutcome("opponent_win")
      },
      {
        label: winLabel("You won", player1Deck),
        accessibilityLabel: `You won · ${player1Deck ? player1Deck.name : "Random"}`,
        colors: gradientFromBase(p1Base),
        textColor: textOnColor(p1Base),
        onPress: () => finishWithOutcome("player_win")
      },
      // Draw gets its own distinct (slate-blue) tone — not the cancel steel.
      {label: "Draw", variant: "draw", onPress: () => finishWithOutcome("draw")},
      // Backing out of the prompt is a plain cancel (not a destructive action) —
      // matches the hamburger reset dialog's neutral "Cancel".
      {label: "Cancel", variant: "neutral", onPress: handleDontSave}
    ];
  }, [player1Deck, player2Deck, finishWithOutcome, handleDontSave, startConfig]);

  // Deck-picker options: every deck + a "Random" row (mirrors Home).
  const pickerOptions = useMemo(
    () => [
      {key: RANDOM_DECK_ID, label: "Random", special: true},
      ...decks.map((d) => ({key: d.id, label: d.name, aspectColor: accentForDeck(d)}))
    ],
    [decks]
  );

  // Apply a picker selection to the open side, then close.
  const handlePickDeck = useCallback(
    (key) => {
      setGameLoadout((prev) => (pickerSide ? {...prev, [pickerSide]: key} : prev));
      setPickerSide(null);
    },
    [pickerSide]
  );

  const pickerTitle = pickerSide === "player1DeckId" ? "PLAYER DECK" : "OPPONENT DECK";
  const pickerSelectedKey = pickerSide ? gameLoadout[pickerSide] : null;

  return (
    <View style={styles.container}>
      <PlayerView
        hasInitiative={initiativePlayer === PLAYER1_ID}
        playerLife={player1Life}
        setPlayerLife={setPlayer1Life}
        claimInitiative={() => setInitiativePlayer(PLAYER1_ID)}
        linesImage={isLandscape ? startConfig.player2Color.lines.landscape : startConfig.player2Color.lines.portrait}
        isOpponent={true}
        isLandscape={isLandscape}
        teamColor={startConfig.player2Color}
        enableAnimations={startConfig.enableAnimations}
        enableHaptics={startConfig.enableHaptics}
        // The TOP (rotated) half is the OPPONENT's physical position — its badge
        // surfaces the opponent's deck (player2DeckId) AND it is tinted with the
        // OPPONENT's team color (player2Color). Both the deck AND the color now
        // follow the physical side, so they agree (and match the outcome
        // prompt's "Opponent won" button).
        deckName={player2Deck ? player2Deck.name : null}
        deckAspects={player2Deck ? player2Deck.aspects : []}
        isRandom={gameLoadout.player2DeckId === RANDOM_DECK_ID}
        isPlayerSide={false}
        onPressBadge={() => setPickerSide("player2DeckId")}
      />

      <Divider
        onPress={() => setDialogVisible(true)}
        enabled={isRecordable}
        onEndGame={openOutcomeModal}
        enableAnimations={startConfig.enableAnimations}
      />

      <ConfirmationModal
        visible={dialogVisible}
        enableAnimations={startConfig.enableAnimations}
        title="Reset life or return to home?"
        actions={[
          {label: "Reset Life", variant: "destructive", onPress: resetLife},
          {label: "Return to Home", variant: "primary", onPress: handleReturnToHomeAction},
          {label: "Cancel", variant: "neutral", onPress: () => setDialogVisible(false)}
        ]}
      />

      <ConfirmationModal
        visible={outcomeModalVisible}
        enableAnimations={startConfig.enableAnimations}
        title="How did this game end?"
        actions={outcomeActions}
      />

      {/* Deck picker — rendered HERE (outside both PlayerViews) so it never
          inherits the opponent half's 180° rotation. RN Modal portals to the
          native root regardless, but rendering from this non-rotated subtree
          also keeps it upright on react-native-web. */}
      <DropdownSheet
        visible={pickerSide !== null}
        title={pickerTitle}
        options={pickerOptions}
        selectedKey={pickerSelectedKey}
        onPick={handlePickDeck}
        onClose={() => setPickerSide(null)}
        enableAnimations={startConfig.enableAnimations}
      />

      <PlayerView
        hasInitiative={initiativePlayer === PLAYER2_ID}
        playerLife={player2Life}
        setPlayerLife={setPlayer2Life}
        claimInitiative={() => setInitiativePlayer(PLAYER2_ID)}
        linesImage={isLandscape ? startConfig.player1Color.lines.landscape : startConfig.player1Color.lines.portrait}
        isLandscape={isLandscape}
        teamColor={startConfig.player1Color}
        enableAnimations={startConfig.enableAnimations}
        enableHaptics={startConfig.enableHaptics}
        // The BOTTOM (non-rotated) half is the PLAYER's physical position —
        // surface the player's deck (player1DeckId) AND tint it with the
        // PLAYER's team color (player1Color), so deck + color agree (and match
        // the outcome prompt's "You won" button).
        deckName={player1Deck ? player1Deck.name : null}
        deckAspects={player1Deck ? player1Deck.aspects : []}
        isRandom={gameLoadout.player1DeckId === RANDOM_DECK_ID}
        isPlayerSide={true}
        onPressBadge={() => setPickerSide("player1DeckId")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  // Italic "Random" inside the outcome-prompt win buttons (inherits the
  // button's bold/size/color from the dialog; only adds the slant).
  outcomeRandom: {
    fontStyle: "italic"
  }
});
