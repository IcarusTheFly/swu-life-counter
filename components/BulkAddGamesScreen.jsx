import React, {useEffect, useMemo, useState} from "react";
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import BackIcon from "../icons/BackIcon";
import {accentForDeck} from "./DeckCard";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {DECK_NAME_MAX, EVENT_TAG_MAX, GAME_COMMENT_MAX, RANDOM_DECK_ID} from "../constants/decks";
import {eventsInGames} from "../context/deckStats";
import {textShadow} from "../utils/textShadow";

// Bulk game-import form (v3 — the headline backfill feature). Pick a
// (player, opponent) pair from the single shared `decks` list (the opponent
// may also be Random), enter wins/losses/draws, optionally tag an event + a
// shared comment, and generate that many game records at once via
// `bulkAddGames`. Either picker can create a brand-new deck inline (via
// `addDeck`); names are unique case-insensitive across the whole pool.
export default function BulkAddGamesScreen({prefillPlayerDeckId, prefillOpponentDeckId, onBack, onSaved}) {
  const {games, decks, getDeckById, addDeck, bulkAddGames} = useDecks();
  const {settings} = useSettings();

  const recentEvent = useMemo(() => {
    const list = eventsInGames(games);
    return list.length > 0 ? list[0] : "";
  }, [games]);
  const eventSuggestions = useMemo(() => eventsInGames(games), [games]);

  const [playerDeckId, setPlayerDeckId] = useState(prefillPlayerDeckId || null);
  const [opponentDeckId, setOpponentDeckId] = useState(prefillOpponentDeckId || null);
  const [wins, setWins] = useState("0");
  const [losses, setLosses] = useState("0");
  const [draws, setDraws] = useState("0");
  const [event, setEvent] = useState(recentEvent);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);

  const [picker, setPicker] = useState(null); // "player" | "opponent" | null

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (picker !== null) {
        setPicker(null);
        return true;
      }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, picker]);

  const playerDeck = playerDeckId ? getDeckById(playerDeckId) : null;
  const opponentIsRandom = opponentDeckId === RANDOM_DECK_ID;
  const opponentDeck = opponentDeckId && !opponentIsRandom ? getDeckById(opponentDeckId) : null;
  const opponentLabel = opponentIsRandom ? "Random" : opponentDeck ? opponentDeck.name : "Pick the opponent";

  const existingNames = useMemo(() => decks.map((d) => d.name.trim().toLowerCase()), [decks]);

  const handleCreateDeck = (name) => {
    const created = addDeck({name: name.trim()});
    if (created && created.id) {
      if (picker === "player") setPlayerDeckId(created.id);
      else setOpponentDeckId(created.id);
      setError(null);
    }
    setPicker(null);
  };

  const handleSave = () => {
    if (!playerDeckId) {
      setError("Pick your deck");
      return;
    }
    if (!opponentDeckId) {
      setError("Pick the opponent");
      return;
    }
    const w = parseCount(wins);
    const l = parseCount(losses);
    const d = parseCount(draws);
    if (w + l + d < 1) {
      setError("Enter at least one win, loss, or draw");
      return;
    }
    bulkAddGames({
      playerDeckId,
      opponentDeckId,
      wins: w,
      losses: l,
      draws: d,
      comment: comment.trim(),
      event: event.trim()
    });
    onSaved();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({pressed}) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <BackIcon stroke="#FFF" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>BULK ADD GAMES</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* PLAYER DECK */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR DECK</Text>
          <PickerRow
            label={playerDeck ? playerDeck.name : "Pick your deck"}
            aspectColor={playerDeck ? accentForDeck(playerDeck) : null}
            filled={!!playerDeck}
            onPress={() => setPicker("player")}
          />
        </View>

        {/* OPPONENT DECK */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OPPONENT DECK</Text>
          <PickerRow
            label={opponentLabel}
            aspectColor={opponentDeck ? accentForDeck(opponentDeck) : null}
            filled={!!opponentDeck || opponentIsRandom}
            onPress={() => setPicker("opponent")}
          />
        </View>

        {/* RESULTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESULTS</Text>
          <View style={styles.steppers}>
            <Stepper label="Wins" value={wins} onChange={setWins} clearError={() => setError(null)} />
            <Stepper label="Losses" value={losses} onChange={setLosses} clearError={() => setError(null)} />
            <Stepper label="Draws" value={draws} onChange={setDraws} clearError={() => setError(null)} />
          </View>
        </View>

        {/* EVENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EVENT (OPTIONAL)</Text>
          <TextInput
            value={event}
            onChangeText={setEvent}
            maxLength={EVENT_TAG_MAX}
            style={styles.input}
            placeholder="e.g. PETRANAKI"
            placeholderTextColor="#666"
            accessibilityLabel="Event tag"
          />
          <View style={styles.inputMeta}>
            <Text style={styles.metaSpacer}> </Text>
            <Text style={styles.counter}>
              {event.length} / {EVENT_TAG_MAX}
            </Text>
          </View>
          <EventSuggestions suggestions={eventSuggestions} current={event} onPick={setEvent} />
        </View>

        {/* COMMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMENT (OPTIONAL — APPLIED TO ALL)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            maxLength={GAME_COMMENT_MAX}
            style={[styles.input, styles.commentInput]}
            placeholder="e.g. From spreadsheet import"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Shared comment"
          />
          <View style={styles.inputMeta}>
            <Text style={styles.metaSpacer}> </Text>
            <Text style={styles.counter}>
              {comment.length} / {GAME_COMMENT_MAX}
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ACTIONS */}
        <View style={styles.footerActions}>
          <ActionButton label="Add games" onPress={handleSave} variant="primary" />
          <ActionButton label="Cancel" onPress={onBack} variant="neutral" />
        </View>
      </ScrollView>

      <DeckPickerModal
        visible={picker !== null}
        kind={picker}
        decks={decks}
        selectedId={picker === "player" ? playerDeckId : opponentDeckId}
        existingNames={existingNames}
        allowRandom={picker === "opponent"}
        enableAnimations={settings.enableAnimations}
        onPick={(id) => {
          if (picker === "player") setPlayerDeckId(id);
          else setOpponentDeckId(id);
          setError(null);
          setPicker(null);
        }}
        onCreateDeck={handleCreateDeck}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

// Parse a stepper string to a non-negative integer (NaN / negatives → 0).
function parseCount(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function PickerRow({label, aspectColor, filled, onPress}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.pickerRow, pressed && styles.pressedSubtle]}
      accessibilityRole="button"
      accessibilityLabel={filled ? `${label}. Tap to change.` : label}
    >
      {aspectColor ? <View style={[styles.pickerDot, {backgroundColor: aspectColor}]} /> : null}
      <Text style={[styles.pickerValue, !filled && styles.placeholderValue]} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
      <Text style={styles.pickerChevron}>▾</Text>
    </Pressable>
  );
}

// A labelled +/- numeric stepper. The middle value is also directly
// editable (numeric keyboard) for fast spreadsheet entry of large counts.
function Stepper({label, value, onChange, clearError}) {
  const num = parseCount(value);
  const set = (next) => {
    clearError();
    onChange(String(Math.max(0, next)));
  };
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={() => set(num - 1)}
          hitSlop={6}
          style={({pressed}) => [styles.stepperBtn, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>
        <TextInput
          value={value}
          onChangeText={(t) => {
            clearError();
            const cleaned = t.replace(/[^0-9]/g, "");
            onChange(cleaned);
          }}
          onBlur={() => {
            if (value.trim() === "") onChange("0");
          }}
          keyboardType="number-pad"
          maxLength={4}
          style={styles.stepperValue}
          accessibilityLabel={`${label} count`}
        />
        <Pressable
          onPress={() => set(num + 1)}
          hitSlop={6}
          style={({pressed}) => [styles.stepperBtn, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EventSuggestions({suggestions, current, onPick}) {
  const trimmed = current.trim();
  const shown = suggestions.filter((s) => s !== trimmed).slice(0, 8);
  if (shown.length === 0) return null;
  return (
    <View style={styles.suggestionRow}>
      {shown.map((s) => (
        <Pressable
          key={s}
          onPress={() => onPick(s)}
          style={({pressed}) => [styles.suggestionChip, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel={`Use event ${s}`}
        >
          <Text style={styles.suggestionChipText} numberOfLines={1}>
            {s}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Modal list picker over the shared deck pool. The opponent kind prepends a
// Random row; both kinds expose an inline "new deck" field so the user never
// has to leave the flow to create a fresh deck during a spreadsheet import.
function DeckPickerModal({visible, kind, decks, selectedId, existingNames, allowRandom, onPick, onCreateDeck, onClose}) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!visible) setNewName("");
  }, [visible]);

  const trimmed = newName.trim();
  const duplicate = trimmed.length > 0 && existingNames.includes(trimmed.toLowerCase());
  const canCreate = trimmed.length > 0 && !duplicate;
  const title = kind === "opponent" ? "PICK OPPONENT" : "PICK YOUR DECK";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={["#1c1c22", "#141418"]} style={styles.modalDialog} start={{x: 0, y: 0}} end={{x: 0, y: 1}}>
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
            {allowRandom ? (
              <Pressable
                onPress={() => onPick(RANDOM_DECK_ID)}
                style={({pressed}) => [
                  styles.modalRow,
                  styles.modalRowSpecial,
                  selectedId === RANDOM_DECK_ID && styles.modalRowSelected,
                  pressed && styles.pressedSubtle
                ]}
                accessibilityRole="button"
                accessibilityState={{selected: selectedId === RANDOM_DECK_ID}}
                accessibilityLabel="Random"
              >
                <Text style={[styles.modalRowText, styles.modalRowTextSpecial]}>Random</Text>
                {selectedId === RANDOM_DECK_ID ? <Text style={styles.modalRowCheck}>✓</Text> : null}
              </Pressable>
            ) : null}
            {decks.map((d) => {
              const isSelected = d.id === selectedId;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => onPick(d.id)}
                  style={({pressed}) => [styles.modalRow, isSelected && styles.modalRowSelected, pressed && styles.pressedSubtle]}
                  accessibilityRole="button"
                  accessibilityState={{selected: isSelected}}
                  accessibilityLabel={d.name}
                >
                  <View style={[styles.modalRowDot, {backgroundColor: accentForDeck(d)}]} />
                  <Text style={styles.modalRowText} numberOfLines={1} ellipsizeMode="tail">
                    {d.name}
                  </Text>
                  {isSelected ? <Text style={styles.modalRowCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
            {decks.length === 0 && !allowRandom ? (
              <Text style={styles.modalEmpty}>No decks yet. Create one below.</Text>
            ) : null}
          </ScrollView>

          <View style={styles.createBlock}>
            <Text style={styles.createLabel}>NEW DECK</Text>
            <View style={styles.createRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                maxLength={DECK_NAME_MAX}
                style={[styles.createInput, duplicate && styles.createInputError]}
                placeholder="e.g. Vader Aggression"
                placeholderTextColor="#888"
                accessibilityLabel="New deck name"
              />
              <Pressable
                onPress={() => canCreate && onCreateDeck(newName)}
                disabled={!canCreate}
                style={({pressed}) => [styles.createBtn, !canCreate && styles.createBtnDisabled, pressed && canCreate && styles.pressedSubtle]}
                accessibilityRole="button"
                accessibilityLabel="Create deck"
                accessibilityState={{disabled: !canCreate}}
              >
                <Text style={styles.createBtnText}>Create</Text>
              </Pressable>
            </View>
            {duplicate ? <Text style={styles.createError}>A deck with that name already exists</Text> : null}
          </View>

          <Pressable
            onPress={onClose}
            style={({pressed}) => [styles.modalCloseBtn, pressed && styles.pressedSubtle]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.modalCloseLabel}>Close</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const VARIANT_GRADIENTS = {
  primary: ["#3c3c3c", "#6e6e6e", "#a1a1a1", "#6e6e6e", "#3c3c3c"],
  neutral: ["#2a2a2a", "#444", "#2a2a2a"]
};

function ActionButton({label, onPress, variant = "primary", disabled = false}) {
  const colors = VARIANT_GRADIENTS[variant] || VARIANT_GRADIENTS.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      style={({pressed}) => [styles.actionBtn, pressed && !disabled && styles.pressedSubtle, disabled && styles.actionBtnDisabled]}
    >
      <LinearGradient colors={colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.actionGradient}>
        <Text style={styles.actionLabel}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: "#000"},
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
    gap: 8
  },
  backBtn: {width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center"},
  pressed: {opacity: 0.7},
  pressedSubtle: {opacity: 0.7},
  headerTitle: {color: "#FFF", fontFamily: "FiraCode_700Bold", fontSize: 18, letterSpacing: 1.4},
  body: {padding: 20, paddingBottom: 40},
  section: {marginBottom: 22},
  sectionTitle: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 12,
    marginLeft: 2
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#15151a",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    gap: 10
  },
  pickerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)"
  },
  pickerValue: {flex: 1, color: "#FFF", fontFamily: "FiraCode_700Bold", fontSize: 15, letterSpacing: 0.3},
  placeholderValue: {color: "#666", fontFamily: "FiraCode_400Regular"},
  pickerChevron: {color: "#AAA", fontFamily: "FiraCode_700Bold", fontSize: 12},
  steppers: {gap: 12},
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#15151a",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  stepperLabel: {color: "#DDD", fontFamily: "FiraCode_700Bold", fontSize: 14, letterSpacing: 0.8},
  stepperControls: {flexDirection: "row", alignItems: "center", gap: 10},
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2e",
    alignItems: "center",
    justifyContent: "center"
  },
  stepperBtnText: {color: "#FFF", fontFamily: "FiraCode_700Bold", fontSize: 20, lineHeight: 22},
  stepperValue: {
    // Fixed width (not minWidth) — on react-native-web a TextInput with only
    // a minWidth grows to fill the row, blowing the −/+ buttons past the edge
    // and breaking the steppers' alignment. A fixed width keeps the control
    // cluster compact so space-between right-aligns all three rows identically.
    width: 56,
    flexGrow: 0,
    flexShrink: 0,
    textAlign: "center",
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 0.5,
    backgroundColor: "#16161a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  input: {
    color: "#FFF",
    fontFamily: "FiraCode_400Regular",
    fontSize: 15,
    backgroundColor: "#15151a",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    letterSpacing: 0.3
  },
  commentInput: {minHeight: 96, paddingTop: 12},
  inputMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 2
  },
  metaSpacer: {flex: 1},
  counter: {color: "#666", fontFamily: "FiraCode_400Regular", fontSize: 11, letterSpacing: 0.5},
  suggestionRow: {flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4},
  suggestionChip: {
    borderWidth: 1,
    borderColor: "#3a3a40",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: "center",
    maxWidth: "100%"
  },
  suggestionChipText: {color: "#CCC", fontFamily: "FiraCode_400Regular", fontSize: 12, letterSpacing: 0.5},
  errorText: {
    color: "#ff6b6b",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 12,
    marginLeft: 2
  },
  footerActions: {marginTop: 4, gap: 10},
  actionBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#cccccc55"
  },
  actionBtnDisabled: {opacity: 0.45},
  actionGradient: {flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 16},
  actionLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 16,
    letterSpacing: 1.2,
    ...textShadow({color: "rgba(0,0,0,0.5)", offset: {width: 0, height: 2}, radius: 4})
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  modalDialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderColor: "#34343c",
    borderWidth: 1,
    padding: 18,
    elevation: 6
  },
  modalTitle: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 12,
    marginLeft: 2
  },
  modalEmpty: {
    color: "#AAA",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    letterSpacing: 0.3,
    lineHeight: 19,
    textAlign: "center",
    paddingVertical: 8
  },
  modalList: {maxHeight: 240},
  modalListContent: {gap: 8},
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1f1f26",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48
  },
  modalRowSpecial: {
    backgroundColor: "#17171c",
    borderColor: "#34343c",
    borderStyle: "dashed"
  },
  modalRowSelected: {backgroundColor: "#26303a", borderColor: "#4B79A1"},
  modalRowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)"
  },
  modalRowText: {flex: 1, color: "#FFF", fontFamily: "FiraCode_700Bold", fontSize: 14, letterSpacing: 0.5},
  modalRowTextSpecial: {fontFamily: "FiraCode_400Regular", color: "#CCC"},
  modalRowCheck: {color: "#7fb4e0", fontFamily: "FiraCode_700Bold", fontSize: 15},
  createBlock: {marginTop: 16},
  createLabel: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8
  },
  createRow: {flexDirection: "row", alignItems: "center", gap: 8},
  createInput: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_400Regular",
    fontSize: 14,
    backgroundColor: "#1f1f24",
    borderWidth: 1,
    borderColor: "#3a3a40",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  createInputError: {borderColor: "#ff6b6b"},
  createBtn: {
    backgroundColor: "#4B79A1",
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  createBtnDisabled: {opacity: 0.45},
  createBtnText: {color: "#FFF", fontFamily: "FiraCode_700Bold", fontSize: 13, letterSpacing: 0.5},
  createError: {color: "#ff6b6b", fontFamily: "FiraCode_400Regular", fontSize: 11, letterSpacing: 0.3, marginTop: 6},
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2a2a30",
    alignItems: "center",
    minHeight: 46,
    justifyContent: "center"
  },
  modalCloseLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 15,
    letterSpacing: 1.2
  }
});
