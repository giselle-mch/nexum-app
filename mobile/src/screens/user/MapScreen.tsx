import { View, TouchableOpacity, Text, Alert } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

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
  const user = useAuthStore((state) => state.user);
  const canManageProperties = user?.rol === "arrendador" || user?.rol === "admin";

  useEffect(() => {
    fetchProperties(INITIAL_REGION);
  }, []);

  const fetchProperties = async (region: Region) => {
    try {
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

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          position: "absolute",
          top: 48,
          right: 16,
          zIndex: 10,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            elevation: 3,
          }}
        >
          <Text style={{ color: "#0B1F33", fontWeight: "700" }}>Perfil</Text>
        </TouchableOpacity>

        {canManageProperties ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("LandlordDashboard")}
            style={{
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
              elevation: 3,
            }}
          >
            <Text style={{ color: "#0B1F33", fontWeight: "700" }}>Arrendador</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <MapView
        style={{ flex: 1 }}
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={fetchProperties}
      >
        {properties
          .filter((item) => item.latitud !== null && item.longitud !== null)
          .map((item) => (
            <Marker
              key={item.id}
              coordinate={{
                latitude: item.latitud as number,
                longitude: item.longitud as number,
              }}
              title={item.titulo}
              description={
                item.precio !== null ? `$${item.precio}` : "Precio a consultar"
              }
              onCalloutPress={() => navigation.navigate("Detail", { id: item.id })}
            />
          ))}
      </MapView>

      <TouchableOpacity
        onPress={() => navigation.navigate("List")}
        style={{
          position: "absolute",
          bottom: 40,
          left: 20,
          right: 20,
          backgroundColor: "#0B1F33",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white" }}>Ver lista de propiedades</Text>
      </TouchableOpacity>
    </View>
  );
}
