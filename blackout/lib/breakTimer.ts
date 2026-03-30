import { doc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { getExpoPushTokenAsync } from "./notifications";

const COLLECTION = "breakTimers";

/**
 * Write a break timer doc so the Cloud Function can send a silent push
 * when the break expires, waking the app to re-enable shielding.
 */
export async function scheduleBreakPush(
  sessionId: string,
  durationSec: number
): Promise<void> {
  const token = await getExpoPushTokenAsync();
  if (!token) return;
  const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, "_");
  const docId = `${sessionId}_${safeToken}`;
  const reenableAt = Timestamp.fromMillis(Date.now() + durationSec * 1000);
  await setDoc(doc(db, COLLECTION, docId), {
    pushToken: token,
    reenableAt,
    sessionId,
    createdAt: Timestamp.now(),
  });
}

/**
 * Cancel a pending break push (e.g. session ended or break ended naturally in foreground).
 */
export async function cancelBreakPush(
  sessionId: string
): Promise<void> {
  const token = await getExpoPushTokenAsync();
  if (!token) return;
  const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, "_");
  const docId = `${sessionId}_${safeToken}`;
  await deleteDoc(doc(db, COLLECTION, docId)).catch(() => {});
}
