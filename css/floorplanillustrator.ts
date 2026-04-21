import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    height: "75%",
    backgroundColor: "#f5f5f5",
    paddingTop: 48,
    paddingHorizontal: 16,
    marginTop: 30,
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    width: "100%",
  },
  rowButton: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  list: {
    gap: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  label: {
    marginTop: 8,
    fontSize: 24,
    color: "#000",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 60,
    fontSize: 16,
    color: "#aaa",
  },
});
