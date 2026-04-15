const DEFAULT_COUNTRY_CODE = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY_CODE ?? "52";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const normalizePhoneToE164 = (rawPhone: string): string | null => {
  const trimmed = rawPhone.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = onlyDigits(trimmed);
    if (digits.length >= 8 && digits.length <= 15) {
      return `+${digits}`;
    }
    return null;
  }

  const digits = onlyDigits(trimmed);
  if (!digits) return null;

  // Caso más común local MX sin prefijo: 10 dígitos -> +52XXXXXXXXXX
  if (digits.length === 10) {
    return `+${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  // Si ya incluye lada internacional sin "+"
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
};

export const toWhatsAppDigits = (rawPhone: string): string | null => {
  const normalized = normalizePhoneToE164(rawPhone);
  if (!normalized) return null;
  return normalized.replace("+", "");
};

