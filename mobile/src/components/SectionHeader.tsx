import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "default" | "light";
};

export default function SectionHeader({
  title,
  subtitle,
  icon = "sparkles-outline",
  variant = "default",
}: SectionHeaderProps) {
  const isLight = variant === "light";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: isLight ? "rgba(255,255,255,0.2)" : "#E8EEF7",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={isLight ? COLORS.white : COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: isLight ? COLORS.white : COLORS.ink, fontSize: 20, fontWeight: "800" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: isLight ? "#D8E4F1" : COLORS.secondary }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
