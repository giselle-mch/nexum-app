import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import { COLORS } from "../../constants/colors";
import PropertyCard from "../../components/PropertyCard";
import SectionHeader from "../../components/SectionHeader";
import StatePanel from "../../components/StatePanel";

type MyProperty = {
  id: number;
  title: string;
  price: number | null;
  type: string;
  city: string;
  thumbnail: string | null;
};

export default function LandlordDashboardScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [properties, setProperties] = useState<MyProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadMyProperties();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadMyProperties = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await api("/properties/mine");
      setProperties(Array.isArray(response) ? (response as MyProperty[]) : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible cargar inmuebles del arrendador"
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = (propertyId: number) => {
    Alert.alert("Eliminar inmueble", "¿Seguro que quieres eliminar esta publicación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/properties/mine/${propertyId}`, "DELETE");
            setProperties((prev) => prev.filter((property) => property.id !== propertyId));
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "No fue posible eliminar"
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={{ padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }}>
          <SectionHeader
            title="Panel Arrendador"
            subtitle="Gestiona y actualiza tus publicaciones"
            icon="business-outline"
          />
        </View>

        <View style={{ padding: 16, flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Map")}
            style={{
              flex: 1,
              backgroundColor: COLORS.lightGray,
              borderRadius: 12,
              alignItems: "center",
              padding: 12,
            }}
          >
            <Text style={{ color: COLORS.dark, fontWeight: "700" }}>Volver al mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("PropertyForm")}
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              alignItems: "center",
              padding: 12,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "700" }}>Publicar inmueble</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {errorMessage ? <StatePanel variant="error" message={errorMessage} /> : null}
        </View>

        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          refreshing={loading}
          onRefresh={loadMyProperties}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 14 }}
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 16 }}>
              <StatePanel variant="empty" message="No tienes inmuebles publicados." />
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: 4 }}>
              <PropertyCard
                property={item}
                onPress={() => navigation.navigate("Detail", { id: item.id })}
              />
              <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("PropertyForm", { propertyId: item.id })}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.secondary,
                    borderRadius: 10,
                    alignItems: "center",
                    paddingVertical: 11,
                  }}
                >
                  <Text style={{ color: COLORS.white, fontWeight: "700" }}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#B42318",
                    borderRadius: 10,
                    alignItems: "center",
                    paddingVertical: 11,
                  }}
                >
                  <Text style={{ color: COLORS.white, fontWeight: "700" }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
