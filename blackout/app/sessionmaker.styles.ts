import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },

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

  headerContainer: {
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: "#979797ff",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Archivo_900Black",
    fontSize: 36,
    color: "#ffffff",
    letterSpacing: -1,
    marginBottom: 16,
  },
  divider: {
    height: 3,
    width: 60,
    backgroundColor: "#ffffffff",
    borderRadius: 2,
  },
  card: {
    backgroundColor: "rgba(44, 44, 44, 0.48)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 13,
    color: "#ffffffff",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  timeButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  timeButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    transform: [{ scale: 0.98 }],
  },
  timeIconContainer: {
    marginRight: 16,
  },
  clockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(110, 110, 110, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  clockText: {
    fontSize: 24,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: "#ffffffff",
    marginBottom: 4,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 32,
    color: "#ffffffff",
    fontWeight: "300",
  },
  pickerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  infoCard: {
    backgroundColor: "rgba(44, 44, 44, 0.48)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  infoLabel: {
    fontSize: 12,
    color: "#ffffffff",
    marginBottom: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  participantSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  selectorButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(132, 132, 132, 1)",
  },
  selectorButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    transform: [{ scale: 0.95 }],
  },
  selectorButtonDisabled: {
    opacity: 0.3,
    borderColor: "rgba(139, 92, 246, 0.15)",
  },
  selectorButtonText: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "300",
  },
  selectorButtonTextDisabled: {
    color: "#8b8b9a",
  },
  countDisplay: {
    alignItems: "center",
    minWidth: 100,
  },
  countNumber: {
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: -1,
  },
  countLabel: {
    fontSize: 14,
    color: "#ffffffff",
    marginTop: 4,
    fontWeight: "500",
  },
  unlimitedButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
  },
  unlimitedButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  unlimitedButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  unlimitedButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#a0a0a0",
  },
  unlimitedButtonTextActive: {
    color: "#ffffff",
  },

  startButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 12,
    alignSelf: "center",
  },
  startButtonText: {
    fontSize: 18,
    color: "#000000ff",
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  startButtonIcon: {
    fontSize: 24,
    color: "#000000",
    fontWeight: "300",
  },
});
