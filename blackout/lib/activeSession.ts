import AsyncStorage from "@react-native-async-storage/async-storage";

const ACTIVE_SESSION_KEY = "@Blackout/activeSession";

export type ActiveSession = {
  sessionId: string;
  endTime: string; // ISO string
  isHost: boolean;
  maxParticipants?: string;
  unblockLimit?: number;
  unblockDurationMinutes?: number;
  unblocksRemaining?: number;
  unblockExpiresAt?: string; // ISO string - when current unblock period ends
  chatUserId?: string;
  chatUsername?: string;
};

export async function saveActiveSession(session: ActiveSession): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ActiveSession;
    if (!session?.sessionId || !session?.endTime) return null;
    return session;
  } catch {
    return null;
  }
}

export async function clearActiveSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function isSessionStillActive(session: ActiveSession): boolean {
  const endDate = new Date(session.endTime);
  return !Number.isNaN(endDate.getTime()) && new Date() < endDate;
}
