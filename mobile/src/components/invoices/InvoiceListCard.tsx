import { Pressable, StyleSheet, View as RNView } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/tw";
import { spacing } from "@/lib/spacing";
import {
  formatMoney,
  useAppTheme,
  useLayout,
  usePreferences,
  useTranslation,
} from "@/lib/preferences";
import { getStatusStyle, type InvoiceStatusKey } from "@/theme/status";
import { typeStyle } from "@/theme/typography";

interface InvoiceListCardProps {
  invoice: {
    id: string;
    seqNumber: number;
    status: InvoiceStatusKey;
    total: string;
    currency: string;
    issueDate: Date | string;
    dueDate?: Date | string | null;
  };
  onPress: () => void;
}

export function InvoiceListCard({ invoice, onPress }: InvoiceListCardProps) {
  const theme = useAppTheme();
  const { locale, colorScheme } = usePreferences();
  const { t } = useTranslation();
  const { row, isRTL } = useLayout();
  const cfg = getStatusStyle(invoice.status, colorScheme);
  const statusKey = invoice.status as keyof typeof t.invoices.status;
  const label = t.invoices.status[statusKey] ?? t.invoices.status.draft;
  const dateTag = locale === "ar" ? "ar-SA" : "en-US";
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const isOverdue = invoice.status === "overdue";
  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString(dateTag, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          flexDirection: row,
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <RNView style={styles.body}>
        <RNView style={[styles.topRow, { flexDirection: row }]}>
          <Text style={[typeStyle("bodyMedium"), { color: theme.colors.ink }]}>
            INV-{String(invoice.seqNumber).padStart(3, "0")}
          </Text>
          <RNView style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[typeStyle("label"), { color: cfg.color, fontSize: 9 }]}>{label}</Text>
          </RNView>
        </RNView>

        <RNView style={[styles.bottomRow, { flexDirection: row }]}>
          <RNView style={{ gap: 2 }}>
            <Text style={[typeStyle("caption"), { color: theme.colors.ink3 }]}>
              {new Date(invoice.issueDate).toLocaleDateString(dateTag, {
                month: "short",
                day: "numeric",
              })}
            </Text>
            {dueDateStr ? (
              <Text
                style={[
                  typeStyle("caption"),
                  {
                    color: isOverdue ? cfg.color : theme.colors.ink3,
                    fontWeight: isOverdue ? "700" : "500",
                  },
                ]}
              >
                {t.invoiceDetail.dueDate}: {dueDateStr}
              </Text>
            ) : null}
          </RNView>
          <Text style={[typeStyle("money"), { color: theme.colors.ink }]} selectable>
            {formatMoney(parseFloat(invoice.total), locale)} {invoice.currency}
          </Text>
        </RNView>
      </RNView>

      <Chevron size={16} color={theme.colors.ink3} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: spacing.cardRadius,
    paddingVertical: 10,
    paddingHorizontal: spacing.cardPad,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  bottomRow: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  num: {
    fontSize: 14,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  date: {
    fontSize: 11,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});
