import { useMemo, useState } from "react";
import { FlatList, View as RNView } from "react-native";
import { AppLoader } from "@/components/ui/AppLoader";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileText } from "lucide-react-native";
import { View, Text } from "@/tw";
import { useAppTheme, useTranslation } from "@/lib/preferences";
import { listQueryOpts } from "@/lib/query-client";
import { spacing } from "@/lib/spacing";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { ScreenBody } from "@/components/ui/ScreenBody";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { HeroDashboard, type StatusFilter } from "@/components/invoices/HeroDashboard";
import { InvoiceListCard } from "@/components/invoices/InvoiceListCard";
import { tabBarScrollPadding } from "@/lib/layout";
import { typeStyle } from "@/theme/typography";

type InvoiceRow = {
  id: string;
  seqNumber: number;
  status: "draft" | "unpaid" | "paid" | "overdue";
  total: string;
  currency: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
};

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    data: invoices,
    isPending,
    isFetching,
    isError,
    refetch,
  } = trpc.invoices.list.useQuery(undefined, {
    enabled: !!user,
    ...listQueryOpts,
  });

  const filteredInvoices = useMemo(() => {
    const list = (invoices ?? []) as InvoiceRow[];
    if (statusFilter === "all") return list;
    if (statusFilter === "unpaid") {
      return list.filter((i) => i.status === "unpaid" || i.status === "overdue");
    }
    return list.filter((i) => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const stats = useMemo(() => {
    const list: InvoiceRow[] = invoices ?? [];
    return {
      total: list.length,
      unpaid: list.filter((i) => i.status === "unpaid" || i.status === "overdue").length,
      paid: list.filter((i) => i.status === "paid").length,
      draft: list.filter((i) => i.status === "draft").length,
    };
  }, [invoices]);

  const unpaidTotal =
    invoices
      ?.filter((i: InvoiceRow) => i.status === "unpaid" || i.status === "overdue")
      .reduce((sum: number, i: InvoiceRow) => sum + parseFloat(i.total), 0) ?? 0;

  const isEmpty = !isPending && filteredInvoices.length === 0;
  const showLoader = isPending && !invoices;

  function openNewInvoice() {
    router.push("/invoice/new");
  }

  return (
    <ScreenShell topBarColor={theme.colors.heroBg}>
      <ScreenHeader
        title={t.invoices.title}
        subtitle={user ? `${t.invoices.greeting} ${user.name.split(" ")[0]}` : undefined}
        actionLabel={`+ ${t.invoices.new}`}
        onAction={openNewInvoice}
        backgroundColor={theme.colors.heroBg}
        invertContent
        noBorder
      />

      <ScreenBody noTopGap>
        {isError ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 12 }}>
            <Text style={[typeStyle("headline"), { color: theme.colors.ink, textAlign: "center" }]}>
              {t.invoices.loadError}
            </Text>
            <Text style={[typeStyle("body"), { color: theme.colors.ink3, textAlign: "center" }]}>
              {t.common.loadErrorSub}
            </Text>
            <PrimaryButton label={t.common.retry} onPress={() => refetch()} variant="brand" />
          </View>
        ) : showLoader ? (
          <RNView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <AppLoader variant="surface" size={56} />
          </RNView>
        ) : (
          <FlatList
            data={filteredInvoices}
            keyExtractor={(item) => item.id}
            style={{ backgroundColor: theme.colors.appBg }}
            ListHeaderComponent={
              <HeroDashboard
                unpaidTotal={unpaidTotal}
                stats={stats}
                activeFilter={statusFilter}
                onFilter={setStatusFilter}
              />
            }
            renderItem={({ item }) => (
              <InvoiceListCard
                invoice={item}
                onPress={() => router.push(`/invoice/${item.id}`)}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing.screenX,
              gap: spacing.item,
              paddingBottom: tabBarScrollPadding(insets.bottom),
              ...(isEmpty ? { flexGrow: 1 } : {}),
            }}
            onRefresh={refetch}
            refreshing={isFetching && !isPending}
            ListEmptyComponent={
              <EmptyState
                icon={FileText}
                title={t.invoices.emptyTitle}
                subtitle={t.invoices.emptySub}
                actionLabel={t.invoices.create}
                onAction={openNewInvoice}
              />
            }
          />
        )}
      </ScreenBody>
    </ScreenShell>
  );
}
