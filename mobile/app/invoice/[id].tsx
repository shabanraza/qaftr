import { useMemo, useState } from "react";
import { Alert, Image, StyleSheet } from "react-native";
import { AppLoader } from "@/components/ui/AppLoader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { View, Text, ScrollView } from "@/tw";
import { trpc } from "@/lib/trpc";
import type { InvoiceForPdf } from "@/lib/invoice-pdf";
import {
  generateInvoicePdf,
  shareInvoicePdf,
  shareInvoiceViaWhatsApp,
} from "@/lib/share-invoice-pdf";
import { encodeZatcaQr } from "@zatca/shared";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { DetailNavHeader } from "@/components/ui/DetailNavHeader";
import { detailQueryOpts } from "@/lib/query-client";
import { spacing } from "@/lib/spacing";
import { useAppTheme, usePreferences, useTranslation } from "@/lib/preferences";
import { alertTrpcError } from "@/lib/trpc-errors";
import { getStatusStyle } from "@/theme/status";
import { InvoicePreviewSheet } from "@/components/invoices/InvoicePreviewSheet";
import type { InvoicePreviewData } from "@/components/invoices/InvoicePreview";

function fmt(value: string | number, currency = "SAR") {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtDate(date: Date | string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function padNum(n: number) {
  return `INV-${String(n).padStart(3, "0")}`;
}

function toPdfInput(invoice: InvoiceForPdf & { id: string }): InvoiceForPdf {
  const { id: _id, ...pdf } = invoice;
  return pdf;
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();
  const theme = useAppTheme();
  const { colorScheme, locale } = usePreferences();
  const { t } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          flex: 1,
          backgroundColor: theme.colors.appBg,
          justifyContent: "center",
          alignItems: "center",
        },
        errorWrap: {
          paddingHorizontal: 24,
          gap: 12,
        },
        errorTitle: {
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.ink,
          textAlign: "center",
        },
        errorSub: {
          fontSize: 14,
          color: theme.colors.ink3,
          textAlign: "center",
        },
        statusRow: {
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        },
        statusBadge: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        },
        statusText: {
          fontSize: 14,
          fontWeight: "600",
        },
        dateText: {
          fontSize: 14,
          color: theme.colors.ink3,
        },
        entityName: {
          fontSize: 16,
          fontWeight: "700",
          color: theme.colors.ink,
          textAlign: "right",
        },
        entityMeta: {
          fontSize: 13,
          color: theme.colors.ink3,
          textAlign: "right",
          marginTop: 2,
        },
        entityLine: {
          fontSize: 12,
          color: theme.colors.ink3,
          textAlign: "right",
          marginTop: 4,
        },
        businessLogo: {
          width: 56,
          height: 56,
          borderRadius: 8,
          marginBottom: 8,
          alignSelf: "flex-end",
        },
        tableHeader: {
          flexDirection: "row-reverse",
          paddingBottom: 8,
          marginBottom: 4,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        tableHead: {
          fontSize: 12,
          fontWeight: "600",
          color: theme.colors.ink3,
        },
        colDesc: { flex: 1, textAlign: "right" },
        colQty: { width: 40, textAlign: "center" },
        colTotal: { width: 80, textAlign: "left" },
        tableRow: {
          flexDirection: "row-reverse",
          alignItems: "flex-start",
          paddingVertical: 10,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        lineDesc: {
          fontSize: 14,
          fontWeight: "500",
          color: theme.colors.ink,
          textAlign: "right",
        },
        lineMeta: {
          fontSize: 12,
          color: theme.colors.ink3,
          textAlign: "right",
          marginTop: 2,
        },
        lineTotal: {
          fontSize: 14,
          fontWeight: "600",
          color: theme.colors.ink,
          fontVariant: ["tabular-nums"],
        },
        totalRow: {
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          paddingVertical: 8,
        },
        totalLabel: {
          fontSize: 14,
          color: theme.colors.ink2,
        },
        totalValue: {
          fontSize: 14,
          fontWeight: "500",
          color: theme.colors.ink,
          fontVariant: ["tabular-nums"],
        },
        grandTotalRow: {
          marginTop: 4,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
        },
        grandLabel: {
          fontSize: 16,
          fontWeight: "800",
          color: theme.colors.brandText,
        },
        grandValue: {
          fontSize: 16,
          fontWeight: "800",
          color: theme.colors.brandText,
          fontVariant: ["tabular-nums"],
        },
        qrWrap: {
          alignItems: "center",
          gap: 12,
          paddingVertical: 8,
        },
        qrBox: {
          backgroundColor: "#FFFFFF",
          padding: 12,
          borderRadius: 12,
        },
        notes: {
          fontSize: 14,
          color: theme.colors.ink2,
          textAlign: "right",
          lineHeight: 22,
        },
      }),
    [theme],
  );

  const { data: invoice, isPending, error } = trpc.invoices.get.useQuery(
    { id: id ?? "" },
    { enabled: !!id, ...detailQueryOpts },
  );

  const updateStatus = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      utils.invoices.get.invalidate({ id: id ?? "" });
      utils.invoices.list.invalidate();
    },
    onError: (err) =>
      alertTrpcError(err, t, t.common.saveError, (title, message) =>
        Alert.alert(title, message),
      ),
  });

  const [sharingPdf, setSharingPdf] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);

  async function handleSharePdf() {
    if (!invoice) return;
    setSharingPdf(true);
    try {
      const uri = await generateInvoicePdf(toPdfInput({ ...invoice, id: invoice.id }));
      await shareInvoicePdf(uri, {
        title: padNum(invoice.seqNumber),
        message: padNum(invoice.seqNumber),
        dialogTitle: t.invoiceDetail.sharePdf,
      });
    } catch {
      Alert.alert(t.common.error, t.invoiceDetail.shareError);
    } finally {
      setSharingPdf(false);
    }
  }

  async function handleShareWhatsApp() {
    if (!invoice) return;
    setSharingWhatsApp(true);
    try {
      const uri = await generateInvoicePdf(toPdfInput({ ...invoice, id: invoice.id }));
      const invoiceNum = padNum(invoice.seqNumber);
      await shareInvoiceViaWhatsApp(uri, {
        invoiceNumber: invoiceNum,
        total: fmt(invoice.total, invoice.currency),
        caption: `${t.invoiceDetail.whatsappCaption} ${invoice.business?.nameAr ?? ""}`,
        dialogTitle: t.invoiceDetail.shareWhatsApp,
      });
    } catch {
      Alert.alert(t.common.error, t.invoiceDetail.shareError);
    } finally {
      setSharingWhatsApp(false);
    }
  }

  function handleMarkPaid() {
    if (!invoice) return;
    Alert.alert(t.invoiceDetail.markPaidTitle, t.invoiceDetail.markPaidMsg, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.invoiceDetail.confirm,
        onPress: () => updateStatus.mutate({ id: invoice.id, status: "paid" }),
      },
    ]);
  }

  if (isPending && !invoice) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <AppLoader variant="surface" size={56} />
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={[styles.centered, styles.errorWrap, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>{t.invoiceDetail.loadError}</Text>
        <Text style={styles.errorSub}>{t.common.loadErrorSub}</Text>
        <PrimaryButton label={t.invoiceDetail.back} onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const statusKey =
    invoice.status in t.invoices.status ? invoice.status : "draft";
  const cfg = getStatusStyle(statusKey, colorScheme);
  const statusLabel =
    t.invoices.status[statusKey as keyof typeof t.invoices.status];
  const invoiceNum = padNum(invoice.seqNumber);
  const canMarkPaid = invoice.status === "unpaid" || invoice.status === "overdue";

  let qrValue: string | null = null;
  if (invoice.business?.vatNumber) {
    try {
      qrValue = encodeZatcaQr({
        sellerName: invoice.business.nameAr,
        vatNumber: invoice.business.vatNumber,
        timestamp: new Date(invoice.issueDate).toISOString(),
        invoiceTotal: invoice.total,
        vatTotal: invoice.vatAmount,
      });
    } catch {
      // best-effort
    }
  }

  const previewData: InvoicePreviewData = {
    businessName: invoice.business?.nameAr ?? "—",
    businessNameEn: invoice.business?.nameEn,
    businessVat: invoice.business?.vatNumber,
    businessAddress: invoice.business?.address,
    logoUrl: invoice.business?.logoUrl ?? null,
    clientName: invoice.client?.name ?? null,
    clientVat: invoice.client?.vatNumber ?? null,
    issueDate: invoice.issueDate,
    lineItems: invoice.lineItems.map((item: (typeof invoice.lineItems)[number]) => ({
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: parseFloat(item.lineTotal),
    })),
    subtotal: parseFloat(invoice.subtotal),
    vatAmount: parseFloat(invoice.vatAmount),
    total: parseFloat(invoice.total),
    currency: invoice.currency,
    notes: invoice.notes,
    invoiceNumber: invoiceNum,
  };

  return (
    <ScreenShell>
      <DetailNavHeader
        title={invoiceNum}
        onBack={() => router.back()}
        actionLabel={t.invoiceDetail.sharePdf}
        onAction={handleSharePdf}
        actionLoading={sharingPdf}
      />

      <View style={{ paddingHorizontal: spacing.screenX, paddingTop: 8, gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={t.invoiceDetail.shareWhatsApp}
              onPress={handleShareWhatsApp}
              loading={sharingWhatsApp}
              variant="brand"
              size="sm"
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={t.invoiceNew.preview}
              onPress={() => setPreviewOpen(true)}
              variant="outline"
              size="sm"
            />
          </View>
        </View>
      </View>

      <InvoicePreviewSheet
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t.invoicePreview.title}
        closeLabel={t.common.close}
        data={previewData}
        locale={locale}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX,
          paddingTop: spacing.contentTop,
          gap: spacing.item,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{statusLabel}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 2 }}>
            <Text style={styles.dateText}>{fmtDate(invoice.issueDate, locale)}</Text>
            {invoice.dueDate ? (
              <Text style={[styles.dateText, { fontWeight: "600" }]}>
                {t.invoiceDetail.dueDate}: {fmtDate(invoice.dueDate, locale)}
              </Text>
            ) : null}
          </View>
        </View>

        <Card>
          <SectionLabel>{t.invoiceDetail.from}</SectionLabel>
          {invoice.business?.logoUrl ? (
            <Image
              source={{ uri: invoice.business.logoUrl }}
              style={styles.businessLogo}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.entityName}>{invoice.business?.nameAr ?? "—"}</Text>
          {invoice.business?.nameEn ? (
            <Text style={styles.entityMeta}>{invoice.business.nameEn}</Text>
          ) : null}
          {invoice.business?.vatNumber ? (
            <Text style={styles.entityLine}>{t.invoicePreview.vat}: {invoice.business.vatNumber}</Text>
          ) : null}
          {invoice.business?.address ? (
            <Text style={styles.entityMeta}>{invoice.business.address}</Text>
          ) : null}
        </Card>

        {invoice.client ? (
          <Card>
            <SectionLabel>{t.invoiceDetail.to}</SectionLabel>
            <Text style={styles.entityName}>{invoice.client.name}</Text>
            {invoice.client.vatNumber ? (
              <Text style={styles.entityLine}>{t.invoicePreview.vat}: {invoice.client.vatNumber}</Text>
            ) : null}
            {invoice.client.email ? (
              <Text style={styles.entityMeta}>{invoice.client.email}</Text>
            ) : null}
            {invoice.client.phone ? (
              <Text style={styles.entityMeta}>{invoice.client.phone}</Text>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <SectionLabel>{t.invoiceDetail.lineItems}</SectionLabel>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHead, styles.colDesc]}>{t.invoiceDetail.description}</Text>
            <Text style={[styles.tableHead, styles.colQty]}>{t.invoiceDetail.qty}</Text>
            <Text style={[styles.tableHead, styles.colTotal]}>{t.invoiceDetail.total}</Text>
          </View>
          {invoice.lineItems.map((item: (typeof invoice.lineItems)[number]) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.lineDesc}>{item.description}</Text>
                <Text style={styles.lineMeta}>
                  {parseFloat(item.qty).toLocaleString("ar-SA")} × {fmt(item.unitPrice, "")}
                </Text>
              </View>
              <Text style={[styles.lineTotal, styles.colTotal]}>{fmt(item.lineTotal, "")}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <SectionLabel>{t.invoiceDetail.totals}</SectionLabel>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.invoiceDetail.subtotal}</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotal, invoice.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.invoiceDetail.vat}</Text>
            <Text style={styles.totalValue}>{fmt(invoice.vatAmount, invoice.currency)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>{t.invoiceDetail.grandTotal}</Text>
            <Text style={styles.grandValue} selectable>
              {fmt(invoice.total, invoice.currency)}
            </Text>
          </View>
        </Card>

        {qrValue ? (
          <Card>
            <View style={styles.qrWrap}>
              <SectionLabel>{t.invoiceDetail.qrLabel}</SectionLabel>
              <View style={styles.qrBox}>
                <QRCode
                  value={qrValue}
                  size={160}
                  backgroundColor="white"
                  color={theme.colors.brand}
                />
              </View>
            </View>
          </Card>
        ) : null}

        {invoice.notes ? (
          <Card>
            <SectionLabel>{t.invoiceDetail.notes}</SectionLabel>
            <Text style={styles.notes}>{invoice.notes}</Text>
          </Card>
        ) : null}

        {canMarkPaid ? (
          <PrimaryButton
            label={t.invoiceDetail.markPaid}
            onPress={handleMarkPaid}
            loading={updateStatus.isPending}
            variant="brand"
            size="lg"
          />
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}
