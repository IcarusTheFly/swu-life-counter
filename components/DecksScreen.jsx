import React, {useEffect, useMemo, useState} from "react";
import {BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from "react-native";
import BackIcon from "../icons/BackIcon";
import DeckCard from "./DeckCard";
import PrimaryButton from "./ui/PrimaryButton";
import {useDecks} from "../context/DecksContext";
import {statsForDeck, streakForDeck, recentForm} from "../context/deckStats";
import {GOLD, TEXT} from "../constants/theme";
import {
  EMPTY_FILTERS,
  SORT_NAME,
  SORT_GAMES,
  ORDER_ASC,
  ORDER_DESC,
  activeFilterCount,
  distinctArchetypes,
  filterDecks
} from "../context/deckFilters";
import {ASPECTS} from "../constants/decks";

const ASPECT_NAMES = Object.keys(ASPECTS);
const SORT_OPTIONS = [
  {key: SORT_NAME, label: "Name"},
  {key: SORT_GAMES, label: "Games played"}
];
const ORDER_OPTIONS = [
  {key: ORDER_ASC, label: "Asc"},
  {key: ORDER_DESC, label: "Desc"}
];

// Decks list screen (v3). ONE shared list — no My/Opponent split. Each deck
// renders as a polished DeckCard. A collapsible "Filters" panel (hidden by
// default) narrows the list by name, aspect, and archetype, and sets the sort
// (Name / Games played) + order (Asc / Desc). The list is alphabetical by
// default; there is no pinned default deck.
export default function DecksScreen({onBack, onOpenDeckDetail, onOpenDeckEdit}) {
  const {decks, games} = useDecks();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const archetypeOptions = useMemo(() => distinctArchetypes(decks), [decks]);
  const filterCount = activeFilterCount(filters);

  // `filterDecks` already filters AND sorts per the current sort/order; we just
  // attach the per-deck stats for the cards.
  const rows = useMemo(() => {
    return filterDecks(decks, games, filters).map((d) => ({
      deck: d,
      stats: statsForDeck(d.id, games),
      streak: streakForDeck(d.id, games),
      points: recentForm(d.id, games)
    }));
  }, [decks, games, filters]);

  const toggleInArray = (key, value) => {
    setFilters((f) => {
      const arr = f[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return {...f, [key]: next};
    });
  };
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasDecks = decks.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({pressed}) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <BackIcon stroke="#FFF" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>DECKS</Text>
        <Pressable
          onPress={() => onOpenDeckEdit(null)}
          hitSlop={8}
          style={({pressed}) => [styles.newBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Create new deck"
        >
          <Text style={styles.newLabel}>+ NEW</Text>
        </Pressable>
      </View>

      {!hasDecks ? (
        <View style={styles.emptyBody}>
          <Text style={styles.emptyTitle}>No decks yet</Text>
          <Text style={styles.emptySubtitle}>
            Register your first deck to start logging playtests and tracking matchups.
          </Text>
          <PrimaryButton
            label="Create your first deck"
            onPress={() => onOpenDeckEdit(null)}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <>
          {/* Collapsible Filters toggle. The toggle and the Clear action are
              SIBLINGS (not nested) so neither renders a <button> inside a
              <button> on web. */}
          <View style={styles.filterBar}>
            <Pressable
              onPress={() => setFiltersOpen((o) => !o)}
              style={({pressed}) => [styles.filterToggle, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{expanded: filtersOpen}}
              accessibilityLabel={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
            >
              <Text style={styles.filterChevron}>{filtersOpen ? "▾" : "▸"}</Text>
              <Text style={styles.filterBarLabel}>FILTERS</Text>
              {filterCount > 0 ? (
                <View style={styles.filterCountBadge}>
                  <Text style={styles.filterCountText}>{filterCount}</Text>
                </View>
              ) : null}
            </Pressable>
            {filterCount > 0 ? (
              <Pressable
                onPress={clearFilters}
                hitSlop={8}
                style={({pressed}) => [styles.clearBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Clear filters"
              >
                <Text style={styles.clearLabel}>CLEAR</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtersOpen ? (
              <View style={styles.panel}>
                {/* Search */}
                <Text style={styles.panelLabel}>SEARCH</Text>
                <TextInput
                  value={filters.search}
                  onChangeText={(t) => setFilters((f) => ({...f, search: t}))}
                  placeholder="Deck name…"
                  placeholderTextColor="#666"
                  style={styles.search}
                  accessibilityLabel="Search decks by name"
                />

                {/* Aspects */}
                <Text style={styles.panelLabel}>ASPECTS</Text>
                <View style={styles.chipWrap}>
                  {ASPECT_NAMES.map((name) => {
                    const selected = filters.aspects.includes(name);
                    return (
                      <Pressable
                        key={name}
                        onPress={() => toggleInArray("aspects", name)}
                        style={({pressed}) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityState={{selected}}
                        accessibilityLabel={`Aspect ${name}`}
                      >
                        <View style={[styles.chipDot, {backgroundColor: ASPECTS[name].color}]} />
                        <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{name}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Archetypes (only when some exist) */}
                {archetypeOptions.length > 0 ? (
                  <>
                    <Text style={styles.panelLabel}>ARCHETYPE</Text>
                    <View style={styles.chipWrap}>
                      {archetypeOptions.map((a) => {
                        const selected = filters.archetypes.includes(a);
                        return (
                          <Pressable
                            key={a}
                            onPress={() => toggleInArray("archetypes", a)}
                            style={({pressed}) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityState={{selected}}
                            accessibilityLabel={`Archetype ${a}`}
                          >
                            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{a}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                {/* Sort by */}
                <Text style={styles.panelLabel}>SORT BY</Text>
                <View style={styles.segmented}>
                  {SORT_OPTIONS.map((opt) => {
                    const active = filters.sortBy === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setFilters((f) => ({...f, sortBy: opt.key}))}
                        style={({pressed}) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityState={{selected: active}}
                        accessibilityLabel={`Sort by ${opt.label.toLowerCase()}`}
                      >
                        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Order */}
                <Text style={styles.panelLabel}>ORDER</Text>
                <View style={styles.segmented}>
                  {ORDER_OPTIONS.map((opt) => {
                    const active = filters.sortOrder === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setFilters((f) => ({...f, sortOrder: opt.key}))}
                        style={({pressed}) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityState={{selected: active}}
                        accessibilityLabel={`Order ${opt.label === "Asc" ? "ascending" : "descending"}`}
                      >
                        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {rows.length === 0 ? (
              <View style={styles.noMatch}>
                <Text style={styles.noMatchTitle}>No decks match your filters</Text>
                <Pressable
                  onPress={clearFilters}
                  style={({pressed}) => [styles.noMatchBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear filters"
                >
                  <Text style={styles.noMatchBtnLabel}>Clear filters</Text>
                </Pressable>
              </View>
            ) : (
              rows.map(({deck, stats, streak, points}) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  stats={stats}
                  streak={streak}
                  points={points}
                  onPress={() => onOpenDeckDetail(deck.id)}
                />
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: "transparent"},
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
    gap: 8
  },
  headerBtn: {minWidth: 44, height: 44, paddingHorizontal: 8, borderRadius: 22, alignItems: "center", justifyContent: "center"},
  pressed: {opacity: 0.7},
  headerTitle: {flex: 1, color: "#FFF", fontFamily: "FiraCode_700Bold", fontSize: 18, letterSpacing: 1.4},
  newBtn: {minHeight: 44, paddingHorizontal: 10, justifyContent: "center"},
  newLabel: {color: GOLD, fontFamily: "FiraCode_700Bold", fontSize: 13, letterSpacing: 1.4},

  // Filters toggle bar (row: toggle + clear as siblings)
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1c1c1c"
  },
  filterToggle: {flexDirection: "row", alignItems: "center", gap: 8, flex: 1, paddingVertical: 8},
  clearBtn: {paddingVertical: 8, paddingLeft: 12},
  filterChevron: {color: "#888", fontSize: 12, width: 14},
  filterBarLabel: {color: "#AAA", fontFamily: "FiraCode_700Bold", fontSize: 12, letterSpacing: 2.5},
  filterCountBadge: {minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: GOLD, alignItems: "center", justifyContent: "center"},
  filterCountText: {color: "#241a04", fontFamily: "FiraCode_700Bold", fontSize: 11},
  clearLabel: {color: "#888", fontFamily: "FiraCode_700Bold", fontSize: 11, letterSpacing: 1.5},

  body: {padding: 16, paddingBottom: 32},

  // Filter panel
  panel: {
    backgroundColor: "#0f0f12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
    padding: 14,
    marginBottom: 16,
    gap: 8
  },
  panelLabel: {color: "#888", fontFamily: "FiraCode_700Bold", fontSize: 10, letterSpacing: 2.5, marginTop: 6},
  search: {
    color: "#FFF",
    fontFamily: "FiraCode_400Regular",
    fontSize: 14,
    backgroundColor: "#16161a",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  chipWrap: {flexDirection: "row", flexWrap: "wrap", gap: 8},
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#3a3a3e",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 34
  },
  chipSelected: {backgroundColor: "rgba(232,196,90,0.16)", borderColor: GOLD},
  chipDot: {width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)"},
  chipLabel: {color: "#BBB", fontFamily: "FiraCode_400Regular", fontSize: 12, letterSpacing: 0.3},
  chipLabelSelected: {color: "#FFF", fontFamily: "FiraCode_700Bold"},
  segmented: {flexDirection: "row", backgroundColor: "#16161a", borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2e", overflow: "hidden"},
  segment: {flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 9, minHeight: 40},
  segmentActive: {backgroundColor: "rgba(232,196,90,0.16)"},
  segmentLabel: {color: "#AAA", fontFamily: "FiraCode_700Bold", fontSize: 12, letterSpacing: 0.6},
  segmentLabelActive: {color: GOLD},

  // No-match state
  noMatch: {alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 14},
  noMatchTitle: {color: "#888", fontFamily: "FiraCode_400Regular", fontSize: 13, letterSpacing: 0.5},
  noMatchBtn: {borderWidth: 1, borderColor: "#555", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10},
  noMatchBtnLabel: {color: "#CCC", fontFamily: "FiraCode_700Bold", fontSize: 13},

  // Empty (no decks at all)
  emptyBody: {flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12},
  emptyTitle: {color: TEXT.onSpace.primary, fontFamily: "FiraCode_700Bold", fontSize: 18, letterSpacing: 1},
  emptySubtitle: {color: TEXT.onSpace.muted, fontFamily: "FiraCode_400Regular", fontSize: 13, letterSpacing: 0.5, textAlign: "center", lineHeight: 20, marginBottom: 8},
  emptyButton: {alignSelf: "stretch", marginTop: 4}
});
