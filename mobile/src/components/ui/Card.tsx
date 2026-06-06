import type { ReactNode } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { Text } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";
import { spacing } from "@/lib/spacing";

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
}

export function Card({ children, title, style }: CardProps) {
  const theme = useAppTheme();
  const { textAlign } = useLayout();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {title ? (
        <Text style={[styles.title, { color: theme.colors.ink, textAlign }]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPad,
    gap: spacing.section,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
  },
});
