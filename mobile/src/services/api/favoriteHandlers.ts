import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  buildFavoriteDocId,
  getCurrentUserProfile,
  JsonMap,
  RouteContext,
  toNumberOrNull,
} from "./shared";

const getPropertyIdFromFavorite = (data: JsonMap) => Number(data.property_id ?? 0);

export const handleFavoriteRoute = async ({ path, method }: RouteContext) => {
  if (path === "/favorites" && method === "GET") {
    const user = await getCurrentUserProfile();
    const propertyIds = new Set<number>();

    const byUidSnap = await getDocs(query(collection(db, "favorites"), where("user_uid", "==", user.uid)));
    byUidSnap.docs.forEach((docSnap) => {
      const propertyId = getPropertyIdFromFavorite(docSnap.data() as JsonMap);
      if (Number.isInteger(propertyId) && propertyId > 0) {
        propertyIds.add(propertyId);
      }
    });

    if (propertyIds.size === 0) {
      const legacySnap = await getDocs(
        query(collection(db, "favorites"), where("user_id", "==", user.id))
      );
      legacySnap.docs.forEach((docSnap) => {
        const propertyId = getPropertyIdFromFavorite(docSnap.data() as JsonMap);
        if (Number.isInteger(propertyId) && propertyId > 0) {
          propertyIds.add(propertyId);
        }
      });
    }

    const properties = await Promise.all(
      Array.from(propertyIds).map(async (id) => {
        const snap = await getDoc(doc(db, "properties", String(id)));
        if (!snap.exists()) return null;

        const property = snap.data() as JsonMap;
        return {
          id: Number(property.id),
          titulo: String(property.titulo ?? ""),
          precio: toNumberOrNull(property.precio),
          ciudad: String(property.ciudad ?? ""),
          tipo: String(property.tipo ?? ""),
        };
      })
    );

    return properties.filter(Boolean);
  }

  const favoriteById = path.match(/^\/favorites\/(\d+)$/);
  if (favoriteById && method === "POST") {
    const user = await getCurrentUserProfile();
    const propertyId = Number(favoriteById[1]);

    const propertySnap = await getDoc(doc(db, "properties", String(propertyId)));
    if (!propertySnap.exists()) {
      throw new Error("Propiedad no encontrada");
    }

    const favoriteDocId = buildFavoriteDocId(user.uid, propertyId);
    await setDoc(doc(db, "favorites", favoriteDocId), {
      id: favoriteDocId,
      user_uid: user.uid,
      user_id: user.id,
      property_id: propertyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { message: "Favorito agregado" };
  }

  if (favoriteById && method === "DELETE") {
    const user = await getCurrentUserProfile();
    const propertyId = Number(favoriteById[1]);
    const favoriteDocId = buildFavoriteDocId(user.uid, propertyId);

    await deleteDoc(doc(db, "favorites", favoriteDocId));

    const [byUidSnap, byIdSnap] = await Promise.all([
      getDocs(query(collection(db, "favorites"), where("user_uid", "==", user.uid))),
      getDocs(query(collection(db, "favorites"), where("user_id", "==", user.id))),
    ]);

    await Promise.all(
      [...byUidSnap.docs, ...byIdSnap.docs]
        .filter((docSnap) => getPropertyIdFromFavorite(docSnap.data() as JsonMap) === propertyId)
        .map((docSnap) => deleteDoc(docSnap.ref))
    );

    return { message: "Favorito eliminado" };
  }

  return null;
};