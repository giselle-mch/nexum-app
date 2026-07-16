import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../services/api";
import { COLORS } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

type Payment = {
  id: number; client_id: number; landlord_id: number; amount: string; due_date: string;
  paid_at: string | null; status: "pendiente" | "pagado" | "vencido" | "cancelado";
  reference: string; property_title: string; client_name: string; landlord_name: string;
};

const statusColor: Record<Payment["status"], string> = {
  pendiente: "#B7791F", pagado: COLORS.success, vencido: "#B42318", cancelado: COLORS.secondary,
};

export default function PaymentListScreen({ navigation }: any) {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems((await api("/payments")) as Payment[]); }
    catch (error) { Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar los pagos"); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const act = (item: Payment, action: "simulate" | "cancel") => {
    const title = action === "simulate" ? "Simular pago" : "Cancelar cobro";
    const message = action === "simulate" ? "Esta acción no mueve dinero real. ¿Continuar?" : "¿Cancelar este cobro?";
    Alert.alert(title, message, [{ text: "No", style: "cancel" }, { text: "Sí", onPress: async () => {
      try { await api(`/payments/${item.id}/${action}`, "POST"); await load(); }
      catch (error) { Alert.alert("Error", error instanceof Error ? error.message : "No fue posible procesar la acción"); }
    }}]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <View style={{ padding: 16, flexDirection: "row", gap: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>‹</Text></TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.ink }}>Pagos de renta</Text>
      </View>
      <View style={{ marginHorizontal: 16, padding: 12, borderRadius: 12, backgroundColor: "#FFF4CE" }}>
        <Text style={{ color: "#6B4E00" }}>Simulación académica: no procesa dinero real.</Text>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primary} /> : (
        <FlatList data={items} keyExtractor={(item) => String(item.id)} contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: COLORS.secondary }}>No hay cobros registrados.</Text>}
          renderItem={({ item }) => {
            const isClient = user?.id === item.client_id;
            return <View style={{ backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <Text style={{ flex: 1, fontWeight: "800", color: COLORS.ink }}>{item.property_title}</Text>
                <Text style={{ color: statusColor[item.status], fontWeight: "800", textTransform: "capitalize" }}>{item.status}</Text>
              </View>
              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "800" }}>${Number(item.amount).toFixed(2)} MXN</Text>
              <Text style={{ marginTop: 5, color: COLORS.secondary }}>Fecha límite: {String(item.due_date).slice(0, 10)}</Text>
              <Text style={{ marginTop: 3, color: COLORS.secondary }}>{isClient ? `Arrendador: ${item.landlord_name}` : `Cliente: ${item.client_name}`}</Text>
              <Text selectable style={{ marginTop: 3, color: COLORS.secondary, fontSize: 12 }}>Referencia: {item.reference}</Text>
              {item.status === "pendiente" && isClient ? <TouchableOpacity onPress={() => act(item, "simulate")} style={{ marginTop: 12, padding: 11, borderRadius: 10, alignItems: "center", backgroundColor: COLORS.success }}><Text style={{ color: COLORS.white, fontWeight: "800" }}>Simular pago</Text></TouchableOpacity> : null}
              {item.status === "pendiente" && !isClient ? <TouchableOpacity onPress={() => act(item, "cancel")} style={{ marginTop: 12, padding: 11, borderRadius: 10, alignItems: "center", backgroundColor: "#B42318" }}><Text style={{ color: COLORS.white, fontWeight: "800" }}>Cancelar cobro</Text></TouchableOpacity> : null}
            </View>;
          }}
        />
      )}
    </SafeAreaView>
  );
}
