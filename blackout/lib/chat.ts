import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: Date;
};

const MESSAGES_LIMIT = 200;

function messagesRef(sessionId: string) {
  return collection(db, "sessions", sessionId, "messages");
}

export function generateChatUserId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${ts}-${rand}`;
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  username: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || !sessionId || !userId || !username.trim()) return;

  await addDoc(messagesRef(sessionId), {
    userId,
    username: username.trim().slice(0, 24),
    text: trimmed.slice(0, 500),
    createdAt: serverTimestamp(),
  });
}

export function subscribeToMessages(
  sessionId: string,
  onMessages: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    messagesRef(sessionId),
    orderBy("createdAt", "asc"),
    limit(MESSAGES_LIMIT)
  );

  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const ts = data.createdAt as Timestamp | null;
      return {
        id: doc.id,
        userId: data.userId ?? "",
        username: data.username ?? "",
        text: data.text ?? "",
        createdAt: ts?.toDate?.() ?? new Date(),
      };
    });
    onMessages(msgs);
  });
}
