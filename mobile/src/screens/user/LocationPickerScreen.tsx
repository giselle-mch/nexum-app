import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import { CommonActions } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";

const DEFAULT_REGION: Region = {
  latitude: 31.6904,
  longitude: -106.4245,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

type SearchResult = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export default function LocationPickerScreen({ route, navigation }: any) {
  const currentLat = route?.params?.currentLat as number | undefined;
  const currentLng = route?.params?.currentLng as number | undefined;
  const formRouteKey = route?.params?.formRouteKey as string | undefined;

  const initialRegion = useMemo<Region>(() => {
    if (typeof currentLat === "number" && typeof currentLng === "number") {
      return {
        latitude: currentLat,
        longitude: currentLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    return DEFAULT_REGION;
  }, [currentLat, currentLng]);

  const [selected, setSelected] = useState({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const mapRef = useRef<MapView | null>(null);

  const onSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearchError("");
      return;
    }

    try {
      setSearching(true);
      setSearchError("");

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
        trimmed
      )}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("No fue posible buscar esa ubicación");
      }

      const payload = (await response.json()) as Array<{
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
      }>;

      const mapped = payload
        .map((item) => ({
          id: String(item.place_id),
          name: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
        }))
        .filter((item) => !Number.isNaN(item.lat) && !Number.isNaN(item.lng));

      setResults(mapped);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Error buscando direccion"
      );
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onSelectResult = (item: SearchResult) => {
    const next = { latitude: item.lat, longitude: item.lng };
    setSelected(next);
    setResults([]);
    setQuery(item.name);

    mapRef.current?.animateToRegion(
      {
        ...next,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      350
    );
  };

  const onConfirmLocation = () => {
    if (formRouteKey) {
      navigation.dispatch({
        ...CommonActions.setParams({
          selectedLocation: {
            lat: selected.latitude,
            lng: selected.longitude,
          },
        }),
        source: formRouteKey,
      });
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
      <View
        style={{
          position: "absolute",
          top: 16,
          left: 12,
          right: 12,
          zIndex: 10,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 10,
          gap: 8,
          elevation: 5,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Buscar direccion o lugar"
            value={query}
            onChangeText={setQuery}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.lightGray,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              backgroundColor: "#FFFFFF",
            }}
          />
          <TouchableOpacity
            onPress={onSearch}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 8,
              paddingHorizontal: 14,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "700" }}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {searching ? <ActivityIndicator color={COLORS.primary} /> : null}
        {searchError ? <Text style={{ color: "#B42318" }}>{searchError}</Text> : null}

        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 180 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelectResult(item)}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.lightGray,
                  paddingVertical: 8,
                }}
              >
                <Text numberOfLines={2} style={{ color: COLORS.dark }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : null}
      </View>

      <MapView
        ref={(instance) => {
          mapRef.current = instance;
        }}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onPress={(event) => setSelected(event.nativeEvent.coordinate)}
      >
        <Marker
          coordinate={selected}
          draggable
          onDragEnd={(event) => setSelected(event.nativeEvent.coordinate)}
        />
      </MapView>

      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 14,
          gap: 8,
          elevation: 4,
        }}
      >
        <Text style={{ color: COLORS.dark, fontWeight: "700" }}>
          Selecciona la ubicacion del inmueble
        </Text>
        <Text style={{ color: "gray" }}>
          Lat: {selected.latitude.toFixed(6)} | Lng: {selected.longitude.toFixed(6)}
        </Text>
        <TouchableOpacity
          onPress={onConfirmLocation}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 10,
            alignItems: "center",
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: "700" }}>
            Usar esta ubicacion
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}
