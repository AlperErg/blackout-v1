import { Archivo_900Black } from "@expo-google-fonts/archivo/900Black";
import { useFonts } from "@expo-google-fonts/archivo/useFonts";
import { Slot, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import {
  getActiveSession,
  isSessionStillActive,
  clearActiveSession,
} from "@/lib/activeSession";
import { extractSessionIdFromScan } from "@/lib/joinLink";
import { joinSession } from "@/lib/sessions";

SplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  splashContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  splashLogo: {
    width: 200,
    height: 200,
  },
  splashSpinner: {
    transform: [{ scale: 1.2 }],
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Archivo_900Black });
  const router = useRouter();
  const initialUrlHandledRef = useRef(false);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Deep link: when app is opened via blackout://join/SESSION_ID or https://blackout.codes/join/SESSION_ID
  // getInitialURL() can be null on cold start (e.g. Android); capture early and retry so we don't stay on splash/index spinner
  useEffect(() => {
    if (!fontsLoaded || !router) return;

    const handleJoinUrl = async (url: string | null) => {
      if (!url || initialUrlHandledRef.current) return;
      const sessionId = extractSessionIdFromScan(url);
      if (!sessionId) return;
      initialUrlHandledRef.current = true;
      try {
        const result = await joinSession(sessionId);
        if (result.success && result.session) {
          router.replace({
            pathname: "/session",
            params: {
              sessionId,
              endTime: result.session.endTime.toISOString(),
              unblockLimit: String(result.session.unblockLimit ?? 0),
              unblockDurationMinutes: String(result.session.unblockDurationMinutes ?? 5),
            },
          });
        } else {
          initialUrlHandledRef.current = false;
        }
      } catch {
        initialUrlHandledRef.current = false;
      }
    };

    const tryInitialUrl = () => Linking.getInitialURL().then(handleJoinUrl);

    tryInitialUrl();

    const t1 = setTimeout(tryInitialUrl, 400);
    const t2 = setTimeout(tryInitialUrl, 1000);

    const sub = Linking.addEventListener("url", ({ url }) => {
      handleJoinUrl(url);
    });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      sub.remove();
    };
  }, [fontsLoaded, router]);

  useEffect(() => {
    const openChatFromActiveSession = async () => {
      const stored = await getActiveSession();
      if (!stored) return;
      if (!isSessionStillActive(stored)) {
        await clearActiveSession();
        return;
      }

      if (stored.isHost) {
        router.replace({
          pathname: "/qrpage",
          params: {
            sessionId: stored.sessionId,
            endTime: stored.endTime,
            maxParticipants: stored.maxParticipants ?? "",
            openAnnouncements: "1",
          },
        });
      } else {
        router.replace({
          pathname: "/session",
          params: {
            sessionId: stored.sessionId,
            endTime: stored.endTime,
            unblockLimit: String(stored.unblockLimit ?? 0),
            unblockDurationMinutes: String(stored.unblockDurationMinutes ?? 5),
            openAnnouncements: "1",
          },
        });
      }
    };

    const listener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const type = response.notification.request.content.data?.type;
        if (type === "host-announcement") {
          await openChatFromActiveSession();
        }
      }
    );

    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      const type = last?.notification.request.content.data?.type;
      if (type === "host-announcement") {
        await openChatFromActiveSession();
      }
    })();

    return () => listener.remove();
  }, [router]);

  if (!fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={styles.splashLogo}
          resizeMode="contain"
          accessibilityLabel="Blackout logo"
        />
        <ActivityIndicator
          size="large"
          color="#ffffff"
          style={styles.splashSpinner}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}
