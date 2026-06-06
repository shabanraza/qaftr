import { StyleSheet, TouchableOpacity } from "react-native";
import { Eye } from "lucide-react-native";
import { View, Text } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";
import { typeStyle } from "@/theme/typography";

interface SubScreenHeaderProps {
  title: string;
  cancelLabel?: string;
  onCancel: () => void;
  previewLabel?: string;
  onPreview?: () => void;
}

export function SubScreenHeader({
  title,
  cancelLabel = "Cancel",
  onCancel,
  previewLabel,
  onPreview,
}: SubScreenHeaderProps) {
  const theme = useAppTheme();
  const { row, isRTL } = useLayout();

  return (
    <View
      style={[
        styles.wrap,
        {
          flexDirection: row,
          backgroundColor: theme.colors.appBg,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <TouchableOpacity onPress={onCancel} hitSlop={8}>
        <Text style={[typeStyle("body"), { color: theme.colors.ink2 }]}>{cancelLabel}</Text>
      </TouchableOpacity>
      <Text style={[typeStyle("headline"), { color: theme.colors.ink }]}>{title}</Text>
      {onPreview && previewLabel ? (
        <TouchableOpacity
          onPress={onPreview}
          hitSlop={8}
          style={[
            styles.previewBtn,
            { borderColor: theme.colors.border, flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Eye size={15} color={theme.colors.brandText} strokeWidth={2} />
          <Text style={[typeStyle("bodyMedium"), { color: theme.colors.brandText, fontSize: 13 }]}>
            {previewLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    minHeight: 36,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  spacer: { width: 72 },
});
