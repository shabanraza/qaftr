import Constants from "expo-constants";

const DEV_FALLBACK = "http://localhost:9000";

function normalizeOrigin(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

/** Resolve the invoice-app API origin for auth and tRPC. */
export function getApiUrl(): string {
  const fromEnv = normalizeOrigin(process.env.EXPO_PUBLIC_API_URL);
  const fromExtra = normalizeOrigin(Constants.expoConfig?.extra?.apiUrl as string | undefined);
  return fromEnv ?? fromExtra ?? DEV_FALLBACK;
}
