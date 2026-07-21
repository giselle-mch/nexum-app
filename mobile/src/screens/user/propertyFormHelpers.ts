import { normalizePhoneToE164 } from "../../utils/phone";

export type PropertyDetail = {
  id: number;
  title: string;
  description: string;
  price: number | null;
  operation?: string;
  type: string;
  phone: string | null;
  images: string[];
  location: {
    address: string | null;
    city: string | null;
    state?: string | null;
    neighborhood: string | null;
    postalCode: string | null;
    lat: number | null;
    lng: number | null;
  };
};

export type FormState = {
  titulo: string;
  descripcion: string;
  precio: string;
  operacion: string;
  tipo: string;
  direccion: string;
  ciudad: string;
  estado: string;
  colonia: string;
  codigo_postal: string;
  latitud: string;
  longitud: string;
  telefono_contacto: string;
};

export const EMPTY_FORM: FormState = {
  titulo: "",
  descripcion: "",
  precio: "",
  operacion: "",
  tipo: "",
  direccion: "",
  ciudad: "",
  estado: "",
  colonia: "",
  codigo_postal: "",
  latitud: "",
  longitud: "",
  telefono_contacto: "",
};

export const PROPERTY_TYPES = [
  "Casa",
  "Departamento",
  "Cuarto",
  "Local",
  "Oficina",
  "Terreno",
  "Bodega",
  "Loft",
];

export const PROPERTY_OPERATIONS = ["Renta", "Venta", "Renta y venta"];

export const isPermissionDeniedError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const typedError = error as { code?: string; message?: string };
  const code = String(typedError.code ?? "").toLowerCase();
  const message = String(typedError.message ?? "").toLowerCase();
  return (
    code.includes("permission-denied") ||
    message.includes("permission-denied") ||
    message.includes("missing or insufficient permissions")
  );
};

export const mapPropertyToForm = (property: PropertyDetail): FormState => ({
  titulo: property.title ?? "",
  descripcion: property.description ?? "",
  precio: property.price !== null && property.price !== undefined ? String(property.price) : "",
  operacion: property.operation ?? "",
  tipo: property.type ?? "",
  direccion: property.location?.address ?? "",
  ciudad: property.location?.city ?? "",
  estado: property.location?.state ?? "",
  colonia: property.location?.neighborhood ?? "",
  codigo_postal: property.location?.postalCode ?? "",
  latitud:
    property.location?.lat !== null && property.location?.lat !== undefined
      ? String(property.location.lat)
      : "",
  longitud:
    property.location?.lng !== null && property.location?.lng !== undefined
      ? String(property.location.lng)
      : "",
  telefono_contacto: property.phone ?? "",
});

export const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const mergeImageLinks = (existingImages: string[], newImageLinks: string[]) =>
  Array.from(new Set([...existingImages, ...newImageLinks])).filter(Boolean);

export const buildGeneratedImageLink = (form: FormState, currentCount: number) => {
  const seedBase = [
    form.titulo.trim(),
    form.ciudad.trim(),
    form.colonia.trim(),
    String(Date.now()),
    String(currentCount + 1),
  ]
    .filter(Boolean)
    .join("-")
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `https://picsum.photos/seed/${encodeURIComponent(seedBase || "nexum")}/1200/800`;
};

export const buildPropertyPayload = (form: FormState, imageLinks: string[]) => ({
  titulo: form.titulo.trim(),
  descripcion: form.descripcion.trim(),
  precio: form.precio.trim() ? parseNumber(form.precio.trim()) : null,
  operacion: form.operacion.trim(),
  tipo: form.tipo.trim(),
  direccion: form.direccion.trim(),
  ciudad: form.ciudad.trim(),
  estado: form.estado.trim(),
  colonia: form.colonia.trim(),
  codigo_postal: form.codigo_postal.trim(),
  latitud: form.latitud.trim() ? parseNumber(form.latitud.trim()) : null,
  longitud: form.longitud.trim() ? parseNumber(form.longitud.trim()) : null,
  telefono_contacto: "",
  imagenes: imageLinks,
});

export const validatePropertyPayload = (form: FormState, canManageProperties: boolean) => {
  if (!canManageProperties) {
    return "Tu cuenta actual no tiene permisos de arrendador. Inicia sesión con una cuenta arrendador para publicar inmuebles.";
  }

  if (!form.titulo.trim() || !form.descripcion.trim() || !form.operacion.trim() || !form.tipo.trim()) {
    return "Completa al menos título, descripción, operación y tipo.";
  }

  const payload = buildPropertyPayload(form, []);

  if (payload.precio === null && form.precio.trim() !== "") {
    return "El precio debe ser numérico.";
  }

  if (payload.latitud === null && form.latitud.trim() !== "") {
    return "La latitud debe ser numérica.";
  }

  if (payload.longitud === null && form.longitud.trim() !== "") {
    return "La longitud debe ser numérica.";
  }

  if (payload.codigo_postal && !/^\d{5}$/.test(payload.codigo_postal)) {
    return "El código postal debe contener 5 dígitos.";
  }

  if (payload.latitud === null || payload.longitud === null) {
    return "Selecciona la ubicación del inmueble en el mapa.";
  }

  if (payload.latitud < -90 || payload.latitud > 90 || payload.longitud < -180 || payload.longitud > 180) {
    return "La ubicación seleccionada está fuera de los rangos permitidos.";
  }

  const rawPhone = form.telefono_contacto.trim();
  if (rawPhone && !normalizePhoneToE164(rawPhone)) {
    return "Usa un teléfono válido. Ejemplo: 6561234567 o +526561234567.";
  }

  return null;
};

export const normalizeContactPhone = (rawPhone: string) => {
  if (!rawPhone.trim()) return "";
  return normalizePhoneToE164(rawPhone.trim()) ?? null;
};