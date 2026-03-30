import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 24,
  },
  homePage: {
    flex: 1,
    padding: 24,
    backgroundColor: "#000000",
  },
  topTabs: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
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
    width: "100%",
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

  // Header Section
  headerContainer: {
    marginTop: 40,
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
  },
  divider: {
    height: 1,
    backgroundColor: "#1a1a1a",
    marginTop: 8,
  },

  // QR Code Card
  qrCard: {
    backgroundColor: "#0a0a0a",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  qrContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },

  // Info Section
  infoContainer: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fffcfcff",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    maxWidth: 180,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#1a1a1a",
    marginVertical: 8,
  },

  // Instructions
  instructionContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  instruction: {
    fontSize: 15,
    lineHeight: 22,
    color: "#808080",
    textAlign: "center",
  },

  safeArea: { flex: 1, backgroundColor: "#000000" },
  sessionEndedIcon: {
    fontSize: 48,
    color: "#4ade80",
    marginBottom: 16,
  },
  sessionEndedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  sessionEndedSubtext: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
    marginBottom: 24,
  },
  returnHomeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  returnHomeButtonPressed: { opacity: 0.8 },
  returnHomeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
});

export default styles;
