import { Check, Circle } from "lucide-react";
import { getInstantInvoiceChecklist } from "@zatca/shared";
import type { InstantInvoiceDraft } from "@zatca/shared";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import { isDraftReady } from "#/lib/instant-invoice/validation";
import type { MarketingLang } from "#/lib/marketing/lang";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { cn } from "#/lib/utils";

type ExportValidationChecklistProps = {
  draft: InstantInvoiceDraft;
  lang?: MarketingLang;
  visible: boolean;
  /** After a blocked export the list turns red; before that it is a neutral to-do list. */
  emphasis?: boolean;
};

export function ExportValidationChecklist({
  draft,
  lang = "ar",
  visible,
  emphasis = false,
}: ExportValidationChecklistProps) {
  const copy = getInstantInvoiceCopy(lang);
  const ready = isDraftReady(draft);

  if (!visible || ready) return null;

  const checks = getInstantInvoiceChecklist(draft).map(({ key, ok }) => ({
    ok,
    label: copy.previewChecks[key],
  }));

  return (
    <Alert
      variant={emphasis ? "destructive" : "default"}
      className={cn(
        emphasis ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/40",
      )}
    >
      <AlertTitle className={cn("line-clamp-none", emphasis ? "text-destructive" : "text-foreground")}>
        {copy.previewIncomplete}
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1.5">
          {checks.map(({ ok, label }) => (
            <li key={label} className="flex items-start gap-2 text-sm">
              {ok ? (
                <Check className="mt-0.5 shrink-0 text-primary" />
              ) : (
                <Circle
                  className={cn("mt-0.5 shrink-0", emphasis ? "text-destructive" : "text-muted-foreground")}
                />
              )}
              <span className={cn(ok && "text-muted-foreground line-through")}>{label}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
