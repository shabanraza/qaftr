import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { FileText, Settings2, Users, type LucideIcon } from "lucide-react-native";
import { Text } from "@/tw";
import { useAppTheme, usePreferences } from "@/lib/preferences";
import { typeStyle } from "@/theme/typography";

export const TAB_BAR_HEIGHT = 56;
export const TAB_BAR_BOTTOM_MARGIN = 16;

export interface TabItem {
  key: string;
  labelAr: string;
  labelEn: string;
  Icon: LucideIcon;
}

interface FloatingTabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onPress: (key: string) => void;
}

function TabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const { locale } = usePreferences();
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
  }, [isActive, progress]);

  // Pill behind the whole chip (icon + label)
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: withSpring(isActive ? 1 : 0.85, { damping: 20, stiffness: 300 }) }],
  }));

  const label = locale === "ar" ? tab.labelAr : tab.labelEn;
  const { Icon } = tab;
  const activeColor = theme.colors.brandText;
  const inactiveColor = theme.colors.ink3;

  function handlePress() {
    if (Platform.OS === "ios") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      void Haptics.selectionAsync();
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
    >
      {/* Pill sits behind the chip and is the same size */}
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: theme.colors.brandMuted },
          pillStyle,
        ]}
      />

      {/* Icon + label stacked — both inside the pill zone */}
      <Icon
        size={18}
        color={isActive ? activeColor : inactiveColor}
        strokeWidth={isActive ? 2.5 : 1.75}
      />
      <Text style={[styles.label, { color: isActive ? activeColor : inactiveColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FloatingTabBar({ tabs, activeKey, onPress }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const bottom = Math.max(insets.bottom, 12) + TAB_BAR_BOTTOM_MARGIN;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.card,
            shadowColor: theme.colors.ink,
          },
        ]}
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeKey === tab.key}
            onPress={() => onPress(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

export const TabIcons = { FileText, Users, Settings2 };

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 100,
  },
  container: {
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    // Chip area — pill will fill this exact space
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  // Pill matches the tabButton's content area exactly
  pill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
    borderRadius: 22,
  },
  label: {
    ...typeStyle("label"),
    fontSize: 9,
    letterSpacing: 0.2,
  },
});
