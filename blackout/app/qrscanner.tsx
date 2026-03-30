import { joinSession } from "@/lib/sessions";
import { extractSessionIdFromScan } from "@/lib/joinLink";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { styles } from "./qrscanner.styles";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function QRScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinInFlightRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (joinInFlightRef.current || validating || scanned) return;
    joinInFlightRef.current = true;
    const sessionId = extractSessionIdFromScan(data);
    if (!sessionId) {
      joinInFlightRef.current = false;
      return;
    }
    setScanned(true);
    setError(null);
    setValidating(true);

    try {
      const result = await joinSession(sessionId);

      if (!result.success || !result.session) {
        setError(result.error || "Could not join session");
        return;
      }

      // Now TypeScript knows result.session exists
      router.replace({
        pathname: "/session",
        params: {
          sessionId,
          endTime: result.session.endTime.toISOString(),
          unblockLimit: String(result.session.unblockLimit),
          unblockDurationMinutes: String(result.session.unblockDurationMinutes),
        },
      });
    } catch (e) {
      console.error(e);
      setError("Could not validate session");
    } finally {
      setValidating(false);
      joinInFlightRef.current = false;
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain ?? true;
    return (
      <View style={styles.centerContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.messageText}>
          We need camera permission to scan QR codes.
        </Text>
        {canAskAgain ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant permission</Text>
          </Pressable>
        ) : (
          <>
            <Text style={[styles.messageText, { fontSize: 14, marginTop: 8 }]}>
              Camera access was previously denied. Open Settings to enable it.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => Linking.openURL("app-settings:")}
            >
              <Text style={styles.buttonText}>Open Settings</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Square viewfinder overlay */}
      {!scanned && (
        <View style={styles.viewfinderOverlay} pointerEvents="none">
          <View style={styles.viewfinderSquare} />
        </View>
      )}
      {scanned && (
        <View style={styles.scanAgainOverlay}>
          {validating && (
            <ActivityIndicator
              color={"#ffff"}
              size="large"
              style={styles.loader}
            />
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              joinInFlightRef.current = false;
              setScanned(false);
              setError(null);
            }}
          >
            <Text style={styles.buttonText}>Tap to scan again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
