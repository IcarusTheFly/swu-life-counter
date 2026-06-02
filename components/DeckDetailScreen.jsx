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
import ConfirmationModal from "./ConfirmationModal";
import {WinRateBar, accentForDeck} from "./DeckCard";
import {useDecks} from "../context/DecksContext";
import {useSettings} from "../context/SettingsContext";
import {
  ASPECTS,
  MATCHUP_ARCHETYPE_MAX,
  MATCHUP_COMMENTS_MAX,
  RANDOM_DECK_ID
} from "../constants/decks";
import {
  eventsInGames,
  groupMatchupsByEvent,
  matchupsForDeck,
  statsForDeck,
  streakForDeck
} from "../context/deckStats";
import {textShadow} from "../utils/textShadow";

// Deck detail view (v3). Symmetric overall W-L-D + emphasized win% + a
// win-rate bar + streak; aspects/leader/archetype/notes; head-to-head
// matchups grouped under event headers (now symmetric — a row can appear
// for any deck the user faced on either side, plus a synthetic "Random"
// row). NAMED matchup rows carry an inline-editable archetype + comments
// (via upsertMatchup); the Random row shows stats only (no notes). Footer
// actions: a split "Set Default" row (silver Player / gold Opponent) then
// Bulk Add / Edit / Delete (cascade warning).
export default function DeckDetailScreen({
  deckId,
  onBack,
  onOpenDeckEdit,
  onOpenBulkAddGames,
  onOpenGameHistory,
  onDeleted
}) {
  const {decks, games, matchups, getDeckById, getMatchup, upsertMatchup, deleteDeck} = useDecks();
  const {settings, updateSettings} = useSettings();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [addMatchupVisible, setAddMatchupVisible] = useState(false);

  const deck = getDeckById(deckId);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (deleteVisible) {
        setDeleteVisible(false);
        return true;
      }
      if (addMatchupVisible) {
        setAddMatchupVisible(false);
        return true;
      }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, deleteVisible, addMatchupVisible]);

  // Defensive: if the deck disappears mid-screen (external wipe, cascade
  // delete), bounce back rather than crash on a null read.
  useEffect(() => {
    if (!deck) {
      onBack();
    }
  }, [deck, onBack]);

  const stats = useMemo(() => (deck ? statsForDeck(deck.id, games) : null), [deck, games]);
  const streak = useMemo(() => (deck ? streakForDeck(deck.id, games) : null), [deck, games]);

  // Games involving this deck on EITHER side — drives the event-grouping
  // decision (the matchup math itself is done by the symmetric helpers).
  const gamesForDeck = useMemo(
    () => (deck ? games.filter((g) => g.playerDeckId === deck.id || g.opponentDeckId === deck.id) : []),
    [deck, games]
  );
  const hasEvents = useMemo(() => eventsInGames(gamesForDeck).length > 0, [gamesForDeck]);
  const flatMatchups = useMemo(
    () => (deck ? matchupsForDeck(deck.id, games, decks) : []),
    [deck, games, decks]
  );
  const eventGroups = useMemo(
    () => (deck && hasEvents ? groupMatchupsByEvent(deck.id, games, decks) : []),
    [deck, games, decks, hasEvents]
  );

  // Cascade counts surfaced in the delete confirmation modal. Both sides
  // count (a deck can be the player OR the opponent in a record).
  const affectedGameCount = useMemo(
    () => (deck ? games.filter((g) => g.playerDeckId === deck.id || g.opponentDeckId === deck.id).length : 0),
    [deck, games]
  );
  const affectedMatchupCount = useMemo(
    () => (deck ? matchups.filter((m) => m.playerDeckId === deck.id || m.opponentDeckId === deck.id).length : 0),
    [deck, matchups]
  );

  // "Add a matchup" picker: every OTHER deck without an existing (deck, X)
  // matchup record, plus the deck itself if no mirror record exists yet (a
  // mirror is a valid matchup). Sorted by name.
  const availableOpponents = useMemo(() => {
    if (!deck) return [];
    return decks
      .filter((o) => !getMatchup(deck.id, o.id))
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }, [deck, decks, getMatchup]);

  if (!deck) {
    return null;
  }

  const isPlayerDefault = settings.defaultDeckId === deck.id;
  const isOpponentDefault = settings.defaultOpponentDeckId === deck.id;
  const winPctLabel = stats.winPct === null ? "–" : stats.winPct.toFixed(1) + "%";

  // Toggle this deck as the default PLAYER deck. Checking sets it and selects
  // it on the player1 loadout side. Unchecking clears the default and resets
  // the loadout to Random (no specific deck).
  const handleSetPlayerDefault = () => {
    if (isPlayerDefault) {
      updateSettings({
        defaultDeckId: null,
        activeLoadout: {...settings.activeLoadout, player1DeckId: RANDOM_DECK_ID}
      });
    } else {
      updateSettings({
        defaultDeckId: deck.id,
        activeLoadout: {...settings.activeLoadout, player1DeckId: deck.id}
      });
    }
  };

  // Toggle this deck as the default OPPONENT deck. Unchecking resets the
  // opponent loadout side to Random.
  const handleSetOpponentDefault = () => {
    if (isOpponentDefault) {
      updateSettings({
        defaultOpponentDeckId: null,
        activeLoadout: {...settings.activeLoadout, player2DeckId: RANDOM_DECK_ID}
      });
    } else {
      updateSettings({
        defaultOpponentDeckId: deck.id,
        activeLoadout: {...settings.activeLoadout, player2DeckId: deck.id}
      });
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteVisible(false);
    deleteDeck(deck.id);
    onDeleted();
  };

  const handleAddMatchup = (opponentDeckId) => {
    setAddMatchupVisible(false);
    // Create an empty matchup so the user can attach pre-game notes before
    // any game is logged for the pair.
    upsertMatchup(deck.id, opponentDeckId, {});
  };

  const renderMatchupRow = (m) => (
    <MatchupRow
      key={m.opponentDeckId}
      row={m}
      playerDeckId={deck.id}
      getMatchup={getMatchup}
      upsertMatchup={upsertMatchup}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({pressed}) => [styles.backBtn, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel="Back to Decks"
        >
          <BackIcon stroke="#FFF" size={22} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {deck.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* IDENTITY: aspect dots + leader + archetype */}
        {(deck.aspects.length > 0 || deck.leader || deck.archetype) ? (
          <View style={styles.identityRow}>
            <View style={[styles.identityAccent, {backgroundColor: accentForDeck(deck)}]} />
            <View style={styles.identityCol}>
              <AspectsWithLabels aspects={deck.aspects} />
              {deck.leader ? <Text style={styles.leader}>{deck.leader}</Text> : null}
              {deck.archetype ? <Text style={styles.archetype}>{deck.archetype}</Text> : null}
            </View>
          </View>
        ) : null}

        {/* OVERALL STATS — win% is the headline number. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OVERALL</Text>
          <View style={styles.statsCard}>
            {stats.total === 0 ? (
              <Text style={styles.noGamesText}>No games yet</Text>
            ) : (
              <>
                <View style={styles.statsTopRow}>
                  <Text style={styles.bigPct}>{winPctLabel}</Text>
                  <View style={styles.statsRight}>
                    <Text style={styles.wld}>
                      {stats.wins}–{stats.losses}–{stats.draws}
                    </Text>
                    <Text style={styles.wldLabel}>W – L – D</Text>
                    {streak ? <StreakBadge streak={streak} /> : null}
                  </View>
                </View>
                <WinRateBar pct={stats.winPct} />
              </>
            )}
          </View>
        </View>

        {/* NOTES */}
        {deck.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{deck.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* MATCHUPS */}
        <View style={styles.section}>
          <View style={styles.matchupHeaderRow}>
            <Text style={styles.sectionTitle}>MATCHUPS</Text>
            <Pressable
              onPress={() => setAddMatchupVisible(true)}
              hitSlop={8}
              style={({pressed}) => [styles.addMatchupBtn, pressed && styles.pressedSubtle]}
              accessibilityRole="button"
              accessibilityLabel="Add a matchup"
            >
              <Text style={styles.addMatchupLabel}>+ ADD</Text>
            </Pressable>
          </View>

          {flatMatchups.length === 0 ? (
            <View style={styles.emptyMatchups}>
              <Text style={styles.emptyMatchupsText}>
                No matchups yet. Record a game or add one to start tracking.
              </Text>
            </View>
          ) : hasEvents ? (
            eventGroups.map((group) => (
              <View key={group.event === null ? "__other__" : group.event} style={styles.eventGroup}>
                <Text style={styles.eventHeader}>{group.event === null ? "OTHER" : group.event}</Text>
                <View style={styles.matchupList}>{group.matchups.map(renderMatchupRow)}</View>
              </View>
            ))
          ) : (
            <View style={styles.matchupList}>{flatMatchups.map(renderMatchupRow)}</View>
          )}
        </View>

        {/* ACTIONS */}
        <View style={styles.section}>
          {/* Split default: silver = Player side, gold = Opponent side. */}
          <View style={styles.defaultRow}>
            <DefaultCheckbox
              label="Default · Player"
              onPress={handleSetPlayerDefault}
              tone="player"
              active={isPlayerDefault}
            />
            <DefaultCheckbox
              label="Default · Opponent"
              onPress={handleSetOpponentDefault}
              tone="opponent"
              active={isOpponentDefault}
            />
          </View>
          <ActionButton label="Game History" onPress={() => onOpenGameHistory(deck.id)} variant="neutral" />
          <ActionButton label="Bulk Add Games" onPress={() => onOpenBulkAddGames(deck.id, null)} variant="neutral" />
          <ActionButton label="Edit" onPress={() => onOpenDeckEdit(deck.id)} variant="neutral" />
          <ActionButton label="Delete" onPress={() => setDeleteVisible(true)} variant="destructive" />
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={deleteVisible}
        enableAnimations={settings.enableAnimations}
        title={`Delete ${deck.name}?`}
        message={buildDeleteMessage(affectedMatchupCount, affectedGameCount)}
        actions={[
          {label: "Delete", variant: "destructive", onPress: handleDeleteConfirm},
          {label: "Cancel", variant: "neutral", onPress: () => setDeleteVisible(false)}
        ]}
      />

      <AddMatchupModal
        visible={addMatchupVisible}
        opponents={availableOpponents}
        selfId={deck.id}
        onPick={handleAddMatchup}
        onClose={() => setAddMatchupVisible(false)}
      />
    </View>
  );
}

// "Delete <name>? This also removes N matchups and M game records." Falls
// back to a gentler line when there's nothing to cascade.
function buildDeleteMessage(matchupCount, gameCount) {
  if (matchupCount === 0 && gameCount === 0) {
    return "This deck has no matchups or game records yet.";
  }
  const m = `${matchupCount} matchup${matchupCount === 1 ? "" : "s"}`;
  const g = `${gameCount} game record${gameCount === 1 ? "" : "s"}`;
  return `This also removes ${m} and ${g} (counting both sides).`;
}

function AspectsWithLabels({aspects}) {
  if (!aspects || aspects.length === 0) return null;
  return (
    <View style={styles.dotsRow}>
      {aspects.map((aspect) => {
        const spec = ASPECTS[aspect];
        if (!spec) return null;
        return (
          <View key={aspect} style={styles.dotWithLabel}>
            <View style={[styles.dot, {backgroundColor: spec.color}]} />
            <Text style={styles.dotLabel}>{aspect}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StreakBadge({streak}) {
  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakText}>
        {streak.kind}
        {streak.count}
      </Text>
    </View>
  );
}

// One matchup row. Top line: opponent name + W-L-D + win% + a tiny win-rate
// bar. NAMED rows expose an inline-editable archetype tag + an expandable
// comments editor (persisted via upsertMatchup). The synthetic "Random" row
// (opponentDeckId === RANDOM_DECK_ID) renders stats only — Random accrues no
// directional notes (design.md Decision 4).
function MatchupRow({row, playerDeckId, getMatchup, upsertMatchup}) {
  const isRandom = row.opponentDeckId === RANDOM_DECK_ID;
  const record = isRandom ? null : getMatchup(playerDeckId, row.opponentDeckId);
  const archetype = record ? record.archetype || "" : "";
  const comments = record ? record.comments || "" : "";

  const [editingArchetype, setEditingArchetype] = useState(false);
  const [archetypeDraft, setArchetypeDraft] = useState(archetype);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [commentsDraft, setCommentsDraft] = useState(comments);

  const pct = row.winPct === null ? "–" : row.winPct.toFixed(1) + "%";

  const saveArchetype = () => {
    setEditingArchetype(false);
    const next = archetypeDraft.trim();
    if (next !== archetype) {
      upsertMatchup(playerDeckId, row.opponentDeckId, {archetype: next});
    }
  };
  const cancelArchetype = () => {
    setArchetypeDraft(archetype);
    setEditingArchetype(false);
  };

  const saveComments = () => {
    setCommentsExpanded(false);
    const next = commentsDraft.trim();
    if (next !== comments) {
      upsertMatchup(playerDeckId, row.opponentDeckId, {comments: next});
    }
  };
  const cancelComments = () => {
    setCommentsDraft(comments);
    setCommentsExpanded(false);
  };

  return (
    <View style={styles.matchupRow}>
      <View style={styles.matchupTop}>
        <Text style={[styles.matchupName, isRandom && styles.matchupNameRandom]} numberOfLines={1} ellipsizeMode="tail">
          {row.opponentName}
        </Text>
        <View style={styles.matchupStats}>
          <Text style={styles.matchupWld}>
            {row.wins}–{row.losses}–{row.draws}
          </Text>
          <Text style={styles.matchupPct}>{pct}</Text>
        </View>
      </View>

      <View style={styles.matchupBar}>
        <WinRateBar pct={row.winPct} />
      </View>

      {/* Notes are directional + NAMED-only — the Random row stops here. */}
      {isRandom ? null : editingArchetype ? (
        <View style={styles.inlineEditRow}>
          <TextInput
            value={archetypeDraft}
            onChangeText={setArchetypeDraft}
            onBlur={saveArchetype}
            maxLength={MATCHUP_ARCHETYPE_MAX}
            autoFocus
            style={styles.inlineInput}
            placeholder="Archetype"
            placeholderTextColor="#666"
            accessibilityLabel="Matchup archetype"
          />
          <InlineBtn label="Save" onPress={saveArchetype} />
          <InlineBtn label="Cancel" onPress={cancelArchetype} subtle />
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setArchetypeDraft(archetype);
            setEditingArchetype(true);
          }}
          style={({pressed}) => [styles.archetypeChip, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel={archetype ? `Edit archetype ${archetype}` : "Add archetype"}
        >
          <Text style={[styles.archetypeChipText, !archetype && styles.placeholderText]} numberOfLines={1}>
            {archetype || "+ archetype"}
          </Text>
        </Pressable>
      )}

      {isRandom ? null : commentsExpanded ? (
        <View style={styles.commentsEditor}>
          <TextInput
            value={commentsDraft}
            onChangeText={setCommentsDraft}
            onBlur={saveComments}
            maxLength={MATCHUP_COMMENTS_MAX}
            autoFocus
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.commentsInput}
            placeholder="Strategic notes for this matchup…"
            placeholderTextColor="#666"
            accessibilityLabel="Matchup comments"
          />
          <View style={styles.inlineEditRow}>
            <InlineBtn label="Save" onPress={saveComments} />
            <InlineBtn label="Cancel" onPress={cancelComments} subtle />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setCommentsDraft(comments);
            setCommentsExpanded(true);
          }}
          style={({pressed}) => [styles.commentsPreviewRow, pressed && styles.pressedSubtle]}
          accessibilityRole="button"
          accessibilityLabel={comments ? "Edit matchup comments" : "Add matchup comments"}
        >
          <Text style={styles.commentsChevron}>{comments ? "▾" : "+"}</Text>
          <Text style={[styles.commentsPreview, !comments && styles.placeholderText]} numberOfLines={1}>
            {comments || "Add notes"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function InlineBtn({label, onPress, subtle = false}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({pressed}) => [styles.inlineBtn, subtle && styles.inlineBtnSubtle, pressed && styles.pressedSubtle]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.inlineBtnLabel, subtle && styles.inlineBtnLabelSubtle]}>{label}</Text>
    </Pressable>
  );
}

// "Add a matchup" — a modal list of decks not yet matched. A mirror (the
// deck itself) is a valid pick and is tagged "(mirror)".
function AddMatchupModal({visible, opponents, selfId, onPick, onClose}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={["#1c1c22", "#141418"]} style={styles.modalDialog} start={{x: 0, y: 0}} end={{x: 0, y: 1}}>
          <Text style={styles.modalTitle}>ADD A MATCHUP</Text>
          {opponents.length === 0 ? (
            <Text style={styles.modalEmpty}>
              Every deck already has a matchup. Create a new deck from the Decks screen first.
            </Text>
          ) : (
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {opponents.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => onPick(o.id)}
                  style={({pressed}) => [styles.modalRow, pressed && styles.pressedSubtle]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add matchup against ${o.name}`}
                >
                  <View style={[styles.modalRowDot, {backgroundColor: accentForDeck(o)}]} />
                  <Text style={styles.modalRowText} numberOfLines={1} ellipsizeMode="tail">
                    {o.name}
                    {o.id === selfId ? "  (mirror)" : ""}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
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
  neutral: ["#2a2a2a", "#444", "#2a2a2a"],
  destructive: ["#5a1a1a", "#8B0000", "#5a1a1a"]
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

// Accent colours for the two default-side checkboxes.
// "player" → metallic silver;  "opponent" → metallic gold.
const DEFAULT_CHECKBOX_TONES = {
  player:   {accent: "#a1a1a1", activeLabel: "#d0d0d0"},
  opponent: {accent: "#caa23a", activeLabel: "#e8c96a"}
};

// Half-width checkbox for the "Set as default" pair. Shows a small coloured
// square (border only when inactive; filled + ✓ when active) + a label.
// Pressing while `active` is a no-op; the row is still tappable to convey it
// is checked (useful for screen-readers).
function DefaultCheckbox({label, onPress, tone, active = false}) {
  const t = DEFAULT_CHECKBOX_TONES[tone] || DEFAULT_CHECKBOX_TONES.player;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{checked: active}}
      style={({pressed}) => [
        styles.defaultCheckboxRow,
        {borderColor: active ? t.accent + "88" : "#2a2a2e"},
        pressed && styles.pressedSubtle
      ]}
    >
      <View style={[styles.checkboxBox, {borderColor: t.accent}, active && {backgroundColor: t.accent}]}>
        {active ? <Text style={styles.checkboxTick}>✓</Text> : null}
      </View>
      <Text
        style={[styles.checkboxLabel, active && {color: t.activeLabel}]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
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
  pressedSubtle: {
    opacity: 0.7
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 1.4,
    flex: 1
  },
  body: {
    padding: 20,
    paddingBottom: 32
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 12,
    marginLeft: 2
  },
  identityRow: {
    flexDirection: "row",
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    overflow: "hidden",
    marginBottom: 24
  },
  identityAccent: {
    width: 4
  },
  identityCol: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  dotsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10
  },
  dotWithLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)"
  },
  dotLabel: {
    color: "#DDD",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.5
  },
  leader: {
    color: "#CCC",
    fontFamily: "FiraCode_400Regular",
    fontSize: 14,
    letterSpacing: 0.5,
    marginTop: 10
  },
  archetype: {
    color: "#8a8a92",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    letterSpacing: 0.5,
    marginTop: 4
  },
  statsCard: {
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 18
  },
  noGamesText: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 14,
    letterSpacing: 0.5,
    textAlign: "center"
  },
  statsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  bigPct: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 44,
    letterSpacing: 0.5,
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 2}, radius: 6})
  },
  statsRight: {
    alignItems: "flex-end",
    gap: 4
  },
  wld: {
    color: "#EEE",
    fontFamily: "FiraCode_700Bold",
    fontSize: 20,
    letterSpacing: 1
  },
  wldLabel: {
    color: "#777",
    fontFamily: "FiraCode_400Regular",
    fontSize: 10,
    letterSpacing: 1.5
  },
  streakBadge: {
    borderWidth: 1,
    borderColor: "#3a3a40",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4
  },
  streakText: {
    color: "#CCC",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    letterSpacing: 0.8
  },
  notesCard: {
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 14
  },
  notesText: {
    color: "#DDD",
    fontFamily: "FiraCode_400Regular",
    fontSize: 14,
    letterSpacing: 0.3,
    lineHeight: 20
  },
  matchupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  addMatchupBtn: {
    minHeight: 32,
    paddingHorizontal: 8,
    justifyContent: "center",
    marginBottom: 12
  },
  addMatchupLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    letterSpacing: 1.2
  },
  emptyMatchups: {
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 16
  },
  emptyMatchupsText: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    letterSpacing: 0.3,
    lineHeight: 19,
    textAlign: "center"
  },
  eventGroup: {
    marginBottom: 16
  },
  eventHeader: {
    color: "#CCC",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 2
  },
  matchupList: {
    backgroundColor: "#15151a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    overflow: "hidden"
  },
  matchupRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2e"
  },
  matchupTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  matchupName: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 14,
    letterSpacing: 0.5
  },
  matchupNameRandom: {
    color: "#AAA",
    fontFamily: "FiraCode_400Regular",
    fontStyle: "italic"
  },
  matchupStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  matchupWld: {
    color: "#DDD",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 0.5
  },
  matchupPct: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.5,
    minWidth: 52,
    textAlign: "right"
  },
  matchupBar: {
    marginTop: 8
  },
  archetypeChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#3a3a40",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
    maxWidth: "100%"
  },
  archetypeChipText: {
    color: "#CCC",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.5
  },
  placeholderText: {
    color: "#666",
    fontStyle: "italic"
  },
  inlineEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8
  },
  inlineInput: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    backgroundColor: "#16161a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  inlineBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#4B79A1",
    minHeight: 32,
    justifyContent: "center"
  },
  inlineBtnSubtle: {
    backgroundColor: "#333"
  },
  inlineBtnLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    letterSpacing: 0.5
  },
  inlineBtnLabelSubtle: {
    color: "#CCC"
  },
  commentsPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8
  },
  commentsChevron: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    width: 14,
    textAlign: "center"
  },
  commentsPreview: {
    flex: 1,
    color: "#BBB",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    letterSpacing: 0.3
  },
  commentsEditor: {
    marginTop: 8
  },
  commentsInput: {
    color: "#FFF",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    backgroundColor: "#16161a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 72
  },
  defaultRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },
  defaultCheckboxRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#15151a",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  checkboxTick: {
    color: "#000",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    lineHeight: 15
  },
  checkboxLabel: {
    flex: 1,
    color: "#555",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12,
    letterSpacing: 0.5
  },
  actionBtn: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#cccccc55",
    marginBottom: 10
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
    marginBottom: 8
  },
  modalList: {
    maxHeight: 320
  },
  modalListContent: {
    gap: 8
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1f1f26",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48
  },
  modalRowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)"
  },
  modalRowText: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 14,
    letterSpacing: 0.5
  },
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
