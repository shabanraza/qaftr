import { useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import { SAUDI_INVOICE_TYPES } from "@zatca/shared";
import type { SaudiInvoiceType } from "@zatca/shared";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import type { MarketingLang } from "#/lib/marketing/lang";
import { cn } from "#/lib/utils";

/**
 * ZATCA invoice type: «فاتورة ضريبية مبسطة» (B2C) or «فاتورة ضريبية» (B2B).
 * WAI-ARIA radio group: one tab stop, arrow keys move and select.
 */
export function InvoiceTypePicker({
  lang,
  value,
  onChange,
}: {
  lang: MarketingLang;
  value: SaudiInvoiceType;
  onChange: (type: SaudiInvoiceType) => void;
}) {
  const copy = getInstantInvoiceCopy(lang);
  const labelId = useId();
  const refs = useRef<Partial<Record<SaudiInvoiceType, HTMLButtonElement | null>>>({});

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = SAUDI_INVOICE_TYPES.indexOf(value);
    const next = SAUDI_INVOICE_TYPES[(index + 1) % SAUDI_INVOICE_TYPES.length];
    onChange(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-sm font-semibold text-foreground">
        {copy.invoiceTypeLabel}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid gap-3 sm:grid-cols-2">
        {SAUDI_INVOICE_TYPES.map((type) => {
          const checked = type === value;
          const option = copy.invoiceTypes[type];
          return (
            <button
              key={type}
              ref={(el) => {
                refs.current[type] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              data-invoice-type={type}
              onClick={() => onChange(type)}
              onKeyDown={onKeyDown}
              className={cn(
                "group flex items-start gap-3 rounded-xl border bg-card p-4 text-start transition-colors outline-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                checked
                  ? "border-primary bg-primary/[0.04] shadow-[inset_0_0_0_1px_var(--color-primary)]"
                  : "border-border hover:border-primary/40",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  checked ? "border-primary" : "border-muted-foreground",
                )}
              >
                <span className={cn("size-2.5 rounded-full", checked ? "bg-primary" : "bg-transparent")} />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold text-foreground">{option.title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
