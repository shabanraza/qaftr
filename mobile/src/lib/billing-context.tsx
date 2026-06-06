import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";
import {
  configureRevenueCat,
  fetchCustomerInfo,
  fetchOfferings,
  formatPackagePrice,
  hasRevenueCatKeys,
  isProCustomer,
  loginRevenueCat,
  logoutRevenueCat,
  pickPackages,
  purchasePackage,
  restorePurchases,
} from "@/lib/revenuecat";

interface BillingState {
  isReady: boolean;
  isPro: boolean;
  monthlyPrice: string | null;
  annualPrice: string | null;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  purchasing: boolean;
  restoring: boolean;
  purchase: (pkg: PurchasesPackage) => Promise<{ ok: boolean; error?: string }>;
  restore: () => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
  storeAvailable: boolean;
}

const BillingContext = createContext<BillingState | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const storeAvailable = hasRevenueCatKeys() && Platform.OS !== "web";

  const [isReady, setIsReady] = useState(!storeAvailable);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const { data: usage } = trpc.billing.getUsage.useQuery(undefined, {
    enabled: !!user,
  });

  const refresh = useCallback(async () => {
    if (!storeAvailable) {
      setIsReady(true);
      return;
    }

    try {
      const [info, offerings] = await Promise.all([
        fetchCustomerInfo(),
        fetchOfferings(),
      ]);
      setCustomerInfo(info);
      const { monthly, annual } = pickPackages(offerings);
      setMonthlyPackage(monthly);
      setAnnualPackage(annual);
    } finally {
      setIsReady(true);
    }
  }, [storeAvailable]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!storeAvailable) {
        setIsReady(true);
        return;
      }

      await configureRevenueCat(user?.id);
      if (cancelled) return;

      if (user?.id) {
        const info = await loginRevenueCat(user.id);
        if (!cancelled) setCustomerInfo(info);
      }

      await refresh();
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [user?.id, storeAvailable, refresh]);

  useEffect(() => {
    if (!user) {
      void logoutRevenueCat();
      setCustomerInfo(null);
    }
  }, [user]);

  const isPro =
    isProCustomer(customerInfo) ||
    usage?.plan === "pro" ||
    usage?.limit === null;

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<{ ok: boolean; error?: string }> => {
      setPurchasing(true);
      try {
        const info = await purchasePackage(pkg);
        setCustomerInfo(info);
        await utils.billing.getUsage.invalidate();
        return { ok: isProCustomer(info) };
      } catch (e: unknown) {
        const err = e as { userCancelled?: boolean; message?: string };
        if (err.userCancelled) return { ok: false };
        return { ok: false, error: err.message ?? "PURCHASE_FAILED" };
      } finally {
        setPurchasing(false);
      }
    },
    [utils],
  );

  const restore = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      setCustomerInfo(info);
      await utils.billing.getUsage.invalidate();
      return { ok: isProCustomer(info) };
    } catch (e: unknown) {
      const err = e as { message?: string };
      return { ok: false, error: err.message ?? "RESTORE_FAILED" };
    } finally {
      setRestoring(false);
    }
  }, [utils]);

  const value = useMemo<BillingState>(
    () => ({
      isReady,
      isPro,
      monthlyPrice: formatPackagePrice(monthlyPackage),
      annualPrice: formatPackagePrice(annualPackage),
      monthlyPackage,
      annualPackage,
      purchasing,
      restoring,
      purchase,
      restore,
      refresh,
      storeAvailable,
    }),
    [
      isReady,
      isPro,
      monthlyPackage,
      annualPackage,
      purchasing,
      restoring,
      purchase,
      restore,
      refresh,
      storeAvailable,
    ],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingState {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}
