import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  login: (token: string, user?: AuthUser | null) => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  login: async (token, user = null) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    set({ token, user });
  },

  setUser: async (user) => {
    await AsyncStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    set({ token: null, user: null });
  },

  loadSession: async () => {
    const token = await AsyncStorage.getItem("token");
    const user = await AsyncStorage.getItem("user");

    if (token && user) {
      set({
        token,
        user: JSON.parse(user) as AuthUser,
      });
      return;
    }

    if (token) {
      set({
        token,
        user: null,
      });
    }
  },
}));
