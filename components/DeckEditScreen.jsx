import React, {useEffect, useMemo, useState} from "react";
import {BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import BackIcon from "../icons/BackIcon";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {
  ASPECTS,
  DECK_ARCHETYPE_MAX,
  DECK_LEADER_MAX,
  DECK_NAME_MAX,
  DECK_NOTES_MAX,
  MAX_ASPECTS_PER_DECK
} from "../constants/decks";
import {textShadow} from "../utils/textShadow";

const ASPECT_NAMES = Object.keys(ASPECTS);

// Unified deck create / edit form (v3). `deckId === null` → create;
// otherwise → edit (pre-filled from the deck record in the single shared
// pool). Fields: name (≤50) + aspects (≤3) + archetype + leader + notes.
// Name uniqueness is case-insensitive across ALL decks (self excluded on
// edit). On the first-ever deck create, the new deck also becomes the
// `defaultDeckId` and fills the loadout's player1 slot.
export default function DeckEditScreen({deckId, onBack, onSaved}) {
  const {decks, addDeck, updateDeck, getDeckById} = useDecks();
  const {settings, updateSettings} = useSettings();

  const editingDeck = deckId !== null ? getDeckById(deckId) : null;
  const isEdit = editingDeck !== null;

  const [name, setName] = useState(editingDeck ? editingDeck.name : "");
  const [aspects, setAspects] = useState(editingDeck ? [...editingDeck.aspects] : []);
  const [archetype, setArchetype] = useState(editingDeck ? editingDeck.archetype || "" : "");
  const [leader, setLeader] = useState(editingDeck ? editingDeck.leader || "" : "");
  const [notes, setNotes] = useState(editingDeck ? editingDeck.notes || "" : "");
  const [nameError, setNameError] = useState(null);
  const [aspectMessage, setAspectMessage] = useState(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  // If we were asked to edit a deck that no longer exists (out-of-band
  // delete or a stale route), bail. Without this the form would write back
  // to a ghost id on save.
  useEffect(() => {
    if (deckId !== null && editingDeck === null) {
      onBack();
    }
  }, [deckId, editingDeck, onBack]);

  // Uniqueness is scoped to the single shared deck list (case-insensitive),
  // excluding the deck being edited.
  const otherDeckNames = useMemo(() => {
    return decks.filter((d) => d.id !== deckId).map((d) => d.name.trim().toLowerCase());
  }, [decks, deckId]);

  // Live validity for the Save button — mirrors the handleSave checks so
  // the button disables before the user taps it.
  const trimmedName = name.trim();
  const isNameEmpty = trimmedName.length === 0;
  const isNameTooLong = trimmedName.length > DECK_NAME_MAX;
  const isNameDuplicate = !isNameEmpty && otherDeckNames.includes(trimmedName.toLowerCase());
  const isSaveDisabled = isNameEmpty || isNameTooLong || isNameDuplicate;

  const toggleAspect = (aspect) => {
    setAspectMessage(null);
    setAspects((prev) => {
      if (prev.includes(aspect)) {
        return prev.filter((a) => a !== aspect);
      }
      if (prev.length >= MAX_ASPECTS_PER_DECK) {
        setAspectMessage(`Maximum ${MAX_ASPECTS_PER_DECK} aspects`);
        return prev;
      }
      return [...prev, aspect];
    });
  };

  const handleSave = () => {
    const finalName = name.trim();
    if (finalName.length === 0) {
      setNameError("Name is required");
      return;
    }
    if (finalName.length > DECK_NAME_MAX) {
      setNameError(`Name must be at most ${DECK_NAME_MAX} chars`);
      return;
    }
    if (otherDeckNames.includes(finalName.toLowerCase())) {
      setNameError("A deck with that name already exists");
      return;
    }

    const payload = {
      name: finalName,
      aspects,
      archetype: archetype.trim(),
      leader: leader.trim(),
      notes: notes.trim()
    };

    if (isEdit) {
      updateDeck(deckId, payload);
    } else {
      const isFirstDeck = decks.length === 0;
      const newDeck = addDeck(payload);
      if (isFirstDeck && newDeck && newDeck.id) {
        // First deck ever → become the default AND fill the loadout's
        // player1 slot, so Home's Player dropdown immediately reflects it.
        updateSettings({
          defaultDeckId: newDeck.id,
          activeLoadout: {
            ...settings.activeLoadout,
            player1DeckId: newDeck.id
          }
        });
      }
    }
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
        <Text style={styles.headerTitle}>{isEdit ? "EDIT DECK" : "NEW DECK"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* NAME */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (nameError) setNameError(null);
            }}
            maxLength={DECK_NAME_MAX}
            style={[styles.input, (nameError || isNameDuplicate) && styles.inputError]}
            placeholder="e.g. Bossk Vigilance"
            placeholderTextColor="#666"
            accessibilityLabel="Deck name"
          />
          <View style={styles.inputMeta}>
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : isNameDuplicate ? (
              <Text style={styles.errorText}>A deck with that name already exists</Text>
            ) : (
              <Text style={styles.metaSpacer}> </Text>
            )}
            <Text style={styles.counter}>
              {name.length} / {DECK_NAME_MAX}
            </Text>
          </View>
        </View>

        {/* ASPECTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ASPECTS</Text>
          <View style={styles.aspectGrid}>
            {ASPECT_NAMES.map((aspect) => {
              const selected = aspects.includes(aspect);
              const color = ASPECTS[aspect].color;
              return (
                <Pressable
                  key={aspect}
                  onPress={() => toggleAspect(aspect)}
                  accessibilityRole="button"
                  accessibilityLabel={`${aspect} aspect`}
                  accessibilityState={{selected}}
                  style={({pressed}) => [
                    styles.aspectChip,
                    selected && {backgroundColor: color, borderColor: color},
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.aspectLabel, selected && styles.aspectLabelSelected]}>{aspect}</Text>
                </Pressable>
              );
            })}
          </View>
          {aspectMessage ? <Text style={styles.aspectMessage}>{aspectMessage}</Text> : null}
        </View>

        {/* ARCHETYPE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARCHETYPE (OPTIONAL)</Text>
          <TextInput
            value={archetype}
            onChangeText={setArchetype}
            maxLength={DECK_ARCHETYPE_MAX}
            style={styles.input}
            placeholder="e.g. Colossus"
            placeholderTextColor="#666"
            accessibilityLabel="Archetype"
          />
          <View style={styles.inputMeta}>
            <Text style={styles.metaSpacer}> </Text>
            <Text style={styles.counter}>
              {archetype.length} / {DECK_ARCHETYPE_MAX}
            </Text>
          </View>
        </View>

        {/* LEADER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEADER (OPTIONAL)</Text>
          <TextInput
            value={leader}
            onChangeText={setLeader}
            maxLength={DECK_LEADER_MAX}
            style={styles.input}
            placeholder="e.g. Bossk, Renowned Hunter"
            placeholderTextColor="#666"
            accessibilityLabel="Leader"
          />
          <View style={styles.inputMeta}>
            <Text style={styles.metaSpacer}> </Text>
            <Text style={styles.counter}>
              {leader.length} / {DECK_LEADER_MAX}
            </Text>
          </View>
        </View>

        {/* NOTES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            maxLength={DECK_NOTES_MAX}
            style={[styles.input, styles.notesInput]}
            placeholder="Strategy reminders, sideboard notes, etc."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Notes"
          />
          <View style={styles.inputMeta}>
            <Text style={styles.metaSpacer}> </Text>
            <Text style={styles.counter}>
              {notes.length} / {DECK_NOTES_MAX}
            </Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.footerActions}>
          <ActionButton label="Save" onPress={handleSave} variant="primary" disabled={isSaveDisabled} />
          <ActionButton label="Cancel" onPress={onBack} variant="neutral" />
        </View>
      </ScrollView>
    </View>
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
      style={({pressed}) => [
        styles.actionBtn,
        pressed && !disabled && styles.pressed,
        disabled && styles.actionBtnDisabled
      ]}
    >
      <LinearGradient colors={colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.actionGradient}>
        <Text style={styles.actionLabel}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

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
  pressed: {
    opacity: 0.7
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 1.4
  },
  body: {
    padding: 20,
    paddingBottom: 40
  },
  section: {
    marginBottom: 22
  },
  sectionTitle: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 12,
    marginLeft: 2
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
  inputError: {
    borderColor: "#ff6b6b"
  },
  notesInput: {
    minHeight: 96,
    paddingTop: 12
  },
  inputMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 2
  },
  metaSpacer: {
    flex: 1
  },
  counter: {
    color: "#666",
    fontFamily: "FiraCode_400Regular",
    fontSize: 11,
    letterSpacing: 0.5
  },
  errorText: {
    flex: 1,
    color: "#ff6b6b",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.3
  },
  aspectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  aspectChip: {
    borderWidth: 1,
    borderColor: "#3a3a40",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  aspectLabel: {
    color: "#CCC",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    letterSpacing: 0.8
  },
  aspectLabelSelected: {
    // Selected chips wrap the canonical aspect color — black reads cleanly
    // on every aspect color except Villainy (near-black), where we accept
    // the lower contrast (the chip border already signals selection).
    color: "#000"
  },
  aspectMessage: {
    color: "#ff6b6b",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.3,
    marginTop: 8,
    marginLeft: 2
  },
  footerActions: {
    marginTop: 12,
    gap: 10
  },
  actionBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#cccccc55"
  },
  actionBtnDisabled: {
    opacity: 0.45
  },
  actionGradient: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  actionLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 16,
    letterSpacing: 1.2,
    ...textShadow({color: "rgba(0,0,0,0.5)", offset: {width: 0, height: 2}, radius: 4})
  }
});
