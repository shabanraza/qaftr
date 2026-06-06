import { StyleSheet, TouchableOpacity } from "react-native";
import { InlineLoader } from "./AppLoader";
import { View, Text } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";
import { spacing } from "@/lib/spacing";

interface DetailNavHeaderProps {
  title: string;
  onBack: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
}

export function DetailNavHeader({
  title,
  onBack,
  actionLabel,
  onAction,
  actionLoading,
}: DetailNavHeaderProps) {
  const theme = useAppTheme();
  const { row } = useLayout();

  return (
    <View
      style={[
        styles.wrap,
        {
          flexDirection: row,
          backgroundColor: theme.colors.card,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        style={[styles.backBtn, { backgroundColor: theme.colors.brandMuted }]}
      >
        <Text style={[styles.backIcon, { color: theme.colors.brandText }]}>›</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.colors.ink }]}>{title}</Text>

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.75}
          disabled={actionLoading}
          style={[styles.actionBtn, { backgroundColor: `${theme.colors.gold}22` }]}
        >
          {actionLoading ? (
            <InlineLoader size={18} primary={theme.colors.gold} accent={theme.colors.brandText} />
          ) : (
            <Text style={[styles.actionText, { color: theme.colors.gold }]}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenX,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "700",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  spacer: { width: 88 },
});
