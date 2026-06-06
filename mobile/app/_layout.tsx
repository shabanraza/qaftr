import "../src/global.css";
import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AppStatusBar } from "@/components/AppStatusBar";
import * as SplashScreen from "expo-splash-screen";
import { I18nManager } from "react-native";
import { AppLoader, SplashLoader } from "@/components/ui/AppLoader";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  businessQueryOpts,
  createAppQueryClient,
  listQueryOpts,
} from "@/lib/query-client";
import { useFonts } from "expo-font";

SplashScreen.preventAutoHideAsync().catch(() => {});
import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
  ReadexPro_700Bold,
} from "@expo-google-fonts/readex-pro";
import { trpc, createTrpcClient } from "@/lib/trpc";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { BillingProvider } from "@/lib/billing-context";
import { PreferencesProvider, usePreferences } from "@/lib/preferences";

const queryClient = createAppQueryClient();

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const root = segments[0];
    const inAuth = root === "(auth)";
    const inTabs = root === "(tabs)";
    const onIndex = !root;

    if (!user && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (user && inAuth) {
      router.replace("/(tabs)");
    } else if (user && onIndex) {
      router.replace("/(tabs)");
    } else if (!user && inTabs) {
      router.replace("/(auth)/sign-in");
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return <AppLoader fullScreen variant="brand" />;
  }

  return <BusinessGate />;
}

function BusinessGate() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const root = segments[0];
  const onOnboarding = root === "onboarding";
  const inAuth = root === "(auth)";
    const onSettings = root === "(tabs)" && segments[1] === "settings";

  const utils = trpc.useUtils();
  const { data: business, isPending: bizPending } = trpc.business.get.useQuery(undefined, {
    enabled: !!user,
    ...businessQueryOpts,
  });

  useEffect(() => {
    if (!user) return;
    void utils.invoices.list.prefetch(undefined, listQueryOpts);
    void utils.clients.list.prefetch(undefined, listQueryOpts);
  }, [user, utils]);

  useEffect(() => {
    if (!user || bizPending || business || onOnboarding || inAuth || onSettings) return;
    router.replace("/onboarding");
  }, [user, bizPending, business, onOnboarding, inAuth, onSettings, router]);

  if (user && bizPending && !business && !onOnboarding && !inAuth && !onSettings) {
    return <AppLoader fullScreen variant="surface" />;
  }

  return <Slot />;
}

const TrpcProvider = trpc.Provider;

export default function RootLayout() {
  const [trpcClient] = useState(() => createTrpcClient());
  const [fontsLoaded, fontError] = useFonts({
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
    ReadexPro_700Bold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return <SplashLoader variant="brand" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TrpcProvider client={trpcClient} queryClient={queryClient}>
            <PreferencesProvider>
              <AuthProvider>
                <BillingProvider>
                  <RtlBootstrap />
                  <AppStatusBar />
                  <AuthGate />
                </BillingProvider>
              </AuthProvider>
            </PreferencesProvider>
          </TrpcProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RtlBootstrap() {
  const { isRTL } = usePreferences();
  useEffect(() => {
    I18nManager.allowRTL(isRTL);
    I18nManager.swapLeftAndRightInRTL(isRTL);
  }, [isRTL]);
  return null;
}
