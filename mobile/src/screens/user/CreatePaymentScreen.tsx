import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import { COLORS } from "../../constants/colors";
import { logAppError } from "../../utils/debug";
import BackButton from "../../components/BackButton";

export default function CreatePaymentScreen({ route, navigation }: any) {
  const { conversationId, propertyTitle } = route.params;
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!amount.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert("Datos incompletos", "Ingresa monto y fecha en formato AAAA-MM-DD.");
      return;
    }
    try {
      setLoading(true);
      const result = await api("/payments", "POST", {
        conversationId,
        amount: Number(amount),
        dueDate,
      });
      Alert.alert("Cobro creado", `Referencia: ${result.reference}`, [
        { text: "Aceptar", onPress: () => navigation.replace("Payments") },
      ]);
    } catch (error) {
      logAppError("CreatePaymentScreen.create", error, {
        conversationId,
        amount,
        dueDate,
      });
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible crear el cobro");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper, padding: 18 }}>
      <BackButton onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Payments"))} />
      <Text style={{ marginTop: 24, fontSize: 24, fontWeight: "800", color: COLORS.ink }}>Crear cobro de renta</Text>
      <Text style={{ marginTop: 8, color: COLORS.secondary }}>{propertyTitle}</Text>
      <View style={{ marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: "#FFF4CE" }}>
        <Text style={{ color: "#6B4E00", fontWeight: "700" }}>Simulación académica: no procesa dinero real.</Text>
      </View>
      <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Monto (MXN)" style={{ marginTop: 18, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 13 }} />
      <TextInput value={dueDate} onChangeText={setDueDate} placeholder="Fecha límite: AAAA-MM-DD" maxLength={10} style={{ marginTop: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 13 }} />
      <TouchableOpacity onPress={create} disabled={loading} style={{ marginTop: 18, backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: "center" }}>
        <Text style={{ color: COLORS.white, fontWeight: "800" }}>{loading ? "Creando..." : "Crear cobro"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
