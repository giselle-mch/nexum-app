import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export type AuthUser = {
  id: number;
  nombre?: string;
  email: string;
  telefono?: string;
  rol: "usuario" | "arrendador" | "admin" | string;
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  firebaseUser: User | null;
  login: (token: string, user?: AuthUser | null) => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
  setFirebaseUser: (firebaseUser: User | null) => void;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  firebaseUser: null,

  login: async (token, user = null) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    set({ token, user });
  },

  setUser: async (user) => {
    await AsyncStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  setFirebaseUser: (firebaseUser) => {
    set({ firebaseUser });
  },

  clearSession: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ token: null, user: null, firebaseUser: null });
  },

  logout: async () => {
    await signOut(auth);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    set({ token: null, user: null, firebaseUser: null });
  },

  loadSession: async () => {
    const token = await AsyncStorage.getItem("token");
    const user = await AsyncStorage.getItem("user");
    const firebaseUser = auth.currentUser;

    if (token && user) {
      let parsedUser: AuthUser | null = null;
      try {
        parsedUser = JSON.parse(user) as AuthUser | null;
      } catch {
        parsedUser = null;
      }

      set({
        token,
        user: parsedUser,
        firebaseUser,
      });

      return;
    }

    if (token) {
      set({
        token,
        user: null,
        firebaseUser,
      });
    }

  },
}));
