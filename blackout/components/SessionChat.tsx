import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  Keyboard,
} from "react-native";
import { ChatMessage, sendMessage, subscribeToMessages } from "@/lib/chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  sessionId: string;
  userId: string;
  username: string;
  visible: boolean;
  onClose?: () => void;
  embedded?: boolean;
};

const USER_COLORS = [
  "#00e5ff",
  "#ff00e5",
  "#4ade80",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function shortName(userId: string): string {
  return userId.slice(-4).toUpperCase();
}

function isHostUsername(username: string): boolean {
  return username.trim().toLowerCase() === "host";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SessionChat({
  sessionId,
  userId,
  username,
  visible,
  onClose,
  embedded = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const didInitialScroll = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      translateX.setValue(0);
    }
  }, [visible, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const mostlyHorizontal =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 8;
        const isRightSwipe = gestureState.dx > 0;
        return mostlyHorizontal && isRightSwipe;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(Math.max(0, gestureState.dx));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 48 || gestureState.vx > 0.35) {
          onClose?.();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 80,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (!visible || !sessionId) return;
    didInitialScroll.current = false;
    const unsub = subscribeToMessages(sessionId, setMessages);
    return unsub;
  }, [visible, sessionId]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: didInitialScroll.current });
      didInitialScroll.current = true;
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    Keyboard.dismiss();
    try {
      await sendMessage(sessionId, userId, username, text);
    } finally {
      setSending(false);
    }
  }, [draft, sending, sessionId, userId, username]);

  if (!visible) return null;

  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const isOwn = item.userId === userId;
    const isHost = isHostUsername(item.username ?? "");
    const color = isHost ? "#f5c542" : colorForUser(item.userId);
    const prev = index > 0 ? messages[index - 1] : null;
    const next = index < messages.length - 1 ? messages[index + 1] : null;
    const sameAsPrev = prev?.userId === item.userId;
    const sameAsNext = next?.userId === item.userId;

    return (
      <View
        style={[
          s.messageBubble,
          isOwn ? s.ownBubble : s.otherBubble,
          isOwn && { borderColor: "rgba(255,255,255,0.08)" },
          !isOwn && { borderColor: `${color}22` },
          sameAsPrev && { marginTop: 2 },
          sameAsNext && { marginBottom: 2 },
          isOwn && sameAsPrev && { borderTopRightRadius: 12 },
          isOwn && sameAsNext && { borderBottomRightRadius: 12 },
          !isOwn && sameAsPrev && { borderTopLeftRadius: 12 },
          !isOwn && sameAsNext && { borderBottomLeftRadius: 12 },
        ]}
      >
        {!isOwn && !sameAsPrev && (
          <Text style={[s.senderName, { color }]}>
            {item.username || shortName(item.userId)}
          </Text>
        )}
        <Text style={s.messageText}>{item.text}</Text>
        {!sameAsNext && <Text style={s.messageTime}>{formatTime(item.createdAt)}</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <Animated.View style={[s.content, { transform: [{ translateX }] }]}>
      {!embedded && <View style={s.swipeEdge} {...panResponder.panHandlers} />}
      {!embedded && (
        <View style={[s.header, { paddingTop: Math.max(insets.top, 8) + 16 }]}>
          <View>
            <Text style={s.headerTitle}>Session Chat</Text>
            <Text style={s.selfName}>@{username}</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
          >
            <Text style={s.closeBtnText}>✕</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={s.listContent}
        style={s.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyText}>No messages yet</Text>
            <Text style={s.emptySubtext}>
              Say something to your group
            </Text>
          </View>
        }
      />

      <View
        style={[s.inputRow, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}
      >
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message..."
          placeholderTextColor="#555"
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!sending}
          multiline
        />
        <Pressable
          onPress={handleSend}
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
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
  swipeEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  selfName: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  emptyText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtext: {
    color: "#333",
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  ownBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#111",
    borderTopRightRadius: 4,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    color: "#444",
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
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
  sendBtnText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
});
