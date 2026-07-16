import { useAuthStore } from "../store/authStore";
import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getHostFromUrl = (value?: string | null) => {
  if (!value) return null;

  try {
    const normalized = value.includes("://") ? value : `http://${value}`;
    return new URL(normalized).hostname;
  } catch (_error) {
    const match = value.match(/^[a-z]+:\/\/([^/:?#]+)/i);
    return match?.[1] ?? null;
  }
};

const getExpoDevServerHost = () => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.hostname;
  }

  // Expo Go publica la IP de Metro en hostUri. SourceCode queda como
  // respaldo para builds de desarrollo que no incluyen ese manifiesto.
  const expoHost = getHostFromUrl(Constants.expoConfig?.hostUri);
  if (expoHost) return expoHost;

  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  return getHostFromUrl(scriptURL);
};

const getDefaultApiBaseUrl = () => {
  const devServerHost = getExpoDevServerHost();

  // En Expo Go, el manifiesto contiene el host LAN actual de Metro.
  if (devServerHost && devServerHost !== "localhost") {
    return `http://${devServerHost}:3000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
};

// En desarrollo, Expo expone la IP actual de la computadora mediante
// `hostUri`. Usamos esa IP para que un cambio de red no deje la app
// apuntando a una dirección anterior. La variable de entorno queda como
// una sobrescritura opcional para un backend desplegado.
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_BASE_URL = trimTrailingSlash(
  configuredApiUrl || getDefaultApiBaseUrl()
);
const API_URL = `${API_BASE_URL}/api`;

const isAbsoluteUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

export const toAssetUrl = (value?: string | null) => {
  if (!value) return null;
  return isAbsoluteUrl(value) ? value : `${API_BASE_URL}${value}`;
};

export const buildApiUrl = (
  endpoint: string,
  query?: Record<string, string | number | undefined | null>
) => {
  const url = new URL(`${API_URL}${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

export const api = async (
  endpoint: string,
  method = "GET",
  body?: unknown,
  query?: Record<string, string | number | undefined | null>
) => {
  const token = useAuthStore.getState().token;

  let res: Response;

  try {
    res = await fetch(buildApiUrl(endpoint, query), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(
      `No se pudo conectar al backend (${API_BASE_URL}). Verifica que el servidor esté encendido y accesible en red.`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : null) ?? "Error de comunicación con el servidor";
    throw new Error(message);
  }

  return payload;
};

const guessMimeType = (uri: string) => {
  if (uri.endsWith(".png")) return "image/png";
  if (uri.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
};

export const uploadPropertyImage = async (propertyId: number, uri: string) => {
  const token = useAuthStore.getState().token;
  const filename = uri.split("/").pop() || `image-${Date.now()}.jpg`;
  const formData = new FormData();

  if (Platform.OS === "web") {
    const imageResponse = await fetch(uri);
    const imageBlob = await imageResponse.blob();
    formData.append("image", imageBlob, filename);
  } else {
    formData.append("image", {
      uri,
      name: filename,
      type: guessMimeType(filename),
    } as any);
  }

  let res: Response;

  try {
    res = await fetch(buildApiUrl(`/images/${propertyId}`), {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
  } catch (_error) {
    throw new Error(
      `No se pudo conectar al backend (${API_BASE_URL}). Verifica que el servidor esté encendido y accesible en red.`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : null) ?? "No fue posible subir la imagen";
    throw new Error(message);
  }

  return payload;
};
