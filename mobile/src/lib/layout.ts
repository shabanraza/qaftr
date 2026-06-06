import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_MARGIN } from "@/components/floating-tab-bar";

/**
 * Bottom padding so scroll content clears the floating pill tab bar.
 * TAB_BAR_HEIGHT + bottom margin + inset + extra breathing room.
 */
export function tabBarScrollPadding(bottomInset: number) {
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + Math.max(bottomInset, 12) + 16;
}
