import { StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { View, Text, Pressable } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";
import { spacing } from "@/lib/spacing";
import { typeStyle } from "@/theme/typography";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Override background; when set, text/button adapts to the given surface */
  backgroundColor?: string;
  /** Force text/icon to be light (for dark backgrounds) */
  invertContent?: boolean;
  /** Remove bottom hairline */
  noBorder?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  backgroundColor,
  invertContent,
  noBorder,
}: ScreenHeaderProps) {
  const theme = useAppTheme();
  const { row, alignEnd } = useLayout();
  const showAction = actionLabel && onAction;

  const bg = backgroundColor ?? theme.colors.appBg;
  const titleColor = invertContent ? "#FFFFFF" : theme.colors.ink;
  const subtitleColor = invertContent ? "rgba(255,255,255,0.6)" : theme.colors.ink3;
  const btnBg = invertContent ? "rgba(255,255,255,0.15)" : theme.colors.brand;
  const btnText = "#FFFFFF";

  return (
    <View
      style={[
        styles.wrap,
        {
          borderBottomColor: noBorder ? "transparent" : theme.colors.border,
          borderBottomWidth: noBorder ? 0 : StyleSheet.hairlineWidth,
          backgroundColor: bg,
        },
      ]}
    >
      <View style={[styles.row, { flexDirection: row }]}>
        <View style={[styles.titleBlock, { alignItems: alignEnd }]}>
          <Text style={[typeStyle("title"), { color: titleColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[typeStyle("caption"), { color: subtitleColor }]}>{subtitle}</Text>
          ) : null}
        </View>

        {showAction ? (
          <Pressable
            onPress={onAction}
            style={[
              styles.actionBtn,
              { backgroundColor: btnBg, flexDirection: row },
            ]}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Plus size={14} color={btnText} strokeWidth={2.5} />
            <Text style={[typeStyle("bodyMedium"), { color: btnText, fontSize: 13 }]}>
              {actionLabel.replace(/^\+\s*/, "")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.headerPadX,
    paddingTop: 6,
    paddingBottom: spacing.headerPadBottom,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    minHeight: 40,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
