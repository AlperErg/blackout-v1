import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  increment,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

const SESSIONS_COLLECTION = "sessions";

/** Sentinel value for unlimited participants (avoids Firestore/JS quirks with 0) */
const UNLIMITED = 999999;

export type SessionData = {
  sessionId: string;
  endTime: Date;
  maxParticipants: number;
  status: "active" | "ended";
  createdAt: ReturnType<typeof serverTimestamp>;
  joined: number;
  unblockLimit: number;
  unblockDurationMinutes: number;
};

function toInt(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 1;
  return Math.floor(n);
}

export async function createSession(
  endTime: Date,
  maxParticipants: number,
  unblockLimit: number,
  unblockDurationMinutes: number,
): Promise<string> {
  // 0 = unlimited (stored as UNLIMITED); otherwise clamp to 1–999
  const raw = Math.floor(Number(maxParticipants));
  const max = raw === 0 ? UNLIMITED : Math.max(1, Math.min(999, raw));
  const unblocks = Math.max(0, Math.min(20, Math.floor(Number(unblockLimit))));
  const duration =
    unblockDurationMinutes === 10 ? 10 : Math.min(10, Math.max(5, Math.floor(Number(unblockDurationMinutes))));
  const ref = doc(collection(db, SESSIONS_COLLECTION));
  const sessionId = ref.id;

  const payload = {
    sessionId,
    endTime: Timestamp.fromDate(endTime),
    maxParticipants: max,
    participantLimit: max, // backup field in case maxParticipants is stripped by rules
    status: "active",
    createdAt: serverTimestamp(),
    joined: 0,
    unblockLimit: unblocks,
    unblockDurationMinutes: duration,
  };

  await setDoc(ref, payload);

  // Verify the write persisted correctly (catches Firestore rules stripping fields)
  const verify = await getDoc(ref);
  const data = verify.data();
  const storedRaw = data?.participantLimit ?? data?.maxParticipants;
  const storedMax =
    storedRaw === 0 || storedRaw === "0" ? UNLIMITED : toInt(storedRaw ?? 0);
  const effectiveStored = storedMax >= UNLIMITED ? UNLIMITED : storedMax;
  if (effectiveStored !== max) {
    throw new Error(
      `Session created but participant limit may not have saved correctly (expected ${max}, got ${effectiveStored}). Check Firestore security rules allow writing maxParticipants and participantLimit.`
    );
  }

  return sessionId;
}

export async function joinSession(sessionId: string): Promise<{
  success: boolean;
  session?: SessionData & { id: string };
  error?: string;
}> {
  const ref = doc(db, SESSIONS_COLLECTION, sessionId);

  try {
    let sessionResult: SessionData & { id: string } | null = null;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        throw new Error("Session not found");
      }

      const data = snap.data();
      if (data.status !== "active") {
        throw new Error("Session has ended");
      }

      const currentJoined = Number(data.joined ?? 0);
      const rawMax = data.participantLimit ?? data.maxParticipants;
      const maxParticipants =
        rawMax === 0 || rawMax === "0" || Number(rawMax) >= UNLIMITED
          ? UNLIMITED
          : toInt(rawMax ?? 1);

      if (maxParticipants < UNLIMITED && currentJoined >= maxParticipants) {
        throw new Error("Session is full");
      }

      transaction.update(ref, { joined: increment(1) });

      const unblockLimit = Math.max(0, toInt(data.unblockLimit ?? 0));
      const unblockDurationMinutes = Math.min(
        10,
        Math.max(5, toInt(data.unblockDurationMinutes ?? 5))
      );

      sessionResult = {
        id: snap.id,
        sessionId: (data.sessionId ?? snap.id) as string,
        endTime: data.endTime?.toDate?.() ?? new Date(),
        maxParticipants,
        status: data.status as SessionData["status"],
        createdAt: data.createdAt,
        joined: currentJoined + 1,
        unblockLimit,
        unblockDurationMinutes,
      };
    });

    if (!sessionResult) {
      return { success: false, error: "Failed to join session" };
    }

    return { success: true, session: sessionResult };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to join session";
    if (
      message === "Session not found" ||
      message === "Session has ended" ||
      message === "Session is full"
    ) {
      return { success: false, error: message };
    }
    console.error("Error joining session:", e);
    return { success: false, error: "Failed to join session" };
  }
}

async function deleteSubcollectionDocs(
  sessionId: string,
  subcollection: "messages" | "announcements",
  batchSize = 200
): Promise<void> {
  while (true) {
    const ref = collection(db, SESSIONS_COLLECTION, sessionId, subcollection);
    const snap = await getDocs(query(ref, limit(batchSize)));
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    if (snap.size < batchSize) return;
  }
}

export async function deleteSessionWithData(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  try {
    await deleteSubcollectionDocs(sessionId, "messages");
    await deleteSubcollectionDocs(sessionId, "announcements");
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
    return true;
  } catch (e) {
    console.error("Failed to delete session tree:", e);
    return false;
  }
}
