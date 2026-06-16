import { FC } from "react";
import { View, Text, TouchableOpacity } from "react-native";

type RotationControlsProps = {
  rotation: number;
  startRotating: (dir: 1 | -1) => void;
  stopRotating: () => void;
};

export const RotationControls: FC<RotationControlsProps> = ({
  rotation,
  startRotating,
  stopRotating,
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        paddingVertical: 12,
      }}
    >
      <TouchableOpacity
        onPressIn={() => startRotating(-1)}
        onPressOut={stopRotating}
        hitSlop={40}
      >
        <Text style={{ fontSize: 28 }}>↺</Text>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 14,
          color: "#666",
          width: 60,
          textAlign: "center",
        }}
      >
        {`${rotation}°`}
      </Text>

      <TouchableOpacity
        onPressIn={() => startRotating(1)}
        onPressOut={stopRotating}
        hitSlop={40}
      >
        <Text style={{ fontSize: 28 }}>↻</Text>
      </TouchableOpacity>
    </View>
  );
};
