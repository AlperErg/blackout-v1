import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  ListRenderItem,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Constants from "expo-constants";
import {
  isScreenTimeModuleLoaded,
  requestScreenTimeAuthorization,
} from "expo-family-controls";
import {
  isAndroidBlockerAvailable,
  hasUsageAccess,
  hasOverlayPermission,
  openUsageAccessSettings,
  openOverlaySettings,
} from "expo-android-blocker";
import { setOnboardingComplete } from "@/lib/onboarding";
import { BlackoutColors as C } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_PADDING = 32;
const SLIDE_WIDTH = SCREEN_WIDTH;

type Slide = {
  id: string;
  emoji: string;
  title: string;
  body: string;
};

const GUIDE_SLIDES: Slide[] = [
  {
    id: "welcome",
    emoji: "👋",
    title: "How to use Blackout",
    body: "Blackout lets a group go phone-free together. One person creates a session; everyone else joins and gets their apps locked until the session ends—or the host allows a short break.",
  },
  {
    id: "create",
    emoji: "📱",
    title: "Create a session",
    body: "Tap Create, set an end time and optional unblock break rules, then share the QR code or link with your group.",
  },
  {
    id: "join",
    emoji: "📷",
    title: "Join a session",
    body: "Tap Scan and scan the host's QR code, or open the join link on your phone. Approve Screen Time when prompted so Blackout can lock apps.",
  },
  {
    id: "during",
    emoji: "🔒",
    title: "During the session",
    body: "Your distracting apps are locked. Use in-session chat and host announcements to stay in touch. If the host enabled unblock breaks, you'll get short windows to use your phone before it locks again.",
  },
  {
    id: "end",
    emoji: "✅",
    title: "When it ends",
    body: "The session ends at the host's chosen time. Apps unlock and you're back to normal. You're in control: you choose to join and can leave anytime.",
  },
];

function GuideSlide({ slide }: { slide: Slide }) {
  return (
    <View style={styles.slide}>
      <View style={styles.slideContent}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideBody}>{slide.body}</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const isIOS = Platform.OS === "ios";
  const isExpoGo = Constants.appOwnership === "expo";
  const [phase, setPhase] = useState<"guide" | "setup">("guide");
  const [slideIndex, setSlideIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [authStatus, setAuthStatus] = useState<
    "unknown" | "authorized" | "denied" | "unavailable"
  >("unknown");
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [androidUsageAccess, setAndroidUsageAccess] = useState(false);
  const [androidOverlayPerm, setAndroidOverlayPerm] = useState(false);
  const listRef = useRef<FlatList>(null);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
      if (i !== slideIndex && i >= 0 && i < GUIDE_SLIDES.length) {
        setSlideIndex(i);
      }
    },
    [slideIndex]
  );

  const onGetStarted = useCallback(() => {
    setPhase("setup");
  }, []);

  const refreshState = useCallback(async () => {
    if (isIOS) {
      if (isExpoGo) {
        setAuthStatus("authorized");
        setInitialCheckDone(true);
        return;
      }
      try {
        if (!isScreenTimeModuleLoaded()) {
          setAuthStatus("unavailable");
          return;
        }
        const status = await requestScreenTimeAuthorization();
        setAuthStatus(status);
      } catch {
        setAuthStatus("unavailable");
      } finally {
        setInitialCheckDone(true);
      }
      return;
    }
    if (Platform.OS === "android" && isAndroidBlockerAvailable()) {
      setAndroidUsageAccess(hasUsageAccess());
      setAndroidOverlayPerm(hasOverlayPermission());
    }
    setInitialCheckDone(true);
  }, [isIOS, isExpoGo]);

  useEffect(() => {
    if (phase === "setup") refreshState();
  }, [phase, refreshState]);

  const onRequestPermission = useCallback(async () => {
    if (!isIOS) return;
    if (isExpoGo) {
      setAuthStatus("authorized");
      return;
    }
    setBusy(true);
    try {
      const status = await requestScreenTimeAuthorization();
      setAuthStatus(status);
    } finally {
      setBusy(false);
    }
  }, [isIOS, isExpoGo]);

  const onContinue = useCallback(async () => {
    setBusy(true);
    try {
      await setOnboardingComplete();
      router.replace("/");
    } finally {
      setBusy(false);
    }
  }, []);

  const openSettings = () => Linking.openURL("app-settings:");

  const isAndroid = Platform.OS === "android";
  const androidBlockerReady = isAndroid && isAndroidBlockerAvailable();
  const androidNeedsSetup = androidBlockerReady && (!androidUsageAccess || !androidOverlayPerm);

  const canContinue = isIOS
    ? isExpoGo || authStatus === "authorized"
    : isAndroid
      ? !androidBlockerReady || (androidUsageAccess && androidOverlayPerm)
      : true;

  const isBlocked =
    (isIOS && !isExpoGo && initialCheckDone && authStatus !== "authorized") ||
    (initialCheckDone && androidNeedsSetup);

  const renderSlide: ListRenderItem<Slide> = useCallback(({ item }) => {
    return <GuideSlide slide={item} />;
  }, []);

  // —— Guide phase (swipeable slides) ——
  if (phase === "guide") {
    return (
      <SafeAreaView style={styles.safe}>
        <FlatList
          ref={listRef}
          data={GUIDE_SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.guideList}
          contentContainerStyle={styles.guideListContent}
          getItemLayout={(_, index) => ({
            length: SLIDE_WIDTH,
            offset: SLIDE_WIDTH * index,
            index,
          })}
        />
        <View style={styles.guideFooter}>
          <View style={styles.dots}>
            {GUIDE_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === slideIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={
              slideIndex === GUIDE_SLIDES.length - 1
                ? onGetStarted
                : () =>
                    listRef.current?.scrollToOffset({
                      offset: (slideIndex + 1) * SLIDE_WIDTH,
                      animated: true,
                    })
            }
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {slideIndex === GUIDE_SLIDES.length - 1 ? "Get started" : "Next"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // —— Setup phase: permissions required (blocked) ——
  if (isBlocked) {
    if (isAndroid && androidNeedsSetup) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.setupRoot}>
            <View>
              <Text style={styles.setupTitle}>Permissions required</Text>
              <Text style={styles.setupBody}>
                Blackout needs two permissions to block apps during sessions.
                Grant them below, then tap "Check again".
              </Text>
              {!androidUsageAccess && (
                <Pressable
                  onPress={() => openUsageAccessSettings()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { marginBottom: 12 },
                    pressed && styles.primaryButtonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    Grant Usage Access
                  </Text>
                </Pressable>
              )}
              {androidUsageAccess && (
                <Text style={[styles.setupHint, { marginBottom: 12 }]}>
                  ✓ Usage access granted
                </Text>
              )}
              {!androidOverlayPerm && (
                <Pressable
                  onPress={() => openOverlaySettings()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { marginBottom: 12 },
                    pressed && styles.primaryButtonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    Allow Display Over Apps
                  </Text>
                </Pressable>
              )}
              {androidOverlayPerm && (
                <Text style={[styles.setupHint, { marginBottom: 12 }]}>
                  ✓ Overlay permission granted
                </Text>
              )}
            </View>
            <View style={styles.setupActions}>
              <Pressable
                onPress={refreshState}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Check again</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.setupRoot}>
          <View>
            <Text style={styles.setupTitle}>Screen Time required</Text>
            <Text style={styles.setupBody}>
              Blackout requires Screen Time permission to block apps during
              sessions. The app cannot function without it.
            </Text>
            <Text style={styles.setupHint}>
              {authStatus === "denied"
                ? "You previously denied access. Open Settings to grant Screen Time permission, then return here."
                : "Screen Time is only available in a development or TestFlight build on a physical iPhone."}
            </Text>
          </View>
          <View style={styles.setupActions}>
            <Pressable
              onPress={onRequestPermission}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryButton,
                busy && styles.primaryButtonDisabled,
                pressed && !busy && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {busy ? "Checking…" : "Try again"}
              </Text>
            </Pressable>
            <Pressable
              onPress={openSettings}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.secondaryButtonText}>Open Settings</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // —— Setup phase: ready to continue ——
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.setupRoot}>
        <View>
          <Text style={styles.setupTitle}>Set up Blackout</Text>
          <Text style={styles.setupBody}>
            Blackout blocks apps during sessions. You can use unblock breaks when
            the host allows them.
          </Text>
          {isExpoGo && (
            <Text style={styles.setupHint}>
              Expo Go: Screen Time blocking is disabled while you test features
              like chat.
            </Text>
          )}
          {isAndroid && androidBlockerReady && (
            <Text style={styles.setupHint}>
              Blackout will block apps during sessions using a foreground
              service and overlay.
            </Text>
          )}
          {isAndroid && !androidBlockerReady && (
            <Text style={styles.setupHint}>
              On Android, use your device's Digital Wellbeing or Focus mode
              during sessions.
            </Text>
          )}
        </View>
        <View style={styles.setupActions}>
          {busy && (
            <View style={styles.busyRow}>
              <ActivityIndicator color={C.textMuted} />
              <Text style={styles.busyText}>Working…</Text>
            </View>
          )}
          <Pressable
            onPress={onContinue}
            disabled={busy || !canContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              (busy || !canContinue) && styles.primaryButtonDisabled,
              pressed && !busy && canContinue && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  slide: {
    width: SLIDE_WIDTH,
    flex: 1,
    paddingHorizontal: SLIDE_PADDING,
    alignItems: "center",
    justifyContent: "center",
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  guideList: { flex: 1 },
  guideListContent: { flexGrow: 1 },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  slideTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  slideBody: {
    color: C.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  guideFooter: {
    paddingHorizontal: SLIDE_PADDING,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.textMuted,
    opacity: 0.4,
  },
  dotActive: {
    backgroundColor: C.text,
    opacity: 1,
  },
  primaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.text,
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: C.background,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textMuted,
  },
  setupRoot: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  setupTitle: {
    color: C.text,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  setupBody: {
    color: C.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
  },
  setupHint: {
    color: C.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  setupActions: { gap: 12 },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  busyText: { color: C.textMuted },
});
