import QRCode from "qrcode";
import { encodeZatcaQr } from "@zatca/shared";

export interface InvoiceForPdf {
  seqNumber: number;
  issueDate: Date | string;
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

function fmt(value: string | number, currency = "SAR") {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Full ISO 8601 timestamp required by ZATCA Phase 1 (date + time, not date-only). */
function fmtTimestamp(date: Date | string) {
  return new Date(date).toISOString(); // e.g. "2026-06-06T09:40:00.000Z"
}

function padNum(n: number) {
  return String(n).padStart(3, "0");
}

export async function buildInvoiceHtml(invoice: InvoiceForPdf): Promise<string> {
  // Build ZATCA Phase 1 QR
  let qrSvg = "";
  if (invoice.business?.vatNumber) {
    try {
      const tlvBase64 = encodeZatcaQr({
        sellerName: invoice.business.nameAr,
        vatNumber: invoice.business.vatNumber,
        timestamp: fmtTimestamp(invoice.issueDate),
        invoiceTotal: invoice.total,
        vatTotal: invoice.vatAmount,
      });
      qrSvg = await QRCode.toString(tlvBase64, { type: "svg", margin: 0, width: 140 });
    } catch {
      // QR generation is best-effort; invoice is still valid without it
    }
  }

  const invoiceNum = `INV-${padNum(invoice.seqNumber)}`;
  const dateStr = fmtDate(invoice.issueDate);
  const businessName = invoice.business?.nameAr ?? "قافتر";
  const businessNameEn = invoice.business?.nameEn ?? "";
  const businessVat = invoice.business?.vatNumber ?? "";
  const businessAddress = invoice.business?.address ?? "";
  const businessLogo = invoice.business?.logoUrl ?? "";

  const lineItemsHtml = invoice.lineItems
    .map(
      (item) => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="num">${parseFloat(item.qty).toLocaleString("ar-SA")}</td>
      <td class="num">${fmt(item.unitPrice, "")}</td>
      <td class="num bold">${fmt(item.lineTotal, "")}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>فاتورة ${invoiceNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'IBM Plex Sans Arabic', 'Arial', sans-serif;
    direction: rtl;
    text-align: right;
    color: #0D1F19;
    background: #fff;
    padding: 40px;
    font-size: 14px;
    line-height: 1.6;
  }

  /* Header */
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
  .brand-sub { font-size: 12px; color: #8DA89D; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  .invoice-meta { text-align: left; }
  .invoice-num { font-size: 22px; font-weight: 700; color: #0A3D2E; }
  .invoice-date { font-size: 13px; color: #4D6B5F; margin-top: 4px; }

  /* Parties */
  .parties { display: flex; justify-content: space-between; margin-bottom: 28px; gap: 24px; }
  .party { flex: 1; }
  .party-label {
    font-size: 11px; font-weight: 600; color: #8DA89D;
    text-transform: uppercase; letter-spacing: 1px;
    margin-bottom: 8px; padding-bottom: 4px;
    border-bottom: 1px solid #E8EDEB;
  }
  .party-name { font-size: 16px; font-weight: 700; color: #0D1F19; }
  .party-detail { font-size: 12px; color: #4D6B5F; margin-top: 2px; }

  /* Items table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  thead tr { background: #0A3D2E; }
  thead th {
    color: #fff;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 600;
    text-align: right;
  }
  tbody tr:nth-child(even) { background: #F4F6F5; }
  tbody td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #E8EDEB; }
  .desc { max-width: 260px; }
  .num { text-align: left; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 700; }

  /* Totals */
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

  /* QR */
  .qr-block { text-align: center; }
  .qr-label { font-size: 10px; color: #8DA89D; margin-top: 6px; }

  /* Notes */
  .notes-section { 
    margin-top: 28px; padding-top: 16px; 
    border-top: 1px solid #E8EDEB;
    font-size: 12px; color: #4D6B5F;
  }
  .notes-label { font-weight: 600; margin-bottom: 4px; }

  /* Footer */
  .footer {
    margin-top: 36px; padding-top: 16px;
    border-top: 1px solid #E8EDEB;
    text-align: center; font-size: 11px; color: #8DA89D;
  }

  /* VAT badge */
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
  <div>
    ${businessLogo ? `<img class="brand-logo" src="${businessLogo}" alt="" />` : ""}
    <div class="brand">${businessName}</div>
    ${businessNameEn ? `<div class="brand-sub">${businessNameEn}</div>` : ""}
    ${businessVat ? `<div class="vat-badge">الرقم الضريبي: ${businessVat}</div>` : ""}
    ${businessAddress ? `<div class="party-detail" style="margin-top:6px">${businessAddress}</div>` : ""}
  </div>
  <div class="invoice-meta">
    <div class="invoice-num">فاتورة ${invoiceNum}</div>
    <div class="invoice-date">${dateStr}</div>
    <div style="font-size:11px;color:#8DA89D;margin-top:4px">فاتورة ضريبية — المرحلة الأولى</div>
  </div>
</div>

<div class="parties">
  <div class="party">
    <div class="party-label">من</div>
    <div class="party-name">${businessName}</div>
    ${businessVat ? `<div class="party-detail">الرقم الضريبي: ${businessVat}</div>` : ""}
    ${businessAddress ? `<div class="party-detail">${businessAddress}</div>` : ""}
  </div>
  ${
    invoice.client
      ? `<div class="party">
    <div class="party-label">إلى</div>
    <div class="party-name">${invoice.client.name}</div>
    ${invoice.client.vatNumber ? `<div class="party-detail">الرقم الضريبي: ${invoice.client.vatNumber}</div>` : ""}
    ${invoice.client.email ? `<div class="party-detail">${invoice.client.email}</div>` : ""}
    ${invoice.client.phone ? `<div class="party-detail">${invoice.client.phone}</div>` : ""}
  </div>`
      : ""
  }
</div>

<table>
  <thead>
    <tr>
      <th>الوصف</th>
      <th style="text-align:left">الكمية</th>
      <th style="text-align:left">سعر الوحدة (${invoice.currency})</th>
      <th style="text-align:left">الإجمالي (${invoice.currency})</th>
    </tr>
  </thead>
  <tbody>
    ${lineItemsHtml}
  </tbody>
</table>

<div class="totals">
  ${qrSvg ? `<div class="qr-block">${qrSvg}<div class="qr-label">رمز الاستجابة السريعة — زاتكا</div></div>` : "<div></div>"}
  <div class="totals-table">
    <div class="totals-row">
      <span class="totals-label">المجموع قبل الضريبة</span>
      <span class="totals-value">${fmt(invoice.subtotal, invoice.currency)}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">ضريبة القيمة المضافة 15%</span>
      <span class="totals-value">${fmt(invoice.vatAmount, invoice.currency)}</span>
    </div>
    <div class="totals-row grand">
      <span>الإجمالي</span>
      <span class="totals-value">${fmt(invoice.total, invoice.currency)}</span>
    </div>
  </div>
</div>

${invoice.notes ? `<div class="notes-section"><div class="notes-label">ملاحظات</div><div>${invoice.notes}</div></div>` : ""}

<div class="footer">
  تم إنشاء هذه الفاتورة بواسطة قافتر · متوافقة مع متطلبات زاتكا — المرحلة الأولى
</div>

</body>
</html>`;
}
