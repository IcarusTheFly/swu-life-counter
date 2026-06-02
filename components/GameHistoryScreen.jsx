import React, {useEffect, useMemo, useState} from "react";
import {BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from "react-native";
import BackIcon from "../icons/BackIcon";
import ConfirmationModal from "./ConfirmationModal";
import {DropdownSheet} from "./Dropdown";
import {WinRateBar, accentForDeck} from "./DeckCard";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {EVENT_TAG_MAX, GAME_COMMENT_MAX, RANDOM_DECK_ID} from "../constants/decks";
import {gamesGroupedByOpponent} from "../context/deckStats";
import {textShadow} from "../utils/textShadow";

// Game History (v3) — the recorded game LOG for one deck, classified by
// opponent. Each opponent card shows W-L-D + every individual game.
//
// New additions:
//   • "+ Add Game" in the header — inline form (one at a time) that records a
//     game with this deck as the player side.
//   • Edit mode on every game row — change outcome, event, or comment in-place.
export default function GameHistoryScreen({deckId, onBack}) {
  const {decks, games, getDeckById, deleteGame, recordGame, updateGame} = useDecks();
  const {settings} = useSettings();

  const [pendingDelete, setPendingDelete] = useState(null); // {id, label} | null
  const [addFormVisible, setAddFormVisible] = useState(false);

  const deck = getDeckById(deckId);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (pendingDelete) { setPendingDelete(null); return true; }
      if (addFormVisible) { setAddFormVisible(false); return true; }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, pendingDelete, addFormVisible]);

  // Defensive: if the deck vanishes (external wipe / cascade delete), bounce.
  useEffect(() => {
    if (!deck) onBack();
  }, [deck, onBack]);

  const groups = useMemo(
    () => (deck ? gamesGroupedByOpponent(deck.id, games, decks) : []),
    [deck, games, decks]
  );

  const totals = useMemo(() => {
    let wins = 0, losses = 0, draws = 0;
    for (const g of groups) { wins += g.wins; losses += g.losses; draws += g.draws; }
    return {wins, losses, draws, total: wins + losses + draws};
  }, [groups]);

  if (!deck) return null;

  const handleConfirmDelete = () => {
    if (pendingDelete) deleteGame(pendingDelete.id);
    setPendingDelete(null);
  };

  const handleAddGame = ({opponentId, result, event, comment}) => {
    const outcome = resultToOutcome(result, true /* always player side when adding */);
    recordGame({
      playerDeckId: deckId,
      opponentDeckId: opponentId,
      outcome,
      event: event.trim() || undefined,
      comment: comment.trim() || undefined
    });
    setAddFormVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({pressed}) => [styles.backBtn, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel="Back to deck detail"
        >
          <BackIcon stroke="#FFF" size={22} />
        </Pressable>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerOverline}>GAME HISTORY</Text>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {deck.name}
          </Text>
        </View>
        {!addFormVisible && (
          <Pressable
            onPress={() => setAddFormVisible(true)}
            hitSlop={8}
            style={({pressed}) => [styles.addHeaderBtn, pressed && styles.pressedSubtle]}
            accessibilityRole="button"
            accessibilityLabel="Add a game"
          >
            <Text style={styles.addHeaderLabel}>+ ADD</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Inline "add game" form — one at a time */}
        {addFormVisible && (
          <AddGameForm
            deckId={deckId}
            deckName={deck.name}
            decks={decks}
            settings={settings}
            onSave={handleAddGame}
            onCancel={() => setAddFormVisible(false)}
          />
        )}

        {totals.total === 0 && !addFormVisible ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No games recorded yet. Tap "+ ADD" to log your first game, finish a game
              from the life counter, or use Bulk Add Games.
            </Text>
          </View>
        ) : totals.total > 0 ? (
          <>
            {/* SUMMARY */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCount}>
                {totals.total} game{totals.total === 1 ? "" : "s"}
              </Text>
              <View style={styles.summaryRight}>
                <Text style={styles.summaryWld}>
                  {totals.wins}–{totals.losses}–{totals.draws}
                </Text>
                <Text style={styles.summaryWldLabel}>W – L – D</Text>
              </View>
            </View>

            {/* Per-opponent groups */}
            {groups.map((group) => (
              <OpponentGroup
                key={group.opponentDeckId}
                group={group}
                onUpdateGame={updateGame}
                onRequestDelete={(id, label) => setPendingDelete({id, label})}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <ConfirmationModal
        visible={pendingDelete !== null}
        enableAnimations={settings.enableAnimations}
        title="Delete this game?"
        message={
          pendingDelete
            ? `Removes ${pendingDelete.label} from the log. The deck's stats update immediately. This can't be undone.`
            : ""
        }
        actions={[
          {label: "Delete", variant: "destructive", onPress: handleConfirmDelete},
          {label: "Cancel", variant: "neutral", onPress: () => setPendingDelete(null)}
        ]}
      />
    </View>
  );
}

// ─── Add-game inline form ────────────────────────────────────────────────────

// Renders a compact card for adding a single new game. This deck is always the
// "player" side (shown as a "YOU" chip); the user picks the opponent + a W/L/D
// result read from THIS deck's perspective.
function AddGameForm({deckId, deckName, decks, settings, onSave, onCancel}) {
  const [opponentId, setOpponentId] = useState(null);
  const [result, setResult] = useState("W");
  const [event, setEvent] = useState("");
  const [comment, setComment] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Opponent options: Random sentinel first, then all decks including this one
  // (a mirror is a valid game).
  const opponentOptions = useMemo(() => {
    const opts = [{key: RANDOM_DECK_ID, label: "Random", special: true}];
    for (const d of decks) {
      opts.push({
        key: d.id,
        label: d.name,
        aspectColor: accentForDeck(d)
      });
    }
    return opts;
  }, [decks]);

  const selectedOpponent = opponentOptions.find((o) => o.key === opponentId) || null;

  const canSave = opponentId !== null;

  const handleSave = () => {
    if (!canSave) return;
    onSave({opponentId, result, event, comment});
  };

  return (
    <View style={styles.addFormCard}>
      <Text style={styles.addFormTitle}>ADD GAME</Text>

      {/* Matchup: YOU (this deck) vs the opponent you pick. */}
      <View style={styles.matchupRow}>
        <View style={styles.youChip}>
          <Text style={styles.youTag}>YOU</Text>
          <Text style={styles.youName} numberOfLines={1} ellipsizeMode="tail">
            {deckName}
          </Text>
        </View>
        <Text style={styles.vsText}>vs</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({pressed}) => [styles.addOpponentPill, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel={`Opponent: ${selectedOpponent ? selectedOpponent.label : "none selected"}. Tap to change.`}
        >
          {selectedOpponent && selectedOpponent.aspectColor ? (
            <View style={[styles.addOpponentDot, {backgroundColor: selectedOpponent.aspectColor}]} />
          ) : null}
          <Text style={[styles.addOpponentText, !selectedOpponent && styles.addOpponentPlaceholder]} numberOfLines={1} ellipsizeMode="tail">
            {selectedOpponent ? selectedOpponent.label : "Opponent…"}
          </Text>
          <Text style={styles.addChevron}>▾</Text>
        </Pressable>
      </View>

      {/* Result — read from THIS deck's perspective (W = you won). */}
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel} numberOfLines={1}>
          Result for <Text style={styles.resultDeck}>{deckName}</Text>
        </Text>
        <OutcomeChips value={result} onChange={setResult} />
      </View>

      {/* Row 2: event + comment inputs */}
      <TextInput
        value={event}
        onChangeText={setEvent}
        placeholder="Event tag (e.g. LOCALS)"
        placeholderTextColor="#555"
        maxLength={EVENT_TAG_MAX}
        style={styles.addInput}
        accessibilityLabel="Event tag"
      />
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Comment (optional)"
        placeholderTextColor="#555"
        maxLength={GAME_COMMENT_MAX}
        style={styles.addInput}
        accessibilityLabel="Comment"
      />

      {/* Action row */}
      <View style={styles.addFormActions}>
        <Pressable
          onPress={onCancel}
          hitSlop={6}
          style={({pressed}) => [styles.formBtn, styles.formBtnCancel, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.formBtnCancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={6}
          style={({pressed}) => [styles.formBtn, styles.formBtnSave, !canSave && styles.formBtnDisabled, pressed && canSave && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel="Save game"
          accessibilityState={{disabled: !canSave}}
        >
          <Text style={[styles.formBtnSaveText, !canSave && styles.formBtnDisabledText]}>Add Game</Text>
        </Pressable>
      </View>

      <DropdownSheet
        visible={pickerOpen}
        title="OPPONENT"
        options={opponentOptions}
        selectedKey={opponentId}
        onPick={(k) => { setOpponentId(k); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
        enableAnimations={settings.enableAnimations}
      />
    </View>
  );
}

// ─── Opponent group card ─────────────────────────────────────────────────────

function OpponentGroup({group, onUpdateGame, onRequestDelete}) {
  const isRandom = group.opponentDeckId === RANDOM_DECK_ID;
  const pct = group.winPct === null ? "–" : group.winPct.toFixed(1) + "%";
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text
          style={[styles.groupName, isRandom && styles.groupNameRandom]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isRandom ? "Random" : group.opponentName}
        </Text>
        <View style={styles.groupStats}>
          <Text style={styles.groupWld}>
            {group.wins}–{group.losses}–{group.draws}
          </Text>
          <Text style={styles.groupPct}>{pct}</Text>
        </View>
      </View>
      <WinRateBar pct={group.winPct} />

      <View style={styles.gameList}>
        {group.games.map((g) => (
          <GameRow
            key={g.id}
            game={g}
            opponentName={isRandom ? "Random" : group.opponentName}
            onUpdateGame={onUpdateGame}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Game row — display + inline edit ────────────────────────────────────────

function GameRow({game, opponentName, onUpdateGame, onRequestDelete}) {
  const [editing, setEditing] = useState(false);
  const [editResult, setEditResult] = useState(game.result);
  const [editEvent, setEditEvent] = useState(game.event);
  const [editComment, setEditComment] = useState(game.comment);

  const startEdit = () => {
    setEditResult(game.result);
    setEditEvent(game.event);
    setEditComment(game.comment);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    const newOutcome = resultToOutcome(editResult, game.isPlayerSide);
    onUpdateGame(game.id, {
      outcome: newOutcome,
      event: editEvent.trim(),
      comment: editComment.trim()
    });
    setEditing(false);
  };

  const dateLabel = formatDate(game.playedAt);
  const deleteLabel = `the ${RESULT_WORD[game.result] || "game"} vs ${opponentName}${
    game.event ? ` (${game.event})` : ""
  }${dateLabel ? ` on ${dateLabel}` : ""}`;

  if (editing) {
    return (
      <View style={[styles.gameRow, styles.gameRowEditing]}>
        <View style={styles.editRow}>
          <OutcomeChips value={editResult} onChange={setEditResult} />
        </View>
        <TextInput
          value={editEvent}
          onChangeText={setEditEvent}
          placeholder="Event tag"
          placeholderTextColor="#555"
          maxLength={EVENT_TAG_MAX}
          style={[styles.addInput, styles.editInput]}
          accessibilityLabel="Event tag"
        />
        <TextInput
          value={editComment}
          onChangeText={setEditComment}
          placeholder="Comment"
          placeholderTextColor="#555"
          maxLength={GAME_COMMENT_MAX}
          style={[styles.addInput, styles.editInput]}
          accessibilityLabel="Comment"
        />
        <View style={styles.addFormActions}>
          <Pressable
            onPress={cancelEdit}
            hitSlop={6}
            style={({pressed}) => [styles.formBtn, styles.formBtnCancel, pressed && styles.pressedSubtle]}
            accessibilityRole="button"
            accessibilityLabel="Cancel edit"
          >
            <Text style={styles.formBtnCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={saveEdit}
            hitSlop={6}
            style={({pressed}) => [styles.formBtn, styles.formBtnSave, pressed && styles.pressedSubtle]}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            <Text style={styles.formBtnSaveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameRow}>
      <ResultChip result={game.result} />
      <View style={styles.gameMid}>
        <View style={styles.gameMetaRow}>
          {game.event ? (
            <Text style={styles.gameEvent} numberOfLines={1}>
              {game.event}
            </Text>
          ) : null}
          {dateLabel ? <Text style={styles.gameDate}>{dateLabel}</Text> : null}
        </View>
        {game.comment ? (
          <Text style={styles.gameComment} numberOfLines={2}>
            {game.comment}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={startEdit}
        hitSlop={8}
        style={({pressed}) => [styles.iconBtn, pressed && styles.pressedSubtle]}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${deleteLabel}`}
      >
        <Text style={styles.editGlyph}>✎</Text>
      </Pressable>
      <Pressable
        onPress={() => onRequestDelete(game.id, deleteLabel)}
        hitSlop={8}
        style={({pressed}) => [styles.iconBtn, pressed && styles.pressedSubtle]}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${deleteLabel}`}
      >
        <Text style={styles.deleteGlyph}>✕</Text>
      </Pressable>
    </View>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

// W / L / D selector — used in both the add form and the edit row.
function OutcomeChips({value, onChange}) {
  return (
    <View style={styles.outcomeChips}>
      {["W", "L", "D"].map((r) => {
        const s = RESULT_STYLES[r];
        const active = value === r;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            style={[
              styles.outcomeChipBtn,
              {borderColor: active ? s.border : "#333"},
              active && {backgroundColor: s.bg}
            ]}
            accessibilityRole="button"
            accessibilityLabel={RESULT_WORD[r]}
            accessibilityState={{selected: active}}
          >
            <Text style={[styles.outcomeChipText, {color: active ? s.text : "#666"}]}>{r}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ResultChip({result}) {
  const s = RESULT_STYLES[result] || RESULT_STYLES.D;
  return (
    <View style={[styles.resultChip, {backgroundColor: s.bg, borderColor: s.border}]}>
      <Text style={[styles.resultChipText, {color: s.text}]}>{result}</Text>
    </View>
  );
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const RESULT_WORD = {W: "win", L: "loss", D: "draw"};

const RESULT_STYLES = {
  W: {bg: "#15301b", border: "#2e7d3288", text: "#74e08c"},
  L: {bg: "#301717", border: "#8B000088", text: "#ff8a8a"},
  D: {bg: "#26262c", border: "#4a4a52",   text: "#c4c4cc"}
};

// Translate a perspective result (W/L/D from `deckId`'s POV) back to the v3
// stored outcome enum. `isPlayerSide` is taken from the game log entry
// (populated by gamesGroupedByOpponent). For new games added from this
// screen, the deck is always the player side.
function resultToOutcome(result, isPlayerSide) {
  if (result === "D") return "draw";
  if (isPlayerSide) return result === "W" ? "player_win" : "opponent_win";
  return result === "W" ? "opponent_win" : "player_win";
}

function formatDate(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return "";
  try {
    return new Date(ms).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"});
  } catch {
    return "";
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
    gap: 8
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleCol: {
    flex: 1
  },
  headerOverline: {
    color: "#777",
    fontFamily: "FiraCode_700Bold",
    fontSize: 10,
    letterSpacing: 2.5
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 1.2
  },
  addHeaderBtn: {
    minHeight: 36,
    paddingHorizontal: 8,
    justifyContent: "center"
  },
  addHeaderLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    letterSpacing: 1.2
  },
  pressedSubtle: {
    opacity: 0.7
  },
  body: {
    padding: 20,
    paddingBottom: 32
  },

  // ── Empty state ──
  emptyCard: {
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 18
  },
  emptyText: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    letterSpacing: 0.3,
    lineHeight: 20,
    textAlign: "center"
  },

  // ── Summary ──
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 18
  },
  summaryCount: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 0.5
  },
  summaryRight: {
    alignItems: "flex-end",
    gap: 2
  },
  summaryWld: {
    color: "#EEE",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 1
  },
  summaryWldLabel: {
    color: "#777",
    fontFamily: "FiraCode_400Regular",
    fontSize: 9,
    letterSpacing: 1.5
  },

  // ── Add form ──
  addFormCard: {
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 16,
    marginBottom: 18,
    gap: 10
  },
  addFormTitle: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 10,
    letterSpacing: 3
  },
  addFormRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  matchupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  youChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#101014",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 40,
    maxWidth: "46%"
  },
  youTag: {
    color: "#74e08c",
    fontFamily: "FiraCode_700Bold",
    fontSize: 9,
    letterSpacing: 1.5,
    flexShrink: 0
  },
  youName: {
    color: "#FFFFFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 0.3,
    flexShrink: 1
  },
  vsText: {
    color: "#777",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    flexShrink: 0
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  resultLabel: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.3,
    flexShrink: 1
  },
  resultDeck: {
    color: "#CCCCCC",
    fontFamily: "FiraCode_700Bold"
  },
  addOpponentPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101014",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 40,
    gap: 7
  },
  addOpponentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    flexShrink: 0
  },
  addOpponentText: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 0.3
  },
  addOpponentPlaceholder: {
    color: "#555",
    fontFamily: "FiraCode_400Regular"
  },
  addChevron: {
    color: "#AAA",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11
  },
  addInput: {
    color: "#FFF",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    backgroundColor: "#101014",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  addFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 2
  },
  formBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center"
  },
  formBtnCancel: {
    backgroundColor: "#1f1f26",
    borderWidth: 1,
    borderColor: "#2a2a2e"
  },
  formBtnCancelText: {
    color: "#AAA",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 0.5
  },
  formBtnSave: {
    backgroundColor: "#1e3a28",
    borderWidth: 1,
    borderColor: "#2e7d3266"
  },
  formBtnSaveText: {
    color: "#74e08c",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 0.5
  },
  formBtnDisabled: {
    opacity: 0.4
  },
  formBtnDisabledText: {
    color: "#555"
  },

  // ── Outcome chips (W/L/D selector) ──
  outcomeChips: {
    flexDirection: "row",
    gap: 6,
    flexShrink: 0
  },
  outcomeChipBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  outcomeChipText: {
    fontFamily: "FiraCode_700Bold",
    fontSize: 14,
    letterSpacing: 0.3
  },

  // ── Opponent group card ──
  groupCard: {
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 14,
    marginBottom: 14
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10
  },
  groupName: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 15,
    letterSpacing: 0.5
  },
  groupNameRandom: {
    color: "#AAA",
    fontFamily: "FiraCode_400Regular",
    fontStyle: "italic"
  },
  groupStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  groupWld: {
    color: "#DDD",
    fontFamily: "FiraCode_700Bold",
    fontSize: 14,
    letterSpacing: 0.5
  },
  groupPct: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.5,
    minWidth: 52,
    textAlign: "right"
  },
  gameList: {
    marginTop: 12,
    gap: 8
  },

  // ── Game row ──
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#101014",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#23232a",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  gameRowEditing: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    paddingVertical: 12
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  editInput: {
    // Slightly smaller vertical padding when inline in the game row
    paddingVertical: 7
  },
  resultChip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  resultChipText: {
    fontFamily: "FiraCode_700Bold",
    fontSize: 14,
    letterSpacing: 0.5,
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 1}, radius: 2})
  },
  gameMid: {
    flex: 1,
    gap: 3
  },
  gameMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  gameEvent: {
    color: "#caa23a",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 1
  },
  gameDate: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.3
  },
  gameComment: {
    color: "#AAA",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.2,
    lineHeight: 17
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  editGlyph: {
    color: "#666",
    fontFamily: "FiraCode_700Bold",
    fontSize: 15
  },
  deleteGlyph: {
    color: "#666",
    fontFamily: "FiraCode_700Bold",
    fontSize: 14
  }
});
