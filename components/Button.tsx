import { Pressable, Text, StyleSheet } from "react-native";

interface ButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function Button({ text, onPress, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#fafafa",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    width: 400,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    backgroundColor: "#aaa",
  },
  text: {
    color: "#100d0d",
    fontSize: 16,
    fontWeight: "600",
  },
});
