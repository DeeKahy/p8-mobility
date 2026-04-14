import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
// Loading overlay is used in Index.tsx, for showing that its doing stuff and not frozen.
export default function LoadingOverlay({ text }: { text: string }) {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#fff" />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  text: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
  },
});
