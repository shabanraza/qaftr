import { Alert, Linking, Platform, Share } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  buildInvoiceHtml,
  type InvoiceForPdf,
} from "@/lib/invoice-pdf";

export async function generateInvoicePdf(invoice: InvoiceForPdf): Promise<string> {
  const html = await buildInvoiceHtml(invoice);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareInvoicePdf(
  uri: string,
  options: { title: string; message: string; dialogTitle: string },
): Promise<void> {
  if (Platform.OS === "ios") {
    await Share.share({ url: uri, title: options.title });
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: options.dialogTitle,
      UTI: "com.adobe.pdf",
    });
    return;
  }

  Alert.alert(options.title, options.message);
}

/** Opens share sheet with a WhatsApp-friendly caption; user picks WhatsApp from the sheet. */
export async function shareInvoiceViaWhatsApp(
  uri: string,
  options: { invoiceNumber: string; total: string; caption: string; dialogTitle: string },
): Promise<void> {
  const message = `${options.caption}\n${options.invoiceNumber}\n${options.total}`;

  if (Platform.OS === "android") {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      // Share PDF via system sheet — WhatsApp appears as a target with the file attached
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: options.dialogTitle,
      });
      return;
    }
  }

  await Share.share({
    url: uri,
    message: Platform.OS === "android" ? message : undefined,
    title: options.invoiceNumber,
  });
}
