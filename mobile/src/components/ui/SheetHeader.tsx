import { StyleSheet, Pressable } from "react-native";
import { View, Text } from "@/tw";
import { useAppTheme, useLayout } from "@/lib/preferences";

interface SheetHeaderProps {
  title: string;
  onClose: () => void;
  closeLabel?: string;
}

export function SheetHeader({ title, onClose, closeLabel = "Close" }: SheetHeaderProps) {
  const theme = useAppTheme();
  const { row } = useLayout();

  return (
    <View
      style={[
        styles.wrap,
        {
          flexDirection: row,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.ink }]}>{title}</Text>
      <Pressable onPress={onClose} hitSlop={8}>
        <Text style={[styles.close, { color: theme.colors.ink2 }]}>{closeLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  close: {
    fontSize: 15,
  },
});
