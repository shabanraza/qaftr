import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { computeDraftTotals } from "@zatca/shared";
import type { InstantInvoiceDraft } from "@zatca/shared";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import { isDraftReady } from "#/lib/instant-invoice/validation";
import {
  buildInvoiceHtml,
  draftToPdfInvoice,
} from "#/lib/instant-invoice/invoice-pdf";
import type { MarketingLang } from "#/lib/marketing/lang";
import { Badge } from "#/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Spinner } from "#/components/ui/spinner";

type InvoiceHtmlPreviewProps = {
  draft: InstantInvoiceDraft;
  lang?: MarketingLang;
  issueDate: Date;
  seqNumber: number;
};

export function InvoiceHtmlPreview({
  draft,
  lang = "ar",
  issueDate,
  seqNumber,
}: InvoiceHtmlPreviewProps) {
  const copy = getInstantInvoiceCopy(lang);
  const totals = useMemo(() => computeDraftTotals(draft), [draft]);
  const invoice = useMemo(
    () => draftToPdfInvoice(draft, totals, seqNumber, issueDate),
    [draft, totals, seqNumber, issueDate],
  );
  const isReady = useMemo(() => isDraftReady(draft), [draft]);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [iframeHeight, setIframeHeight] = useState(480);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const width = el.clientWidth;
      if (width > 0) setContainerWidth(width);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, error, html]);

  useEffect(() => {
    let cancelled = false;
    setError(false);

    const timer = window.setTimeout(() => {
      void buildInvoiceHtml(invoice, lang, { includeQr: isReady, compact: true })
        .then((nextHtml) => {
          if (!cancelled) {
            setHtml(nextHtml);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [invoice, lang, isReady]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    let resizeObserver: ResizeObserver | undefined;
    let cancelled = false;

    const measureHeight = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return 0;
      return Math.ceil(
        Math.max(
          doc.documentElement.scrollHeight,
          doc.documentElement.offsetHeight,
          doc.body.scrollHeight,
          doc.body.offsetHeight,
        ),
      );
    };

    const syncHeight = () => {
      if (cancelled) return;
      const nextHeight = measureHeight();
      if (nextHeight > 0) setIframeHeight(nextHeight);
    };

    const scheduleSync = () => {
      syncHeight();
      requestAnimationFrame(() => {
        syncHeight();
        requestAnimationFrame(syncHeight);
      });
    };

    const bindContent = () => {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc?.body || !win) return;

      scheduleSync();

      doc.querySelectorAll("img").forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", scheduleSync, { once: true });
        }
      });

      void win.document.fonts?.ready.then(scheduleSync);

      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(scheduleSync);
      resizeObserver.observe(doc.body);
      resizeObserver.observe(doc.documentElement);
    };

    const onLoad = () => bindContent();

    iframe.addEventListener("load", onLoad);
    bindContent();

    return () => {
      cancelled = true;
      iframe.removeEventListener("load", onLoad);
      resizeObserver?.disconnect();
    };
  }, [html]);

  return (
    <Card className="gap-0 overflow-hidden border-border/80 py-0 shadow-sm">
      <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {copy.previewTitle}
          </CardTitle>
          <Badge variant={isReady ? "default" : "outline"} className="shrink-0">
            {isReady ? copy.previewReady : copy.previewIncomplete}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative p-0">
        {loading ? (
          <div className="flex h-[520px] items-center justify-center bg-muted/10">
            <Spinner className="size-6 text-muted-foreground" />
            <span className="sr-only">{copy.previewLoading}</span>
          </div>
        ) : error ? (
          <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {copy.previewError}
          </div>
        ) : (
          <div ref={containerRef} className="w-full bg-white">
            {containerWidth > 0 ? (
              <iframe
                ref={iframeRef}
                title={copy.previewTitle}
                srcDoc={html}
                sandbox="allow-same-origin"
                className="block w-full border-0"
                style={{ height: iframeHeight }}
              />
            ) : (
              <div className="h-[520px]" aria-hidden="true" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
