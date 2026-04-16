import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

type StatePanelProps = {
  message: string;
  variant?: "empty" | "error" | "info";
};

export default function StatePanel({ message, variant = "info" }: StatePanelProps) {
  const palette =
    variant === "error"
      ? {
          bg: "#FEE4E2",
          border: "#FECACA",
          text: "#B42318",
          icon: "alert-circle-outline" as const,
        }
      : variant === "empty"
        ? {
            bg: "#EEF3FA",
            border: "#D6E1EF",
            text: COLORS.secondary,
            icon: "file-tray-outline" as const,
          }
        : {
            bg: "#ECFDF3",
            border: "#D1FADF",
            text: "#067647",
            icon: "information-circle-outline" as const,
          };

  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons name={palette.icon} size={18} color={palette.text} />
      <Text style={{ color: palette.text, flex: 1 }}>{message}</Text>
    </View>
  );
}

