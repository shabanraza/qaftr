import type { LucideIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { View, Text } from "@/tw";
import { PrimaryButton } from "./PrimaryButton";
import { useAppTheme } from "@/lib/preferences";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.brandMuted }]}>
        <Icon size={36} color={theme.colors.brandText} strokeWidth={1.75} />
      </View>
      <Text style={[styles.title, { color: theme.colors.ink }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.ink2 }]}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} variant="brand" size="lg" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  action: {
    marginTop: 8,
    width: "100%",
    maxWidth: 280,
  },
});
