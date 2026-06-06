import { Image, StyleSheet, View as RNView } from "react-native";
import { Text } from "@/tw";
import { spacing } from "@/lib/spacing";
import { formatMoney, useLayout, useTranslation } from "@/lib/preferences";
import type { Locale } from "@/i18n/translations";
import { typeStyle } from "@/theme/typography";

export interface InvoicePreviewLine {
  description: string;
  qty: string;
  unitPrice: string;
  lineTotal: number;
}

export interface InvoicePreviewData {
  businessName: string;
  businessNameEn?: string | null;
  businessVat?: string | null;
  businessAddress?: string | null;
  logoUrl?: string | null;
  clientName?: string | null;
  clientVat?: string | null;
  issueDate: Date | string;
  lineItems: InvoicePreviewLine[];
  subtotal: number;
  vatAmount: number;
  total: number;
  currency?: string;
  notes?: string | null;
  invoiceNumber?: string;
}

interface InvoicePreviewProps {
  data: InvoicePreviewData;
  locale: Locale;
}

export function InvoicePreview({ data, locale }: InvoicePreviewProps) {
  const { t } = useTranslation();
  const { textAlign, row } = useLayout();
  const currency = data.currency ?? t.common.sar;
  const dateTag = locale === "ar" ? "ar-SA" : "en-US";
  const dateStr = new Date(data.issueDate).toLocaleDateString(dateTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <RNView style={styles.paper}>
      <RNView style={[styles.header, { flexDirection: row }]}>
        <RNView style={{ flex: 1, alignItems: textAlign === "right" ? "flex-end" : "flex-start" }}>
          {data.logoUrl ? (
            <Image source={{ uri: data.logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : null}
          <Text style={[typeStyle("headline"), styles.ink, { textAlign }]}>
            {data.businessName}
          </Text>
          {data.businessNameEn ? (
            <Text style={[typeStyle("caption"), styles.muted, { textAlign }]}>
              {data.businessNameEn}
            </Text>
          ) : null}
          {data.businessVat ? (
            <Text style={[typeStyle("caption"), styles.muted, { textAlign }]}>
              {t.invoicePreview.vat}: {data.businessVat}
            </Text>
          ) : null}
        </RNView>
        <RNView style={{ alignItems: textAlign === "right" ? "flex-start" : "flex-end" }}>
          {data.invoiceNumber ? (
            <Text style={[typeStyle("bodyMedium"), styles.ink]}>{data.invoiceNumber}</Text>
          ) : (
            <Text style={[typeStyle("label"), styles.muted]}>{t.invoicePreview.draft}</Text>
          )}
          <Text style={[typeStyle("caption"), styles.muted]}>{dateStr}</Text>
        </RNView>
      </RNView>

      {data.clientName ? (
        <RNView style={styles.block}>
          <Text style={[typeStyle("label"), styles.muted, { textAlign }]}>{t.invoicePreview.to}</Text>
          <Text style={[typeStyle("bodyMedium"), styles.ink, { textAlign }]}>{data.clientName}</Text>
          {data.clientVat ? (
            <Text style={[typeStyle("caption"), styles.muted, { textAlign }]}>
              {t.invoicePreview.vat}: {data.clientVat}
            </Text>
          ) : null}
        </RNView>
      ) : null}

      <RNView style={styles.tableHead}>
        <Text style={[typeStyle("label"), styles.muted, styles.colDesc, { textAlign }]}>
          {t.invoicePreview.description}
        </Text>
        <Text style={[typeStyle("label"), styles.muted, styles.colAmt]}>{t.invoicePreview.amount}</Text>
      </RNView>

      {data.lineItems.map((item, idx) => (
        <RNView key={`${item.description}-${idx}`} style={[styles.tableRow, { flexDirection: row }]}>
          <RNView style={styles.colDesc}>
            <Text style={[typeStyle("body"), styles.ink, { textAlign }]}>{item.description}</Text>
            <Text style={[typeStyle("caption"), styles.muted, { textAlign }]}>
              {item.qty} × {formatMoney(parseFloat(item.unitPrice) || 0, locale)}
            </Text>
          </RNView>
          <Text style={[typeStyle("money"), styles.ink, styles.colAmt]}>
            {formatMoney(item.lineTotal, locale)}
          </Text>
        </RNView>
      ))}

      <RNView style={styles.totals}>
        <RNView style={[styles.totalRow, { flexDirection: row }]}>
          <Text style={[typeStyle("caption"), styles.muted]}>{t.invoiceNew.subtotal}</Text>
          <Text style={[typeStyle("bodyMedium"), styles.ink]}>
            {formatMoney(data.subtotal, locale)} {currency}
          </Text>
        </RNView>
        <RNView style={[styles.totalRow, { flexDirection: row }]}>
          <Text style={[typeStyle("caption"), styles.muted]}>{t.invoiceNew.vat}</Text>
          <Text style={[typeStyle("bodyMedium"), styles.ink]}>
            {formatMoney(data.vatAmount, locale)} {currency}
          </Text>
        </RNView>
        <RNView style={[styles.totalRow, styles.grandRow, { flexDirection: row }]}>
          <Text style={[typeStyle("headline"), styles.brand]}>{t.invoiceNew.total}</Text>
          <Text style={[typeStyle("moneyLg"), styles.brand]}>
            {formatMoney(data.total, locale)} {currency}
          </Text>
        </RNView>
      </RNView>

      {data.notes ? (
        <RNView style={styles.block}>
          <Text style={[typeStyle("label"), styles.muted, { textAlign }]}>{t.invoiceNew.notes}</Text>
          <Text style={[typeStyle("body"), styles.ink2, { textAlign }]}>{data.notes}</Text>
        </RNView>
      ) : null}

    </RNView>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: "#FFFFFF",
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: spacing.cardPad + 4,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  header: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginBottom: 6,
  },
  block: { gap: 4 },
  tableHead: {
    flexDirection: "row",
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  tableRow: {
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
    gap: 8,
  },
  colDesc: { flex: 1 },
  colAmt: { minWidth: 88, textAlign: "right" },
  totals: { gap: 6, marginTop: 4 },
  totalRow: { justifyContent: "space-between", alignItems: "center" },
  grandRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  ink: { color: "#111827" },
  ink2: { color: "#4B5563" },
  muted: { color: "#9CA3AF" },
  brand: { color: "#0A3D2E" },
  footer: { color: "#9CA3AF", marginTop: 8 },
});
