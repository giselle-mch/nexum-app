type AddressMap = Record<string, string>;

type NominatimItem = {
  display_name?: string;
  address?: AddressMap & { postcode?: string };
};

type PostalApiResponse = {
  response?: {
    asentamiento?: string[];
    municipio?: string;
    estado?: string;
    ciudad?: string;
  };
};

type ZipResponse = {
  places?: Array<{
    "place name"?: string;
    state?: string;
  }>;
};

export type PostalLookupResult = {
  city: string;
  state: string;
  neighborhood: string;
  street: string;
  neighborhoods: string[];
  message: string;
  sources: string;
};

const fetchJsonWithTimeout = async <T,>(url: string, timeoutMs = 3200): Promise<T | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const getCityFromAddress = (address?: AddressMap) => {
  if (!address) return "";
  return (
    address.city ||
    address.town ||
    address.municipality ||
    address.city_district ||
    address.county ||
    address.village ||
    ""
  );
};

const getStateFromAddress = (address?: AddressMap) => {
  if (!address) return "";
  return address.state || address.state_district || address.region || address.county || "";
};

const normalizeNeighborhoods = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

export const lookupPostalCode = async (postalCode: string): Promise<PostalLookupResult | null> => {
  if (!/^\d{5}$/.test(postalCode)) {
    return null;
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=mx&limit=5&q=${encodeURIComponent(`${postalCode}, Mexico`)}`;
  const nominatimPayload = (await fetchJsonWithTimeout<NominatimItem[]>(nominatimUrl)) ?? [];

  const cpMatches = nominatimPayload.filter((item) =>
    item.address?.postcode?.startsWith(postalCode)
  );
  const scopedResults = cpMatches.length > 0 ? cpMatches : nominatimPayload;

  const addressNeighborhoods = scopedResults
    .map(
      (item) =>
        item.address?.neighbourhood ||
        item.address?.suburb ||
        item.address?.quarter ||
        item.address?.hamlet ||
        item.address?.residential ||
        item.address?.city_district ||
        ""
    )
    .filter(Boolean);

  const displayNameNeighborhoods = scopedResults
    .map((item) => String(item.display_name ?? ""))
    .map((name) => name.split(",")[0]?.trim() ?? "")
    .filter((value) => value.length > 0 && !/^\d+$/.test(value));

  const copomexPayload = await fetchJsonWithTimeout<PostalApiResponse>(
    `https://api.copomex.com/query/info_cp/${postalCode}?token=pruebas`
  );
  const sepomexPayload = await fetchJsonWithTimeout<PostalApiResponse>(
    `https://api-sepomex.hckdrk.mx/query/info_cp/${postalCode}?type=simplified`
  );
  const zipPayload = await fetchJsonWithTimeout<ZipResponse>(
    `https://api.zippopotam.us/MX/${postalCode}`
  );

  const copomexNeighborhoods = Array.isArray(copomexPayload?.response?.asentamiento)
    ? copomexPayload?.response?.asentamiento
    : [];
  const sepomexNeighborhoods = Array.isArray(sepomexPayload?.response?.asentamiento)
    ? sepomexPayload?.response?.asentamiento
    : [];

  const neighborhoods = normalizeNeighborhoods([
    ...copomexNeighborhoods,
    ...sepomexNeighborhoods,
    ...addressNeighborhoods,
    ...displayNameNeighborhoods,
  ]);

  const candidate =
    scopedResults.find((item) => Boolean(getCityFromAddress(item.address))) ?? scopedResults[0];
  const address = candidate?.address ?? {};
  const fallbackPlace = zipPayload?.places?.[0];

  const city =
    getCityFromAddress(address) ||
    String(copomexPayload?.response?.ciudad || copomexPayload?.response?.municipio || "").trim() ||
    String(sepomexPayload?.response?.ciudad || sepomexPayload?.response?.municipio || "").trim() ||
    String(fallbackPlace?.["place name"] ?? "").trim();

  const state =
    getStateFromAddress(address) ||
    String(copomexPayload?.response?.estado || "").trim() ||
    String(sepomexPayload?.response?.estado || "").trim() ||
    String(fallbackPlace?.state ?? "").trim();

  const neighborhood =
    neighborhoods[0] || address.neighbourhood || address.suburb || address.quarter || "";
  const road = address.road || address.pedestrian || address.residential || address.path || "";
  const houseNumber = address.house_number || "";
  const street = [road, houseNumber].filter(Boolean).join(" ").trim();

  const message = neighborhoods.length > 0
    ? city
      ? "Datos de ubicación completados automáticamente."
      : "Se detectaron colonias; revisa ciudad/estado si hace falta."
    : city || state
      ? "No pudimos cargar colonias automáticamente; puedes escribir la colonia manualmente."
      : "No fue posible autocompletar con ese código postal; captura los datos manualmente.";

  return {
    city,
    state,
    neighborhood,
    street,
    neighborhoods,
    message,
    sources: `Colonias: ${neighborhoods.length} (Copomex ${copomexNeighborhoods.length}, Sepomex ${sepomexNeighborhoods.length}, Mapa ${addressNeighborhoods.length})`,
  };
};