import { logAppError } from "../utils/debug";
import { handleAuthRoute } from "./api/authHandlers";
import { handleConversationRoute } from "./api/conversationHandlers";
import { handleFavoriteRoute } from "./api/favoriteHandlers";
import { handlePaymentRoute } from "./api/paymentHandlers";
import { handlePropertyRoute } from "./api/propertyHandlers";
import { normalizeApiError, parseEndpoint, QueryMap, toAssetUrl } from "./api/shared";

export { toAssetUrl };

const routeHandlers = [
  handleAuthRoute,
  handlePropertyRoute,
  handleFavoriteRoute,
  handleConversationRoute,
  handlePaymentRoute,
];

export const api = async (
  endpoint: string,
  method = "GET",
  body?: unknown,
  queryParams?: QueryMap
): Promise<any> => {
  const path = parseEndpoint(endpoint);
  const payload = ((body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;

  try {
    for (const handleRoute of routeHandlers) {
      const result = await handleRoute({ path, method, payload, queryParams });
      if (result !== null) {
        return result;
      }
    }

    throw new Error(`Endpoint no soportado en modo Firebase-only: ${method} ${path}`);
  } catch (error) {
    const normalizedError = normalizeApiError(error, path);
    logAppError("api", normalizedError, {
      endpoint,
      path,
      method,
      hasBody: Object.keys(payload).length > 0,
      queryParams: queryParams ?? null,
    });
    throw normalizedError;
  }
};

