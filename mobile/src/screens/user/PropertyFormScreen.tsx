import { useEffect, useMemo, useRef, useState } from "react";
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
import { api, toAssetUrl } from "../../services/api";
import { lookupPostalCode } from "../../services/postalLookup";
import { COLORS } from "../../constants/colors";
import { logAppError } from "../../utils/debug";
import { useAuthStore } from "../../store/authStore";
import BackButton from "../../components/BackButton";
import {
  buildGeneratedImageLink,
  buildPropertyPayload,
  EMPTY_FORM,
  FormState,
  isPermissionDeniedError,
  mapPropertyToForm,
  mergeImageLinks,
  normalizeContactPhone,
  PROPERTY_OPERATIONS,
  PROPERTY_TYPES,
  PropertyDetail,
  validatePropertyPayload,
} from "./propertyFormHelpers";

export default function PropertyFormScreen({ route, navigation }: any) {
  const propertyId = route?.params?.propertyId as number | undefined;
  const isEdit = useMemo(() => typeof propertyId === "number", [propertyId]);
  const userRole = useAuthStore((state) => state.user?.rol);
  const canManageProperties = userRole === "arrendador" || userRole === "admin";

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageLinks, setNewImageLinks] = useState<string[]>([]);
  const [draftImageLink, setDraftImageLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);
  const [postalLookupMessage, setPostalLookupMessage] = useState("");
  const [coloniaOptions, setColoniaOptions] = useState<string[]>([]);
  const [postalLookupSources, setPostalLookupSources] = useState("");
  const lastPostalLookupRef = useRef<string>("");

  useEffect(() => {
    if (isEdit && propertyId) {
      loadProperty(propertyId);
    }
  }, [isEdit, propertyId]);

  useEffect(() => {
    const selectedLocation = route?.params?.selectedLocation as
      | {
          lat: number;
          lng: number;
          address?: string;
          city?: string;
          state?: string;
          neighborhood?: string;
          postalCode?: string;
        }
      | undefined;

    if (!selectedLocation) return;

    setForm((prev) => ({
      ...prev,
      latitud: String(selectedLocation.lat),
      longitud: String(selectedLocation.lng),
      direccion: selectedLocation.address || prev.direccion,
      ciudad: selectedLocation.city || prev.ciudad,
      estado: selectedLocation.state || prev.estado,
      colonia: selectedLocation.neighborhood || prev.colonia,
      codigo_postal: selectedLocation.postalCode || prev.codigo_postal,
    }));

    navigation.setParams({ selectedLocation: undefined });
  }, [route?.params?.selectedLocation, navigation]);

  const loadProperty = async (id: number) => {
    try {
      setLoading(true);
      const data = (await api(`/properties/${id}`)) as PropertyDetail;
      setForm(mapPropertyToForm(data));
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

  const lookupAddressByPostalCode = async (postalCode: string) => {
    if (!/^\d{5}$/.test(postalCode)) return;

    try {
      setPostalLookupLoading(true);
      setPostalLookupMessage("");
      setPostalLookupSources("");
      const result = await lookupPostalCode(postalCode);
      if (!result) {
        return;
      }

      setForm((prev) => ({
        ...prev,
        ciudad: result.city || prev.ciudad,
        estado: result.state || prev.estado,
        colonia: result.neighborhood || prev.colonia,
        direccion: result.street || prev.direccion,
      }));
      setColoniaOptions(result.neighborhoods);
      setPostalLookupMessage(result.message);
      setPostalLookupSources(result.sources);
    } catch (error) {
      logAppError("PropertyFormScreen.lookupAddressByPostalCode", error, { postalCode });
      setPostalLookupMessage(
        error instanceof Error
          ? error.message
          : "No fue posible autocompletar el domicilio"
      );
      setPostalLookupSources("");
    } finally {
      setPostalLookupLoading(false);
    }
  };

  useEffect(() => {
    const postalCode = form.codigo_postal.trim();
    if (!/^\d{5}$/.test(postalCode)) {
      setColoniaOptions([]);
      setPostalLookupMessage("");
      setPostalLookupSources("");
      return;
    }
    if (postalCode === lastPostalLookupRef.current) return;

    const timer = setTimeout(() => {
      lastPostalLookupRef.current = postalCode;
      lookupAddressByPostalCode(postalCode);
    }, 450);

    return () => clearTimeout(timer);
  }, [form.codigo_postal]);

  const allImageLinks = mergeImageLinks(existingImages, newImageLinks);

  const addImageLink = () => {
    const value = draftImageLink.trim();

    if (!value) return;
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      Alert.alert("Link inválido", "La imagen debe ser un link http o https.");
      return;
    }

    setNewImageLinks((prev) => Array.from(new Set([...prev, value])).slice(0, 8));
    setDraftImageLink("");
  };

  const removeImageLink = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((item) => item !== imageUrl));
    setNewImageLinks((prev) => prev.filter((item) => item !== imageUrl));
  };

  const addGeneratedImageLink = () => {
    const generatedLink = buildGeneratedImageLink(form, allImageLinks.length);
    setNewImageLinks((prev) => Array.from(new Set([...prev, generatedLink])).slice(0, 8));
  };

  const onSubmit = async () => {
    const validationMessage = validatePropertyPayload(form, canManageProperties);
    if (validationMessage) {
      Alert.alert(
        canManageProperties ? "Dato inválido" : "Sin permisos para publicar",
        validationMessage
      );
      return;
    }

    const payload = buildPropertyPayload(form, allImageLinks);
    const normalizedPhone = normalizeContactPhone(form.telefono_contacto);
    if (normalizedPhone) {
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

      Alert.alert("Listo", isEdit ? "Inmueble actualizado" : "Inmueble publicado");
      navigation.navigate("LandlordDashboard");
    } catch (error) {
      logAppError("PropertyFormScreen.onSave", error, {
        isEdit,
        propertyId,
        newImagesCount: newImageLinks.length,
      });

      if (isPermissionDeniedError(error)) {
        Alert.alert(
          "Permisos insuficientes",
          "Tu cuenta no tiene permisos para completar esta operación en Firebase. Verifica las reglas de Firestore para propiedades del arrendador."
        );
        return;
      }

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
      <BackButton
        onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("LandlordDashboard"))}
      />

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

      <View style={{ gap: 8 }}>
        <Text style={{ color: COLORS.dark, fontWeight: "600" }}>Operación</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PROPERTY_OPERATIONS.map((operation) => {
            const selected = form.operacion === operation;
            return (
              <TouchableOpacity
                key={operation}
                onPress={() => updateField("operacion", operation)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? COLORS.primary : COLORS.lightGray,
                  backgroundColor: selected ? "#E6F0FF" : COLORS.white,
                }}
              >
                <Text style={{ color: selected ? COLORS.primary : COLORS.dark, fontWeight: "600" }}>
                  {operation}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: COLORS.dark, fontWeight: "600" }}>Tipo de inmueble</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PROPERTY_TYPES.map((propertyType) => {
            const selected = form.tipo === propertyType;
            return (
              <TouchableOpacity
                key={propertyType}
                onPress={() => updateField("tipo", propertyType)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? COLORS.primary : COLORS.lightGray,
                  backgroundColor: selected ? "#E6F0FF" : COLORS.white,
                }}
              >
                <Text style={{ color: selected ? COLORS.primary : COLORS.dark, fontWeight: "600" }}>
                  {propertyType}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TextInput
        placeholder="Código postal"
        keyboardType="number-pad"
        maxLength={5}
        value={form.codigo_postal}
        onChangeText={(text) => updateField("codigo_postal", text.replace(/\D/g, ""))}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      {postalLookupLoading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={{ color: COLORS.secondary }}>Buscando datos por código postal...</Text>
        </View>
      ) : null}

      {postalLookupMessage ? (
        <Text style={{ color: postalLookupMessage.startsWith("No fue posible") ? "#B42318" : COLORS.secondary }}>
          {postalLookupMessage}
        </Text>
      ) : null}

      {postalLookupSources ? (
        <Text style={{ color: COLORS.secondary, fontSize: 12 }}>{postalLookupSources}</Text>
      ) : null}

      <TextInput
        placeholder="Estado"
        value={form.estado}
        onChangeText={(text) => updateField("estado", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <TextInput
        placeholder="Ciudad"
        value={form.ciudad}
        onChangeText={(text) => updateField("ciudad", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <View style={{ gap: 6 }}>
        <Text style={{ color: COLORS.dark, fontWeight: "600" }}>Colonia</Text>

        {!postalLookupLoading && form.codigo_postal.length === 5 && coloniaOptions.length === 0 ? (
          <TouchableOpacity
            onPress={() => lookupAddressByPostalCode(form.codigo_postal.trim())}
            style={{ alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#E6F0FF" }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Reintentar búsqueda de colonias</Text>
          </TouchableOpacity>
        ) : null}

        {coloniaOptions.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {coloniaOptions.map((option) => {
              const selected = form.colonia === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => updateField("colonia", option)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 11,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.lightGray,
                    backgroundColor: selected ? "#E6F0FF" : COLORS.white,
                  }}
                >
                  <Text style={{ color: selected ? COLORS.primary : COLORS.dark, fontWeight: "600" }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <TextInput
          placeholder="Colonia"
          value={form.colonia}
          onChangeText={(text) => updateField("colonia", text)}
          style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
        />
      </View>

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

      <View style={{ padding: 12, borderRadius: 10, backgroundColor: form.latitud && form.longitud ? "#EAF7EE" : "#FFF4CE" }}>
        <Text style={{ color: COLORS.dark, fontWeight: "600" }}>
          {form.latitud && form.longitud
            ? `Ubicación confirmada${form.colonia ? ` en ${form.colonia}` : ""}${form.codigo_postal ? `, CP ${form.codigo_postal}` : ""}`
            : "Selecciona la ubicación en el mapa antes de publicar."}
        </Text>
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
          {form.latitud && form.longitud ? "Cambiar ubicación en mapa" : "Seleccionar ubicación en mapa"}
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Teléfono de contacto (+52...)"
        value={form.telefono_contacto}
        onChangeText={(text) => updateField("telefono_contacto", text)}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <Text style={{ marginTop: 8, marginBottom: 2, color: COLORS.dark, fontWeight: "600" }}>
        Links de imágenes
      </Text>

      <TouchableOpacity
        onPress={addGeneratedImageLink}
        style={{ backgroundColor: "#E6F0FF", borderRadius: 10, alignItems: "center", padding: 12 }}
      >
        <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
          Generar link automáticamente ({allImageLinks.length}/8)
        </Text>
      </TouchableOpacity>

      {allImageLinks.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {allImageLinks.map((image, index) => (
            <TouchableOpacity key={`${image}-${index}`} onPress={() => removeImageLink(image)} activeOpacity={0.9}>
              <Image
                source={{ uri: toAssetUrl(image) ?? undefined }}
                style={{ width: 90, height: 70, borderRadius: 8, backgroundColor: COLORS.lightGray }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <TextInput
        placeholder="Opcional: pega aquí el link de una imagen"
        value={draftImageLink}
        onChangeText={setDraftImageLink}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 12, backgroundColor: COLORS.white }}
      />

      <TouchableOpacity
        onPress={addImageLink}
        style={{ backgroundColor: COLORS.lightGray, borderRadius: 10, alignItems: "center", padding: 12 }}
      >
        <Text style={{ color: COLORS.dark, fontWeight: "600" }}>
          Agregar link de imagen ({allImageLinks.length}/8)
        </Text>
      </TouchableOpacity>

      {allImageLinks.length > 0 ? (
        <Text style={{ color: COLORS.secondary, fontSize: 12 }}>
          Toca una imagen para quitarla del inmueble.
        </Text>
      ) : null}

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
