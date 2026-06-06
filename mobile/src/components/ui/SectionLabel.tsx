import { StyleSheet } from "react-native";
import { Text } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";

export function SectionLabel({ children }: { children: string }) {
  const theme = useAppTheme();
  const { textAlign } = useLayout();
  return (
    <Text style={[styles.label, { color: theme.colors.ink3, textAlign }]}>{children}</Text>
  );
}

/** Section title above a card group (settings, lists). */
export function PageSectionTitle({ children }: { children: string }) {
  const theme = useAppTheme();
  const { textAlign } = useLayout();
  return (
    <Text style={[styles.page, { color: theme.colors.ink3, textAlign }]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  page: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
});
