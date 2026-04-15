import { useAuthStore } from "../store/authStore";
import { Platform } from "react-native";

const getDefaultApiBaseUrl = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  getDefaultApiBaseUrl();
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

  formData.append("image", {
    uri,
    name: filename,
    type: guessMimeType(filename),
  } as any);

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
