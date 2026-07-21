import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../services/firebase";
import { logAppError } from "../../utils/debug";

type AuthMode = "login" | "register" | "recovery";

const toAuthMessage = (error: unknown, fallback: string) => {
  const typedError = error as { code?: string; message?: string };
  const code = String(typedError?.code ?? "");

  if (code.includes("auth/email-already-in-use")) {
    return "Ese correo ya está registrado. Inicia sesión o recupera tu contraseña.";
  }

  if (code.includes("auth/invalid-email")) {
    return "El correo no tiene un formato válido.";
  }

  if (code.includes("auth/weak-password")) {
    return "La contraseña es débil. Usa al menos 6 caracteres.";
  }

  if (code.includes("auth/operation-not-allowed")) {
    return "El registro por correo/contraseña no está habilitado en Firebase Auth.";
  }

  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
    return "Correo o contraseña incorrectos.";
  }

  if (code.includes("auth/user-not-found")) {
    return "No existe una cuenta con ese correo.";
  }

  if (code.includes("auth/too-many-requests")) {
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }

  if (code.includes("unavailable") || code.includes("network-request-failed")) {
    return "No se pudo conectar con Firebase. Revisa tu red y vuelve a intentar.";
  }

  const message = String(typedError?.message ?? "").trim();
  return message || fallback;
};

export default function LoginScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(16)).current;

  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<"cliente" | "arrendador">("cliente");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const isRegisterMode = mode === "register";
  const isRecoveryMode = mode === "recovery";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(riseAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [fadeAnim, riseAnim]);

  const doLogin = async () => {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const idToken = await userCredential.user.getIdToken();
    const userData = await api("/auth/user-profile", "GET");

    if (idToken) {
      await login(idToken, userData?.user ?? null);
      return;
    }

    throw new Error("No se pudo obtener el token de autenticación");
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await doLogin();
    } catch (error) {
      logAppError("LoginScreen.handleLogin", error, { email });
      alert(toAuthMessage(error, "No fue posible iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Completa nombre, correo y contraseña");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();

      await api("/auth/register", "POST", {
        uid: userCredential.user.uid,
        nombre: name.trim(),
        email: email.trim(),
        telefono: phone.trim(),
        rol: selectedRole,
      });

      const userData = await api("/auth/user-profile", "GET");

      await login(idToken, {
        ...(userData?.user ?? {}),
        nombre: userData?.user?.nombre ?? name.trim(),
        email: userData?.user?.email ?? email.trim(),
        telefono: userData?.user?.telefono ?? phone.trim(),
        rol: userData?.user?.rol ?? selectedRole,
      });
    } catch (error) {
      logAppError("LoginScreen.handleRegister", error, { email, selectedRole });
      alert(toAuthMessage(error, "No fue posible registrarse"));
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async () => {
    if (!email.trim()) {
      alert("Ingresa tu correo");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      alert("Se envió un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.");
      setMode("login");
      setPassword("");
    } catch (error) {
      logAppError("LoginScreen.handleRecoverPassword", error, { email });
      alert(toAuthMessage(error, "No fue posible recuperar la contraseña"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <View
        style={{
          position: "absolute",
          top: -70,
          right: -35,
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: "#DCE8F5",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 80,
          left: -60,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: "#E8D7CC",
        }}
      />

      <Animated.View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 20,
          opacity: fadeAnim,
          transform: [{ translateY: riseAnim }],
        }}
      >
        <Text style={{ fontSize: 34, color: COLORS.primary, fontWeight: "800", letterSpacing: 1 }}>
          NEXUM
        </Text>
        <Text style={{ color: COLORS.secondary, marginTop: 4, marginBottom: 18 }}>
          Espacios inteligentes, decisiones seguras.
        </Text>

        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 16,
            shadowColor: "#12263A",
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}
        >
          {isRegisterMode ? (
            <>
              <TextInput
                placeholder="Nombre completo"
                value={name}
                onChangeText={setName}
                style={{ borderWidth: 1, marginBottom: 10, padding: 11, borderColor: COLORS.border, borderRadius: 10 }}
              />

              <TextInput
                placeholder="Teléfono (opcional)"
                value={phone}
                onChangeText={setPhone}
                style={{ borderWidth: 1, marginBottom: 10, padding: 11, borderColor: COLORS.border, borderRadius: 10 }}
              />

              <Text style={{ marginBottom: 8, color: COLORS.dark, fontWeight: "700" }}>Tipo de cuenta</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => setSelectedRole("cliente")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: selectedRole === "cliente" ? COLORS.primary : COLORS.border,
                    backgroundColor: selectedRole === "cliente" ? COLORS.primary : COLORS.white,
                  }}
                >
                  <Text style={{ fontWeight: "700", color: selectedRole === "cliente" ? COLORS.white : COLORS.dark }}>
                    Cliente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedRole("arrendador")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: selectedRole === "arrendador" ? COLORS.primary : COLORS.border,
                    backgroundColor: selectedRole === "arrendador" ? COLORS.primary : COLORS.white,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: selectedRole === "arrendador" ? COLORS.white : COLORS.dark,
                    }}
                  >
                    Arrendador
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          <TextInput
            placeholder="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ borderWidth: 1, marginBottom: 10, padding: 11, borderColor: COLORS.border, borderRadius: 10 }}
          />

          {isRecoveryMode ? (
            <>
              <Text style={{ color: COLORS.secondary, marginBottom: 14 }}>
                Te enviaremos un correo para restablecer tu contraseña.
              </Text>
            </>
          ) : (
            <TextInput
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{ borderWidth: 1, marginBottom: 14, padding: 11, borderColor: COLORS.border, borderRadius: 10 }}
            />
          )}

          <TouchableOpacity
            onPress={
              isRecoveryMode
                ? handleRecoverPassword
                : isRegisterMode
                  ? handleRegister
                  : handleLogin
            }
            disabled={loading}
            style={{
              backgroundColor: COLORS.primary,
              padding: 14,
              alignItems: "center",
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              {loading
                ? isRecoveryMode
                  ? "Enviando..."
                  : isRegisterMode
                    ? "Creando cuenta..."
                    : "Entrando..."
                : isRecoveryMode
                  ? "Enviar correo de recuperación"
                  : isRegisterMode
                    ? "Crear cuenta"
                    : "Entrar"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            setMode(isRegisterMode ? "login" : "register");
            setSelectedRole("cliente");
            setNewPassword("");
            setConfirmPassword("");
          }}
          disabled={loading}
          style={{ marginTop: 14, alignItems: "center" }}
        >
          <Text style={{ color: COLORS.secondary, fontWeight: "600" }}>
            {isRegisterMode
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setMode("recovery");
          }}
          disabled={loading}
          style={{ marginTop: 10, alignItems: "center" }}
        >
          <Text style={{ color: COLORS.secondary }}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
