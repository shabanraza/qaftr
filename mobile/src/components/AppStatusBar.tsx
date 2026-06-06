import { StatusBar } from "expo-status-bar";
import { useSegments } from "expo-router";
import { usePreferences } from "@/lib/preferences";

export function AppStatusBar() {
  const segments = useSegments();
  const { colorScheme } = usePreferences();
  const root = segments[0];
  const onDarkHero = root === "(auth)";

  if (onDarkHero) return <StatusBar style="light" />;

  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />;
}
