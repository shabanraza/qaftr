import { StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "@/tw";
import { useAppTheme } from "@/lib/preferences";
import { InvoiceLoader } from "./InvoiceLoader";

export type AppLoaderVariant = "brand" | "surface";

interface AppLoaderProps {
  fullScreen?: boolean;
  variant?: AppLoaderVariant;
  label?: string;
  size?: number;
  style?: ViewStyle;
}

export function AppLoader({
  fullScreen = false,
  variant = "surface",
  label,
  size,
  style,
}: AppLoaderProps) {
  const theme = useAppTheme();
  const primary = variant === "brand" ? "#FFFFFF" : theme.colors.brandText;
  const accent = theme.colors.gold;
  const backgroundColor = variant === "brand" ? theme.colors.brand : theme.colors.appBg;
  const loaderSize = size ?? (fullScreen ? 64 : 52);

  const content = (
    <View style={[styles.center, style]}>
      <InvoiceLoader size={loaderSize} primary={primary} accent={accent} />
      {label ? (
        <Text
          style={[
            styles.label,
            { color: variant === "brand" ? "rgba(255,255,255,0.75)" : theme.colors.ink2 },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return <View style={[styles.full, { backgroundColor }]}>{content}</View>;
  }

  return content;
}

/** For splash / font load — outside PreferencesProvider */
export function SplashLoader({ variant = "brand" }: { variant?: AppLoaderVariant }) {
  const isBrand = variant === "brand";
  return (
    <View
      style={[
        styles.full,
        { backgroundColor: isBrand ? "#0A3D2E" : "#F4F6F5" },
      ]}
    >
      <View style={styles.center}>
        <InvoiceLoader
          size={64}
          primary={isBrand ? "#FFFFFF" : "#72D4AC"}
          accent="#C8973A"
        />
      </View>
    </View>
  );
}

/** Compact inline spinner for buttons and headers */
export function InlineLoader({
  size = 18,
  primary = "#FFFFFF",
  accent = "#C8973A",
}: {
  size?: number;
  primary?: string;
  accent?: string;
}) {
  return <InvoiceLoader size={size} primary={primary} accent={accent} />;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
