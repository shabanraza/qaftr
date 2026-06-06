import { StyleSheet, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import {
  FloatingTabBar,
  TabIcons,
  type TabItem,
} from "@/components/floating-tab-bar";
import { useAppTheme, usePreferences } from "@/lib/preferences";

const TABS: TabItem[] = [
  { key: "index", labelAr: "الفواتير", labelEn: "Invoices", Icon: TabIcons.FileText },
  { key: "clients", labelAr: "العملاء", labelEn: "Clients", Icon: TabIcons.Users },
  { key: "settings", labelAr: "الإعدادات", labelEn: "Settings", Icon: TabIcons.Settings2 },
];

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const theme = useAppTheme();
  const { locale } = usePreferences();
  const activeKey = (segments[segments.length - 1] as string | undefined) ?? "index";
  const resolvedKey = TABS.some((t) => t.key === activeKey) ? activeKey : "index";

  function handleTabPress(key: string) {
    if (key === "index") router.replace("/(tabs)");
    else router.replace(`/(tabs)/${key}` as never);
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.appBg }]}>
      <Slot />
      <FloatingTabBar
        tabs={TABS}
        activeKey={resolvedKey}
        onPress={handleTabPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
