import { doc, getDocFromServer, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  generateId,
  getCurrentUserProfile,
  JsonMap,
  normalizeRole,
  requireFirebaseUser,
  RouteContext,
  toPublicRole,
} from "./shared";

export const handleAuthRoute = async ({ path, method, payload }: RouteContext) => {
  if (path === "/auth/register" && method === "POST") {
    const firebaseUser = await requireFirebaseUser();
    const uid = String(payload.uid ?? firebaseUser.uid);

    if (uid !== firebaseUser.uid) {
      throw new Error("UID no coincide con sesión activa");
    }

    const userRef = doc(db, "users", uid);
    const existing = await getDocFromServer(userRef);

    if (existing.exists()) {
      const user = existing.data() as JsonMap;
      return {
        message: "Usuario ya existente",
        user: {
          id: Number(user.id),
          nombre: String(user.nombre ?? ""),
          email: String(user.email ?? firebaseUser.email ?? ""),
          telefono: (user.telefono as string | null) ?? null,
          rol: toPublicRole(String(user.rol ?? "usuario")),
        },
      };
    }

    const id = await generateId();
    const role = normalizeRole(String(payload.rol ?? "usuario"));

    await setDoc(userRef, {
      id,
      nombre: String(payload.nombre ?? ""),
      email: String(payload.email ?? firebaseUser.email ?? ""),
      telefono: (payload.telefono as string | null) ?? null,
      rol: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      message: "Usuario creado",
      user: {
        id,
        nombre: String(payload.nombre ?? ""),
        email: String(payload.email ?? firebaseUser.email ?? ""),
        telefono: (payload.telefono as string | null) ?? null,
        rol: toPublicRole(role),
      },
    };
  }

  if ((path === "/auth/user-profile" || path === "/users/profile") && method === "GET") {
    const user = await getCurrentUserProfile();
    return {
      message: "Perfil del usuario autenticado",
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
      },
    };
  }

  return null;
};