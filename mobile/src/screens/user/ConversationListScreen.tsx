import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../services/api";
import { COLORS } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

type Conversation = {
  id: number;
  property_title: string;
  client_id: number;
  landlord_id: number;
  client_name: string;
  landlord_name: string;
  last_message?: string | null;
  last_message_at?: string | null;
};

export default function ConversationListScreen({ navigation }: any) {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems((await api("/conversations")) as Conversation[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>‹</Text></TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.ink }}>Mensajes</Text>
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} /> : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: COLORS.secondary }}>Aún no tienes conversaciones.</Text>}
          renderItem={({ item }) => {
            const otherName = user?.id === item.client_id ? item.landlord_name : item.client_name;
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate("Conversation", { id: item.id })}
                style={{ backgroundColor: COLORS.white, padding: 15, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border }}
              >
                <Text style={{ fontWeight: "800", color: COLORS.ink }}>{item.property_title}</Text>
                <Text style={{ marginTop: 4, color: COLORS.secondary }}>{otherName}</Text>
                <Text numberOfLines={1} style={{ marginTop: 8, color: COLORS.dark }}>{item.last_message || "Conversación nueva"}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
