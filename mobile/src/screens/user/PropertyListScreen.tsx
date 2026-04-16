import { useEffect, useRef, useState } from "react";
import { View, FlatList, TextInput, TouchableOpacity, Text, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import PropertyCard from "../../components/PropertyCard";
import { COLORS } from "../../constants/colors";
import SectionHeader from "../../components/SectionHeader";
import StatePanel from "../../components/StatePanel";

type PropertyListItem = {
  id: number;
  title: string;
  price: number | null;
  city: string;
  type: string;
  thumbnail: string | null;
  distanceKm?: number;
};

export default function PropertyListScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProperties();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchProperties = async (withFilters = false) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const endpoint = withFilters ? "/properties/search" : "/properties";
      const data = await api(endpoint, "GET", undefined, {
        ciudad: city,
        tipo: type,
        precio_min: minPrice ? Number(minPrice) : undefined,
        precio_max: maxPrice ? Number(maxPrice) : undefined,
      });
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No fue posible cargar inmuebles"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View
          style={{
            padding: 14,
            backgroundColor: COLORS.primary,
            borderBottomLeftRadius: 22,
            borderBottomRightRadius: 22,
            shadowColor: "#0A1526",
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
          }}
        >
          <SectionHeader
            title="Explorar Inmuebles"
            subtitle="Encuentra tu próximo hogar con filtros inteligentes"
            icon="compass-outline"
            variant="light"
          />

          <View
            style={{
              marginTop: 12,
              backgroundColor: "rgba(255,255,255,0.97)",
              borderRadius: 14,
              padding: 10,
              gap: 8,
            }}
          >
            <TextInput
              placeholder="Ciudad"
              value={city}
              onChangeText={setCity}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 10,
                borderRadius: 10,
                backgroundColor: COLORS.white,
              }}
            />
            <TextInput
              placeholder="Tipo (casa, departamento, local...)"
              value={type}
              onChangeText={setType}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 10,
                borderRadius: 10,
                backgroundColor: COLORS.white,
              }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Mín"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: COLORS.white,
                }}
              />
              <TextInput
                placeholder="Máx"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: COLORS.white,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => fetchProperties(true)}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.accent,
                  padding: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: "700" }}>Aplicar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setCity("");
                  setType("");
                  setMinPrice("");
                  setMaxPrice("");
                  fetchProperties(false);
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#E8EDF4",
                  padding: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.ink, fontWeight: "700" }}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
          {errorMessage ? <StatePanel variant="error" message={errorMessage} /> : null}
        </View>

        <FlatList
          data={properties}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 18 }}
          ListEmptyComponent={
            !loading && !errorMessage ? (
              <View style={{ paddingHorizontal: 12 }}>
                <StatePanel variant="empty" message="No encontramos inmuebles con esos filtros." />
              </View>
            ) : null
          }
          onRefresh={() =>
            fetchProperties(city !== "" || type !== "" || minPrice !== "" || maxPrice !== "")
          }
          refreshing={loading}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => navigation.navigate("Detail", { id: item.id })}
            />
          )}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
