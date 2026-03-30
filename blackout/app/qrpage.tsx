import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import {
  saveActiveSession,
  clearActiveSession,
  getActiveSession,
} from "@/lib/activeSession";
import { generateChatUserId } from "@/lib/chat";
import { deleteSessionWithData } from "@/lib/sessions";
import { buildJoinLink } from "@/lib/joinLink";
import { registerSessionPushToken } from "@/lib/notifications";
import SessionChat from "@/components/SessionChat";
import SessionAnnouncements from "@/components/SessionAnnouncements";
import styles from "./qrpage.styles";

export default function QRMaker() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    sessionId?: string;
    endTime?: string;
    maxParticipants?: string;
    unblockLimit?: string;
    unblockDurationMinutes?: string;
    openAnnouncements?: string;
  }>();
  const sessionId = params.sessionId;
  const endTime = params.endTime;
  const maxParticipants = params.maxParticipants;
  const unblockLimit = parseInt(params.unblockLimit ?? "0", 10) || 0;
  const unblockDurationMinutes = parseInt(params.unblockDurationMinutes ?? "5", 10) || 5;
  const [sessionEnded, setSessionEnded] = useState(false);
  const [chatUserId, setChatUserId] = useState("");
  const [chatUsername, setChatUsername] = useState("Host");
  const [isLeavingSession, setIsLeavingSession] = useState(false);
  const [activeTab, setActiveTab] = useState<"announcements" | "home" | "chat">(
    "home"
  );
  const pagerRef = useRef<ScrollView>(null);
  const hasHandledExpiryRef = useRef(false);

  useEffect(() => {
    if (!sessionId || !endTime) return;
    (async () => {
      const stored = await getActiveSession();
      let chatId = stored?.chatUserId;
      const username = stored?.chatUsername?.trim() || "Host";
      if (!chatId) {
        chatId = generateChatUserId();
      }
      setChatUserId(chatId);
      setChatUsername(username);
      await saveActiveSession({
        sessionId,
        endTime,
        isHost: true,
        maxParticipants,
        chatUserId: chatId,
        chatUsername: username,
      });
    })();
  }, [sessionId, endTime, maxParticipants]);

  useEffect(() => {
    if (!sessionId) return;
    registerSessionPushToken(sessionId, "host").catch(() => {});
  }, [sessionId]);

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

  const onPagerEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index <= 0) setActiveTab("announcements");
    else if (index === 1) setActiveTab("home");
    else setActiveTab("chat");
  };

  useEffect(() => {
    if (!endTime || !sessionId) return;
    const endDate = new Date(endTime);
    if (Number.isNaN(endDate.getTime())) return;

    const check = () => {
      if (new Date() < endDate || hasHandledExpiryRef.current) return;
      hasHandledExpiryRef.current = true;
      (async () => {
        await deleteSessionWithData(sessionId);
        await clearActiveSession();
        setSessionEnded(true);
      })();
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [endTime, sessionId]);

  const onExitSession = () => {
    Alert.alert(
      "Leave session?",
      "Are you sure you want to leave? You can create a new session with different settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            if (!sessionId) {
              clearActiveSession();
              router.replace("/");
              return;
            }
            setIsLeavingSession(true);
            const deleted = await deleteSessionWithData(sessionId);
            setIsLeavingSession(false);
            if (!deleted) {
              Alert.alert(
                "Couldn't end session",
                "Failed to delete this session from Firebase. Please check your connection and try again."
              );
              return;
            }
            clearActiveSession();
            router.replace("/");
          },
        },
      ]
    );
  };

  const formatEndTime = () => {
    if (!endTime) return "Unknown";
    const date = new Date(endTime);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const joinLink = buildJoinLink(sessionId ?? "");

  if (sessionEnded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={[styles.qrCard, { alignItems: "center" }]}>
            <Text style={styles.sessionEndedIcon}>✓</Text>
            <Text style={styles.sessionEndedTitle}>Session ended</Text>
            <Text style={styles.sessionEndedSubtext}>
              The session is over. Participants are free.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.returnHomeButton,
                pressed && styles.returnHomeButtonPressed,
              ]}
              onPress={() => {
                clearActiveSession();
                router.replace("/");
              }}
            >
              <Text style={styles.returnHomeButtonText}>Return home</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
    <View style={styles.root}>
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
          {sessionId && (
            <SessionAnnouncements
              sessionId={sessionId}
              isHost
              hostName={chatUsername}
            />
          )}
        </View>
        <View style={[styles.page, { width }]}>
      <View style={styles.homePage}>
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.title}>Scan to join</Text>
          <Pressable
            disabled={isLeavingSession}
            onPress={onExitSession}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 16,
              opacity: isLeavingSession ? 0.5 : pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: "#e57373", fontSize: 16, fontWeight: "600" }}>
              {isLeavingSession ? "Leaving..." : "Exit"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.qrCard}>
        <View style={styles.qrContainer}>
          <QRCode
            value={joinLink}
            size={240}
            backgroundColor="#ffffff"
            color="#000000"
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max participants: </Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {maxParticipants === "0" ? "Unlimited" : maxParticipants}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Time: </Text>
            <Text style={styles.infoValue}>{formatEndTime()}</Text>
          </View>
          {unblockLimit > 0 && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Unblock breaks: </Text>
                <Text style={styles.infoValue}>
                  {unblockLimit} × {unblockDurationMinutes} min
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instruction}>
          Ask participants to open the app and scan this QR code to join your
          session
        </Text>
      </View>
      </View>
        </View>
        <View style={[styles.page, { width }]}>
          {sessionId && chatUserId !== "" && (
            <SessionChat
              sessionId={sessionId}
              userId={chatUserId}
              username={chatUsername}
              visible
              embedded
            />
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomTabs, { paddingBottom: insets.bottom }]}>
        <Pressable style={styles.bottomTabButton} onPress={() => setActiveTab("announcements")}>
          <Ionicons
            name={activeTab === "announcements" ? "megaphone" : "megaphone-outline"}
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
        <Pressable style={styles.bottomTabButton} onPress={() => setActiveTab("chat")}>
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
    </View>
    </SafeAreaView>
  );
}
