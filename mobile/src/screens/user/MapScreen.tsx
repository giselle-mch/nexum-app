import { View, TouchableOpacity, Text, Alert } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import PropertyMap from "../../components/maps/PropertyMap";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapProperty = {
  id: number;
  titulo: string;
  precio: number | null;
  latitud: number | null;
  longitud: number | null;
  imagen_principal: string | null;
};

const INITIAL_REGION: Region = {
  latitude: 31.6904,
  longitude: -106.4245,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen({ navigation }: any) {
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [fitToMarkersToken, setFitToMarkersToken] = useState(0);
  const user = useAuthStore((state) => state.user);
  const canManageProperties = user?.rol === "arrendador" || user?.rol === "admin";

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  const fetchProperties = async (region?: Region) => {
    try {
      if (!region) {
        const data = await api("/properties/map", "GET", undefined, {
          limit: 300,
        });

        setProperties(Array.isArray(data) ? (data as MapProperty[]) : []);
        setFitToMarkersToken((prev) => prev + 1);
        return;
      }

      const minLat = region.latitude - region.latitudeDelta / 2;
      const maxLat = region.latitude + region.latitudeDelta / 2;
      const minLng = region.longitude - region.longitudeDelta / 2;
      const maxLng = region.longitude + region.longitudeDelta / 2;

      const data = await api("/properties/map", "GET", undefined, {
        minLat,
        maxLat,
        minLng,
        maxLng,
        limit: 300,
      });

      setProperties(Array.isArray(data) ? (data as MapProperty[]) : []);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No fue posible cargar el mapa"
      );
    }
  };

  const validProperties = properties.filter(
    (item): item is MapProperty & { latitud: number; longitud: number } =>
      item.latitud !== null && item.longitud !== null
  );

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          position: "absolute",
          top: 56,
          right: 16,
          zIndex: 2000,
          elevation: 10,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 15,
            paddingVertical: 11,
            borderRadius: 14,
            elevation: 5,
            shadowColor: "#0A1526",
            shadowOpacity: 0.14,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text style={{ color: "#0B1F33", fontWeight: "800" }}>Perfil</Text>
        </TouchableOpacity>

        {canManageProperties ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("LandlordDashboard")}
            style={{
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 15,
              paddingVertical: 11,
              borderRadius: 14,
              elevation: 5,
              shadowColor: "#0A1526",
              shadowOpacity: 0.14,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text style={{ color: "#0B1F33", fontWeight: "800" }}>
              Arrendador
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <PropertyMap
        region={INITIAL_REGION}
        properties={validProperties}
        fitToMarkersToken={fitToMarkersToken}
        onRegionChangeComplete={fetchProperties}
        onSelectProperty={(property) => {
          navigation.navigate("Detail", { id: property.id });
        }}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("List")}
        style={{
          position: "absolute",
          bottom: 28,
          left: 20,
          right: 20,
          zIndex: 2000,
          elevation: 10,
          backgroundColor: "#0B1F33EE",
          padding: 16,
          borderRadius: 14,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#3A5F7D",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          Ver lista de propiedades
        </Text>
      </TouchableOpacity>
    </View>
  );
}
