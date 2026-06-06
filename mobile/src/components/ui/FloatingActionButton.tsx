import { Pressable, Text } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Platform, type ViewStyle } from "react-native";
import { Plus } from "lucide-react-native";
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_MARGIN } from "@/components/floating-tab-bar";

interface FloatingActionButtonProps {
  label: string;
  onPress: () => void;
}

export function FloatingActionButton({ label, onPress }: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();

  function handlePress() {
    if (Platform.OS === "ios") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }

  return (
    <Pressable
      className="absolute end-5 flex-row-reverse items-center gap-2 px-5 py-3.5 rounded-full bg-gold"
      style={
        {
          bottom: TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + Math.max(insets.bottom, 12) + 12,
          backgroundColor: "#C8973A",
          boxShadow: "0 4px 16px rgba(200,151,58,0.45)",
          zIndex: 50,
        } as ViewStyle
      }
      onPress={handlePress}
    >
      <Plus size={18} color="#0A3D2E" strokeWidth={2.5} />
      <Text className="text-[15px] font-bold text-brand">{label}</Text>
    </Pressable>
  );
}
