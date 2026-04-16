import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { COLORS } from "../../constants/colors";
import SectionHeader from "../../components/SectionHeader";
import StatePanel from "../../components/StatePanel";

type ProfilePayload = {
  id: number;
  email: string;
  rol: string;
  iat: number;
  exp: number;
};

type FavoriteProperty = {
  id: number;
  titulo?: string;
  precio?: number | null;
  ciudad?: string;
  tipo?: string;
};

export default function ProfileScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { logout } = useAuthStore();

  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [profileResponse, favoritesResponse] = await Promise.all([
        api("/users/profile"),
        api("/favorites"),
      ]);

      const user =
        profileResponse && typeof profileResponse === "object" && "user" in profileResponse
          ? (profileResponse.user as ProfilePayload)
          : null;

      setProfile(user);
      setFavorites(Array.isArray(favoritesResponse) ? (favoritesResponse as FavoriteProperty[]) : []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No fue posible cargar el perfil";
      setErrorMessage(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    await logout();
  };

  const onRemoveFavorite = async (propertyId: number) => {
    try {
      await api(`/favorites/${propertyId}`, "DELETE");
      setFavorites((prev) => prev.filter((item) => item.id !== propertyId));
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No fue posible eliminar favorito"
      );
    }
  };

  const renderFavorite = ({ item }: { item: FavoriteProperty }) => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
      }}
    >
      <TouchableOpacity onPress={() => navigation.navigate("Detail", { id: item.id })}>
        <Text style={{ fontWeight: "700", color: COLORS.dark, fontSize: 15 }}>
          {item.titulo ?? `Inmueble #${item.id}`}
        </Text>
        <Text style={{ color: COLORS.secondary, marginTop: 4 }}>
          {item.precio !== null && item.precio !== undefined
            ? `$${item.precio}`
            : "Precio a consultar"}
        </Text>
        <Text style={{ color: "gray", marginTop: 4 }}>{item.ciudad ?? "Sin ciudad"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onRemoveFavorite(item.id)}
        style={{
          marginTop: 10,
          alignSelf: "flex-start",
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 8,
          backgroundColor: "#FEE4E2",
        }}
      >
        <Text style={{ color: "#B42318", fontWeight: "600" }}>Quitar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.lightGray,
          }}
        >
          <SectionHeader title="Mi Perfil" subtitle="Tu información y favoritos" icon="person-circle-outline" />
          <Text style={{ marginTop: 10, color: COLORS.dark }}>Email: {profile?.email ?? "No disponible"}</Text>
          <Text style={{ marginTop: 4, color: COLORS.dark }}>Rol: {profile?.rol ?? "No disponible"}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, padding: 16 }}>
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
            onPress={onLogout}
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              alignItems: "center",
              padding: 12,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "700" }}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <SectionHeader title="Favoritos" subtitle="Tus inmuebles guardados" icon="heart-outline" />

          {errorMessage ? <StatePanel variant="error" message={errorMessage} /> : null}

          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id.toString()}
            refreshing={loading}
            onRefresh={loadData}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 14 }}
            ListEmptyComponent={
              <StatePanel variant="empty" message="Aún no tienes inmuebles favoritos." />
            }
            renderItem={renderFavorite}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
