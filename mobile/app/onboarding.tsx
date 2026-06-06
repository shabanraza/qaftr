import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Alert, StyleSheet, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Building2, ImagePlus } from "lucide-react-native";
import { View, Text, ScrollView } from "@/tw";
import { trpc } from "@/lib/trpc";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { SubScreenHeader } from "@/components/ui/SubScreenHeader";
import { useAppTheme, usePreferences, useTranslation } from "@/lib/preferences";
import { alertTrpcError } from "@/lib/trpc-errors";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const { locale } = usePreferences();
  const { t } = useTranslation();
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const utils = trpc.useUtils();
  const { data: existing } = trpc.business.get.useQuery();
  const isEdit = !!existing;

  useEffect(() => {
    if (!existing || prefilled) return;
    setNameAr(existing.nameAr);
    setNameEn(existing.nameEn ?? "");
    setVatNumber(existing.vatNumber ?? "");
    setAddress(existing.address ?? "");
    setLogoUrl(existing.logoUrl ?? null);
    setPrefilled(true);
  }, [existing, prefilled]);

  const upsert = trpc.business.upsert.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    },
    onError: (err) =>
      alertTrpcError(err, t, t.common.saveError, (title, message) =>
        Alert.alert(title, message),
      ),
  });

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? "image/jpeg";
    const dataUrl = `data:${mime};base64,${asset.base64}`;
    if (dataUrl.length > 400_000) {
      Alert.alert(t.common.alert, t.onboarding.logoTooLarge);
      return;
    }
    setLogoUrl(dataUrl);
  }

  function handleSave() {
    if (!nameAr.trim()) {
      Alert.alert(t.common.alert, t.onboarding.nameRequired);
      return;
    }
    upsert.mutate({
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined,
      address: address.trim() || undefined,
      logoUrl: logoUrl ?? undefined,
      defaultLanguage: locale,
    });
  }

  function handleCancel() {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }

  return (
    <ScreenShell>
      <SubScreenHeader
        title={isEdit ? t.settings.editBusiness : t.settings.addBusiness}
        cancelLabel={t.common.cancel}
        onCancel={handleCancel}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.brandMuted }]}>
              <Building2 size={28} color={theme.colors.brandText} strokeWidth={2} />
            </View>
            <Text style={[styles.hint, { color: theme.colors.ink2 }]}>{t.onboarding.hint}</Text>
          </View>

          <Card>
            <Text style={[styles.logoLabel, { color: theme.colors.ink3 }]}>{t.onboarding.logo}</Text>
            <View style={styles.logoRow}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.brandMuted }]}>
                  <ImagePlus size={24} color={theme.colors.brandText} strokeWidth={2} />
                </View>
              )}
              <View style={styles.logoActions}>
                <PrimaryButton
                  label={t.onboarding.logoPick}
                  onPress={pickLogo}
                  variant="outline"
                  size="sm"
                />
                {logoUrl ? (
                  <Pressable onPress={() => setLogoUrl(null)} hitSlop={8}>
                    <Text style={[styles.logoRemove, { color: theme.colors.destructive }]}>
                      {t.onboarding.logoRemove}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Field
              label={t.onboarding.nameAr}
              required
              value={nameAr}
              onChangeText={setNameAr}
              placeholder={t.onboarding.nameArPh}
            />
            <Field
              label={t.onboarding.nameEn}
              value={nameEn}
              onChangeText={setNameEn}
              placeholder={t.onboarding.nameEnPh}
              autoCapitalize="words"
            />
            <Field
              label={t.onboarding.vat}
              value={vatNumber}
              onChangeText={setVatNumber}
              placeholder={t.onboarding.vatPh}
              keyboardType="number-pad"
              maxLength={15}
            />
            <Field
              label={t.onboarding.address}
              value={address}
              onChangeText={setAddress}
              placeholder={t.onboarding.addressPh}
              multiline
              numberOfLines={2}
            />
          </Card>

          <PrimaryButton
            label={t.common.save}
            onPress={handleSave}
            loading={upsert.isPending}
            variant="brand"
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  iconRow: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    fontSize: 14,
    textAlign: "center",
  },
  logoLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  logoPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  logoActions: {
    flex: 1,
    gap: 8,
    alignItems: "flex-start",
  },
  logoRemove: {
    fontSize: 13,
    fontWeight: "600",
  },
});
