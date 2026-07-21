import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import { COLORS } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { logAppError } from "../../utils/debug";
import BackButton from "../../components/BackButton";

type Message = { id: number; sender_id: number; sender_name: string; content: string; sent_at: string };
type Detail = { conversation: { id: number; landlord_id: number; property_title: string }; messages: Message[] };

export default function ConversationScreen({ route, navigation }: any) {
  const { id } = route.params;
  const user = useAuthStore((state) => state.user);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    try { setDetail((await api(`/conversations/${id}`)) as Detail); }
    catch (error) {
      logAppError("ConversationScreen.load", error, { conversationId: id });
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible cargar el chat");
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const send = async () => {
    const text = content.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      await api(`/conversations/${id}/messages`, "POST", { content: text });
      setContent("");
      await load();
    } catch (error) {
      logAppError("ConversationScreen.send", error, {
        conversationId: id,
        contentLength: text.length,
      });
      Alert.alert("Error", error instanceof Error ? error.message : "No fue posible enviar el mensaje");
    } finally { setSending(false); }
  };

  const createPayment = () => {
    if (!detail) return;
    navigation.navigate("CreatePayment", {
      conversationId: detail.conversation.id,
      propertyTitle: detail.conversation.property_title,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ padding: 14, flexDirection: "row", gap: 14, backgroundColor: COLORS.white }}>
          <BackButton onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Conversations"))} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 18, fontWeight: "800", color: COLORS.ink }}>{detail?.conversation.property_title ?? "Conversación"}</Text>
        </View>
        {detail?.conversation.landlord_id === user?.id ? (
          <TouchableOpacity onPress={createPayment} style={{ margin: 12, marginBottom: 0, padding: 11, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: "center" }}>
            <Text style={{ color: COLORS.white, fontWeight: "800" }}>Crear cobro de renta</Text>
          </TouchableOpacity>
        ) : null}
        <FlatList
          ref={listRef}
          data={detail?.messages ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 14, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", marginBottom: 9, padding: 11, borderRadius: 14, backgroundColor: mine ? COLORS.primary : COLORS.white }}>
                {!mine ? <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.secondary }}>{item.sender_name}</Text> : null}
                <Text style={{ marginTop: mine ? 0 : 3, color: mine ? COLORS.white : COLORS.dark }}>{item.content}</Text>
                <Text style={{ fontSize: 10, marginTop: 5, color: mine ? "#D5DDE8" : COLORS.secondary }}>{new Date(item.sent_at).toLocaleString()}</Text>
              </View>
            );
          }}
        />
        <View style={{ flexDirection: "row", gap: 8, padding: 12, backgroundColor: COLORS.white }}>
          <TextInput value={content} onChangeText={setContent} maxLength={2000} multiline placeholder="Escribe un mensaje" style={{ flex: 1, maxHeight: 100, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 11 }} />
          <TouchableOpacity onPress={send} disabled={sending || !content.trim()} style={{ justifyContent: "center", backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16 }}>
            <Text style={{ color: COLORS.white, fontWeight: "800" }}>{sending ? "..." : "Enviar"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
