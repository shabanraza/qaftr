import QRCode from "qrcode";
import { documentFontFaceCss } from "#/lib/fonts/document-fonts";
import {
  computeLineVat,
  encodeZatcaQr,
  getSaudiInvoiceTitle,
  normalizeSaudiVatNumber,
  supplyDateToShow,
} from "@zatca/shared";
import type { ComputedInvoiceTotals, InstantInvoiceDraft, SaudiInvoiceType } from "@zatca/shared";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import { toArabicIndic } from "#/lib/sa/format";
import type { MarketingLang } from "#/lib/marketing/lang";
import { htmlToPdfBlob } from "#/lib/invoice/pdf-render";

export interface InvoiceForPdf {
  /** Missing on saved invoices (the DB has no type column): simplified. */
  invoiceType?: SaudiInvoiceType;
  seqNumber: number;
  issueDate: Date | string;
  /** Supply date (YYYY-MM-DD), printed only when it differs from the issue date. */
  supplyDate?: string | null;
  subtotal: string;
  vatAmount: string;
  total: string;
  currency: string;
  notes: string | null;
  business: {
    nameAr: string;
    nameEn: string | null;
    vatNumber: string | null;
    address: string | null;
    logoUrl?: string | null;
  } | null;
  client: {
    name: string;
    vatNumber: string | null;
    address?: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  lineItems: {
    description: string;
    qty: string;
    unitPrice: string;
    lineTotal: string;
  }[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** «ر.س» on Arabic Saudi invoices, the ISO code (SAR) in English. */
export function displayCurrency(currency: string, lang: MarketingLang): string {
  return lang === "ar" && currency === "SAR" ? "ر.س" : currency;
}

function fmt(value: string | number, lang: MarketingLang, currency = "SAR") {
  const n = typeof value === "string" ? parseFloat(value) : value;
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  return `${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtDate(date: Date | string, lang: MarketingLang) {
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** A calendar day (YYYY-MM-DD) in the invoice language, independent of time zone. */
function fmtDay(day: string, lang: MarketingLang) {
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtTime(date: Date | string, lang: MarketingLang) {
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  return new Date(date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatZatcaAmount(value: string) {
  const n = parseFloat(value);
  return Number.isNaN(n) ? "0.00" : n.toFixed(2);
}

function padNum(n: number) {
  return String(n).padStart(3, "0");
}

function ltrValue(value: string): string {
  return `<span dir="ltr" class="ltr-value">${escapeHtml(value)}</span>`;
}

function labeledLtrValue(label: string, value: string, lang: MarketingLang): string {
  const valueHtml = ltrValue(value);
  if (lang === "en") {
    return `${escapeHtml(label)}: ${valueHtml}`;
  }
  return `<span dir="rtl">${escapeHtml(label)}: ${valueHtml}</span>`;
}

function autoDirectionText(value: string): string {
  return `<span dir="auto">${escapeHtml(value)}</span>`;
}

export function pdfDocumentTitle(invoice: Pick<InvoiceForPdf, "invoiceType" | "seqNumber">): string {
  return `${getSaudiInvoiceTitle(invoice.invoiceType ?? "simplified").en} INV-${padNum(invoice.seqNumber)}`;
}

function getPdfStrings(lang: MarketingLang, invoiceType: SaudiInvoiceType = "simplified") {
  return { ...baseStrings(lang, invoiceType), ...getInstantInvoiceCopy(lang).pdf };
}

function baseStrings(lang: MarketingLang, invoiceType: SaudiInvoiceType) {
  const docTitle = getSaudiInvoiceTitle(invoiceType);
  if (lang === "en") {
    return {
      htmlLang: "en",
      dir: "ltr",
      textAlign: "left",
      metaAlign: "right",
      title: docTitle.en,
      subtitle: docTitle.ar,
      invoiceNum: "Invoice no.",
      issueDate: "Issue date",
      issueTime: "Issue time",
      trn: "VAT number",
      from: "Seller",
      to: "Buyer",
      desc: "Description",
      qty: "Qty",
      unitPrice: (currency: string) => `Unit price (${currency})`,
      lineTotal: (currency: string) => `Total (${currency})`,
      subtotal: "Total excl. VAT",
      vat: "VAT 15%",
      grandTotal: "Total incl. VAT",
      notes: "Notes",
      qrLabel: "ZATCA QR code (Phase 1)",
      footer: "Created with Qaftr · qaftr.com · Not affiliated with ZATCA · Please review with your accountant",
    };
  }

  return {
    htmlLang: "ar",
    dir: "rtl",
    textAlign: "right",
    metaAlign: "left",
    title: docTitle.ar,
    subtitle: docTitle.en,
    invoiceNum: "رقم الفاتورة",
    issueDate: "تاريخ الإصدار",
    issueTime: "وقت الإصدار",
    trn: "الرقم الضريبي",
    from: "البائع",
    to: "المشتري",
    desc: "الوصف",
    qty: "الكمية",
    unitPrice: (currency: string) => `سعر الوحدة (${currency})`,
    lineTotal: (currency: string) => `الإجمالي (${currency})`,
    subtotal: "الإجمالي غير شامل الضريبة",
    vat: "ضريبة القيمة المضافة ١٥٪",
    grandTotal: "الإجمالي شامل الضريبة",
    notes: "ملاحظات",
    qrLabel: "رمز الاستجابة السريعة (QR) — المرحلة الأولى من زاتكا",
    footer:
      'أُنشئت هذه الفاتورة عبر قافتر · <span class="footer-url">qaftr.com</span> · غير تابع لهيئة الزكاة والضريبة والجمارك · يُرجى مراجعتها مع محاسبك',
  };
}

export async function buildInvoiceHtml(
  invoice: InvoiceForPdf,
  lang: MarketingLang = "ar",
  options?: { strictQr?: boolean; includeQr?: boolean; compact?: boolean; forPdf?: boolean },
): Promise<string> {
  const s = getPdfStrings(lang, invoice.invoiceType);
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  const currency = displayCurrency(invoice.currency, lang);
  const strictQr = options?.strictQr ?? false;
  const includeQr = options?.includeQr ?? true;
  const compact = options?.compact ?? false;
  const forPdf = options?.forPdf ?? false;
  const bodyPadding = compact ? "20px 14px" : forPdf ? "32px 36px" : "40px";
  const bodyFontSize = compact ? "13px" : "14px";
  // Spaced capitals suit Latin labels only: letter-spacing breaks joined Arabic glyphs.
  const latinCaps = (spacing: string) =>
    lang === "ar" ? "" : `text-transform: uppercase; letter-spacing: ${spacing};`;
  const fontImport = forPdf
    ? ""
    : documentFontFaceCss([400, 500, 600, 700]);
  const fontFamily = forPdf
    ? "'Arial', 'Helvetica Neue', 'Segoe UI', sans-serif"
    : "'IBM Plex Sans Arabic', 'Arial', sans-serif";

  let qrImg = "";
  if (includeQr && invoice.business?.vatNumber) {
    try {
      const tlvBase64 = encodeZatcaQr({
        sellerName: invoice.business.nameAr,
        vatNumber: invoice.business.vatNumber,
        timestamp: new Date(invoice.issueDate).toISOString(),
        invoiceTotal: formatZatcaAmount(invoice.total),
        vatTotal: formatZatcaAmount(invoice.vatAmount),
      });
      qrImg = await QRCode.toDataURL(tlvBase64, { margin: 1, width: 140 });
    } catch {
      if (strictQr) throw new Error("QR_GENERATION_FAILED");
    }
  }

  const invoiceNum = `INV-${padNum(invoice.seqNumber)}`;
  const dateStr = fmtDate(invoice.issueDate, lang);
  const timeStr = fmtTime(invoice.issueDate, lang);
  const businessName = escapeHtml(invoice.business?.nameAr ?? (lang === "en" ? "Qaftr" : "قافتر"));
  const businessNameEn = invoice.business?.nameEn ? escapeHtml(invoice.business.nameEn) : "";
  const businessVat = invoice.business?.vatNumber ?? "";
  const businessAddress = invoice.business?.address ? escapeHtml(invoice.business.address) : "";
  const businessLogo = invoice.business?.logoUrl ?? "";

  // Tax invoice (Art. 53(5)): VAT rate, VAT amount and total incl. VAT per
  // line. The simplified invoice keeps the lean four-column layout.
  const perLineVat = invoice.invoiceType === "standard";
  const lineVat = perLineVat ? computeLineVat(invoice.lineItems) : [];
  const ratePct = (rate: string) => (lang === "ar" ? `${toArabicIndic(rate)}٪` : `${rate}%`);
  const lineItemsHtml = invoice.lineItems
    .map((item, index) => {
      const vat = lineVat[index];
      return `
    <tr>
      <td class="desc">${autoDirectionText(item.description)}</td>
      <td class="num">${parseFloat(item.qty).toLocaleString(locale)}</td>
      <td class="num">${fmt(item.unitPrice, lang, "")}</td>
      ${
        vat
          ? `<td class="num">${fmt(item.lineTotal, lang, "").trim()}</td>
      <td class="num line-rate">${ratePct(vat.vatRate)}</td>
      <td class="num line-vat">${fmt(vat.vatAmount, lang, "").trim()}</td>
      <td class="num bold line-incl">${fmt(vat.totalWithVat, lang, "").trim()}</td>`
          : `<td class="num bold">${fmt(item.lineTotal, lang, "")}</td>`
      }
    </tr>`;
    })
    .join("");
  const supplyDay = supplyDateToShow(invoice.supplyDate ?? undefined, new Date(invoice.issueDate));

  const notesHtml = invoice.notes
    ? `<div class="notes-section"><div class="notes-label">${s.notes}</div><div>${escapeHtml(invoice.notes)}</div></div>`
    : "";

  const clientHtml = invoice.client
    ? `<div class="party">
    <div class="party-label">${s.to}</div>
    <div class="party-name">${autoDirectionText(invoice.client.name)}</div>
    ${invoice.client.vatNumber ? `<div class="party-detail">${labeledLtrValue(s.trn, invoice.client.vatNumber, lang)}</div>` : ""}
    ${invoice.client.address ? `<div class="party-detail" dir="auto">${escapeHtml(invoice.client.address)}</div>` : ""}
  </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${s.htmlLang}" dir="${s.dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(s.title)} ${invoiceNum}</title>
<style>
  ${fontImport}

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${fontFamily};
    direction: ${s.dir};
    text-align: ${s.textAlign};
    color: #0D1F19;
    background: #fff;
    padding: ${bodyPadding};
    font-size: ${bodyFontSize};
    line-height: 1.6;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0A3D2E;
    padding-bottom: 24px;
    margin-bottom: 28px;
  }
  .brand-logo { max-width: 72px; max-height: 72px; object-fit: contain; margin-bottom: 8px; border-radius: 6px; }
  .brand { font-size: 28px; font-weight: 700; color: #0A3D2E; }
  .brand-sub { font-size: 12px; color: #8DA89D; ${latinCaps("2px")} margin-top: 2px; }
  .doc-title { font-size: 26px; font-weight: 700; color: #0A3D2E; margin-bottom: 4px; }
  .doc-subtitle { font-size: 12px; color: #4D6B5F; }
  .invoice-meta { text-align: ${s.metaAlign}; min-width: 200px; }
  .invoice-num { font-size: 14px; font-weight: 600; color: #4D6B5F; margin-top: 8px; }
  .invoice-date { font-size: 13px; color: #4D6B5F; margin-top: 4px; }

  .parties { display: flex; justify-content: space-between; margin-bottom: 28px; gap: 24px; }
  .party { flex: 1; }
  .party-label {
    font-size: 11px; font-weight: 600; color: #8DA89D;
    ${latinCaps("1px")}
    margin-bottom: 8px; padding-bottom: 4px;
    border-bottom: 1px solid #E8EDEB;
  }
  .party-name { font-size: 16px; font-weight: 700; color: #0D1F19; }
  .party-detail { font-size: 12px; color: #4D6B5F; margin-top: 2px; }

  .table-scroll { overflow-x: auto; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  ${
    compact && perLineVat
      ? "thead th, tbody td { padding: 8px 6px; font-size: 11px; } .table-scroll table { min-width: 540px; } .scroll-hint { font-size: 11px; color: #4D6B5F; margin-bottom: 4px; }"
      : ""
  }
  thead tr { background: #0A3D2E; }
  thead th {
    color: #fff; padding: 10px 12px; font-size: 12px; font-weight: 600; text-align: ${s.textAlign};
  }
  thead th.num-col { text-align: ${s.metaAlign}; }
  tbody tr:nth-child(even) { background: #F4F6F5; }
  tbody td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #E8EDEB; vertical-align: top; }
  .desc { max-width: 260px; text-align: ${s.textAlign}; }
  .num {
    text-align: ${s.metaAlign};
    direction: ltr;
    unicode-bidi: isolate;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .bold { font-weight: 700; }
  .ltr-value { unicode-bidi: isolate; }
  .footer-url { direction: ltr; unicode-bidi: isolate; display: inline-block; }

  .totals { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; }
  .totals-table { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .totals-row.grand {
    border-top: 2px solid #0A3D2E;
    padding-top: 10px; margin-top: 4px;
    font-size: 17px; font-weight: 700; color: #0A3D2E;
  }
  .totals-label { color: #4D6B5F; }
  .totals-value { font-variant-numeric: tabular-nums; }

  .qr-block { text-align: center; }
  .qr-label { font-size: 10px; color: #8DA89D; margin-top: 6px; }

  .notes-section {
    margin-top: 28px; padding-top: 16px;
    border-top: 1px solid #E8EDEB;
    font-size: 12px; color: #4D6B5F;
  }
  .notes-label { display: block; font-weight: 600; margin-bottom: 4px; }

  .footer {
    margin-top: 36px; padding-top: 16px;
    border-top: 1px solid #E8EDEB;
    text-align: center; font-size: 11px; color: #8DA89D;
  }

  .vat-badge {
    display: inline-block;
    background: #D4EDE5; color: #0A3D2E;
    padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 600; margin-top: 4px;
  }
</style>
</head>
<body>

<div class="header">
  <div class="brand-block">
    ${businessLogo ? `<img class="brand-logo" src="${escapeHtml(businessLogo)}" alt="" />` : ""}
    <div class="brand">${businessName}</div>
    ${businessNameEn ? `<div class="brand-sub">${businessNameEn}</div>` : ""}
  </div>
  <div class="invoice-meta">
    <div class="doc-title">${s.title}</div>
    <div class="doc-subtitle">${s.subtitle}</div>
    <div class="invoice-num">${labeledLtrValue(s.invoiceNum, invoiceNum, lang)}</div>
    <div class="invoice-date">${s.issueDate}: ${dateStr}</div>
    <div class="invoice-date">${s.issueTime}: ${timeStr}</div>
    ${supplyDay ? `<div class="invoice-date supply-date">${s.supplyDate}: ${fmtDay(supplyDay, lang)}</div>` : ""}
  </div>
</div>

<div class="parties">
  <div class="party">
    <div class="party-label">${s.from}</div>
    <div class="party-name">${businessName}</div>
    ${businessVat ? `<div class="party-detail">${labeledLtrValue(s.trn, businessVat, lang)}</div>` : ""}
    ${businessAddress ? `<div class="party-detail" dir="auto">${businessAddress}</div>` : ""}
  </div>
  ${clientHtml}
</div>

${compact && perLineVat ? `<div class="scroll-hint" aria-hidden="true">${s.scrollHint}</div>` : ""}
<div class="table-scroll">
<table>
  <thead>
    <tr>
      <th>${s.desc}</th>
      <th class="num-col">${s.qty}</th>
      <th class="num-col">${s.unitPrice(currency)}</th>
      ${
        perLineVat
          ? `<th class="num-col">${s.lineNet} (${currency})</th>
      <th class="num-col">${s.vatRate}</th>
      <th class="num-col">${s.vatAmount}</th>
      <th class="num-col">${s.lineInclVat} (${currency})</th>`
          : `<th class="num-col">${s.lineTotal(currency)}</th>`
      }
    </tr>
  </thead>
  <tbody>
    ${lineItemsHtml}
  </tbody>
</table>
</div>

<div class="totals">
  ${qrImg ? `<div class="qr-block"><img src="${qrImg}" width="140" height="140" alt="ZATCA QR" style="min-width:76px;min-height:76px" /><div class="qr-label">${s.qrLabel}</div></div>` : "<div></div>"}
  <div class="totals-table">
    <div class="totals-row">
      <span class="totals-label">${s.subtotal}</span>
      <span class="totals-value">${fmt(invoice.subtotal, lang, currency)}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">${s.vat}</span>
      <span class="totals-value">${fmt(invoice.vatAmount, lang, currency)}</span>
    </div>
    <div class="totals-row grand">
      <span>${s.grandTotal}</span>
      <span class="totals-value">${fmt(invoice.total, lang, currency)}</span>
    </div>
  </div>
</div>

${notesHtml}

<div class="footer">${s.footer}</div>

</body>
</html>`;
}

export function draftToPdfInvoice(
  draft: InstantInvoiceDraft,
  totals: ComputedInvoiceTotals,
  seqNumber = 1,
  issueDate = new Date(),
): InvoiceForPdf {
  const clientName = draft.clientName.trim();
  const clientVat = normalizeSaudiVatNumber(draft.clientVat);
  const clientAddress = (draft.clientAddress ?? "").trim();
  return {
    invoiceType: draft.invoiceType ?? "simplified",
    seqNumber,
    issueDate,
    supplyDate: supplyDateToShow(draft.supplyDate, issueDate),
    subtotal: totals.subtotal,
    vatAmount: totals.vatAmount,
    total: totals.total,
    currency: "SAR",
    notes: draft.notes.trim() || null,
    business: {
      nameAr: draft.sellerName.trim(),
      nameEn: null,
      vatNumber: normalizeSaudiVatNumber(draft.sellerVat),
      address: draft.sellerAddress.trim() || null,
      logoUrl: null,
    },
    client:
      clientName || clientVat || clientAddress
        ? {
            name: clientName,
            vatNumber: clientVat || null,
            address: clientAddress || null,
            email: null,
            phone: null,
          }
        : null,
    lineItems: totals.lineItems.map((item) => ({
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  };
}

export async function exportInvoicePdfBlob(
  invoice: InvoiceForPdf,
  lang: MarketingLang = "ar",
): Promise<Blob> {
  const html = await buildInvoiceHtml(invoice, lang, { strictQr: true, forPdf: true });
  return htmlToPdfBlob(html, { title: pdfDocumentTitle(invoice) });
}

export async function downloadInvoicePdf(
  invoice: InvoiceForPdf,
  lang: MarketingLang = "ar",
): Promise<void> {
  const blob = await exportInvoicePdfBlob(invoice, lang);
  const filename = `qaftr-invoice-${String(invoice.seqNumber).padStart(3, "0")}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 2000);
}

export function openWhatsAppShare(
  invoice: InvoiceForPdf,
  lang: MarketingLang = "ar",
): void {
  const num = `INV-${String(invoice.seqNumber).padStart(3, "0")}`;
  const locale = lang === "en" ? "en-SA" : "ar-SA";
  const total = `${parseFloat(invoice.total).toLocaleString(locale, { minimumFractionDigits: 2 })} ${displayCurrency(invoice.currency, lang)}`;
  const title = getSaudiInvoiceTitle(invoice.invoiceType ?? "simplified");
  const message =
    lang === "en"
      ? `${title.en} — ${num}\nTotal incl. VAT: ${total}\n— Created with Qaftr qaftr.com`
      : `${title.ar} — ${num}\nالإجمالي شامل الضريبة: ${total}\n— أُنشئت عبر قافتر qaftr.com`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}
