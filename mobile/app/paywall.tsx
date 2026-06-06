import { useState } from "react";
import { Alert, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lock } from "lucide-react-native";
import { View, Text } from "@/tw";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { SubScreenHeader } from "@/components/ui/SubScreenHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Card } from "@/components/ui/Card";
import { useAppTheme, useTranslation } from "@/lib/preferences";
import { useBilling } from "@/lib/billing-context";
import { typeStyle } from "@/theme/typography";

type Plan = "monthly" | "annual";

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { t } = useTranslation();
  const billing = useBilling();
  const [plan, setPlan] = useState<Plan>("annual");

  const selectedPackage =
    plan === "annual" ? billing.annualPackage : billing.monthlyPackage;
  const displayPrice =
    (plan === "annual" ? billing.annualPrice : billing.monthlyPrice) ??
    (plan === "annual" ? t.paywall.priceAnnual : t.paywall.priceMonthly);

  async function handlePurchase() {
    if (billing.isPro) {
      router.back();
      return;
    }

    if (!billing.storeAvailable || !selectedPackage) {
      Alert.alert(t.common.alert, t.paywall.storeNotReady);
      return;
    }

    const result = await billing.purchase(selectedPackage);
    if (result.ok) {
      Alert.alert(t.common.alert, t.paywall.purchaseSuccess, [
        { text: t.common.close, onPress: () => router.back() },
      ]);
      return;
    }
    if (result.error) {
      Alert.alert(t.common.error, t.paywall.purchaseFailed);
    }
  }

  async function handleRestore() {
    const result = await billing.restore();
    if (result.ok) {
      Alert.alert(t.common.alert, t.paywall.restoreSuccess, [
        { text: t.common.close, onPress: () => router.back() },
      ]);
      return;
    }
    Alert.alert(t.common.alert, t.paywall.restoreNone);
  }

  return (
    <ScreenShell>
      <SubScreenHeader
        title={t.paywall.title}
        cancelLabel={t.paywall.back}
        onCancel={() => router.back()}
      />
      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.icon, { backgroundColor: theme.colors.brandMuted }]}>
          <Lock size={32} color={theme.colors.brandText} strokeWidth={2} />
        </View>
        <Text style={[typeStyle("title"), { color: theme.colors.ink, textAlign: "center" }]}>
          {t.paywall.title}
        </Text>
        <Text style={[typeStyle("body"), { color: theme.colors.ink2, textAlign: "center" }]}>
          {billing.isPro ? t.paywall.alreadyPro : t.paywall.subtitle}
        </Text>

        {!billing.isPro ? (
          <View style={[styles.planRow, { backgroundColor: theme.colors.inputBg }]}>
            <Pressable
              style={[
                styles.planChip,
                plan === "monthly" && { backgroundColor: theme.colors.brand },
              ]}
              onPress={() => setPlan("monthly")}
            >
              <Text
                style={[
                  styles.planChipText,
                  { color: plan === "monthly" ? "#FFF" : theme.colors.ink },
                ]}
              >
                {t.paywall.monthly}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.planChip,
                plan === "annual" && { backgroundColor: theme.colors.brand },
              ]}
              onPress={() => setPlan("annual")}
            >
              <Text
                style={[
                  styles.planChipText,
                  { color: plan === "annual" ? "#FFF" : theme.colors.ink },
                ]}
              >
                {t.paywall.annual}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Card>
          <Text style={[typeStyle("moneyLg"), { color: theme.colors.brandText, textAlign: "center" }]}>
            {billing.isPro ? t.billing.unlimited : displayPrice}
          </Text>
          <Text style={[typeStyle("caption"), { color: theme.colors.ink3, textAlign: "center", marginTop: 8 }]}>
            {t.paywall.features}
          </Text>
          {plan === "annual" && !billing.isPro ? (
            <Text style={[typeStyle("caption"), { color: theme.colors.gold, textAlign: "center", marginTop: 6 }]}>
              {t.paywall.annualSave}
            </Text>
          ) : null}
        </Card>

        <PrimaryButton
          label={billing.isPro ? t.paywall.back : t.paywall.cta}
          onPress={handlePurchase}
          loading={billing.purchasing}
          variant="brand"
          size="lg"
          disabled={billing.isPro}
        />

        {!billing.isPro ? (
          <PrimaryButton
            label={t.paywall.restore}
            onPress={handleRestore}
            loading={billing.restoring}
            variant="outline"
            size="sm"
          />
        ) : null}

        <Text style={[typeStyle("caption"), { color: theme.colors.ink3, textAlign: "center" }]}>
          {billing.storeAvailable ? t.paywall.terms : t.paywall.storeNotReady}
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
    alignItems: "center",
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  planRow: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    gap: 4,
    width: "100%",
  },
  planChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  planChipText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
