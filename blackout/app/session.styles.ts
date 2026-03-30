import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#000",
  },
  topTabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  topTabButtonActive: {
    borderColor: "#666",
    backgroundColor: "#151515",
  },
  topTabText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  topTabTextActive: {
    color: "#fff",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  bottomTabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    backgroundColor: "#050505",
    paddingTop: 8,
    paddingBottom: 6,
  },
  bottomTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    gap: 2,
  },
  bottomTabText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomTabTextActive: {
    color: "#fff",
  },
  emptyTabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTabText: {
    color: "#888",
    marginBottom: 12,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#000000",
  },

  // Lock Icon
  iconContainer: {
    marginBottom: 32,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    fontSize: 48,
  },

  // Message Section
  messageContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#333333",
  },

  // Time Card
  timeCard: {
    backgroundColor: "#0a0a0a",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    minWidth: 280,
    marginBottom: 32,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  timeValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 1,
  },

  // Break timer (when apps are unblocked)
  breakTimerCard: {
    backgroundColor: "#0f2a1a",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a4a2e",
    minWidth: 200,
    marginTop: 24,
  },
  breakTimerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4ade80",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  breakTimerValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#4ade80",
    letterSpacing: 2,
  },
  breakTimerSubtext: {
    fontSize: 13,
    color: "#6b9b7a",
    marginTop: 4,
  },

  // Status Indicator
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80", // Green dot for active
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#808080",
    letterSpacing: 0.3,
  },

  shareButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#0a0a0a",
    alignItems: "center",
  },
  shareButtonPressed: { opacity: 0.8 },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  shareButtonSubtext: {
    fontSize: 12,
    color: "#808080",
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
  },
  modalQRWrap: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
  },
  modalHint: {
    fontSize: 14,
    color: "#a0a0a0",
    textAlign: "center",
    marginBottom: 20,
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  sessionEndedSubtext: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
    marginBottom: 32,
  },
  returnHomeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  returnHomeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
});

export default styles;
