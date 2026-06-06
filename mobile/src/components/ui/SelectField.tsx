import { StyleSheet, TouchableOpacity } from "react-native";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import { View, Text } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";
import { spacing } from "@/lib/spacing";

interface SelectFieldProps {
  label?: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
}

export function SelectField({ label, value, placeholder, onPress }: SelectFieldProps) {
  const theme = useAppTheme();
  const { textAlign, row, isRTL } = useLayout();
  const hasValue = !!value;
  const Chevron = isRTL ? ChevronLeft : ChevronDown;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.ink2, textAlign }]}>{label}</Text>
      ) : null}
      <TouchableOpacity
        style={[
          styles.input,
          {
            flexDirection: row,
            backgroundColor: theme.colors.inputBg,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Chevron size={18} color={theme.colors.ink3} strokeWidth={2} />
        <Text
          style={[
            styles.value,
            { textAlign, color: hasValue ? theme.colors.ink : theme.colors.ink3 },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: spacing.cardRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  value: {
    flex: 1,
    fontSize: 14,
  },
});
