import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";

/** Must match RevenueCat entitlement identifier */
export const ENTITLEMENT_PRO = "pro";

const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

export function hasRevenueCatKeys(): boolean {
  if (Platform.OS === "ios") return iosKey.length > 0;
  if (Platform.OS === "android") return androidKey.length > 0;
  return false;
}

let configured = false;

export async function configureRevenueCat(appUserId?: string): Promise<void> {
  if (configured || Platform.OS === "web") return;

  const apiKey = Platform.select({ ios: iosKey, android: androidKey });
  if (!apiKey) return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
}

export async function loginRevenueCat(appUserId: string): Promise<CustomerInfo | null> {
  if (!configured) return null;
  const { customerInfo } = await Purchases.logIn(appUserId);
  return customerInfo;
}

export async function logoutRevenueCat(): Promise<void> {
  if (!configured) return;
  await Purchases.logOut();
}

export function isProCustomer(info: CustomerInfo | null): boolean {
  return info?.entitlements.active[ENTITLEMENT_PRO]?.isActive === true;
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

export async function fetchOfferings(): Promise<PurchasesOfferings | null> {
  if (!configured) return null;
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/** Prefer monthly, then annual, from current offering */
export function pickPackages(offerings: PurchasesOfferings | null): {
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
} {
  const current = offerings?.current;
  if (!current) return { monthly: null, annual: null };

  const monthly =
    current.monthly ??
    current.availablePackages.find((p) => p.packageType === "MONTHLY") ??
    null;
  const annual =
    current.annual ??
    current.availablePackages.find((p) => p.packageType === "ANNUAL") ??
    null;

  return { monthly, annual };
}

export function formatPackagePrice(pkg: PurchasesPackage | null): string | null {
  return pkg?.product.priceString ?? null;
}
