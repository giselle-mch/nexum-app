import { Text, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/colors";

type BackButtonProps = {
  label?: string;
  onPress: () => void;
  light?: boolean;
};

export default function BackButton({ label = "Regresar", onPress, light = false }: BackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 4 }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: light ? COLORS.white : COLORS.dark,
        }}
      >
        ← {label}
      </Text>
    </TouchableOpacity>
  );
}