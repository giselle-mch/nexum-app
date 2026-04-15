import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, toAssetUrl } from "../../services/api";
import { COLORS } from "../../constants/colors";
import { normalizePhoneToE164, toWhatsAppDigits } from "../../utils/phone";

type PropertyDetail = {
  id: number;
  title: string;
  description: string;
  price: number | null;
  type: string;
  phone: string | null;
  images: string[];
  location: {
    address: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
  };
  distanceKm?: number;
};

export default function PropertyDetailScreen({ route }: any) {
  const { id } = route.params;
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, []);

  const fetchProperty = async () => {
    try {
      const data = await api(`/properties/${id}`);
      setProperty(data as PropertyDetail);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No fue posible cargar el inmueble"
      );
    }
  };

  if (!property) return null;

  const coverImage =
    toAssetUrl(property.images?.[0]) ?? "https://via.placeholder.com/300";

  const onSaveFavorite = async () => {
    try {
      setLoadingFavorite(true);
      await api(`/favorites/${property.id}`, "POST");
      Alert.alert("Listo", "Inmueble guardado en favoritos");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No fue posible guardar favorito"
      );
    } finally {
      setLoadingFavorite(false);
    }
  };

  const onContact = async () => {
    if (!property.phone) {
      Alert.alert("Sin contacto", "Este inmueble no tiene teléfono registrado.");
      return;
    }

    const normalized = normalizePhoneToE164(property.phone);
    if (!normalized) {
      Alert.alert("Contacto inválido", "El teléfono del anuncio no es válido.");
      return;
    }

    const url = `tel:${normalized}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("No disponible", "No fue posible abrir la app de llamadas.");
      return;
    }
    await Linking.openURL(url);
  };

  const onScheduleVisit = async () => {
    if (!property.phone) {
      Alert.alert("Sin contacto", "Este inmueble no tiene teléfono registrado.");
      return;
    }

    const phone = toWhatsAppDigits(property.phone);
    if (!phone) {
      Alert.alert("Contacto inválido", "El teléfono del anuncio no es válido.");
      return;
    }

    const message = encodeURIComponent(
      `Hola, me interesa agendar una visita para: ${property.title} (ID ${property.id}).`
    );
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

    const supported = await Linking.canOpenURL(whatsappUrl);
    if (!supported) {
      Alert.alert("No disponible", "No se pudo abrir WhatsApp.");
      return;
    }

    await Linking.openURL(whatsappUrl);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
      <Image source={{ uri: coverImage }} style={{ width: "100%", height: 250 }} />

      {property.images?.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {property.images.slice(1).map((image, index) => (
            <Image
              key={`${image}-${index}`}
              source={{ uri: toAssetUrl(image) ?? "https://via.placeholder.com/300" }}
              style={{
                width: 110,
                height: 90,
                marginRight: 8,
                borderRadius: 8,
              }}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ padding: 15 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold" }}>{property.title}</Text>

        <Text style={{ fontSize: 18, color: "green" }}>
          {property.price !== null ? `$${property.price}` : "Precio a consultar"}
        </Text>

        <Text style={{ marginTop: 8, color: "gray" }}>Tipo: {property.type}</Text>

        <Text style={{ marginTop: 10 }}>{property.description}</Text>

        <Text style={{ marginTop: 10, color: "gray" }}>
          {property.location.address}, {property.location.city}
        </Text>

        {property.phone ? (
          <Text style={{ marginTop: 10 }}>Contacto: {property.phone}</Text>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <TouchableOpacity
            onPress={onContact}
            style={{
              flex: 1,
              backgroundColor: COLORS.secondary,
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "600" }}>Contactar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onScheduleVisit}
            style={{
              flex: 1,
              backgroundColor: "#0F9D58",
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "600" }}>Agendar visita</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onSaveFavorite}
          disabled={loadingFavorite}
          style={{
            marginTop: 16,
            backgroundColor: COLORS.primary,
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: "600" }}>
            {loadingFavorite ? "Guardando..." : "Guardar en favoritos"}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
