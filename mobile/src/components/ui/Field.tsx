import { View, StyleSheet, type TextInputProps } from "react-native";
import { Text, TextInput } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";
import { spacing } from "@/lib/spacing";
import { typeStyle, fonts } from "@/theme/typography";

type FieldVariant = "light" | "dark";
type FieldSize = "md" | "sm";

export interface FieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  required?: boolean;
  variant?: FieldVariant;
  size?: FieldSize;
  hideLabel?: boolean;
}

export function Field({
  label,
  hint,
  required,
  variant = "light",
  size = "md",
  hideLabel,
  ...inputProps
}: FieldProps) {
  const theme = useAppTheme();
  const { textAlign } = useLayout();
  const isDark = variant === "dark";
  const isSm = size === "sm";

  return (
    <View style={styles.wrap}>
      {label && !hideLabel ? (
        <Text
          style={[
            typeStyle("label"),
            { color: isDark ? "rgba(255,255,255,0.65)" : theme.colors.ink2, textAlign },
          ]}
        >
          {label}
          {required ? " *" : ""}
        </Text>
      ) : null}

      <TextInput
        {...inputProps}
        style={[
          styles.input,
          isSm && styles.inputSm,
          {
            textAlign,
            fontFamily: fonts.regular,
            fontSize: isSm ? 13 : 15,
            color: isDark ? "#FFFFFF" : theme.colors.ink,
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.colors.inputBg,
            borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.colors.border,
          },
          inputProps.multiline && styles.multiline,
        ]}
        placeholderTextColor={
          isDark ? "rgba(255,255,255,0.35)" : theme.field.placeholder
        }
      />

      {hint ? (
        <Text
          style={[
            typeStyle("caption"),
            {
              textAlign,
              color: isDark ? "rgba(255,255,255,0.45)" : theme.colors.ink3,
            },
          ]}
        >
          {hint}
        </Text>
      ) : null}
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
    borderWidth: 1,
    borderRadius: spacing.cardRadius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputSm: {
    fontSize: 13,
    paddingVertical: 8,
    borderRadius: 10,
  },
  multiline: {
    minHeight: 64,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
});
