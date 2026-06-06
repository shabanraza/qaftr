import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/preferences";

interface ScreenShellProps {
  children: ReactNode;
  backgroundColor?: string;
  /** Color behind the status bar — defaults to backgroundColor */
  topBarColor?: string;
}

export function ScreenShell({ children, backgroundColor, topBarColor }: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const bg = backgroundColor ?? theme.colors.appBg;
  const topBg = topBarColor ?? bg;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <View style={{ height: insets.top, backgroundColor: topBg }} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
});
