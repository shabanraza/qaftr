import { Modal, ScrollView, StyleSheet, View as RNView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { useAppTheme } from "@/lib/preferences";
import { spacing } from "@/lib/spacing";
import { InvoicePreview, type InvoicePreviewData } from "./InvoicePreview";
import type { Locale } from "@/i18n/translations";

interface InvoicePreviewSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  data: InvoicePreviewData;
  locale: Locale;
}

export function InvoicePreviewSheet({
  visible,
  onClose,
  title,
  closeLabel,
  data,
  locale,
}: InvoicePreviewSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <RNView
        style={[
          styles.shell,
          {
            backgroundColor: theme.colors.appBg,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <SheetHeader title={title} closeLabel={closeLabel} onClose={onClose} />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <InvoicePreview data={data} locale={locale} />
        </ScrollView>
      </RNView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.contentTop,
    paddingBottom: 24,
  },
});
