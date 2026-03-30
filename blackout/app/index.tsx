import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getActiveSession,
  isSessionStillActive,
  clearActiveSession,
} from "@/lib/activeSession";
import {
  cancelBreakTimer,
  disableShielding,
  isScreenTimeModuleLoaded,
  requestScreenTimeAuthorization,
} from "expo-family-controls";
import { cancelBreakPush } from "@/lib/breakTimer";
import {
  isAndroidBlockerAvailable,
  hasUsageAccess,
  stopBlocking as stopAndroidBlocking,
} from "expo-android-blocker";
import { isOnboardingComplete } from "@/lib/onboarding";
import { styles } from "./index.styles";

export default function Index() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [screenTimeBlocked, setScreenTimeBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const complete = await isOnboardingComplete();
      if (cancelled) return;
      if (!complete) {
        setChecked(true);
        router.replace("/onboarding");
        return;
      }
      if (Platform.OS === "ios" && isScreenTimeModuleLoaded()) {
        const status = await requestScreenTimeAuthorization();
        if (cancelled) return;
        if (status !== "authorized") {
          setScreenTimeBlocked(true);
          setChecked(true);
          return;
        }
      }
      const session = await getActiveSession();
      if (cancelled) return;
      if (session && isSessionStillActive(session)) {
        setChecked(true);
        if (session.isHost) {
          router.replace({
            pathname: "/qrpage",
            params: {
              sessionId: session.sessionId,
              endTime: session.endTime,
              maxParticipants: session.maxParticipants ?? "",
            },
          });
        } else {
          router.replace({
            pathname: "/session",
            params: {
              sessionId: session.sessionId,
              endTime: session.endTime,
              unblockLimit: String(session.unblockLimit ?? 0),
              unblockDurationMinutes: String(session.unblockDurationMinutes ?? 5),
            },
          });
        }
        return;
      }
      if (session && !isSessionStillActive(session)) {
        await clearActiveSession();
        if (Platform.OS === "ios") {
          cancelBreakTimer().catch(() => {});
          cancelBreakPush(session.sessionId).catch(() => {});
          disableShielding().catch(() => {});
        } else if (Platform.OS === "android" && isAndroidBlockerAvailable()) {
          try { stopAndroidBlocking(); } catch { /* ignore */ }
        }
      }
      setChecked(true);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (screenTimeBlocked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            {
              justifyContent: "center",
              paddingHorizontal: 24,
              gap: 24,
            },
          ]}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Screen Time required
          </Text>
          <Text
            style={{
              color: "#888",
              fontSize: 16,
              lineHeight: 24,
              textAlign: "center",
            }}
          >
            Blackout requires Screen Time permission to work. Please grant it in
            Settings and return.
          </Text>
          <Pressable
            onPress={() => Linking.openURL("app-settings:")}
            style={({ pressed }) => ({
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12,
              backgroundColor: pressed ? "#222" : "#333",
              alignSelf: "center",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Open Settings
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Blackout</Text>
          <Text style={styles.subtitle}>Phone-free with friends.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/qrscanner")}
          >
            <Text style={styles.primaryButtonText}>Scan</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/sessionmaker")}
          >
            <Text style={styles.secondaryButtonText}>Create</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
