import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

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
import ConversationListScreen from "../screens/user/ConversationListScreen";
import ConversationScreen from "../screens/user/ConversationScreen";
import PaymentListScreen from "../screens/user/PaymentListScreen";
import CreatePaymentScreen from "../screens/user/CreatePaymentScreen";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const {
    token,
    user,
    firebaseUser,
    loadSession,
    setUser,
    setFirebaseUser,
    clearSession,
  } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [navReady, setNavReady] = useState(false);
  const previousAuthRef = useRef(false);
  const bootRouteSettledRef = useRef(false);
  const isAuthenticated = Boolean(token && firebaseUser);
  const homeRoute = "Map";

  useEffect(() => {
    const init = async () => {
      await loadSession();
      setSessionReady(true);
    };

    init();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, [setFirebaseUser]);

  useEffect(() => {
    const syncStaleSession = async () => {
      if (!authReady || !sessionReady) return;
      if (token && !firebaseUser) {
        await clearSession();
      }
    };

    syncStaleSession();
  }, [authReady, sessionReady, token, firebaseUser, clearSession]);

  useEffect(() => {
    const hydrateUserFromToken = async () => {
      if (!isAuthenticated) return;

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
  }, [isAuthenticated, setUser]);

  useEffect(() => {
    if (!authReady || !sessionReady || !navReady || !navigationRef.isReady()) return;

    const wasAuthenticated = previousAuthRef.current;

    if (isAuthenticated) {
      const currentRoute = navigationRef.getCurrentRoute()?.name;
      const shouldNormalizeBootRoute = !bootRouteSettledRef.current;
      const shouldNormalizeOnAuthTransition = !wasAuthenticated;
      const shouldNormalizeRoleRoute = currentRoute === "Profile" || currentRoute === "Login";

      if (shouldNormalizeBootRoute || shouldNormalizeOnAuthTransition || shouldNormalizeRoleRoute) {
        navigationRef.resetRoot({
          index: 0,
          routes: [{ name: homeRoute }],
        } as never);
        bootRouteSettledRef.current = true;
      }
    }

    if (!isAuthenticated && wasAuthenticated) {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: "Login" }],
      } as never);
      bootRouteSettledRef.current = false;
    }

    previousAuthRef.current = isAuthenticated;
  }, [authReady, sessionReady, navReady, isAuthenticated, homeRoute]);

  if (!authReady || !sessionReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setNavReady(true);
      }}
    >
      <Stack.Navigator
        key={isAuthenticated ? `auth-${homeRoute}` : "guest"}
        initialRouteName={
          isAuthenticated ? homeRoute : "Login"
        }
        screenOptions={{ headerShown: false }}
      >
        {isAuthenticated ? (
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
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="List" component={PropertyListScreen} />
            <Stack.Screen name="Detail" component={PropertyDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Conversations" component={ConversationListScreen} />
            <Stack.Screen name="Conversation" component={ConversationScreen} />
            <Stack.Screen name="Payments" component={PaymentListScreen} />
            <Stack.Screen name="CreatePayment" component={CreatePaymentScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
