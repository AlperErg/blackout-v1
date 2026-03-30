import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  sendAnnouncement,
  SessionAnnouncement,
  subscribeToAnnouncements,
} from "@/lib/announcements";
import { sendPushToSessionParticipants } from "@/lib/notifications";

type Props = {
  sessionId: string;
  isHost: boolean;
  hostName?: string;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SessionAnnouncements({
  sessionId,
  isHost,
  hostName = "Host",
}: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SessionAnnouncement[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    return subscribeToAnnouncements(sessionId, setItems);
  }, [sessionId]);

  const onSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending || !isHost) return;
    setSending(true);
    setDraft("");
    try {
      await sendAnnouncement(sessionId, text, hostName);
      await sendPushToSessionParticipants(
        sessionId,
        "Host announcement",
        text.slice(0, 200)
      );
    } finally {
      setSending(false);
    }
  }, [draft, sending, isHost, sessionId, hostName]);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <View style={[s.header, { paddingTop: Math.max(insets.top, 8) + 8 }]}>
        <Text style={s.headerTitle}>Host Announcements</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        style={s.list}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <View style={s.announcementCard}>
            <Text style={s.announcementText}>{item.text}</Text>
            <Text style={s.announcementMeta}>
              {item.author} · {formatTime(item.createdAt)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyText}>No announcements yet</Text>
          </View>
        }
      />

      {isHost && (
        <View
          style={[s.inputRow, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}
        >
          <TextInput
            style={s.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Write an announcement..."
            placeholderTextColor="#555"
            maxLength={500}
            editable={!sending}
            multiline
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || sending}
            style={({ pressed }) => [
              s.sendBtn,
              (!draft.trim() || sending) && { opacity: 0.3 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={s.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  list: { flex: 1 },
  listContent: { padding: 14, gap: 8, flexGrow: 1 },
  announcementCard: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 14,
    padding: 12,
  },
  announcementText: { color: "#fff", fontSize: 15, lineHeight: 21 },
  announcementMeta: { color: "#666", marginTop: 8, fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    backgroundColor: "#000",
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#222",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendBtnText: { color: "#000", fontSize: 18, fontWeight: "700" },
});
