import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { api, toAssetUrl, uploadPropertyImage } from "../../services/api";
import { COLORS } from "../../constants/colors";
import { normalizePhoneToE164 } from "../../utils/phone";

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
};

type FormState = {
  titulo: string;
  descripcion: string;
  precio: string;
  tipo: string;
  direccion: string;
  ciudad: string;
  latitud: string;
  longitud: string;
  telefono_contacto: string;
};

const EMPTY_FORM: FormState = {
  titulo: "",
  descripcion: "",
  precio: "",
  tipo: "",
  direccion: "",
  ciudad: "",
  latitud: "",
  longitud: "",
  telefono_contacto: "",
};

export default function PropertyFormScreen({ route, navigation }: any) {
  const propertyId = route?.params?.propertyId as number | undefined;
  const isEdit = useMemo(() => typeof propertyId === "number", [propertyId]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && propertyId) {
      loadProperty(propertyId);
    }
  }, [isEdit, propertyId]);

  useEffect(() => {
    const selectedLocation = route?.params?.selectedLocation as
      | { lat: number; lng: number }
      | undefined;

    if (!selectedLocation) return;

    setForm((prev) => ({
      ...prev,
      latitud: String(selectedLocation.lat),
      longitud: String(selectedLocation.lng),
    }));

    navigation.setParams({ selectedLocation: undefined });
  }, [route?.params?.selectedLocation, navigation]);

  const loadProperty = async (id: number) => {
    try {
      setLoading(true);
      const data = (await api(`/properties/${id}`)) as PropertyDetail;
      setForm({
        titulo: data.title ?? "",
        descripcion: data.description ?? "",
        precio: data.price !== null && data.price !== undefined ? String(data.price) : "",
        tipo: data.type ?? "",
        direccion: data.location?.address ?? "",
        ciudad: data.location?.city ?? "",
        latitud:
          data.location?.lat !== null && data.location?.lat !== undefined
            ? String(data.location.lat)
            : "",
        longitud:
          data.location?.lng !== null && data.location?.lng !== undefined
            ? String(data.location.lng)
            : "",
        telefono_contacto: data.phone ?? "",
      });
      setExistingImages(Array.isArray(data.images) ? data.images : []);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No fue posible cargar el inmueble"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const onPickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Debes permitir acceso a fotos para subir imágenes.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setNewImageUris((prev) => [...prev, ...uris].slice(0, 8));
    }
  };

  const onSubmit = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.tipo.trim()) {
      Alert.alert("Campos requeridos", "Completa al menos título, descripción y tipo.");
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      precio: form.precio.trim() ? parseNumber(form.precio.trim()) : null,
      tipo: form.tipo.trim(),
      direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(),
      latitud: form.latitud.trim() ? parseNumber(form.latitud.trim()) : null,
      longitud: form.longitud.trim() ? parseNumber(form.longitud.trim()) : null,
      telefono_contacto: "",
    };

    if (payload.precio === null && form.precio.trim() !== "") {
      Alert.alert("Dato inválido", "El precio debe ser numérico.");
      return;
    }

    if (payload.latitud === null && form.latitud.trim() !== "") {
      Alert.alert("Dato inválido", "La latitud debe ser numérica.");
      return;
    }

    if (payload.longitud === null && form.longitud.trim() !== "") {
      Alert.alert("Dato inválido", "La longitud debe ser numérica.");
      return;
    }

    const rawPhone = form.telefono_contacto.trim();
    if (rawPhone) {
      const normalizedPhone = normalizePhoneToE164(rawPhone);
      if (!normalizedPhone) {
        Alert.alert(
          "Teléfono inválido",
          "Usa un teléfono válido. Ejemplo: 6561234567 o +526561234567."
        );
        return;
      }

      payload.telefono_contacto = normalizedPhone;
    }

    try {
      setSaving(true);
      let targetPropertyId = propertyId;

      if (isEdit && propertyId) {
        await api(`/properties/mine/${propertyId}`, "PUT", payload);
      } else {
        const created = await api("/properties", "POST", payload);
        if (created && typeof created === "object" && "id" in created) {
          targetPropertyId = Number(created.id);
        }
      }

      if (targetPropertyId && newImageUris.length > 0) {
        for (const uri of newImageUris) {
          await uploadPropertyImage(targetPropertyId, uri);
        }
      }

      Alert.alert("Listo", isEdit ? "Inmueble actualizado" : "Inmueble publicado");
      navigation.navigate("LandlordDashboard");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No fue posible guardar el inmueble"
      );
    } finally {
      setSaving(false);
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.primary }}>
        {isEdit ? "Editar inmueble" : "Publicar inmueble"}
      </Text>

      <TextInput
        placeholder="Título"
        value={form.titulo}
        onChangeText={(text) => updateField("titulo", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <TextInput
        placeholder="Descripción"
        multiline
        value={form.descripcion}
        onChangeText={(text) => updateField("descripcion", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, minHeight: 110, textAlignVertical: "top", backgroundColor: COLORS.white }}
      />

      <TextInput
        placeholder="Tipo (casa, local, terreno...)"
        value={form.tipo}
        onChangeText={(text) => updateField("tipo", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <TextInput
        placeholder="Precio"
        keyboardType="numeric"
        value={form.precio}
        onChangeText={(text) => updateField("precio", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <TextInput
        placeholder="Dirección"
        value={form.direccion}
        onChangeText={(text) => updateField("direccion", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <TextInput
        placeholder="Ciudad"
        value={form.ciudad}
        onChangeText={(text) => updateField("ciudad", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput
          placeholder="Latitud (automática al elegir en mapa)"
          keyboardType="decimal-pad"
          value={form.latitud}
          onChangeText={(text) => updateField("latitud", text)}
          style={{ flex: 1, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
        />

        <TextInput
          placeholder="Longitud (automática al elegir en mapa)"
          keyboardType="decimal-pad"
          value={form.longitud}
          onChangeText={(text) => updateField("longitud", text)}
          style={{ flex: 1, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
        />
      </View>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("LocationPicker", {
            formRouteKey: route.key,
            currentLat: form.latitud ? Number(form.latitud) : undefined,
            currentLng: form.longitud ? Number(form.longitud) : undefined,
          })
        }
        style={{
          backgroundColor: COLORS.secondary,
          borderRadius: 10,
          alignItems: "center",
          padding: 12,
        }}
      >
        <Text style={{ color: COLORS.white, fontWeight: "600" }}>
          Buscar ubicación en mapa
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Teléfono de contacto (+52...)"
        value={form.telefono_contacto}
        onChangeText={(text) => updateField("telefono_contacto", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <Text style={{ marginTop: 8, marginBottom: 2, color: COLORS.dark, fontWeight: "600" }}>
        Imágenes del inmueble
      </Text>

      {existingImages.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {existingImages.map((image, index) => (
            <Image
              key={`${image}-${index}`}
              source={{ uri: toAssetUrl(image) ?? "https://via.placeholder.com/300" }}
              style={{ width: 90, height: 70, borderRadius: 8 }}
            />
          ))}
        </ScrollView>
      ) : null}

      {newImageUris.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {newImageUris.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={{ width: 90, height: 70, borderRadius: 8 }}
            />
          ))}
        </ScrollView>
      ) : null}

      <TouchableOpacity
        onPress={onPickImages}
        style={{
          backgroundColor: COLORS.lightGray,
          borderRadius: 10,
          alignItems: "center",
          padding: 12,
        }}
      >
        <Text style={{ color: COLORS.dark, fontWeight: "600" }}>
          Seleccionar fotos ({newImageUris.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSubmit}
        disabled={saving}
        style={{
          backgroundColor: COLORS.primary,
          borderRadius: 10,
          alignItems: "center",
          padding: 14,
          marginTop: 6,
        }}
      >
        <Text style={{ color: COLORS.white, fontWeight: "700" }}>
          {saving ? "Guardando..." : isEdit ? "Actualizar" : "Publicar"}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
