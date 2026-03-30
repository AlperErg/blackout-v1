import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let hasRequestedPermissions = false;

const PUSH_TOKENS_SUBCOLLECTION = "pushTokens";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  if (hasRequestedPermissions) return true;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    hasRequestedPermissions = true;
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  const granted =
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  hasRequestedPermissions = granted;
  return granted;
}

/** Get current Expo push token for this device (requires EAS projectId in app.json). */
export async function getExpoPushTokenAsync(): Promise<string | null> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
  const granted = await ensureNotificationPermissions();
  if (!granted) return null;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId as string | undefined,
    });
    return tokenData?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Register this device's push token for a session so the host can send live push notifications.
 * Call when the user is on the session screen (as host or joiner).
 */
export async function registerSessionPushToken(
  sessionId: string,
  userId: string
): Promise<void> {
  if (!sessionId || !userId) return;
  const token = await getExpoPushTokenAsync();
  if (!token) return;
  const safeUserId = userId.replace(/\//g, "_");
  const ref = doc(db, "sessions", sessionId, PUSH_TOKENS_SUBCOLLECTION, safeUserId);
  await setDoc(ref, {
    expoPushToken: token,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Send a push notification to all participants in a session (excluding host).
 * Call from the host's app after posting an announcement so joiners get live push even when app is closed.
 */
export async function sendPushToSessionParticipants(
  sessionId: string,
  title: string,
  body: string
): Promise<void> {
  const ref = collection(db, "sessions", sessionId, PUSH_TOKENS_SUBCOLLECTION);
  const snap = await getDocs(ref);
  const messages: Array<{
    to: string;
    title: string;
    body: string;
    data: Record<string, string>;
    sound: "default";
  }> = [];
  snap.docs.forEach((d) => {
    const uid = d.id;
    if (uid === "host") return;
    const token = d.data()?.expoPushToken;
    if (typeof token === "string" && token.startsWith("ExponentPushToken")) {
      messages.push({
        to: token,
        title,
        body: body.slice(0, 200),
        data: { sessionId, type: "host-announcement" },
        sound: "default",
      });
    }
  });
  if (messages.length === 0) return;
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
  if (!response.ok) {
    const text = await response.text();
    console.warn("[notifications] Expo push send failed:", response.status, text);
  }
}

export async function notifyHostAnnouncement(
  sessionId: string,
  body: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Host announcement",
      body,
      data: { sessionId, type: "host-announcement" },
      sound: "default",
    },
    trigger: null,
  });
}
