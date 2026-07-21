type ErrorMeta = Record<string, unknown>;

const formatErrorPayload = (error: unknown) => {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: string };
    return {
      name: error.name,
      message: error.message,
      code: withCode.code ?? null,
      stack: error.stack ?? null,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
    code: null,
    stack: null,
  };
};

export const logAppError = (scope: string, error: unknown, meta?: ErrorMeta) => {
  const payload = {
    scope,
    timestamp: new Date().toISOString(),
    ...formatErrorPayload(error),
    meta: meta ?? {},
  };

  console.groupCollapsed(`[Nexum][Error] ${scope}`);
  console.error(payload);
  console.groupEnd();
};
