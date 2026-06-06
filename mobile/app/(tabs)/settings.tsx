import { Alert, Platform, StyleSheet, Switch, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Lock, Moon } from "lucide-react-native";
import { View, Text, ScrollView } from "@/tw";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { PageSectionTitle } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { tabBarScrollPadding } from "@/lib/layout";
import { spacing } from "@/lib/spacing";
import { ScreenBody } from "@/components/ui/ScreenBody";
import {
  useAppTheme,
  useLayout,
  usePreferences,
  useTranslation,
  type Locale,
} from "@/lib/preferences";

function LanguageChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        chipStyles.chip,
        {
          backgroundColor: active ? theme.colors.brand : theme.colors.inputBg,
          borderColor: active ? theme.colors.brand : theme.colors.border,
        },
      ]}
    >
      <Text style={[chipStyles.chipText, { color: active ? "#FFFFFF" : theme.colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const { textAlign, row } = useLayout();
  const { t } = useTranslation();
  const { locale, colorScheme, setLocale, setColorScheme } = usePreferences();
  const { user, signOut } = useAuth();
  const { data: business } = trpc.business.get.useQuery(undefined, { enabled: !!user });
  const { data: usage } = trpc.billing.getUsage.useQuery(undefined, { enabled: !!user });

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const isDark = colorScheme === "dark";

  async function handleLogout() {
    Alert.alert(t.settings.logoutTitle, t.settings.logoutMsg, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.settings.logoutConfirm,
        style: "destructive",
        onPress: async () => {
          await signOut();
          if (Platform.OS === "ios") {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  }

  const styles = StyleSheet.create({
    accountRow: { flexDirection: row, alignItems: "center", gap: 12 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.brandMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 20, fontWeight: "700", color: theme.colors.brandText },
    accountInfo: { flex: 1, alignItems: textAlign === "right" ? "flex-end" : "flex-start", gap: 2 },
    accountName: { fontSize: 16, fontWeight: "700", color: theme.colors.ink },
    accountEmail: { fontSize: 13, color: theme.colors.ink3 },
    businessInfo: { gap: 4, alignItems: textAlign === "right" ? "flex-end" : "flex-start" },
    businessName: { fontSize: 16, fontWeight: "700", color: theme.colors.ink },
    businessLine: { fontSize: 13, color: theme.colors.ink2 },
    businessMeta: { fontSize: 13, color: theme.colors.ink3 },
    emptyBusiness: { fontSize: 14, color: theme.colors.ink2, textAlign },
    outlineBtn: {
      marginTop: 4,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: "center",
    },
    outlineBtnText: { fontSize: 14, fontWeight: "600", color: theme.colors.brandText },
    settingRow: {
      flexDirection: row,
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    settingLabel: { fontSize: 15, fontWeight: "600", color: theme.colors.ink },
    settingSub: { fontSize: 12, color: theme.colors.ink3, marginTop: 2 },
    langRow: { flexDirection: row, gap: 8 },
    gapList: { gap: 10 },
    gapRow: { flexDirection: row, alignItems: "center", gap: 8 },
    gapText: { flex: 1, fontSize: 13, color: theme.colors.ink2, textAlign },
    haveBox: {
      marginTop: 4,
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.brandMuted,
    },
    haveText: { fontSize: 13, fontWeight: "600", color: theme.colors.brandText, textAlign },
    proRow: { flexDirection: row, justifyContent: "space-between", alignItems: "center" },
    proInfo: {
      flex: 1,
      alignItems: textAlign === "right" ? "flex-end" : "flex-start",
      gap: 4,
    },
    proTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.ink },
    proSub: { fontSize: 13, color: theme.colors.ink3 },
    proBadge: {
      flexDirection: row,
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.appBg,
    },
    proBadgeText: { fontSize: 11, fontWeight: "700", color: theme.colors.ink3 },
    version: { fontSize: 12, color: theme.colors.ink3, textAlign: "center" },
  });

  return (
    <ScreenShell>
      <ScreenHeader title={t.settings.title} subtitle={t.settings.subtitle} />

      <ScreenBody>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          gap: spacing.section,
          paddingBottom: tabBarScrollPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <PageSectionTitle>{t.settings.appearance}</PageSectionTitle>
          <Card>
            <View style={{ gap: 16 }}>
              <View>
                <Text style={[styles.settingLabel, { textAlign }]}>{t.settings.language}</Text>
                <View style={[styles.langRow, { marginTop: 10 }]}>
                  <LanguageChip
                    label={t.settings.languageEn}
                    active={locale === "en"}
                    onPress={() => setLocale("en" as Locale)}
                  />
                  <LanguageChip
                    label={t.settings.languageAr}
                    active={locale === "ar"}
                    onPress={() => setLocale("ar" as Locale)}
                  />
                </View>
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { textAlign }]}>{t.settings.darkMode}</Text>
                </View>
                <Moon size={18} color={theme.colors.ink3} strokeWidth={2} />
                <Switch
                  value={isDark}
                  onValueChange={(v) => setColorScheme(v ? "dark" : "light")}
                  trackColor={{ false: theme.colors.border, true: theme.colors.brand }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </Card>
        </View>

        <View>
          <PageSectionTitle>{t.settings.account}</PageSectionTitle>
          <Card>
            <View style={styles.accountRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "?"}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{user?.name ?? "—"}</Text>
                <Text style={styles.accountEmail}>{user?.email ?? "—"}</Text>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <PageSectionTitle>{t.settings.business}</PageSectionTitle>
          <Card>
            {business ? (
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{business.nameAr}</Text>
                {business.nameEn ? (
                  <Text style={styles.businessMeta}>{business.nameEn}</Text>
                ) : null}
                {business.vatNumber ? (
                  <Text style={styles.businessLine}>
                    {t.settings.vatLabel} {business.vatNumber}
                  </Text>
                ) : null}
                {business.address ? (
                  <Text style={styles.businessMeta}>{business.address}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.emptyBusiness}>{t.settings.noBusiness}</Text>
            )}
            <Pressable style={styles.outlineBtn} onPress={() => router.push("/onboarding")}>
              <Text style={styles.outlineBtnText}>
                {business ? t.settings.editBusiness : t.settings.addBusiness}
              </Text>
            </Pressable>
          </Card>
        </View>

        <View>
          <PageSectionTitle>{t.settings.subscription}</PageSectionTitle>
          <Pressable onPress={() => router.push("/paywall")}>
            <Card style={{ opacity: 0.85 }}>
              <View style={styles.proRow}>
                <View style={styles.proInfo}>
                  <Text style={styles.proTitle}>{t.settings.proTitle}</Text>
                  <Text style={styles.proSub}>{t.settings.proSub}</Text>
                  {usage ? (
                    <Text style={styles.proSub}>
                      {usage.limit === null
                        ? t.billing.unlimited
                        : `${t.invoiceNew.usageFree}: ${usage.used}/${usage.limit}`}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.proBadge}>
                  <Lock size={12} color={theme.colors.ink3} strokeWidth={2} />
                  <Text style={styles.proBadgeText}>{t.settings.comingSoon}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        </View>

        <View style={{ gap: 12 }}>
          <PrimaryButton label={t.settings.logout} onPress={handleLogout} variant="destructive" />
          <Text style={styles.version}>
            {t.settings.version}
            {appVersion}
          </Text>
        </View>
      </ScrollView>
      </ScreenBody>
    </ScreenShell>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
