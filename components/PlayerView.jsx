import React, {useState, useRef} from "react";
import {Platform, View, Text, StyleSheet, Pressable, ImageBackground, Animated} from "react-native";
import * as Haptics from "expo-haptics";
import InitiativeView from "./InitiativeView";
import {canUpdateLife} from "./lifeMath";
import {textShadow} from "../utils/textShadow";
import {ASPECTS} from "../constants/decks";

// react-native-web has no native animated module; only request native driver on real platforms.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// Haptic feedback is mobile-only — expo-haptics ships a web no-op but we still
// gate the call so the import path is dormant on web.
const HAPTICS_AVAILABLE = Platform.OS !== "web";

export default function PlayerView({
  hasInitiative,
  claimInitiative,
  backgroundImage,
  initiativeImage,
  playerLife,
  setPlayerLife,
  isOpponent = false,
  isLandscape = false,
  teamColor,
  enableAnimations = true,
  enableHaptics = false,
  // Deck-badge props. In-game every side resolves to either a real deck or
  // Random (an unset side is normalized to Random — see LifeCounter), so the
  // badge always renders and is a tappable control opening a deck picker.
  deckName = null,
  deckAspects = [],
  isRandom = false,
  isPlayerSide = false,
  // Tapping the badge asks the parent to open the deck picker for this side.
  // Optional: when omitted the badge falls back to a non-interactive label.
  onPressBadge = null
}) {
  const [lifeChange, setLifeChange] = useState(null);

  const [didFadeIn, setDidFadeIn] = useState(false);
  const fadeOutTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  const pressTint = teamColor ? teamColor.press : "#FFFFFF33";

  // When animations are off, run the same Animated.timing calls but with
  // duration: 0 so the overlay snaps in/out — feedback is preserved, motion
  // is removed (see design.md Decision 5).
  const fadeInDuration = enableAnimations ? 300 : 0;
  const fadeOutDuration = enableAnimations ? 500 : 0;

  const updateLife = (change) => {
    if (canUpdateLife(playerLife, change)) {
      clearTimeout(fadeOutTimeout.current);

      if (enableHaptics && HAPTICS_AVAILABLE) {
        // Fire-and-forget; the promise rejection (e.g. user denied haptics
        // permission on iOS) is harmless and not worth surfacing.
        Haptics.selectionAsync().catch(() => {});
      }

      setPlayerLife((prevLife) => prevLife + change);
      setLifeChange((prev) => (prev || 0) + change);

      if (!didFadeIn) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: fadeInDuration,
            useNativeDriver: USE_NATIVE_DRIVER
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: fadeInDuration,
            useNativeDriver: USE_NATIVE_DRIVER
          })
        ]).start();
        setDidFadeIn(true);
      }

      fadeOutTimeout.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: fadeOutDuration,
          useNativeDriver: USE_NATIVE_DRIVER
        }).start(() => {
          setLifeChange(null);
          setDidFadeIn(false);
        });
      }, 2000);
    }
  };

  // The badge is anchored bottom-left of each ImageBackground. The
  // opponent half's 180° parent rotation cascades, so on the device each
  // player still reads their own deck name in their physical bottom-left
  // corner (see design.md Decision 9). No counter-rotation needed. It always
  // renders in-game because every side resolves to a deck or Random.
  const renderDeckBadge = isRandom || deckName !== null;

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={[styles.player, isOpponent && styles.opponent]}>
      {renderDeckBadge ? (
        <DeckBadge
          deckName={deckName}
          deckAspects={deckAspects}
          isRandom={isRandom}
          isPlayerSide={isPlayerSide}
          onPress={onPressBadge}
        />
      ) : null}
      {lifeChange !== null && (
        <View style={[styles.lifeChangeContent, isLandscape ? styles.lifeChangeContentLandscape : styles.lifeChangeContentPortrait]}>
          <Animated.Text
            style={[
              styles.lifeChangeText,
              {
                opacity: fadeAnim,
                transform: [{translateY: translateYAnim}]
              }
            ]}
          >
            {lifeChange > 0 ? `+${lifeChange}` : lifeChange}
          </Animated.Text>
        </View>
      )}

      <View style={styles.lifeArea}>
        <Pressable style={({pressed}) => [styles.buttonContainer, pressed && {backgroundColor: pressTint}]} onPress={() => updateLife(-1)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>-</Text>
          </View>
        </Pressable>
        <View style={styles.buttonContainer}>
          <Text style={styles.lifeText}>{playerLife}</Text>
        </View>
        <Pressable style={({pressed}) => [styles.buttonContainer, pressed && {backgroundColor: pressTint}]} onPress={() => updateLife(1)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>+</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <InitiativeView hasInitiative={hasInitiative} claimInitiative={claimInitiative} initiativeImage={initiativeImage} isLandscape={isLandscape} enableAnimations={enableAnimations} />
    </ImageBackground>
  );
}

// Small per-side identity badge anchored at the bottom-left of each
// ImageBackground inside a translucent pill. The opponent side's
// `styles.opponent` rotation cascades, so each player still reads their
// own badge right-side-up in their physical bottom-left corner — see
// design.md Decision 9.
function DeckBadge({deckName, deckAspects, isRandom, isPlayerSide, onPress}) {
  const aspectsList = Array.isArray(deckAspects) ? deckAspects : [];
  const sideWord = isPlayerSide ? "Your" : "Opponent's";
  // Accessibility label: Random vs a named deck. When tappable the label
  // advertises that the deck can be changed.
  let accessibilityLabel;
  if (isRandom) {
    accessibilityLabel = `${sideWord} deck: Random`;
  } else {
    const aspectsStr = aspectsList.length > 0 ? aspectsList.join(", ") : "none";
    accessibilityLabel = `${sideWord} deck: ${deckName}, aspects ${aspectsStr}`;
  }
  if (onPress) accessibilityLabel += ". Tap to change deck.";

  const content = (
    <>
      {!isRandom && aspectsList.length > 0 ? (
        <View style={styles.deckBadgeDots}>
          {aspectsList.map((aspect) => {
            const spec = ASPECTS[aspect];
            if (!spec) return null;
            return <View key={aspect} style={[styles.deckBadgeDot, {backgroundColor: spec.color}]} />;
          })}
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.deckBadgeText, isRandom && styles.deckBadgeTextRandom]}
      >
        {isRandom ? "Random" : deckName}
      </Text>
      {onPress ? <Text style={styles.deckBadgeChevron}>▾</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [styles.deckBadge, pressed && styles.deckBadgePressed]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens a list to pick this side's deck"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.deckBadge} accessibilityRole="text" accessibilityLabel={accessibilityLabel}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    width: "100%",
    height: "100%",
    flex: 1,
    flexDirection: "column"
  },
  opponent: {
    transform: [{rotate: "180deg"}]
  },
  lifeChangeContent: {
    zIndex: 2
  },
  lifeChangeContentPortrait: {
    alignItems: "center"
  },
  lifeChangeContentLandscape: {
    alignItems: "flex-end",
    marginRight: "35%"
  },
  lifeChangeText: {
    position: "absolute",
    top: 35,
    fontSize: 26,
    color: "white",
    opacity: 0.6,
    // `textShadowOpacity` isn't a valid RN style prop — the intent was a faint shadow,
    // expressed correctly by baking the opacity into the rgba color below.
    ...textShadow({color: "rgba(0,0,0,0.1)", offset: {width: 0, height: 2}, radius: 6})
  },
  lifeArea: {
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    flexDirection: "row"
  },
  lifeText: {
    fontWeight: "bold",
    color: "white",
    marginVertical: 10,
    fontFamily: "FiraCode_400Regular",
    fontSize: 100,
    ...textShadow({color: "rgba(0,0,0,0.1)", offset: {width: 0, height: 2}, radius: 6})
  },
  buttonContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  button: {
    padding: 5,
    marginHorizontal: 5
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "FiraCode_400Regular",
    fontSize: 100,
    ...textShadow({color: "rgba(0,0,0,0.1)", offset: {width: 0, height: 2}, radius: 6})
  },
  divider: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#FFF",
    borderStyle: "dashed"
  },
  // Per-side deck-identity badge. Anchored bottom-left of the
  // ImageBackground inside a translucent pill; the opponent half's parent
  // rotation keeps it right-side-up in that player's physical bottom-left
  // corner (see design.md Decision 9). The 16px inset keeps it clear of
  // the central reset/end-game cluster and the InitiativeView chip.
  deckBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "45%",
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  deckBadgePressed: {
    opacity: 0.7,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  deckBadgeChevron: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    marginLeft: 5
  },
  deckBadgeDots: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
    gap: 1.5
  },
  deckBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)"
  },
  deckBadgeText: {
    color: "white",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    letterSpacing: 0.3,
    flexShrink: 1,
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 2}, radius: 6})
  },
  deckBadgeTextRandom: {
    fontStyle: "italic"
  }
});
