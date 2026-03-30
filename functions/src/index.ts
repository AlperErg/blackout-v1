import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const COLLECTION = "breakTimers";

/**
 * Runs every minute. Finds break timers that have expired and sends
 * a silent push to re-enable shielding on the user's device.
 */
export const processBreakTimers = onSchedule("every 1 minutes", async () => {
  const db = getFirestore();
  const now = Timestamp.now();
  const snap = await db
    .collection(COLLECTION)
    .where("reenableAt", "<=", now)
    .get();

  if (snap.empty) return;

  const pushMessages: Array<{
    to: string;
    data: Record<string, string>;
    priority: string;
    _contentAvailable: boolean;
  }> = [];
  const deleteOps: Array<Promise<FirebaseFirestore.WriteResult>> = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const token = data.pushToken;
    if (typeof token === "string" && token.startsWith("ExponentPushToken")) {
      pushMessages.push({
        to: token,
        data: { type: "break-relock" },
        priority: "high",
        _contentAvailable: true,
      });
    }
    deleteOps.push(doc.ref.delete());
  }

  if (pushMessages.length > 0) {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushMessages),
    });
  }

  await Promise.all(deleteOps);
});
