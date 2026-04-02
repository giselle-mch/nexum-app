import { View, Text, TextInput, Button } from "react-native";
import { useState } from "react";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Login:", email, password);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text>Email</Text>

      <TextInput
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
        value={email}
        onChangeText={setEmail}
      />

      <Text>Password</Text>

      <TextInput
        style={{ borderWidth: 1, marginBottom: 20, padding: 8 }}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Iniciar sesión" onPress={handleLogin} />
    </View>
  );
}