import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiUrl } from "./api-url";

const SESSION_KEY = "qaftr_session_token";

const memoryFallback = new Map<string, string>();

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") return memoryFallback.get(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") { memoryFallback.set(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") { memoryFallback.delete(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: "/api/auth",
  fetchOptions: {
    // Official bearer plugin pattern — do NOT use ctx.options in onRequest (it's undefined).
    auth: {
      type: "Bearer",
      token: async () => (await secureStorage.getItem(SESSION_KEY)) ?? "",
    },
    onSuccess: async (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) await secureStorage.setItem(SESSION_KEY, token);
    },
  },
});

export async function getSessionToken(): Promise<string | null> {
  return secureStorage.getItem(SESSION_KEY);
}

export async function clearSessionToken(): Promise<void> {
  return secureStorage.removeItem(SESSION_KEY);
}

export { SESSION_KEY };
