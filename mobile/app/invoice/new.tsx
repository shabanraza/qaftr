import { useState, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
  Pressable,
  View as RNView,
  StyleSheet,
  Text as RNText,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Plus, Trash2 } from "lucide-react-native";
import { ScrollView } from "@/tw";
import { trpc } from "@/lib/trpc";
import { newId } from "@/lib/id";
import { Field } from "@/components/ui/Field";
import { SelectField } from "@/components/ui/SelectField";
import { SubScreenHeader } from "@/components/ui/SubScreenHeader";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { StickyTotalBar } from "@/components/invoices/StickyTotalBar";
import { InvoicePreviewSheet } from "@/components/invoices/InvoicePreviewSheet";
import type { InvoicePreviewData } from "@/components/invoices/InvoicePreview";
import { listQueryOpts } from "@/lib/query-client";
import { spacing } from "@/lib/spacing";
import {
  formatMoney,
  useAppTheme,
  useLayout,
  usePreferences,
  useTranslation,
} from "@/lib/preferences";
import { alertTrpcError } from "@/lib/trpc-errors";
import { computeInvoiceTotals } from "@zatca/shared";

interface LineItem {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
}

function toTotalsInput(items: LineItem[]) {
  return items
    .filter((item) => item.description.trim() && parseFloat(item.unitPrice))
    .map((item) => ({
      description: item.description.trim(),
      qty: item.qty,
      unitPrice: item.unitPrice,
    }));
}

export default function NewInvoiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const { locale } = usePreferences();
  const { t } = useTranslation();
  const { row, textAlign } = useLayout();

  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: newId("line"), description: "", qty: "1", unitPrice: "" },
  ]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: business } = trpc.business.get.useQuery(undefined, listQueryOpts);
  const { data: clients } = trpc.clients.list.useQuery(undefined, listQueryOpts);
  const { data: usage } = trpc.billing.getUsage.useQuery(undefined, listQueryOpts);

  const issueDate = useMemo(() => new Date(), []);
  const dueDate = useMemo(() => {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 30);
    return d;
  }, [issueDate]);

  const invoiceTotals = useMemo(
    () => computeInvoiceTotals(toTotalsInput(lineItems)),
    [lineItems],
  );
  const subtotal = parseFloat(invoiceTotals.subtotal);
  const vatAmount = parseFloat(invoiceTotals.vatAmount);
  const total = parseFloat(invoiceTotals.total);

  const dueDateLabel = useMemo(
    () =>
      dueDate.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [dueDate, locale],
  );

  const utils = trpc.useUtils();
  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: (created) => {
      utils.invoices.list.invalidate();
      if (Platform.OS === "ios") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/invoice/${created.id}`);
    },
    onError: (err) => {
      if (err.message === "FREE_INVOICE_LIMIT") {
        Alert.alert(t.common.alert, t.invoiceNew.limitReached, [
          { text: t.common.cancel, style: "cancel" },
          { text: t.paywall.title, onPress: () => router.push("/paywall") },
        ]);
        return;
      }
      alertTrpcError(err, t, t.common.saveError, (title, message) =>
        Alert.alert(title, message),
      );
    },
  });

  function addLine() {
    setLineItems((prev) => [...prev, { id: newId("line"), description: "", qty: "1", unitPrice: "" }]);
    if (Platform.OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function removeLine(id: string) {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateLine(id: string, field: keyof LineItem, value: string) {
    setLineItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  const previewData: InvoicePreviewData | null = useMemo(() => {
    if (!business) return null;
    return {
      businessName: business.nameAr,
      businessNameEn: business.nameEn,
      businessVat: business.vatNumber,
      businessAddress: business.address,
      logoUrl: business.logoUrl ?? null,
      clientName: selectedClientName || null,
      clientVat: clients?.find((c: { id: string; vatNumber?: string | null }) => c.id === selectedClientId)?.vatNumber ?? null,
      issueDate: issueDate.toISOString(),
      lineItems: invoiceTotals.lineItems.map((item) => ({
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: parseFloat(item.lineTotal),
      })),
      subtotal,
      vatAmount,
      total,
      currency: t.common.sar,
      notes: notes.trim() || null,
    };
  }, [
    business,
    lineItems,
    invoiceTotals,
    selectedClientName,
    selectedClientId,
    clients,
    subtotal,
    vatAmount,
    total,
    notes,
    t.common.sar,
  ]);

  function handlePreview() {
    if (!business) {
      Alert.alert(t.common.alert, t.invoiceNew.businessRequired);
      return;
    }
    setPreviewOpen(true);
  }

  function handleSave() {
    if (usage?.limit !== null && usage.remaining === 0) {
      Alert.alert(t.common.alert, t.invoiceNew.limitReached, [
        { text: t.common.cancel, style: "cancel" },
        { text: t.paywall.title, onPress: () => router.push("/paywall") },
      ]);
      return;
    }
    if (!business) {
      Alert.alert(t.common.alert, t.invoiceNew.businessRequired);
      return;
    }
    if (lineItems.some((i) => !i.description.trim() || !parseFloat(i.unitPrice))) {
      Alert.alert(t.common.alert, t.invoiceNew.itemsRequired);
      return;
    }
    createInvoice.mutate({
      businessId: business.id,
      clientId: selectedClientId ?? undefined,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      notes: notes.trim() || undefined,
      currency: "SAR",
      subtotal: invoiceTotals.subtotal,
      vatAmount: invoiceTotals.vatAmount,
      total: invoiceTotals.total,
      lineItems: invoiceTotals.lineItems.map((item) => ({
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        sortOrder: item.sortOrder,
      })),
    });
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          paddingHorizontal: spacing.screenX,
          paddingTop: spacing.contentTop,
          paddingBottom: 16,
          gap: spacing.section,
        },
        section: { gap: 10 },
        lineBlock: { gap: 8 },
        lineHeader: {
          flexDirection: row,
          justifyContent: "space-between",
          alignItems: "center",
        },
        lineTitle: {
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: theme.colors.ink3,
        },
        qtyPriceRow: { flexDirection: row, gap: 10 },
        qtyCol: { flex: 0.32 },
        priceCol: { flex: 0.68 },
        lineMeta: {
          flexDirection: row,
          justifyContent: "space-between",
          paddingTop: 2,
        },
        lineMetaLabel: { fontSize: 12, color: theme.colors.ink3 },
        lineMetaValue: {
          fontSize: 14,
          fontWeight: "700",
          color: theme.colors.ink,
          fontVariant: ["tabular-nums"],
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          marginVertical: 4,
        },
        addBtn: {
          flexDirection: row,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 10,
        },
        addText: { fontSize: 14, fontWeight: "600", color: theme.colors.brandText },
        pickerItem: {
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          gap: 4,
        },
        pickerItemActive: {
          borderColor: theme.colors.brand,
          backgroundColor: theme.colors.brandMuted,
        },
        pickerName: {
          fontSize: 15,
          fontWeight: "600",
          color: theme.colors.ink,
          textAlign,
        },
        pickerNameActive: { color: theme.colors.brandText },
        pickerMeta: { fontSize: 12, color: theme.colors.ink3, textAlign },
        pickerEmpty: { padding: 40, alignItems: "center", gap: 8 },
        pickerEmptyTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.ink2 },
        pickerEmptySub: { fontSize: 13, color: theme.colors.ink3, textAlign: "center" },
        clearBtn: {
          marginHorizontal: 16,
          marginTop: 8,
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: theme.colors.border,
        },
        dueRow: {
          flexDirection: row,
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: theme.colors.brandMuted,
        },
        dueLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.brandText },
        dueValue: { fontSize: 13, color: theme.colors.ink2 },
        clearText: { fontSize: 14, color: theme.colors.ink3 },
        usageBanner: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: theme.colors.brandMuted,
        },
        usageText: {
          fontSize: 13,
          fontWeight: "600",
          color: theme.colors.brandText,
          textAlign,
        },
        usageCta: {
          fontSize: 12,
          fontWeight: "700",
          color: theme.colors.brandText,
          textAlign,
          marginTop: 2,
        },
      }),
    [theme, textAlign, row],
  );

  return (
    <ScreenShell>
      <SubScreenHeader
        title={t.invoiceNew.title}
        cancelLabel={t.common.cancel}
        onCancel={() => router.back()}
        previewLabel={t.invoiceNew.preview}
        onPreview={handlePreview}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {usage ? (
            <Pressable
              style={styles.usageBanner}
              onPress={() => {
                if (usage.limit !== null) router.push("/paywall");
              }}
              disabled={usage.limit === null}
            >
              <RNText style={styles.usageText}>
                {usage.limit === null
                  ? t.billing.unlimited
                  : `${t.invoiceNew.usageFree}: ${usage.used}/${usage.limit}`}
              </RNText>
              {usage.limit !== null ? (
                <RNText style={styles.usageCta}>{t.invoiceNew.upgradeCta}</RNText>
              ) : null}
            </Pressable>
          ) : null}

          <RNView style={styles.section}>
            <SelectField
              label={t.invoiceNew.client}
              placeholder={t.invoiceNew.selectClient}
              value={selectedClientName}
              onPress={() => setClientPickerOpen(true)}
            />
            <RNView style={styles.dueRow}>
              <RNText style={styles.dueLabel}>{t.invoiceNew.dueDate}</RNText>
              <RNText style={styles.dueValue}>{dueDateLabel}</RNText>
            </RNView>
            <RNText style={[styles.dueValue, { fontSize: 12, marginTop: -4 }]}>
              {t.invoiceNew.dueDateDefault}
            </RNText>
          </RNView>

          <RNView style={styles.divider} />

          <RNView style={styles.section}>
            {lineItems.map((item, idx) => (
              <RNView key={item.id} style={styles.lineBlock}>
                <RNView style={styles.lineHeader}>
                  <RNText style={styles.lineTitle}>
                    {t.invoiceNew.itemN} {idx + 1}
                  </RNText>
                  {lineItems.length > 1 ? (
                    <TouchableOpacity onPress={() => removeLine(item.id)} hitSlop={8}>
                      <Trash2 size={16} color={theme.colors.destructive} strokeWidth={2} />
                    </TouchableOpacity>
                  ) : null}
                </RNView>

                <Field
                  hideLabel
                  value={item.description}
                  onChangeText={(v) => updateLine(item.id, "description", v)}
                  placeholder={t.invoiceNew.descriptionPh}
                />

                <RNView style={styles.qtyPriceRow}>
                  <RNView style={styles.qtyCol}>
                    <Field
                      label={t.invoiceNew.qty}
                      size="sm"
                      value={item.qty}
                      onChangeText={(v) => updateLine(item.id, "qty", v)}
                      keyboardType="decimal-pad"
                      placeholder="1"
                    />
                  </RNView>
                  <RNView style={styles.priceCol}>
                    <Field
                      label={t.invoiceNew.unitPrice}
                      size="sm"
                      value={item.unitPrice}
                      onChangeText={(v) => updateLine(item.id, "unitPrice", v)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </RNView>
                </RNView>

                <RNView style={styles.lineMeta}>
                  <RNText style={styles.lineMetaLabel}>{t.invoiceNew.lineTotal}</RNText>
                  <RNText style={styles.lineMetaValue}>
                    {formatMoney(calcLine(item), locale)} {t.common.sar}
                  </RNText>
                </RNView>

                {idx < lineItems.length - 1 ? <RNView style={styles.divider} /> : null}
              </RNView>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addLine} activeOpacity={0.7}>
              <Plus size={16} color={theme.colors.brandText} strokeWidth={2.5} />
              <RNText style={styles.addText}>{t.invoiceNew.addItem}</RNText>
            </TouchableOpacity>
          </RNView>

          <RNView style={styles.divider} />

          <RNView style={styles.section}>
            <Field
              label={t.invoiceNew.notesOptional}
              hideLabel
              value={notes}
              onChangeText={setNotes}
              placeholder={t.invoiceNew.notesPh}
              multiline
              numberOfLines={2}
            />
          </RNView>
        </ScrollView>
      </KeyboardAvoidingView>

      <StickyTotalBar
        total={total}
        vatAmount={vatAmount}
        onSave={handleSave}
        onPreview={handlePreview}
        previewLabel={t.invoiceNew.preview}
        saving={createInvoice.isPending}
      />

      {previewData ? (
        <InvoicePreviewSheet
          visible={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={t.invoicePreview.title}
          closeLabel={t.common.close}
          data={previewData}
          locale={locale}
        />
      ) : null}

      <Modal visible={clientPickerOpen} animationType="slide" presentationStyle="pageSheet">
        <RNView
          style={{
            flex: 1,
            backgroundColor: theme.colors.appBg,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <SheetHeader
            title={t.invoiceNew.pickClient}
            closeLabel={t.common.close}
            onClose={() => setClientPickerOpen(false)}
          />
          <FlatList
            data={clients ?? []}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedClientId === item.id && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setSelectedClientId(item.id);
                  setSelectedClientName(item.name);
                  setClientPickerOpen(false);
                }}
                activeOpacity={0.8}
              >
                <RNText
                  style={[
                    styles.pickerName,
                    selectedClientId === item.id && styles.pickerNameActive,
                  ]}
                >
                  {item.name}
                </RNText>
                {item.vatNumber ? (
                  <RNText style={styles.pickerMeta}>{item.vatNumber}</RNText>
                ) : null}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <RNView style={styles.pickerEmpty}>
                <RNText style={styles.pickerEmptyTitle}>{t.invoiceNew.noClientsTitle}</RNText>
                <RNText style={styles.pickerEmptySub}>{t.invoiceNew.noClientsSub}</RNText>
              </RNView>
            }
            contentContainerStyle={{ padding: 16, gap: 8 }}
          />
          {selectedClientId ? (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setSelectedClientId(null);
                setSelectedClientName("");
                setClientPickerOpen(false);
              }}
            >
              <RNText style={styles.clearText}>{t.invoiceNew.noClient}</RNText>
            </TouchableOpacity>
          ) : null}
        </RNView>
      </Modal>
    </ScreenShell>
  );
}

