import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { Download } from "lucide-react";
import type { MarketingLang } from "#/lib/marketing/lang";
import { langDir } from "#/lib/marketing/lang";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { cn } from "#/lib/utils";

/**
 * Sticky bottom bar on phones/tablets (< lg): total + Download PDF while the
 * invoice form is on screen and the main action card is not. Desktop shows
 * the sticky summary column instead. Shared by the Saudi and UAE tools.
 */
export function MobileInvoiceActionBar({
  lang,
  label,
  totalLabel,
  totalText,
  downloadLabel,
  busy,
  downloading,
  sectionRef,
  actionsRef,
  onDownload,
}: {
  lang: MarketingLang;
  /** Landmark name, e.g. "Invoice actions". */
  label: string;
  totalLabel: string;
  totalText: string;
  downloadLabel: string;
  busy: boolean;
  downloading: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  actionsRef: RefObject<HTMLElement | null>;
  onDownload: () => void;
}) {
  // No IntersectionObserver (old browsers, tests): always show.
  const [sectionInView, setSectionInView] = useState(true);
  const [actionsInView, setActionsInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const section = sectionRef.current;
    const actions = actionsRef.current;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === section) setSectionInView(entry.isIntersecting);
        if (entry.target === actions) setActionsInView(entry.isIntersecting);
      }
    });
    if (section) observer.observe(section);
    if (actions) observer.observe(actions);
    return () => observer.disconnect();
  }, [sectionRef, actionsRef]);

  const visible = sectionInView && !actionsInView;

  return (
    <section
      aria-label={label}
      dir={langDir(lang)}
      lang={lang}
      data-testid="mobile-invoice-bar"
      data-visible={visible}
      // Stacks above the consent banner while it is open (see ConsentBanner).
      style={{ bottom: "var(--qaftr-consent-offset, 0px)" }}
      className={cn(
        "qaftr-marketing fixed inset-x-0 z-40 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_-12px_rgba(10,61,46,0.35)] backdrop-blur-md transition-transform duration-200 lg:hidden",
        visible ? "translate-y-0" : "invisible translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs text-muted-foreground">{totalLabel}</span>
          <span className="truncate text-base font-bold tabular-nums text-primary">
            {totalText}
          </span>
        </div>
        <Button
          type="button"
          size="lg"
          className="shrink-0"
          disabled={busy}
          onClick={onDownload}
        >
          {downloading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" aria-hidden />
          )}
          {downloadLabel}
        </Button>
      </div>
    </section>
  );
}
