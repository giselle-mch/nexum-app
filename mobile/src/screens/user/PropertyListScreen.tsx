import { useEffect, useState } from "react";
import { View, FlatList, TextInput, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import PropertyCard from "../../components/PropertyCard";
import { COLORS } from "../../constants/colors";

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
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProperties();
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
      <View style={{ padding: 12, gap: 8 }}>
        <TextInput
          placeholder="Buscar por ciudad"
          value={city}
          onChangeText={setCity}
          style={{ borderWidth: 1, borderColor: COLORS.lightGray, padding: 10, borderRadius: 8 }}
        />
        <TextInput
          placeholder="Tipo (casa, terreno, local...)"
          value={type}
          onChangeText={setType}
          style={{ borderWidth: 1, borderColor: COLORS.lightGray, padding: 10, borderRadius: 8 }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Precio min"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.lightGray,
              padding: 10,
              borderRadius: 8,
            }}
          />
          <TextInput
            placeholder="Precio max"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.lightGray,
              padding: 10,
              borderRadius: 8,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => fetchProperties(true)}
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "600" }}>Aplicar filtros</Text>
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
              backgroundColor: COLORS.lightGray,
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.dark, fontWeight: "600" }}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {errorMessage ? (
        <Text style={{ color: "red", paddingHorizontal: 12, paddingBottom: 8 }}>
          {errorMessage}
        </Text>
      ) : null}

      <FlatList
        data={properties}
        keyExtractor={(item: any) => item.id.toString()}
        onRefresh={() => fetchProperties(city !== "" || type !== "" || minPrice !== "" || maxPrice !== "")}
        refreshing={loading}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate("Detail", { id: item.id })}
          />
        )}
      />
      </View>
    </SafeAreaView>
  );
}
