import { StyleSheet } from "react-native";
import { BlackoutColors as C } from "@/constants/theme";

const VIEWFINDER_SIZE = 220;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    zIndex: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  backButtonPressed: { opacity: 0.7 },
  backButtonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinderSquare: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    padding: 24,
    paddingTop: 80,
    backgroundColor: C.background,
  },
  messageText: {
    textAlign: "center",
    fontSize: 16,
    color: C.textMuted,
  },
  scanAgainOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    gap: 12,
  },
  loader: { marginVertical: 8 },
  errorText: { fontSize: 14, color: "#ff6b6b", textAlign: "center" },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.text,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { fontSize: 16, fontWeight: "600", color: C.background },
});
