import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("test-results/ar-preview");
const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:9002/#invoice-tool";

async function typeField(page, selector, value) {
  const field = page.locator(selector);
  await field.scrollIntoViewIfNeeded();
  await field.click();
  await field.fill("");
  await page.keyboard.type(value, { delay: 8 });
}

async function fillAllDetails(page) {
  await typeField(page, "#seller-name", "qaftr");
  await typeField(page, "#seller-vat", "300000000000003");
  await typeField(page, "#seller-address", "nichi bhood, gola gokarannath");
  await typeField(page, "#client-name", "asdasd");
  await typeField(page, "#client-vat", "310000000000003");
  await typeField(page, "#invoice-line-items input >> nth=0", "iphone");
  await typeField(page, 'input[placeholder="الكمية"]', "1");
  await typeField(page, 'input[placeholder="سعر الوحدة"]', "5000");
  await typeField(page, "#invoice-notes", "شكراً لتعاملكم معنا");
}

async function readIframe(frame) {
  if (!frame) return { error: "iframe not found" };

  return frame.evaluate(() => {
    const ths = [...document.querySelectorAll("thead th")].map((el) => el.textContent?.trim());
    const thRects = [...document.querySelectorAll("thead th")].map((el) => {
      const r = el.getBoundingClientRect();
      return { text: el.textContent?.trim(), left: r.left, right: r.right, width: r.width };
    });
    const trn =
      [...document.querySelectorAll(".party-detail")]
        .map((el) => el.textContent?.trim())
        .find((text) => text?.includes("TRN") || text?.includes("الرقم الضريبي")) ?? "";
    const footer = document.querySelector(".footer")?.textContent?.trim() ?? "";
    const hasQr = !!document.querySelector('img[alt="ZATCA QR"]');
    const sellerName = document.querySelector(".parties .party-name")?.textContent?.trim() ?? "";
    const clientName = [...document.querySelectorAll(".parties .party-name")].map((el) =>
      el.textContent?.trim(),
    );
    const lineText = document.querySelector("tbody tr")?.textContent?.trim() ?? "";
    const notes = document.querySelector(".notes-section")?.textContent?.trim() ?? "";
    const bodyWidth = document.body.getBoundingClientRect().width;
    const docWidth = document.documentElement.scrollWidth;
    return {
      ths,
      thCount: ths.length,
      thRects,
      trn,
      footer,
      hasQr,
      sellerName,
      clientName,
      lineText,
      notes,
      bodyWidth,
      docWidth,
      dir: document.documentElement.dir,
    };
  });
}

async function waitForReadyPreview(page) {
  const iframe = page.frameLocator('iframe[title="معاينة الفاتورة"]');
  await iframe.locator("body").waitFor({ state: "attached", timeout: 15000 });
  await iframe.locator("tbody >> text=iphone").waitFor({ timeout: 15000 });
  await iframe.locator('img[alt="ZATCA QR"]').waitFor({ timeout: 15000 });
  await page.getByText("جاهزة للتصدير").waitFor({ timeout: 15000 });
  await page.locator('iframe[title="معاينة الفاتورة"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
}

async function assertPreviewFullyVisible(page) {
  return page.evaluate(async () => {
    const iframe = document.querySelector('iframe[title="معاينة الفاتورة"]');
    if (!iframe) return { ok: false, reason: "no iframe" };
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return { ok: false, reason: "no iframe document" };

    await win.document.fonts?.ready;

    const iframeRect = iframe.getBoundingClientRect();
    const footer = doc.querySelector(".footer");
    const qr = doc.querySelector('img[alt="ZATCA QR"]');
    const ths = [...doc.querySelectorAll("thead th")];
    const footerRect = footer?.getBoundingClientRect();
    const qrRect = qr?.getBoundingClientRect();
    const iframeBottomLocal = iframe.clientHeight;
    const footerLocalBottom = footerRect ? footerRect.bottom - iframeRect.top : 0;
    const qrLocalBottom = qrRect ? qrRect.bottom - iframeRect.top : 0;
    const thVisible = ths.every((th) => {
      const r = th.getBoundingClientRect();
      const localBottom = r.bottom - iframeRect.top;
      return r.width > 20 && localBottom <= iframeBottomLocal + 2;
    });
    const footerInView = footerLocalBottom > 0 && footerLocalBottom <= iframeBottomLocal + 2;
    const qrInView = qrLocalBottom > 0 && qrLocalBottom <= iframeBottomLocal + 2;
    return {
      ok: ths.length === 4 && thVisible && footerInView && qrInView,
      thCount: ths.length,
      thVisible,
      footerInView,
      qrInView,
      iframeHeight: iframe.clientHeight,
      contentHeight: doc.body.scrollHeight,
      footerLocalBottom,
    };
  });
}

async function runFullFill(page, label) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#seller-name");
  await page.waitForTimeout(1500);
  await fillAllDetails(page);
  await waitForReadyPreview(page);

  const frame = page.frame({ url: /^about:srcdoc$/ });
  const iframeData = await readIframe(frame);
  const panel = await assertPreviewFullyVisible(page);

  await page.locator("#invoice-tool").screenshot({
    path: path.join(OUT_DIR, `${label}-tool-section.png`),
  });
  await page.locator('iframe[title="معاينة الفاتورة"]').screenshot({
    path: path.join(OUT_DIR, `${label}-preview-iframe.png`),
  });
  if (frame) {
    await frame.locator("body").screenshot({
      path: path.join(OUT_DIR, `${label}-iframe-body.png`),
    });
  }

  return { iframeData, panel };
}

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const desktop = await runFullFill(desktopPage, "desktop-full");

const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
const mobile = await runFullFill(mobilePage, "mobile-full");

const report = {
  desktop: { ...desktop.iframeData, panel: desktop.panel },
  mobile: { ...mobile.iframeData, panel: mobile.panel },
  checks: {
    desktopFourColumns: desktop.iframeData.thCount === 4,
    desktopAllColumnsVisible:
      desktop.iframeData.thRects?.length === 4 &&
      desktop.iframeData.thRects.every((col) => col.width > 40),
    desktopTrnOrder:
      desktop.iframeData.trn.includes("الرقم الضريبي") &&
      desktop.iframeData.trn.includes("300000000000003"),
    desktopHasQr: desktop.iframeData.hasQr === true,
    desktopHasLine: desktop.iframeData.lineText.includes("iphone"),
    desktopHasNotes: desktop.iframeData.notes.includes("شكراً"),
    desktopPreviewFullyVisible: desktop.panel?.ok === true,
    desktopFooterInView: desktop.panel?.footerInView === true,
    desktopQrInView: desktop.panel?.qrInView === true,
    mobileFourColumns: mobile.iframeData.thCount === 4,
    mobileAllColumnsVisible:
      mobile.iframeData.thRects?.length === 4 &&
      mobile.iframeData.thRects.every((col) => col.width > 20),
    mobileHasQr: mobile.iframeData.hasQr === true,
    mobileFooter: mobile.iframeData.footer.includes("qaftr.com"),
    mobilePreviewFullyVisible: mobile.panel?.ok === true,
    mobileFooterInView: mobile.panel?.footerInView === true,
    mobileQrInView: mobile.panel?.qrInView === true,
    desktopFooter: desktop.iframeData.footer.includes("qaftr.com"),
    desktopSellerClient:
      desktop.iframeData.clientName?.includes("qaftr") &&
      desktop.iframeData.clientName?.includes("asdasd"),
  },
};

await writeFile(path.join(OUT_DIR, "full-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();

const failed = Object.entries(report.checks).filter(([, ok]) => !ok);
if (failed.length) {
  console.error("FAILED:", failed.map(([k]) => k).join(", "));
  process.exit(1);
}
