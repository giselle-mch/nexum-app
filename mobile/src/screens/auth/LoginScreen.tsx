import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

type AuthMode = "login" | "register" | "recovery";

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
        useNativeDriver: true,
      }),
      Animated.timing(riseAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, riseAnim]);

  const doLogin = async () => {
    const data = await api("/auth/login", "POST", { email, password });

    if (data?.token) {
      await login(data.token, data.user ?? null);
      navigation.replace("Map");
      return;
    }

    throw new Error("Credenciales incorrectas");
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await doLogin();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No fue posible iniciar sesión");
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
      await api("/auth/register", "POST", {
        nombre: name.trim(),
        email: email.trim(),
        password,
        telefono: phone.trim(),
        rol: selectedRole,
      });
      await doLogin();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No fue posible registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async () => {
    if (!email.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      alert("Completa correo, nueva contraseña y confirmación");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      await api("/auth/recover-password", "POST", {
        email: email.trim(),
        newPassword,
      });

      alert("Contraseña actualizada. Ahora inicia sesión con tu nueva contraseña.");
      setMode("login");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No fue posible recuperar la contraseña"
      );
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
              <TextInput
                placeholder="Nueva contraseña"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={{ borderWidth: 1, marginBottom: 10, padding: 11, borderColor: COLORS.border, borderRadius: 10 }}
              />
              <TextInput
                placeholder="Confirmar nueva contraseña"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={{ borderWidth: 1, marginBottom: 14, padding: 11, borderColor: COLORS.border, borderRadius: 10 }}
              />
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
                  ? "Actualizando..."
                  : isRegisterMode
                    ? "Creando cuenta..."
                    : "Entrando..."
                : isRecoveryMode
                  ? "Actualizar contraseña"
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
            setMode(isRecoveryMode ? "login" : "recovery");
            setPassword("");
            setName("");
            setPhone("");
          }}
          disabled={loading}
          style={{ marginTop: 10, alignItems: "center" }}
        >
          <Text style={{ color: COLORS.secondary }}>
            {isRecoveryMode ? "Volver a iniciar sesión" : "¿Olvidaste tu contraseña?"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
