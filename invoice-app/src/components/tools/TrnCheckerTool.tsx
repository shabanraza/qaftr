import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon, CheckIcon, CircleIcon, XIcon } from "lucide-react";
import { analyzeSaudiVatNumber } from "@zatca/shared";
import type { MarketingLang } from "#/lib/marketing/lang";
import { getToolsCopy } from "#/lib/tools/copy";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

type TrnCheckerToolProps = {
  lang: MarketingLang;
};

function RuleRow({
  ok,
  label,
}: {
  ok: boolean | null;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      {ok === null ? (
        <CircleIcon className="size-4 text-muted-foreground/50" />
      ) : ok ? (
        <CheckIcon className="size-4 text-primary" />
      ) : (
        <XIcon className="size-4 text-destructive" />
      )}
      <span className={cn(ok === false && "text-destructive", ok === true && "text-foreground")}>
        {label}
      </span>
    </li>
  );
}

export function TrnCheckerTool({ lang }: TrnCheckerToolProps) {
  const copy = getToolsCopy(lang).trnChecker;
  const [value, setValue] = useState("");

  const analysis = useMemo(() => analyzeSaudiVatNumber(value), [value]);
  const hasInput = value.trim().length > 0;
  const search = lang === "en" ? { lang: "en" as const } : {};

  const lengthOk = hasInput ? analysis.digitCount === 15 : null;
  const startOk = hasInput ? analysis.normalized.startsWith("3") : null;
  const endOk = hasInput ? analysis.normalized.endsWith("3") : null;

  const statusLabel = !hasInput
    ? copy.statusEmpty
    : analysis.valid
      ? copy.statusValid
      : copy.statusInvalid;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              {copy.inputLabel}
            </CardTitle>
            <CardDescription>{copy.inputHint}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="trn-input">{copy.inputLabel}</FieldLabel>
                <Input
                  id="trn-input"
                  inputMode="numeric"
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-lg tracking-[0.08em] tabular-nums"
                  placeholder={copy.inputPlaceholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  maxLength={20}
                />
                <FieldDescription>{copy.inputHint}</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 py-5">
            <div className="flex flex-col gap-2">
              <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
                {copy.rulesTitle}
              </CardTitle>
              <CardDescription>{statusLabel}</CardDescription>
            </div>
            <Badge variant={analysis.valid ? "default" : hasInput ? "destructive" : "outline"}>
              {statusLabel}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-5 pb-2">
            <ul className="flex flex-col gap-3">
              <RuleRow ok={lengthOk} label={copy.rules.length} />
              <RuleRow ok={startOk} label={copy.rules.start} />
              <RuleRow ok={endOk} label={copy.rules.end} />
            </ul>

            {hasInput ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">{copy.normalizedLabel}</p>
                <p dir="ltr" className="mt-1 font-mono text-lg tracking-[0.08em] tabular-nums text-foreground">
                  {analysis.normalized || "—"}
                </p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="px-5 pb-5 pt-2">
            <Button asChild className="w-full" size="lg" disabled={!analysis.valid}>
              <Link
                to="/tools/fatora"
                search={search}
                hash="invoice-tool"
                className="no-underline text-primary-foreground hover:text-primary-foreground"
              >
                {copy.createInvoice}
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
