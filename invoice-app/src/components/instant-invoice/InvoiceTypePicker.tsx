import { useId } from "react";
import { SAUDI_INVOICE_TYPES } from "@zatca/shared";
import type { SaudiInvoiceType } from "@zatca/shared";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import { langDir } from "#/lib/marketing/lang";
import type { MarketingLang } from "#/lib/marketing/lang";
import { Label } from "#/components/ui/label";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";

/**
 * ZATCA invoice type: «فاتورة ضريبية مبسطة» (B2C) or «فاتورة ضريبية» (B2B).
 * shadcn RadioGroup (Radix): one tab stop, arrow keys move and select, and
 * arrow direction follows the page direction. Each option is a card label.
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
  const baseId = useId();
  const labelId = `${baseId}-label`;

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-sm font-semibold text-foreground">
        {copy.invoiceTypeLabel}
      </span>
      <RadioGroup
        aria-labelledby={labelId}
        dir={langDir(lang)}
        value={value}
        onValueChange={(next) => onChange(next as SaudiInvoiceType)}
        className="gap-3 sm:grid-cols-2"
      >
        {SAUDI_INVOICE_TYPES.map((type) => {
          const option = copy.invoiceTypes[type];
          const id = `${baseId}-${type}`;
          return (
            <Label
              key={type}
              htmlFor={id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 text-start text-base font-normal leading-normal select-text transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.04] has-[[data-state=checked]]:shadow-[inset_0_0_0_1px_var(--color-primary)] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
            >
              <RadioGroupItem
                id={id}
                value={type}
                data-invoice-type={type}
                className="mt-0.5 size-5 border-2 border-muted-foreground focus-visible:ring-0 data-[state=checked]:border-primary"
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold text-foreground">{option.title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">{option.hint}</span>
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
