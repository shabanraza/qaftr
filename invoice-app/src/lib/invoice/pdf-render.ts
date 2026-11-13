/**
 * Country-neutral HTML -> PDF rendering (html2canvas + jsPDF, loaded on demand).
 * Moved verbatim from instant-invoice/invoice-pdf.ts so the Saudi and UAE
 * invoice tools share one renderer.
 */

async function waitForPdfDocument(doc: Document): Promise<void> {
  await Promise.all(
    [...doc.images].map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );

  await Promise.race([
    doc.fonts?.ready ?? Promise.resolve(),
    new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
  ]);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function renderHtmlInHiddenIframe(html: string): Promise<{
  iframe: HTMLIFrameElement;
  doc: Document;
}> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;border:0;opacity:0;pointer-events:none;z-index:-1;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("PDF iframe unavailable");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("PDF_RENDER_TIMEOUT")), 30000);
    const done = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    if (doc.readyState === "complete") {
      done();
      return;
    }
    iframe.addEventListener("load", done, { once: true });
  });

  await waitForPdfDocument(doc);

  const contentHeight = Math.ceil(
    Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight, doc.body.offsetHeight),
  );
  iframe.style.height = `${contentHeight}px`;

  await waitForPdfDocument(doc);

  return { iframe, doc };
}

export async function htmlToPdfBlob(
  html: string,
  options?: { title?: string },
): Promise<Blob> {
  const { iframe, doc } = await renderHtmlInHiddenIframe(html);

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const body = doc.body;
    const width = Math.max(body.scrollWidth, body.offsetWidth, 794);
    const height = Math.max(body.scrollHeight, body.offsetHeight, 1);

    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("PDF_RENDER_EMPTY");
    }

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    if (options?.title) pdf.setProperties({ title: options.title, creator: "Qaftr" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;
    const imgHeight = (canvas.height * printableWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    let heightLeft = imgHeight;
    let y = margin;

    pdf.addImage(imgData, "JPEG", margin, y, printableWidth, imgHeight);
    heightLeft -= printableHeight;

    while (heightLeft > 0) {
      y = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, y, printableWidth, imgHeight);
      heightLeft -= printableHeight;
    }

    return pdf.output("blob");
  } finally {
    iframe.remove();
  }
}

/** Triggers a browser download for a generated blob. */
export function downloadBlob(blob: Blob, filename: string): void {
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
