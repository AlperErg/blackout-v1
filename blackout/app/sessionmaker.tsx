import {
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createSession } from "@/lib/sessions";
import { styles } from "./sessionmaker.styles";

export default function SessionMaker() {
  const router = useRouter();
  const [endTime, setTime] = useState(new Date());
  const [show, setShow] = useState(false);
  const [maxParticipants, setmaxParticipants] = useState<number>(1);
  const [unblockLimit, setUnblockLimit] = useState<number>(0);
  const [unblockDurationMinutes, setUnblockDurationMinutes] = useState<number>(5);
  const [creating, setCreating] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const onChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === "ios");
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  const handleStartSession = async () => {
    if (creating) return;
    setCreating(true);
    try {
      // If selected time is in the past, assume user meant same time tomorrow
      let effectiveEndTime = new Date(endTime);
      const now = new Date();
      if (effectiveEndTime <= now) {
        effectiveEndTime = new Date(effectiveEndTime.getTime() + 24 * 60 * 60 * 1000);
      }
      const sessionId = await createSession(
        effectiveEndTime,
        maxParticipants,
        unblockLimit,
        unblockDurationMinutes
      );
      router.push({
        pathname: "/qrpage",
        params: {
          sessionId: sessionId,
          endTime: effectiveEndTime.toISOString(),
          maxParticipants: String(maxParticipants),
          unblockLimit: String(unblockLimit),
          unblockDurationMinutes: String(unblockDurationMinutes),
        },
      });
    } catch (e) {
      console.error("Failed to create session", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Back button sits outside the scroll so it's always visible */}
      <Pressable
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>New Session</Text>
          <Text style={styles.title}>Create a session</Text>
          <View style={styles.divider} />
        </View>

        {/* Time Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Session Duration</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.timeButton,
              pressed && styles.timeButtonPressed,
            ]}
            onPress={() => setShow(true)}
          >
            <View style={styles.timeIconContainer}>
              <View style={styles.clockIcon}>
                <Text style={styles.clockText}>🕐</Text>
              </View>
            </View>
            <View style={styles.timeTextContainer}>
              <Text style={styles.timeLabel}>End Time</Text>
              <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          {show && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display={"spinner"}
              onChange={onChange}
              themeVariant="dark"
            />
          )}
        </View>

        {/* Participant Count Selector */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Max Number of Participants</Text>
          <View style={styles.participantSelector}>
            <Pressable
              style={({ pressed }) => [
                styles.selectorButton,
                pressed && styles.selectorButtonPressed,
                maxParticipants <= 1 && maxParticipants > 0 && styles.selectorButtonDisabled,
              ]}
              onPress={() =>
                setmaxParticipants(
                  maxParticipants === 0 ? 20 : Math.max(1, maxParticipants - 1)
                )
              }
              disabled={maxParticipants === 1}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  maxParticipants <= 1 && maxParticipants > 0 && styles.selectorButtonTextDisabled,
                ]}
              >
                −
              </Text>
            </Pressable>

            <View style={styles.countDisplay}>
              <Text style={styles.countNumber}>
                {maxParticipants === 0 ? "∞" : maxParticipants}
              </Text>
              <Text style={styles.countLabel}>
                {maxParticipants === 0
                  ? "Unlimited"
                  : maxParticipants === 1
                    ? "person"
                    : "people"}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.selectorButton,
                pressed && styles.selectorButtonPressed,
                maxParticipants >= 20 && styles.selectorButtonDisabled,
              ]}
              onPress={() =>
                setmaxParticipants(
                  maxParticipants >= 20 ? 0 : Math.min(20, maxParticipants + 1)
                )
              }
              disabled={maxParticipants >= 20}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  maxParticipants >= 20 && styles.selectorButtonTextDisabled,
                ]}
              >
                +
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.unlimitedButton,
              pressed && styles.unlimitedButtonPressed,
              maxParticipants === 0 && styles.unlimitedButtonActive,
            ]}
            onPress={() => setmaxParticipants(maxParticipants === 0 ? 1 : 0)}
          >
            <Text
              style={[
                styles.unlimitedButtonText,
                maxParticipants === 0 && styles.unlimitedButtonTextActive,
              ]}
            >
              {maxParticipants === 0 ? "✓ Unlimited" : "Unlimited"}
            </Text>
          </Pressable>
        </View>

        {/* Unblock Breaks */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Unblock Breaks (per participant)</Text>
          <Text
            style={{
              fontSize: 12,
              color: "#a0a0a0",
              marginBottom: 12,
            }}
          >
            How many times can participants temporarily unblock apps during the session
          </Text>
          <View style={styles.participantSelector}>
            <Pressable
              style={({ pressed }) => [
                styles.selectorButton,
                pressed && styles.selectorButtonPressed,
                unblockLimit <= 0 && styles.selectorButtonDisabled,
              ]}
              onPress={() => setUnblockLimit(Math.max(0, unblockLimit - 1))}
              disabled={unblockLimit <= 0}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  unblockLimit <= 0 && styles.selectorButtonTextDisabled,
                ]}
              >
                −
              </Text>
            </Pressable>
            <View style={styles.countDisplay}>
              <Text style={styles.countNumber}>{unblockLimit}</Text>
              <Text style={styles.countLabel}>
                {unblockLimit === 1 ? "break" : "breaks"}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.selectorButton,
                pressed && styles.selectorButtonPressed,
                unblockLimit >= 20 && styles.selectorButtonDisabled,
              ]}
              onPress={() => setUnblockLimit(Math.min(20, unblockLimit + 1))}
              disabled={unblockLimit >= 20}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  unblockLimit >= 20 && styles.selectorButtonTextDisabled,
                ]}
              >
                +
              </Text>
            </Pressable>
          </View>
          {unblockLimit > 0 && (
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text style={[styles.infoLabel, { marginBottom: 0 }]}>
                Break duration
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.unlimitedButton,
                    pressed && styles.unlimitedButtonPressed,
                    unblockDurationMinutes === 5 && styles.unlimitedButtonActive,
                  ]}
                  onPress={() => setUnblockDurationMinutes(5)}
                >
                  <Text
                    style={[
                      styles.unlimitedButtonText,
                      unblockDurationMinutes === 5 &&
                        styles.unlimitedButtonTextActive,
                    ]}
                  >
                    5 min
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.unlimitedButton,
                    pressed && styles.unlimitedButtonPressed,
                    unblockDurationMinutes === 10 && styles.unlimitedButtonActive,
                  ]}
                  onPress={() => setUnblockDurationMinutes(10)}
                >
                  <Text
                    style={[
                      styles.unlimitedButtonText,
                      unblockDurationMinutes === 10 &&
                        styles.unlimitedButtonTextActive,
                    ]}
                  >
                    10 min
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Action Button */}
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
              creating && styles.startButtonDisabled,
            ]}
            onPress={handleStartSession}
            disabled={creating}
          >
          <View style={styles.gradientButton}>
            {creating ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.startButtonText}>Start Session</Text>
                <Text style={styles.startButtonIcon}>→</Text>
              </>
            )}
          </View>
        </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}