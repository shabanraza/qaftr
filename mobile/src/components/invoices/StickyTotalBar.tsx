import { StyleSheet, View as RNView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/tw";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { spacing } from "@/lib/spacing";
import {
  formatMoney,
  useAppTheme,
  useLayout,
  usePreferences,
  useTranslation,
} from "@/lib/preferences";
import { typeStyle } from "@/theme/typography";

interface StickyTotalBarProps {
  total: number;
  vatAmount: number;
  onSave: () => void;
  onPreview?: () => void;
  previewLabel?: string;
  saving?: boolean;
}

export function StickyTotalBar({
  total,
  vatAmount,
  onSave,
  onPreview,
  previewLabel,
  saving,
}: StickyTotalBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { locale } = usePreferences();
  const { t } = useTranslation();
  const { row } = useLayout();

  return (
    <RNView
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <RNView style={[styles.row, { flexDirection: row }]}>
        <RNView style={styles.copy}>
          <Text style={[typeStyle("label"), { color: theme.colors.ink3 }]}>{t.invoiceNew.total}</Text>
          <Text style={[typeStyle("moneyLg"), { color: theme.colors.ink, fontSize: 22 }]} selectable>
            {formatMoney(total, locale)} {t.common.sar}
          </Text>
          <Text style={[typeStyle("caption"), { color: theme.colors.ink3 }]}>
            {t.invoiceNew.vatIncl} {formatMoney(vatAmount, locale)}
          </Text>
        </RNView>
        <RNView style={styles.actions}>
          {onPreview && previewLabel ? (
            <PrimaryButton
              label={previewLabel}
              onPress={onPreview}
              variant="outline"
              size="sm"
            />
          ) : null}
          <PrimaryButton
            label={t.common.save}
            onPress={onSave}
            loading={saving}
            variant="brand"
            size="sm"
          />
        </RNView>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: spacing.screenX,
  },
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
