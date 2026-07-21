import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDocFromServer,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export type QueryValue = string | number | undefined | null;
export type QueryMap = Record<string, QueryValue>;
export type JsonMap = Record<string, unknown>;

export type UserProfile = {
  uid: string;
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: string;
  dbRole: string;
};

export type RouteContext = {
  path: string;
  method: string;
  payload: JsonMap;
  queryParams?: QueryMap;
};

export const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isAbsoluteUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

const isBlockedPlaceholderUrl = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("via.placeholder.com/");
};

const sanitizeImageUrls = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0)
        .filter((item) => isAbsoluteUrl(item))
        .filter((item) => !isBlockedPlaceholderUrl(item))
    )
  ).slice(0, 8);
};

export const toAssetUrl = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (!isAbsoluteUrl(normalized)) return null;
  if (isBlockedPlaceholderUrl(normalized)) return null;
  return normalized;
};

export const normalizeRole = (role?: string | null) => {
  if (role === "arrendador" || role === "admin") return role;
  return "usuario";
};

export const toPublicRole = (role?: string | null) => {
  if (role === "usuario") return "cliente";
  return role ?? "cliente";
};

export const toISODate = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const withDate = value as { toDate: () => Date };
    return withDate.toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
};

export const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const normalizeImageList = (value: unknown) => sanitizeImageUrls(value);

export const toTimeMs = (value: unknown) => {
  const iso = toISODate(value);
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
};

const fallbackNumericId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

export const generateId = async () => Promise.resolve(fallbackNumericId());

export const requireFirebaseUser = async () => {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const firebaseUser = await new Promise<User | null>((resolve) => {
    const timeout = setTimeout(() => resolve(null), 1500);
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });

  if (!firebaseUser) {
    throw new Error("Usuario no autenticado");
  }

  return firebaseUser;
};

export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const firebaseUser = await requireFirebaseUser();
  const userSnap = await getDocFromServer(doc(db, "users", firebaseUser.uid));

  if (!userSnap.exists()) {
    throw new Error("Usuario no registrado en Firestore");
  }

  const user = userSnap.data() as JsonMap;
  return {
    uid: firebaseUser.uid,
    id: Number(user.id),
    nombre: String(user.nombre ?? ""),
    email: String(user.email ?? firebaseUser.email ?? ""),
    telefono: (user.telefono as string | null) ?? null,
    rol: toPublicRole(String(user.rol ?? "usuario")),
    dbRole: String(user.rol ?? "usuario"),
  };
};

export const isPropertyOwnedByUser = (
  property: JsonMap,
  user: Pick<UserProfile, "id" | "uid">
) => {
  const ownerUid = String(property.ownerId ?? "").trim();
  const ownerUidLegacy = String(property.propietario_uid ?? "").trim();
  const ownerNumericId = Number(property.propietario_id ?? 0);
  return ownerUid === user.uid || ownerUidLegacy === user.uid || ownerNumericId === user.id;
};

export const buildFavoriteDocId = (userUid: string, propertyId: number) =>
  `${userUid}_${propertyId}`;

export const mapPropertyToList = (property: JsonMap) => {
  const images = sanitizeImageUrls(property.imagenes);

  return {
    id: toFiniteNumber(property.id),
    title: String(property.titulo ?? ""),
    price: toNumberOrNull(property.precio),
    type: String(property.tipo ?? ""),
    city: String(property.ciudad ?? ""),
    thumbnail: images[0] ?? null,
    imagesCount: images.length,
    location: {
      lat: toNumberOrNull(property.latitud),
      lng: toNumberOrNull(property.longitud),
    },
  };
};

export const mapPropertyToMap = (property: JsonMap) => {
  const images = sanitizeImageUrls(property.imagenes);

  return {
    id: toFiniteNumber(property.id),
    titulo: String(property.titulo ?? ""),
    precio: toNumberOrNull(property.precio),
    latitud: toNumberOrNull(property.latitud),
    longitud: toNumberOrNull(property.longitud),
    imagen_principal: images[0] ?? null,
  };
};

export const mapPropertyToDetail = (property: JsonMap) => {
  const images = sanitizeImageUrls(property.imagenes);
  const ownerId = Number(property.propietario_id ?? 0);
  const ownerName = String(property.owner_name ?? property.propietario_nombre ?? "") || null;

  return {
    id: toFiniteNumber(property.id),
    title: String(property.titulo ?? ""),
    description: String(property.descripcion ?? ""),
    price: toNumberOrNull(property.precio),
    operation: String(property.operacion ?? ""),
    type: String(property.tipo ?? ""),
    phone: (property.telefono_contacto as string | null) ?? null,
    images,
    location: {
      address: (property.direccion as string | null) ?? null,
      city: (property.ciudad as string | null) ?? null,
      state: (property.estado as string | null) ?? null,
      neighborhood: (property.colonia as string | null) ?? null,
      postalCode: (property.codigo_postal as string | null) ?? null,
      lat: toNumberOrNull(property.latitud),
      lng: toNumberOrNull(property.longitud),
    },
    owner: {
      id: ownerId,
      name: ownerName,
    },
    createdAt: toISODate(property.createdAt),
  };
};

export const applyPropertyFilters = (items: JsonMap[], filters?: QueryMap) => {
  if (!filters) return items;

  const ciudad = String(filters.ciudad ?? "").trim().toLowerCase();
  const tipo = String(filters.tipo ?? "").trim().toLowerCase();
  const colonia = String(filters.colonia ?? "").trim().toLowerCase();
  const codigoPostal = String(filters.codigo_postal ?? "").trim();
  const precioMin = toNumberOrNull(filters.precio_min);
  const precioMax = toNumberOrNull(filters.precio_max);

  return items.filter((item) => {
    const itemCity = String(item.ciudad ?? "").toLowerCase();
    const itemType = String(item.tipo ?? "").toLowerCase();
    const itemColonia = String(item.colonia ?? "").toLowerCase();
    const itemPostal = String(item.codigo_postal ?? "");
    const itemPrice = toNumberOrNull(item.precio);

    if (ciudad && !itemCity.includes(ciudad)) return false;
    if (tipo && itemType !== tipo) return false;
    if (colonia && !itemColonia.includes(colonia)) return false;
    if (codigoPostal && itemPostal !== codigoPostal) return false;
    if (precioMin !== null && (itemPrice === null || itemPrice < precioMin)) return false;
    if (precioMax !== null && (itemPrice === null || itemPrice > precioMax)) return false;

    return true;
  });
};

export const loadAllProperties = async () => {
  const propertiesQuery = query(collection(db, "properties"), orderBy("createdAt", "desc"));
  const snap = await getDocs(propertiesQuery);

  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as JsonMap;
    return {
      ...data,
      id: toFiniteNumber(data.id) ?? toFiniteNumber(docSnap.id),
    } as JsonMap;
  });
};

export const loadUserProperties = async (user: UserProfile) => {
  const ownerFields: Array<[string, string | number]> = [
    ["ownerId", user.uid],
    ["propietario_uid", user.uid],
    ["propietario_id", user.id],
  ];

  for (const [field, value] of ownerFields) {
    const snap = await getDocs(query(collection(db, "properties"), where(field, "==", value)));
    if (!snap.empty) {
      return snap.docs.map((docSnap) => docSnap.data() as JsonMap);
    }
  }

  return [] as JsonMap[];
};

export const parseEndpoint = (endpoint: string) => endpoint.split("?")[0];

export const normalizeApiError = (error: unknown, path: string) => {
  if (error instanceof Error) {
    const message = error.message || "";
    const lowered = message.toLowerCase();

    if (message === "Usuario no autenticado") {
      return new Error("Tu sesión expiró. Inicia sesión de nuevo.");
    }

    if (message === "Usuario no registrado en Firestore") {
      return new Error(
        "No encontramos tu perfil. Cierra sesión y vuelve a entrar para sincronizar tu cuenta."
      );
    }

    if (message === "No autorizado para publicar inmuebles") {
      return new Error("Tu cuenta no tiene permisos de arrendador para publicar inmuebles.");
    }

    if (
      lowered.includes("missing or insufficient permissions") ||
      lowered.includes("permission-denied")
    ) {
      if (path === "/properties") {
        return new Error(
          "No fue posible publicar el inmueble por permisos de la cuenta. Verifica que tu usuario sea arrendador."
        );
      }
      return new Error("No tienes permisos para realizar esta acción.");
    }
  }

  return error;
};