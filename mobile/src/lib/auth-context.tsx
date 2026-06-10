import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient, clearSessionToken, getSessionToken } from "./auth";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient.getSession()
      .then(({ data }) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function signIn(email: string, password: string): Promise<{ error?: string }> {
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error) return { error: error.message ?? "Sign in failed" };
    await waitForSessionToken();
    const session = await authClient.getSession();
    setUser(session.data?.user ?? data?.user ?? null);
    return {};
  }

  async function signUp(name: string, email: string, password: string): Promise<{ error?: string }> {
    const { data, error } = await authClient.signUp.email({ name, email, password });
    if (error) return { error: error.message ?? "Sign up failed" };
    await waitForSessionToken();
    const session = await authClient.getSession();
    setUser(session.data?.user ?? data?.user ?? null);
    return {};
  }

  async function signOut(): Promise<void> {
    await authClient.signOut();
    await clearSessionToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** SecureStore write from sign-in onSuccess can lag behind navigation. */
async function waitForSessionToken(maxAttempts = 20): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await getSessionToken()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
