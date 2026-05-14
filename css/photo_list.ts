import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  list: {
    padding: 20,
    gap: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    flexDirection: "row",
    gap: 16,
    marginVertical: 5,
    marginHorizontal: 5,
  },

  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  textContainer: {
    flex: 1,
    gap: 4,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
  },

  date: {
    fontSize: 13,
    color: "#999",
  },
});
