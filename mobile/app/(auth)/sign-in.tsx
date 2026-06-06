import { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Link } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import { View, Text, ScrollView, Pressable, AnimatedView } from "@/tw";
import { useAuth } from "@/lib/auth-context";
import { Field } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { theme } from "@/theme/tokens";
import { useTranslation } from "@/lib/preferences";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      if (Platform.OS === "ios") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("خطأ في تسجيل الدخول", error);
    } else {
      if (Platform.OS === "ios") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.colors.authBg }}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "55%",
            backgroundColor: theme.colors.authHero,
            opacity: 0.7,
            borderBottomLeftRadius: 80,
            borderBottomRightRadius: 80,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            backgroundColor: "#040F08",
          }}
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 32,
            gap: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimatedView entering={FadeInDown.duration(700)} style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 52, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1 }}>
              {locale === "ar" ? t.app.name : t.app.name.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.gold, letterSpacing: 4 }}>
              {locale === "ar" ? "QAFTR" : t.app.nameFull}
            </Text>
            <Text style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
              {t.app.subtitle}
            </Text>
          </AnimatedView>

          <AnimatedView entering={FadeInUp.duration(600).delay(200)} style={{ overflow: "hidden", borderRadius: 24 }}>
            <BlurView intensity={20} tint="dark" style={{ padding: 28, gap: 20, borderRadius: 24 }}>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "rgba(200,151,58,0.25)",
                }}
              />

              <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF", textAlign: "right" }}>
                تسجيل الدخول
              </Text>

              <Field
                label="البريد الإلكتروني"
                variant="dark"
                value={email}
                onChangeText={setEmail}
                placeholder="أدخل بريدك الإلكتروني"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />

              <Field
                label="كلمة المرور"
                variant="dark"
                value={password}
                onChangeText={setPassword}
                placeholder="أدخل كلمة المرور"
                secureTextEntry
                textContentType="password"
              />

              <PrimaryButton
                label="دخول"
                onPress={handleSignIn}
                loading={loading}
                variant="gold"
                size="lg"
              />

              <View style={{ flexDirection: "row-reverse", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>ليس لديك حساب؟ </Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Pressable>
                    <Text style={{ fontSize: 14, color: theme.colors.gold, fontWeight: "600" }}>
                      إنشاء حساب
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </BlurView>
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
