import { useMemo } from "react";
import { Platform, Pressable, ScrollView, Text, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function ScreenTimeSetup() {
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  const items = useMemo(
    () => [
      {
        title: "Option A: App Limits",
        steps: [
          "Open Settings \u2192 Screen Time",
          "Tap App Limits \u2192 Add Limit",
          "Choose the apps you want blocked during Blackout sessions",
          "Set a small limit (e.g. 1 minute) and enable Block at End of Limit",
        ],
      },
      {
        title: "Option B: Focus mode",
        steps: [
          "Open Settings \u2192 Focus",
          "Create a Focus (e.g. \u201CBlackout\u201D)",
          "Allow only the apps you need (Phone, Messages, etc.)",
          "Turn the Focus on while a session is active",
        ],
      },
      {
        title: "Option C: Downtime",
        steps: [
          "Open Settings \u2192 Screen Time \u2192 Downtime",
          "Schedule Downtime during your session windows",
          "Pick Allowed Apps (what you can still use)",
        ],
      },
    ],
    []
  );

  const openSettings = () => {
    if (!isIOS) return;
    Linking.openURL("app-settings:");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          marginLeft: 20,
          marginTop: 8,
          marginBottom: 8,
          paddingVertical: 10,
          paddingHorizontal: 4,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>
          Done
        </Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
          Screen Time setup
        </Text>

        <Text style={{ color: "#bbb", fontSize: 15, lineHeight: 20 }}>
          Blackout blocks all apps during sessions. You can also use
          App Limits, Focus, or Downtime in Settings for additional control.
        </Text>

        {isIOS && (
          <View style={{ padding: 14, backgroundColor: "#111", borderRadius: 12 }}>
            <Text style={{ color: "#fff", fontSize: 16 }}>
              Blackout uses Screen Time to block all apps during sessions.
            </Text>
          </View>
        )}

        {!isIOS && (
          <View style={{ padding: 12, backgroundColor: "#111", borderRadius: 12 }}>
            <Text style={{ color: "#fff" }}>
              On Android, Blackout blocks apps using a foreground service. Grant
              Usage Access and "Display over other apps" permissions during
              onboarding.
            </Text>
          </View>
        )}

        {items.map((item) => (
          <View
            key={item.title}
            style={{ padding: 14, backgroundColor: "#111", borderRadius: 12, gap: 8 }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
              {item.title}
            </Text>
            {item.steps.map((s) => (
              <Text key={s} style={{ color: "#ccc", lineHeight: 20 }}>
                • {s}
              </Text>
            ))}
          </View>
        ))}

        {isIOS && (
          <Pressable
            onPress={openSettings}
            style={({ pressed }) => ({
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: pressed ? "#1b1b1b" : "#222",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Open Settings</Text>
          </Pressable>
        )}

        <Text style={{ color: "#777", fontSize: 12, lineHeight: 18 }}>
          Note: Screen Time blocking requires iOS 16+ and works best on a
          physical device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
