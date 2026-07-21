import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  generateId,
  getCurrentUserProfile,
  JsonMap,
  RouteContext,
  toISODate,
  toTimeMs,
} from "./shared";

export const handlePaymentRoute = async ({ path, method, payload }: RouteContext) => {
  if (path === "/payments" && method === "GET") {
    const user = await getCurrentUserProfile();
    const snap = await getDocs(
      query(collection(db, "payments"), where("participants", "array-contains", user.id))
    );
    const today = new Date().toISOString().slice(0, 10);

    return snap.docs
      .map((docSnap) => {
        const payment = docSnap.data() as JsonMap;
        const dueDate = String(payment.due_date ?? "").slice(0, 10);
        const rawStatus = String(payment.status ?? "pendiente");
        const status = rawStatus === "pendiente" && dueDate < today ? "vencido" : rawStatus;

        return {
          id: Number(payment.id),
          conversation_id: Number(payment.conversation_id ?? 0),
          property_id: Number(payment.property_id ?? 0),
          client_id: Number(payment.client_id ?? 0),
          landlord_id: Number(payment.landlord_id ?? 0),
          amount: String(payment.amount ?? "0"),
          due_date: dueDate,
          paid_at: toISODate(payment.paid_at),
          created_at: toISODate(payment.created_at),
          reference: String(payment.reference ?? ""),
          status,
          property_title: String(payment.property_title ?? ""),
          client_name: String(payment.client_name ?? ""),
          landlord_name: String(payment.landlord_name ?? ""),
        };
      })
      .sort((a, b) => toTimeMs(b.created_at) - toTimeMs(a.created_at));
  }

  if (path === "/payments" && method === "POST") {
    const user = await getCurrentUserProfile();
    if (user.dbRole !== "arrendador" && user.dbRole !== "admin") {
      throw new Error("Solo arrendadores pueden crear cobros");
    }

    const conversationId = Number(payload.conversationId ?? 0);
    const convSnap = await getDoc(doc(db, "conversations", String(conversationId)));
    if (!convSnap.exists()) {
      throw new Error("Conversación no encontrada");
    }

    const conversation = convSnap.data() as JsonMap;
    if (Number(conversation.landlord_id) !== user.id) {
      throw new Error("No autorizado");
    }

    const id = await generateId();
    const reference = `NEX-${Date.now().toString(36).toUpperCase()}`;

    await setDoc(doc(db, "payments", String(id)), {
      id,
      conversation_id: conversationId,
      property_id: Number(conversation.property_id),
      property_title: String(conversation.property_title ?? ""),
      client_id: Number(conversation.client_id),
      client_name: String(conversation.client_name ?? ""),
      landlord_id: Number(conversation.landlord_id),
      landlord_name: String(conversation.landlord_name ?? ""),
      participants: [Number(conversation.client_id), Number(conversation.landlord_id)],
      amount: Number(payload.amount ?? 0),
      due_date: String(payload.dueDate ?? ""),
      status: "pendiente",
      paid_at: null,
      reference,
      created_at: new Date().toISOString(),
    });

    return { id, reference };
  }

  const paymentAction = path.match(/^\/payments\/(\d+)\/(simulate|cancel)$/);
  if (paymentAction && method === "POST") {
    const user = await getCurrentUserProfile();
    const paymentId = Number(paymentAction[1]);
    const action = paymentAction[2];
    const paymentRef = doc(db, "payments", String(paymentId));
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      throw new Error("Cobro no encontrado");
    }

    const payment = paymentSnap.data() as JsonMap;
    const status = String(payment.status ?? "pendiente");
    if (status !== "pendiente") {
      throw new Error("El cobro ya fue procesado");
    }

    if (action === "simulate") {
      if (Number(payment.client_id) !== user.id) {
        throw new Error("No autorizado");
      }

      await updateDoc(paymentRef, {
        status: "pagado",
        paid_at: new Date().toISOString(),
      });
      return { message: "Pago simulado" };
    }

    if (Number(payment.landlord_id) !== user.id) {
      throw new Error("No autorizado");
    }

    await updateDoc(paymentRef, { status: "cancelado" });
    return { message: "Cobro cancelado" };
  }

  return null;
};