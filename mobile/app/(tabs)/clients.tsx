import { useState } from "react";
import {
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Users } from "lucide-react-native";
import { View, Text, ScrollView, Pressable } from "@/tw";
import { trpc } from "@/lib/trpc";
import { listQueryOpts } from "@/lib/query-client";
import { spacing } from "@/lib/spacing";
import { useAppTheme, useTranslation } from "@/lib/preferences";
import { alertTrpcError } from "@/lib/trpc-errors";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { ScreenBody } from "@/components/ui/ScreenBody";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { Field } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppLoader } from "@/components/ui/AppLoader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { tabBarScrollPadding } from "@/lib/layout";

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const utils = trpc.useUtils();
  const { data: clients, isPending, isFetching, refetch } = trpc.clients.list.useQuery(
    undefined,
    listQueryOpts,
  );

  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      if (Platform.OS === "ios") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSheetOpen(false);
      resetForm();
    },
    onError: (err) =>
      alertTrpcError(err, t, t.clients.saveError, (title, message) =>
        Alert.alert(title, message),
      ),
  });

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => utils.clients.list.invalidate(),
  });

  function resetForm() {
    setName("");
    setVatNumber("");
    setEmail("");
    setPhone("");
  }

  function openSheet() {
    setSheetOpen(true);
  }

  function handleCreate() {
    if (!name.trim()) {
      Alert.alert(t.common.alert, t.clients.nameRequired);
      return;
    }
    createClient.mutate({
      name: name.trim(),
      vatNumber: vatNumber.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  }

  function handleDelete(id: string, clientName: string) {
    Alert.alert(t.clients.deleteTitle, `${t.clients.deleteMsg} "${clientName}"?`, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.delete, style: "destructive", onPress: () => deleteClient.mutate({ id }) },
    ]);
  }

  const isEmpty = !isPending && (!clients || clients.length === 0);
  const showLoader = isPending && !clients;

  return (
    <ScreenShell>
      <ScreenHeader
        title={t.clients.title}
        subtitle={t.clients.subtitle}
        actionLabel={`+ ${t.clients.add}`}
        onAction={openSheet}
      />

      <ScreenBody>
      {showLoader ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <AppLoader variant="surface" size={56} />
        </View>
      ) : (
        <FlatList
          data={clients ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable
              style={[
                clientStyles.row,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
              onLongPress={() => handleDelete(item.id, item.name)}
            >
              <View style={[clientStyles.avatar, { backgroundColor: theme.colors.brandMuted }]}>
                <Text style={[clientStyles.avatarText, { color: theme.colors.brandText }]}>
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View style={clientStyles.info}>
                <Text style={[clientStyles.name, { color: theme.colors.ink }]}>{item.name}</Text>
                {item.vatNumber ? (
                  <Text style={[clientStyles.meta, { color: theme.colors.ink3 }]}>
                    {item.vatNumber}
                  </Text>
                ) : null}
                {item.phone ? (
                  <Text style={[clientStyles.meta, { color: theme.colors.ink3 }]}>
                    {item.phone}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.screenX,
            gap: spacing.item,
            paddingBottom: tabBarScrollPadding(insets.bottom),
            ...(isEmpty ? { flexGrow: 1, justifyContent: "center" } : {}),
          }}
          onRefresh={refetch}
          refreshing={isFetching && !isPending}
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title={t.clients.emptyTitle}
              subtitle={t.clients.emptySub}
              actionLabel={t.clients.addClient}
              onAction={openSheet}
            />
          }
        />
      )}
      </ScreenBody>

      <Modal visible={sheetOpen} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.appBg,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <SheetHeader
              title={t.clients.newClient}
              closeLabel={t.common.close}
              onClose={() => {
                setSheetOpen(false);
                resetForm();
              }}
            />

            <ScrollView
              contentContainerStyle={{ padding: spacing.screenX, gap: spacing.section }}
              keyboardShouldPersistTaps="handled"
            >
              <Field
                label={t.clients.name}
                required
                value={name}
                onChangeText={setName}
                placeholder={t.clients.namePh}
              />
              <Field
                label={t.clients.vat}
                value={vatNumber}
                onChangeText={setVatNumber}
                placeholder={t.clients.vatPh}
                keyboardType="number-pad"
                maxLength={15}
              />
              <Field
                label={t.clients.email}
                value={email}
                onChangeText={setEmail}
                placeholder={t.clients.emailPh}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label={t.clients.phone}
                value={phone}
                onChangeText={setPhone}
                placeholder={t.clients.phonePh}
                keyboardType="phone-pad"
              />
              <PrimaryButton
                label={t.clients.save}
                onPress={handleCreate}
                loading={createClient.isPending}
                variant="brand"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenShell>
  );
}

const clientStyles = StyleSheet.create({
  row: {
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPad,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 1,
    alignItems: "flex-end",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
  },
});
