import { StyleSheet } from "react-native";
import { Pressable, Text } from "@/tw";
import { useAppTheme } from "@/lib/preferences";
import { InlineLoader } from "./AppLoader";

type Variant = "brand" | "gold" | "destructive" | "outline";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

/** Pill radius — same for every size and variant */
const PILL_RADIUS = 999;

const SIZE_STYLES = {
  sm: { padH: 16, minHeight: 40, fontSize: 14 },
  md: { padH: 20, minHeight: 44, fontSize: 15 },
  lg: { padH: 24, minHeight: 48, fontSize: 17 },
} as const;

export function PrimaryButton({
  label,
  onPress,
  variant = "brand",
  loading = false,
  disabled = false,
  size = "md",
}: PrimaryButtonProps) {
  const theme = useAppTheme();
  const s = SIZE_STYLES[size];

  const variants: Record<Variant, { bg: string; text: string; spinner: string; border?: string }> = {
    brand: { bg: theme.colors.brand, text: theme.colors.onBrand, spinner: theme.colors.onBrand },
    gold: { bg: theme.colors.gold, text: theme.colors.brand, spinner: theme.colors.brand },
    destructive: { bg: theme.colors.destructive, text: "#FFFFFF", spinner: "#FFFFFF" },
    outline: {
      bg: theme.colors.card,
      text: theme.colors.brandText,
      spinner: theme.colors.brandText,
      border: theme.colors.brandText,
    },
  };
  const v = variants[variant];

  return (
    <Pressable
      style={[
        styles.base,
        {
          paddingHorizontal: s.padH,
          minHeight: s.minHeight,
          borderRadius: PILL_RADIUS,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          opacity: loading || disabled ? 0.6 : 1,
        },
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <InlineLoader size={20} primary={v.spinner} accent={theme.colors.gold} />
      ) : (
        <Text style={{ fontSize: s.fontSize, fontWeight: "700", color: v.text }}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
