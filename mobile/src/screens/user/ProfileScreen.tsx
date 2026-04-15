import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { COLORS } from "../../constants/colors";

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
  const { logout } = useAuthStore();

  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

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
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No fue posible cargar el perfil"
      );
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
        borderRadius: 10,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.primary }}>Mi perfil</Text>
        <Text style={{ marginTop: 8, color: COLORS.dark }}>Email: {profile?.email ?? "No disponible"}</Text>
        <Text style={{ marginTop: 4, color: COLORS.dark }}>Rol: {profile?.rol ?? "No disponible"}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10, padding: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Map")}
          style={{
            flex: 1,
            backgroundColor: COLORS.lightGray,
            borderRadius: 10,
            alignItems: "center",
            padding: 12,
          }}
        >
          <Text style={{ color: COLORS.dark, fontWeight: "600" }}>Volver al mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onLogout}
          style={{
            flex: 1,
            backgroundColor: COLORS.primary,
            borderRadius: 10,
            alignItems: "center",
            padding: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: "600" }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: COLORS.dark }}>
          Favoritos
        </Text>

        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          refreshing={loading}
          onRefresh={loadData}
          ListEmptyComponent={
            <Text style={{ color: "gray" }}>Aún no tienes inmuebles favoritos.</Text>
          }
          renderItem={renderFavorite}
        />
      </View>
      </View>
    </SafeAreaView>
  );
}
