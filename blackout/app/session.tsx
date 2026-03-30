import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Notifications from "expo-notifications";
import {
  enableShielding,
  disableShielding,
  disableShieldingForDuration,
  cancelBreakTimer,
  checkAndReenable,
  isScreenTimeModuleLoaded,
  setSessionEndTime,
  clearSessionEndTime,
} from "expo-family-controls";
import { scheduleBreakPush, cancelBreakPush } from "@/lib/breakTimer";
import {
  isAndroidBlockerAvailable,
  startBlocking as startAndroidBlocking,
  stopBlocking as stopAndroidBlocking,
} from "expo-android-blocker";
import {
  saveActiveSession,
  clearActiveSession,
  getActiveSession,
} from "@/lib/activeSession";
import { generateChatUserId } from "@/lib/chat";
import { deleteSessionWithData } from "@/lib/sessions";
import { buildJoinLink } from "@/lib/joinLink";
import { subscribeToAnnouncements } from "@/lib/announcements";
import {
  ensureNotificationPermissions,
  notifyHostAnnouncement,
  registerSessionPushToken,
} from "@/lib/notifications";
import SessionChat from "@/components/SessionChat";
import SessionAnnouncements from "@/components/SessionAnnouncements";
import styles from "./session.styles";

export default function Session() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    endTime?: string;
    sessionId?: string;
    unblockLimit?: string;
    unblockDurationMinutes?: string;
    openAnnouncements?: string;
  }>();
  const [showQRModal, setShowQRModal] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [unblocksRemaining, setUnblocksRemaining] = useState<number>(0);
  const [unblockExpiresAt, setUnblockExpiresAt] = useState<string | null>(null);
  const [isUnblocked, setIsUnblocked] = useState(false);
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState<number | null>(null);
  const [unblockDurationMinutes, setUnblockDurationMinutes] = useState(5);
  const [hasLoadedUnblockState, setHasLoadedUnblockState] = useState(false);
  const [chatUserId, setChatUserId] = useState("");
  const [chatUsername, setChatUsername] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"announcements" | "home" | "chat">(
    "home"
  );
  const pagerRef = useRef<ScrollView>(null);
  const hasPrimedAnnouncementsRef = useRef(false);
  const lastSeenAnnouncementIdRef = useRef<string | null>(null);
  const hasHandledExpiryRef = useRef(false);
  const canUseScreenTime = Platform.OS === "ios" && isScreenTimeModuleLoaded();
  const canUseAndroidBlocker = Platform.OS === "android" && isAndroidBlockerAvailable();
  const canBlock = canUseScreenTime || canUseAndroidBlocker;

  const enableBlocking = useCallback(async () => {
    if (canUseScreenTime) await enableShielding();
    else if (canUseAndroidBlocker) startAndroidBlocking();
  }, [canUseScreenTime, canUseAndroidBlocker]);

  const disableBlocking = useCallback(async () => {
    if (canUseScreenTime) await disableShielding();
    else if (canUseAndroidBlocker) stopAndroidBlocking();
  }, [canUseScreenTime, canUseAndroidBlocker]);

  const [resolvedUnblock, setResolvedUnblock] = useState<{
    limit: number;
    duration: number;
  } | null>(null);
  const unblockLimit = resolvedUnblock?.limit ?? 0;
  const durationMin = resolvedUnblock?.duration ?? 5;

  useEffect(() => {
    if (params.openAnnouncements === "1") {
      setActiveTab("announcements");
    }
  }, [params.openAnnouncements]);

  useEffect(() => {
    const index =
      activeTab === "announcements" ? 0 : activeTab === "home" ? 1 : 2;
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  }, [activeTab, width]);

  useEffect(() => {
    if (!params.sessionId || !chatUserId || !chatUsername) return;
    ensureNotificationPermissions().catch(() => {});
    registerSessionPushToken(params.sessionId, chatUserId).catch(() => {});
    const unsubscribe = subscribeToAnnouncements(params.sessionId, (items) => {
      if (items.length === 0) return;
      const latest = items[items.length - 1];

      if (!hasPrimedAnnouncementsRef.current) {
        hasPrimedAnnouncementsRef.current = true;
        lastSeenAnnouncementIdRef.current = latest.id;
        return;
      }
      if (lastSeenAnnouncementIdRef.current === latest.id) return;
      lastSeenAnnouncementIdRef.current = latest.id;

      if (activeTab === "announcements") return;
      notifyHostAnnouncement(params.sessionId!, latest.text.slice(0, 140)).catch(
        () => {}
      );
    });

    return () => {
      unsubscribe();
      hasPrimedAnnouncementsRef.current = false;
      lastSeenAnnouncementIdRef.current = null;
    };
  }, [params.sessionId, chatUserId, chatUsername, activeTab]);

  useEffect(() => {
    (async () => {
      const fromParamsProvided =
        params.unblockLimit != null || params.unblockDurationMinutes != null;
      const fromParams = {
        limit: Math.max(0, parseInt(params.unblockLimit ?? "0", 10) || 0),
        duration: Math.min(
          10,
          Math.max(5, parseInt(params.unblockDurationMinutes ?? "5", 10) || 5)
        ),
      };
      if (fromParamsProvided) {
        setResolvedUnblock(fromParams);
        return;
      }
      const stored = await getActiveSession();
      if (stored?.unblockLimit != null || stored?.unblockDurationMinutes != null) {
        setResolvedUnblock({
          limit: Math.max(0, stored?.unblockLimit ?? 0),
          duration: Math.min(
            10,
            Math.max(5, stored?.unblockDurationMinutes ?? 5)
          ),
        });
      } else {
        setResolvedUnblock(fromParams);
      }
    })();
  }, [
    params.unblockLimit,
    params.unblockDurationMinutes,
    params.sessionId,
  ]);

  useEffect(() => {
    (async () => {
      if (!params.sessionId) return;
      const stored = await getActiveSession();
      const sameSession = stored?.sessionId === params.sessionId;
      const sameParticipantSession = sameSession && stored?.isHost === false;
      const nextUserId =
        sameParticipantSession && stored?.chatUserId
          ? stored.chatUserId
          : generateChatUserId();
      const nextUsername = sameParticipantSession
        ? stored?.chatUsername?.trim() ?? ""
        : "";

      setChatUserId(nextUserId);
      setChatUsername(nextUsername);
      setUsernameDraft(nextUsername);
      setShowUsernameModal(nextUsername === "");

      if (!sameSession && params.endTime) {
        await saveActiveSession({
          sessionId: params.sessionId,
          endTime: params.endTime,
          isHost: false,
          unblockLimit,
          unblockDurationMinutes: durationMin,
          chatUserId: nextUserId,
        });
      } else if (sameParticipantSession && stored && !stored.chatUserId) {
        await saveActiveSession({ ...stored, chatUserId: nextUserId });
      }
    })();
  }, [params.sessionId, params.endTime, unblockLimit, durationMin]);

  const persistSession = useCallback(
    async (updates: {
      unblocksRemaining?: number;
      unblockExpiresAt?: string | null;
    }) => {
      if (!params.sessionId || !params.endTime) return;
      const current = await getActiveSession();
      const base = {
        sessionId: params.sessionId,
        endTime: params.endTime,
        isHost: false,
        unblockLimit,
        unblockDurationMinutes: durationMin,
        chatUserId: current?.chatUserId ?? (chatUserId || undefined),
        chatUsername: current?.chatUsername ?? (chatUsername || undefined),
      };
      const unblockExpiresAt =
        updates.unblockExpiresAt !== undefined
          ? updates.unblockExpiresAt
          : current?.unblockExpiresAt;
      await saveActiveSession({
        ...base,
        unblocksRemaining:
          updates.unblocksRemaining ?? current?.unblocksRemaining ?? unblockLimit,
        ...(unblockExpiresAt != null ? { unblockExpiresAt } : {}),
      });
    },
    [params.sessionId, params.endTime, unblockLimit, durationMin, chatUserId]
  );

  useEffect(() => {
    if (!params.sessionId || !params.endTime || resolvedUnblock == null) return;
    (async () => {
      const stored = await getActiveSession();
      const limit = resolvedUnblock.limit;
      const duration = resolvedUnblock.duration;
      const remaining = stored?.unblocksRemaining ?? limit;
      const expiresAt = stored?.unblockExpiresAt;
      setUnblocksRemaining(remaining);
      setUnblockDurationMinutes(duration);
      if (expiresAt) {
        const expires = new Date(expiresAt);
        if (new Date() < expires) {
          setUnblockExpiresAt(expiresAt);
          setIsUnblocked(true);
          setBreakSecondsRemaining(
            Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000))
          );
        } else {
          setUnblockExpiresAt(null);
          setIsUnblocked(false);
          setBreakSecondsRemaining(null);
        }
      }
      await saveActiveSession({
        sessionId: params.sessionId!,
        endTime: params.endTime!,
        isHost: false,
        unblockLimit: limit,
        unblockDurationMinutes: duration,
        unblocksRemaining: remaining,
        unblockExpiresAt:
          expiresAt && new Date(expiresAt) > new Date() ? expiresAt : undefined,
        chatUserId: stored?.chatUserId ?? (chatUserId || undefined),
        chatUsername: stored?.chatUsername ?? (chatUsername || undefined),
      });
      setHasLoadedUnblockState(true);
    })();
  }, [params.sessionId, params.endTime, resolvedUnblock, chatUserId, chatUsername]);


  useEffect(() => {
    if (!canBlock) return;
    if (isUnblocked || !hasLoadedUnblockState) return;
    let cancelled = false;
    (async () => {
      try {
        await enableBlocking();
      } catch {
        if (!cancelled) {
          // Non-fatal; user may have no selection or permission denied
        }
      }
    })();
    return () => {
      cancelled = true;
      (async () => {
        try {
          await disableBlocking();
        } catch {
          // ignore
        }
      })();
    };
  }, [isUnblocked, hasLoadedUnblockState, canBlock, enableBlocking, disableBlocking]);

  // Tell the native module about the session end time so it can disable
  // shielding even while JS is suspended in the background.
  useEffect(() => {
    if (!canUseScreenTime || !params.endTime) return;
    const endDate = new Date(params.endTime);
    if (Number.isNaN(endDate.getTime())) return;
    const endTimestamp = endDate.getTime() / 1000; // Unix seconds
    setSessionEndTime(endTimestamp).catch(() => {});
    return () => {
      clearSessionEndTime().catch(() => {});
    };
  }, [canUseScreenTime, params.endTime]);

  useEffect(() => {
    if (!params.endTime) return;
    const endDate = new Date(params.endTime);
    if (Number.isNaN(endDate.getTime())) return;

    const check = () => {
      if (new Date() < endDate || hasHandledExpiryRef.current) return;
      hasHandledExpiryRef.current = true;
      (async () => {
        if (params.sessionId) {
          await deleteSessionWithData(params.sessionId);
        }
        await clearActiveSession();
        try { await cancelBreakTimer(); } catch { /* ignore */ }
        try { if (params.sessionId) await cancelBreakPush(params.sessionId); } catch { /* ignore */ }
        try { await clearSessionEndTime(); } catch { /* ignore */ }
        try { await disableBlocking(); } catch { /* ignore */ }
        setSessionEnded(true);
      })();
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [params.endTime, params.sessionId, disableBlocking]);

  useEffect(() => {
    if (!unblockExpiresAt || !isUnblocked) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(unblockExpiresAt).getTime() - Date.now()) / 1000)
      );
      setBreakSecondsRemaining(remaining);
      if (remaining <= 0) {
        setUnblockExpiresAt(null);
        setIsUnblocked(false);
        setBreakSecondsRemaining(null);
        enableBlocking().catch(() => {});
        persistSession({ unblockExpiresAt: null });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [unblockExpiresAt, isUnblocked, persistSession, enableBlocking]);

  // Re-check break and session state whenever the app returns to foreground (iOS)
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const handleAppState = async (next: AppStateStatus) => {
      if (next !== "active") return;

      // 1. Ask the native module to re-enable shielding if the scheduled time has passed
      if (canUseScreenTime) {
        try {
          const reenabled = await checkAndReenable();
          if (reenabled && isUnblocked) {
            setUnblockExpiresAt(null);
            setIsUnblocked(false);
            setBreakSecondsRemaining(null);
            if (params.sessionId) {
              try { await cancelBreakPush(params.sessionId); } catch { /* ignore */ }
            }
            persistSession({ unblockExpiresAt: null });
            return;
          }
        } catch { /* ignore */ }
      }

      // 2. JS-level check: break may have expired while backgrounded
      if (isUnblocked && unblockExpiresAt) {
        const remaining = new Date(unblockExpiresAt).getTime() - Date.now();
        if (remaining <= 0) {
          setUnblockExpiresAt(null);
          setIsUnblocked(false);
          setBreakSecondsRemaining(null);
          if (params.sessionId) {
            try { await cancelBreakPush(params.sessionId); } catch { /* ignore */ }
          }
          enableBlocking().catch(() => {});
          persistSession({ unblockExpiresAt: null });
        }
      }

      // 3. Session may have ended while backgrounded
      if (params.endTime && !hasHandledExpiryRef.current) {
        const endDate = new Date(params.endTime);
        if (new Date() >= endDate) {
          hasHandledExpiryRef.current = true;
          if (params.sessionId) {
            await deleteSessionWithData(params.sessionId).catch(() => {});
          }
          await clearActiveSession();
          try { await cancelBreakTimer(); } catch { /* ignore */ }
          try { if (params.sessionId) await cancelBreakPush(params.sessionId); } catch { /* ignore */ }
          try { await clearSessionEndTime(); } catch { /* ignore */ }
          try { await disableBlocking(); } catch { /* ignore */ }
          setSessionEnded(true);
        }
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [
    canUseScreenTime,
    isUnblocked,
    unblockExpiresAt,
    params.endTime,
    params.sessionId,
    enableBlocking,
    disableBlocking,
    persistSession,
  ]);

  const onUnblock = useCallback(async () => {
    if (unblocksRemaining <= 0 || !canBlock) return;
    const durationSec = unblockDurationMinutes * 60;
    const expires = new Date(Date.now() + durationSec * 1000);
    const expiresAt = expires.toISOString();
    setUnblockExpiresAt(expiresAt);
    setIsUnblocked(true);
    setBreakSecondsRemaining(durationSec);
    setUnblocksRemaining((r) => Math.max(0, r - 1));
    try {
      if (canUseScreenTime) {
        await disableShieldingForDuration(durationSec);
        if (params.sessionId) {
          try { await scheduleBreakPush(params.sessionId, durationSec); } catch { /* ignore */ }
        }
      } else {
        await disableBlocking();
      }
    } catch { /* ignore */ }
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Break ending",
        body: "Your break is over — apps are being blocked again.",
        sound: "default",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: durationSec, repeats: false },
    }).catch(() => {});
    await persistSession({
      unblocksRemaining: Math.max(0, unblocksRemaining - 1),
      unblockExpiresAt: expiresAt,
    });
  }, [unblocksRemaining, unblockDurationMinutes, persistSession, canBlock, canUseScreenTime, disableBlocking, params.sessionId]);

  const formatEndTime = () => {
    if (!params.endTime) return "Unknown";
    const date = new Date(params.endTime);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const joinLink = buildJoinLink(params.sessionId ?? "");

  const onConfirmUsername = useCallback(async () => {
    const trimmed = usernameDraft.trim();
    if (!trimmed || !params.sessionId || !params.endTime) return;
    const finalName = trimmed.slice(0, 24);
    setChatUsername(finalName);
    setUsernameDraft(finalName);
    setShowUsernameModal(false);
    const current = await getActiveSession();
    await saveActiveSession({
      sessionId: params.sessionId,
      endTime: params.endTime,
      isHost: false,
      unblockLimit,
      unblockDurationMinutes: durationMin,
      unblocksRemaining: current?.unblocksRemaining ?? unblockLimit,
      unblockExpiresAt: current?.unblockExpiresAt,
      chatUserId: current?.chatUserId ?? (chatUserId || undefined),
      chatUsername: finalName,
    });
  }, [
    usernameDraft,
    params.sessionId,
    params.endTime,
    unblockLimit,
    durationMin,
    chatUserId,
  ]);

  const onPagerEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index <= 0) {
      setActiveTab("announcements");
      return;
    }
    if (index === 1) {
      setActiveTab("home");
      return;
    }
    if (!chatUsername.trim()) {
      setShowUsernameModal(true);
      setActiveTab("home");
      return;
    }
    setActiveTab("chat");
  };

  if (sessionEnded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.lockIcon}>✓</Text>
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.title}>Session ended</Text>
            <View style={styles.divider} />
          </View>
          <Text style={styles.sessionEndedSubtext}>
            You're free! Blocking has been turned off.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.returnHomeButton,
              pressed && styles.shareButtonPressed,
            ]}
            onPress={() => {
              clearActiveSession();
              router.replace("/");
            }}
          >
            <Text style={styles.returnHomeButtonText}>Return home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerEnd}
        style={styles.pager}
      >
        <View style={[styles.page, { width }]}>
          {params.sessionId && (
            <SessionAnnouncements sessionId={params.sessionId} isHost={false} />
          )}
        </View>
        <View style={[styles.page, { width }]}>
      <View style={styles.container}>
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        {/* Main Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Your phone has been locked</Text>
          <View style={styles.divider} />
        </View>

        {/* Time Card */}
        <View style={styles.timeCard}>
          <Text style={styles.timeLabel}>You will be freed at</Text>
          <Text style={styles.timeValue}>{formatEndTime()}</Text>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {isUnblocked ? "Apps unblocked" : "Session Active"}
          </Text>
        </View>

        {isUnblocked && unblockExpiresAt && (
          <View style={styles.breakTimerCard}>
            <Text style={styles.breakTimerLabel}>Apps unblocked</Text>
            <Text style={styles.breakTimerValue}>
              {breakSecondsRemaining != null
                ? `${Math.floor(breakSecondsRemaining / 60)}:${(breakSecondsRemaining % 60).toString().padStart(2, "0")}`
                : "0:00"}
            </Text>
            <Text style={styles.breakTimerSubtext}>until reblocking</Text>
          </View>
        )}

        {canBlock && unblockLimit > 0 && !isUnblocked && (
          <Pressable
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.shareButtonPressed,
              unblocksRemaining <= 0 && { opacity: 0.5 },
            ]}
            onPress={onUnblock}
            disabled={unblocksRemaining <= 0}
          >
            <Text style={styles.shareButtonText}>
              Unblock for {unblockDurationMinutes} min
            </Text>
            <Text style={styles.shareButtonSubtext}>
              {unblocksRemaining} {unblocksRemaining === 1 ? "break" : "breaks"} left
            </Text>
          </Pressable>
        )}

        {/* Share session QR code */}
        {params.sessionId && (
          <Pressable
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.shareButtonPressed,
            ]}
            onPress={() => setShowQRModal(true)}
          >
            <Text style={styles.shareButtonText}>Share with friends</Text>
            <Text style={styles.shareButtonSubtext}>Show QR code</Text>
          </Pressable>
        )}

      </View>
        </View>
        <View style={[styles.page, { width }]}>
          {params.sessionId && chatUserId !== "" && chatUsername !== "" ? (
            <SessionChat
              sessionId={params.sessionId}
              userId={chatUserId}
              username={chatUsername}
              visible
              embedded
            />
          ) : (
            <View style={styles.emptyTabContainer}>
              <Text style={styles.emptyTabText}>Set a username to use chat.</Text>
              <Pressable
                style={styles.shareButton}
                onPress={() => setShowUsernameModal(true)}
              >
                <Text style={styles.shareButtonText}>Choose Username</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomTabs, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={styles.bottomTabButton}
          onPress={() => setActiveTab("announcements")}
        >
          <Ionicons
            name={
              activeTab === "announcements" ? "megaphone" : "megaphone-outline"
            }
            size={22}
            color={activeTab === "announcements" ? "#fff" : "#666"}
          />
          <Text
            style={[
              styles.bottomTabText,
              activeTab === "announcements" && styles.bottomTabTextActive,
            ]}
          >
            Alerts
          </Text>
        </Pressable>
        <Pressable style={styles.bottomTabButton} onPress={() => setActiveTab("home")}>
          <Ionicons
            name={activeTab === "home" ? "home" : "home-outline"}
            size={22}
            color={activeTab === "home" ? "#fff" : "#666"}
          />
          <Text
            style={[
              styles.bottomTabText,
              activeTab === "home" && styles.bottomTabTextActive,
            ]}
          >
            Home
          </Text>
        </Pressable>
        <Pressable
          style={styles.bottomTabButton}
          onPress={() => {
            if (!chatUsername.trim()) {
              setShowUsernameModal(true);
              return;
            }
            setActiveTab("chat");
          }}
        >
          <Ionicons
            name={activeTab === "chat" ? "chatbubble" : "chatbubble-outline"}
            size={22}
            color={activeTab === "chat" ? "#fff" : "#666"}
          />
          <Text
            style={[
              styles.bottomTabText,
              activeTab === "chat" && styles.bottomTabTextActive,
            ]}
          >
            Chat
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showUsernameModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose a username</Text>
            <Text style={styles.modalHint}>
              This name is locked for this session and cannot be changed.
            </Text>
            <TextInput
              value={usernameDraft}
              onChangeText={setUsernameDraft}
              placeholder="Username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={24}
              style={{
                width: "100%",
                backgroundColor: "#0f0f0f",
                color: "#fff",
                borderWidth: 1,
                borderColor: "#333",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginTop: 12,
                marginBottom: 14,
              }}
            />
            <Pressable
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.shareButtonPressed,
                usernameDraft.trim().length === 0 && { opacity: 0.5 },
              ]}
              disabled={usernameDraft.trim().length === 0}
              onPress={onConfirmUsername}
            >
              <Text style={styles.modalCloseText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowQRModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan to join</Text>
            <View style={styles.modalQRWrap}>
              <QRCode
                value={joinLink}
                size={200}
                backgroundColor="#ffffff"
                color="#000000"
              />
            </View>
            <Text style={styles.modalHint}>
              Others can scan this to join your session
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.shareButtonPressed,
              ]}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
