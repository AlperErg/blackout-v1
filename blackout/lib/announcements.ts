import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type SessionAnnouncement = {
  id: string;
  text: string;
  createdAt: Date;
  author: string;
};

const ANNOUNCEMENTS_LIMIT = 200;

function announcementsRef(sessionId: string) {
  return collection(db, "sessions", sessionId, "announcements");
}

export async function sendAnnouncement(
  sessionId: string,
  text: string,
  author = "Host"
): Promise<void> {
  const trimmed = text.trim();
  if (!sessionId || !trimmed) return;

  await addDoc(announcementsRef(sessionId), {
    text: trimmed.slice(0, 500),
    author,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToAnnouncements(
  sessionId: string,
  onAnnouncements: (announcements: SessionAnnouncement[]) => void
): () => void {
  const q = query(
    announcementsRef(sessionId),
    orderBy("createdAt", "asc"),
    limit(ANNOUNCEMENTS_LIMIT)
  );
  return onSnapshot(q, (snapshot) => {
    const items: SessionAnnouncement[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const ts = data.createdAt as Timestamp | null;
      return {
        id: doc.id,
        text: data.text ?? "",
        author: data.author ?? "Host",
        createdAt: ts?.toDate?.() ?? new Date(),
      };
    });
    onAnnouncements(items);
  });
}
