import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { buildInvoiceHtml } from '#/lib/instant-invoice/invoice-pdf'
import type { InvoiceForPdf } from '#/lib/instant-invoice/invoice-pdf'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Spinner } from '#/components/ui/spinner'

/** A4 width in CSS pixels at 96 dpi; the page is drawn at this width and scaled to fit. */
const A4_WIDTH = 794
const DEBOUNCE_MS = 250

/**
 * Live preview of the invoice as the PDF will print: renders the same HTML
 * `exportInvoicePdfBlob` turns into the PDF, in a sandboxed iframe at A4
 * width, scaled down to the panel. Re-renders shortly after typing stops.
 */
export function InvoicePagePreview({
  invoice,
  lang,
  title,
  includeQr,
}: {
  invoice: InvoiceForPdf
  lang: MarketingLang
  title: string
  includeQr: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [width, setWidth] = useState(0)
  const [pageHeight, setPageHeight] = useState(1123)
  const [html, setHtml] = useState('')
  const [failed, setFailed] = useState(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      buildInvoiceHtml(invoice, lang, { includeQr, forPdf: true })
        .then((next) => {
          if (cancelled) return
          setHtml(next)
          setFailed(false)
        })
        .catch(() => {
          if (!cancelled) setFailed(true)
        })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [invoice, lang, includeQr])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return
    let observer: ResizeObserver | undefined
    const measure = () => {
      const doc = iframe.contentDocument
      if (!doc?.body) return
      const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight)
      if (h > 0) setPageHeight(Math.max(h, 1123))
    }
    const bind = () => {
      measure()
      const doc = iframe.contentDocument
      if (!doc?.body) return
      observer?.disconnect()
      observer = new ResizeObserver(measure)
      observer.observe(doc.body)
    }
    iframe.addEventListener('load', bind)
    bind()
    return () => {
      iframe.removeEventListener('load', bind)
      observer?.disconnect()
    }
  }, [html])

  const scale = width > 0 ? Math.min(1, width / A4_WIDTH) : 0

  return (
    <div ref={containerRef} className="relative w-full min-w-0 overflow-hidden" data-testid="invoice-page-preview">
      {!html ? (
        <div className="flex aspect-[1/1.414] w-full items-center justify-center rounded-md border border-border bg-white">
          {failed ? null : <Spinner className="size-6 text-muted-foreground" />}
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-md border border-border bg-white shadow-sm"
          style={{ height: Math.ceil(pageHeight * scale) }}
        >
          <iframe
            ref={iframeRef}
            title={title}
            srcDoc={html}
            sandbox="allow-same-origin"
            className="block border-0"
            style={{
              width: A4_WIDTH,
              height: pageHeight,
              transform: `scale(${scale})`,
              transformOrigin: lang === 'ar' ? 'top right' : 'top left',
              // In RTL the iframe hugs the right edge, so it scales from there.
              marginInlineStart: 0,
            }}
          />
        </div>
      )}
    </div>
  )
}
