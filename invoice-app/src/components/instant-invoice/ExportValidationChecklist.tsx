import { Check, Circle } from "lucide-react";
import type { InstantInvoiceDraft } from "@zatca/shared";
import { getInstantInvoiceCopy } from "#/lib/instant-invoice/copy";
import { getDraftReadiness, isDraftReady } from "#/lib/instant-invoice/validation";
import type { MarketingLang } from "#/lib/marketing/lang";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { cn } from "#/lib/utils";

type ExportValidationChecklistProps = {
  draft: InstantInvoiceDraft;
  lang?: MarketingLang;
  visible: boolean;
};

export function ExportValidationChecklist({
  draft,
  lang = "ar",
  visible,
}: ExportValidationChecklistProps) {
  const copy = getInstantInvoiceCopy(lang);
  const readiness = getDraftReadiness(draft);
  const ready = isDraftReady(draft);

  if (!visible || ready) return null;

  const checks = [
    { ok: readiness.sellerName, label: copy.previewChecks.sellerName },
    { ok: readiness.sellerVat, label: copy.previewChecks.sellerVat },
    { ok: readiness.clientName, label: copy.previewChecks.clientName },
    { ok: readiness.lineItems, label: copy.previewChecks.lineItems },
  ] as const;

  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
      <AlertTitle className="text-destructive">{copy.previewIncomplete}</AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1.5">
          {checks.map(({ ok, label }) => (
            <li key={label} className="flex items-start gap-2 text-sm">
              {ok ? (
                <Check className="mt-0.5 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 shrink-0 text-destructive" />
              )}
              <span className={cn(ok && "text-muted-foreground line-through")}>{label}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
