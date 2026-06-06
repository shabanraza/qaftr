import type { ReactNode } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { spacing } from "@/lib/spacing";

interface ScreenBodyProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Skip top gap when content manages its own (e.g. sub-screens with nav bar). */
  noTopGap?: boolean;
}

/** Wraps scroll/list content so it never touches the header. */
export function ScreenBody({ children, style, noTopGap }: ScreenBodyProps) {
  return (
    <View style={[styles.body, !noTopGap && styles.topGap, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  topGap: { paddingTop: spacing.contentTop },
});
