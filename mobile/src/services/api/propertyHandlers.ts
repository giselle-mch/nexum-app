import { collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  applyPropertyFilters,
  getCurrentUserProfile,
  isPropertyOwnedByUser,
  JsonMap,
  loadAllProperties,
  loadUserProperties,
  mapPropertyToDetail,
  mapPropertyToList,
  mapPropertyToMap,
  normalizeImageList,
  RouteContext,
  toNumberOrNull,
  toTimeMs,
  generateId,
} from "./shared";

const buildPropertyPayload = (payload: JsonMap, owner: { id: number; uid: string; nombre: string }) => ({
  titulo: String(payload.titulo ?? ""),
  descripcion: String(payload.descripcion ?? ""),
  precio: toNumberOrNull(payload.precio),
  operacion: String(payload.operacion ?? ""),
  tipo: String(payload.tipo ?? ""),
  direccion: String(payload.direccion ?? ""),
  ciudad: String(payload.ciudad ?? ""),
  estado: String(payload.estado ?? ""),
  colonia: String(payload.colonia ?? ""),
  codigo_postal: String(payload.codigo_postal ?? ""),
  latitud: toNumberOrNull(payload.latitud),
  longitud: toNumberOrNull(payload.longitud),
  telefono_contacto: (payload.telefono_contacto as string | null) ?? null,
  propietario_id: owner.id,
  ownerId: owner.uid,
  propietario_uid: owner.uid,
  owner_name: owner.nombre,
  imagenes: normalizeImageList(payload.imagenes),
});

export const handlePropertyRoute = async ({ path, method, payload, queryParams }: RouteContext) => {
  if (path === "/properties" && method === "GET") {
    return (await loadAllProperties()).map(mapPropertyToList).filter((item) => item.id !== null);
  }

  if (path === "/properties/search" && method === "GET") {
    return applyPropertyFilters(await loadAllProperties(), queryParams)
      .map(mapPropertyToList)
      .filter((item) => item.id !== null);
  }

  if (path === "/properties/map" && method === "GET") {
    const minLat = toNumberOrNull(queryParams?.minLat);
    const maxLat = toNumberOrNull(queryParams?.maxLat);
    const minLng = toNumberOrNull(queryParams?.minLng);
    const maxLng = toNumberOrNull(queryParams?.maxLng);
    const limitValue = toNumberOrNull(queryParams?.limit) ?? 300;

    return (await loadAllProperties())
      .filter((item) => {
        const lat = toNumberOrNull(item.latitud);
        const lng = toNumberOrNull(item.longitud);

        if (lat === null || lng === null) return false;
        if (minLat !== null && lat < minLat) return false;
        if (maxLat !== null && lat > maxLat) return false;
        if (minLng !== null && lng < minLng) return false;
        if (maxLng !== null && lng > maxLng) return false;

        return true;
      })
      .slice(0, limitValue)
      .map(mapPropertyToMap)
      .filter((item) => item.id !== null);
  }

  const propertyById = path.match(/^\/properties\/(\d+)$/);
  if (propertyById && method === "GET") {
    const propertyId = Number(propertyById[1]);
    const snap = await getDoc(doc(db, "properties", String(propertyId)));

    if (!snap.exists()) {
      throw new Error("Propiedad no encontrada");
    }

    return mapPropertyToDetail(snap.data() as JsonMap);
  }

  if (path === "/properties" && method === "POST") {
    const user = await getCurrentUserProfile();
    if (user.dbRole !== "arrendador" && user.dbRole !== "admin") {
      throw new Error("No autorizado para publicar inmuebles");
    }

    const id = await generateId();
    const property = {
      id,
      ...buildPropertyPayload(payload, user),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "properties", String(id)), property);
    return mapPropertyToDetail(property);
  }

  if (path === "/properties/mine" && method === "GET") {
    const user = await getCurrentUserProfile();
    return (await loadUserProperties(user))
      .sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt))
      .map(mapPropertyToList)
      .filter((item) => item.id !== null);
  }

  const mineById = path.match(/^\/properties\/mine\/(\d+)$/);
  if (mineById && method === "PUT") {
    const user = await getCurrentUserProfile();
    const propertyId = Number(mineById[1]);
    const propertyRef = doc(db, "properties", String(propertyId));
    const snap = await getDoc(propertyRef);

    if (!snap.exists()) {
      throw new Error("Propiedad no encontrada");
    }

    const current = snap.data() as JsonMap;
    if (!isPropertyOwnedByUser(current, user)) {
      throw new Error("No autorizado");
    }

    await updateDoc(propertyRef, {
      ...buildPropertyPayload({ ...current, ...payload, imagenes: payload.imagenes ?? current.imagenes }, user),
      propietario_uid: String(current.propietario_uid ?? user.uid),
      owner_name: String(current.owner_name ?? user.nombre),
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(propertyRef);
    return mapPropertyToDetail(updated.data() as JsonMap);
  }

  if (mineById && method === "DELETE") {
    const user = await getCurrentUserProfile();
    const propertyId = Number(mineById[1]);
    const propertyRef = doc(db, "properties", String(propertyId));
    const snap = await getDoc(propertyRef);

    if (!snap.exists()) {
      throw new Error("Propiedad no encontrada");
    }

    const current = snap.data() as JsonMap;
    if (!isPropertyOwnedByUser(current, user)) {
      throw new Error("No autorizado");
    }

    await deleteDoc(propertyRef);
    return { message: "Propiedad eliminada" };
  }

  return null;
};