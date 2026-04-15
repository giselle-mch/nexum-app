import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";

import LoginScreen from "../screens/auth/LoginScreen";
import MapScreen from "../screens/user/MapScreen";
import { useAuthStore } from "../store/authStore";
import PropertyListScreen from "../screens/user/PropertyListScreen";
import PropertyDetailScreen from "../screens/user/PropertyDetailScreen";
import ProfileScreen from "../screens/user/ProfileScreen";
import LandlordDashboardScreen from "../screens/user/LandlordDashboardScreen";
import PropertyFormScreen from "../screens/user/PropertyFormScreen";
import LocationPickerScreen from "../screens/user/LocationPickerScreen";
import { api } from "../services/api";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, user, loadSession, setUser } = useAuthStore();
  const canManageProperties = user?.rol === "arrendador" || user?.rol === "admin";

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    const hydrateUserFromToken = async () => {
      if (!token || user) return;

      try {
        const response = await api("/users/profile");
        if (response && typeof response === "object" && "user" in response) {
          await setUser(response.user as any);
        }
      } catch (_error) {
        // Si falla, dejamos sesión mínima con token.
      }
    };

    hydrateUserFromToken();
  }, [token, user, setUser]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="List" component={PropertyListScreen} />
            <Stack.Screen name="Detail" component={PropertyDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            {canManageProperties ? (
              <>
                <Stack.Screen
                  name="LandlordDashboard"
                  component={LandlordDashboardScreen}
                />
                <Stack.Screen name="PropertyForm" component={PropertyFormScreen} />
                <Stack.Screen
                  name="LocationPicker"
                  component={LocationPickerScreen}
                />
              </>
            ) : null}
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
