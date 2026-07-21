import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  generateId,
  getCurrentUserProfile,
  JsonMap,
  RouteContext,
  toISODate,
  toTimeMs,
} from "./shared";

export const handleConversationRoute = async ({ path, method, payload }: RouteContext) => {
  if (path === "/conversations" && method === "GET") {
    const user = await getCurrentUserProfile();
    const convSnap = await getDocs(
      query(collection(db, "conversations"), where("participants", "array-contains", user.id))
    );

    const items = await Promise.all(
      convSnap.docs.map(async (docSnap) => {
        const conversation = docSnap.data() as JsonMap;
        const messagesSnap = await getDocs(
          query(
            collection(db, "conversations", docSnap.id, "messages"),
            orderBy("sent_at", "desc"),
            limit(1)
          )
        );

        const lastMessage = messagesSnap.empty
          ? null
          : (messagesSnap.docs[0].data() as JsonMap);

        return {
          id: Number(conversation.id),
          property_title: String(conversation.property_title ?? ""),
          client_id: Number(conversation.client_id ?? 0),
          landlord_id: Number(conversation.landlord_id ?? 0),
          client_name: String(conversation.client_name ?? ""),
          landlord_name: String(conversation.landlord_name ?? ""),
          last_message: lastMessage ? String(lastMessage.content ?? "") : null,
          last_message_at: lastMessage ? toISODate(lastMessage.sent_at) : null,
          updated_at: toISODate(conversation.updated_at),
        };
      })
    );

    return items
      .sort((a, b) => toTimeMs(b.updated_at) - toTimeMs(a.updated_at))
      .map(({ updated_at, ...conversation }) => conversation);
  }

  if (path === "/conversations" && method === "POST") {
    const user = await getCurrentUserProfile();
    const propertyId = Number(payload.propertyId ?? 0);
    const propertySnap = await getDoc(doc(db, "properties", String(propertyId)));

    if (!propertySnap.exists()) {
      throw new Error("Propiedad no encontrada");
    }

    const property = propertySnap.data() as JsonMap;
    const landlordId = Number(property.propietario_id ?? 0);
    if (landlordId === user.id) {
      throw new Error("No puedes abrir chat contigo mismo");
    }

    const existing = await getDocs(
      query(collection(db, "conversations"), where("client_id", "==", user.id), limit(100))
    );
    const duplicated = existing.docs.find(
      (docSnap) => Number((docSnap.data() as JsonMap).property_id ?? 0) === propertyId
    );

    if (duplicated) {
      return { id: Number(duplicated.data().id) };
    }

    const id = await generateId();
    await setDoc(doc(db, "conversations", String(id)), {
      id,
      property_id: propertyId,
      property_title: String(property.titulo ?? ""),
      client_id: user.id,
      client_name: user.nombre,
      landlord_id: landlordId,
      landlord_name: String(property.owner_name ?? property.propietario_nombre ?? ""),
      participants: [user.id, landlordId],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return { id };
  }

  const conversationDetail = path.match(/^\/conversations\/(\d+)$/);
  if (conversationDetail && method === "GET") {
    const user = await getCurrentUserProfile();
    const conversationId = Number(conversationDetail[1]);
    const convSnap = await getDoc(doc(db, "conversations", String(conversationId)));

    if (!convSnap.exists()) {
      throw new Error("Conversación no encontrada");
    }

    const conversation = convSnap.data() as JsonMap;
    const participants = (conversation.participants as number[]) ?? [];
    if (!participants.includes(user.id)) {
      throw new Error("No autorizado");
    }

    const messagesSnap = await getDocs(
      query(
        collection(db, "conversations", String(conversationId), "messages"),
        orderBy("sent_at", "asc")
      )
    );

    return {
      conversation: {
        id: Number(conversation.id),
        landlord_id: Number(conversation.landlord_id ?? 0),
        property_title: String(conversation.property_title ?? ""),
      },
      messages: messagesSnap.docs.map((docSnap) => {
        const message = docSnap.data() as JsonMap;
        return {
          id: Number(message.id),
          sender_id: Number(message.sender_id),
          sender_name: String(message.sender_name ?? ""),
          content: String(message.content ?? ""),
          sent_at: toISODate(message.sent_at) ?? new Date().toISOString(),
        };
      }),
    };
  }

  const conversationSend = path.match(/^\/conversations\/(\d+)\/messages$/);
  if (conversationSend && method === "POST") {
    const user = await getCurrentUserProfile();
    const conversationId = Number(conversationSend[1]);
    const convRef = doc(db, "conversations", String(conversationId));
    const convSnap = await getDoc(convRef);

    if (!convSnap.exists()) {
      throw new Error("Conversación no encontrada");
    }

    const conversation = convSnap.data() as JsonMap;
    const participants = (conversation.participants as number[]) ?? [];
    if (!participants.includes(user.id)) {
      throw new Error("No autorizado");
    }

    const messageId = await generateId();
    await setDoc(doc(db, "conversations", String(conversationId), "messages", String(messageId)), {
      id: messageId,
      sender_id: user.id,
      sender_name: user.nombre,
      content: String(payload.content ?? ""),
      sent_at: new Date().toISOString(),
    });

    await updateDoc(convRef, { updated_at: new Date().toISOString() });
    return { id: messageId };
  }

  return null;
};