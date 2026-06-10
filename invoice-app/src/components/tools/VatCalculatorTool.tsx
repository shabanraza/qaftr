import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { calculateVat, VAT_RATE, type VatCalculationMode } from "@zatca/shared";
import type { MarketingLang } from "#/lib/marketing/lang";
import { formatToolMoney, getToolsCopy } from "#/lib/tools/copy";
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
import { Separator } from "#/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";

type VatCalculatorToolProps = {
  lang: MarketingLang;
};

export function VatCalculatorTool({ lang }: VatCalculatorToolProps) {
  const copy = getToolsCopy(lang).vatCalculator;
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<VatCalculationMode>("exclusive");

  const parsedAmount = parseFloat(amount.replace(/,/g, ""));
  const result = useMemo(() => {
    if (!amount.trim() || Number.isNaN(parsedAmount)) return null;
    return calculateVat(parsedAmount, mode);
  }, [amount, mode, parsedAmount]);

  const search = lang === "en" ? { lang: "en" as const } : {};
  const vatPercent = `${Math.round(VAT_RATE * 100)}%`;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <Badge variant="outline" className="w-fit">
              {vatPercent} VAT
            </Badge>
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              {lang === "ar" ? "حاسبة ضريبة القيمة المضافة" : "VAT calculator"}
            </CardTitle>
            <CardDescription>{copy.rateNote}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-6">
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="vat-amount">{copy.amountLabel}</FieldLabel>
                <Input
                  id="vat-amount"
                  inputMode="decimal"
                  dir="ltr"
                  className="text-lg tabular-nums"
                  placeholder={copy.amountPlaceholder}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>{copy.modeLabel}</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={mode}
                  onValueChange={(value) => {
                    if (value === "exclusive" || value === "inclusive") setMode(value);
                  }}
                  className="w-full"
                >
                  <ToggleGroupItem value="exclusive" className="flex-1">
                    {copy.modeExclusive}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="inclusive" className="flex-1">
                    {copy.modeInclusive}
                  </ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>{copy.rateNote}</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 py-0 shadow-sm">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_80%_0%,rgba(200,151,58,0.18),transparent_55%)]"
            aria-hidden
          />
          <CardHeader className="relative gap-2 px-5 py-5">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              {copy.resultsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative px-5 pb-2">
            {result ? (
              <dl className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">{copy.subtotal}</dt>
                  <dd className="text-lg font-semibold tabular-nums text-foreground">
                    {formatToolMoney(result.subtotal, lang)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">{copy.vat}</dt>
                  <dd className="text-lg font-semibold tabular-nums text-primary">
                    {formatToolMoney(result.vatAmount, lang)}
                  </dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-base font-medium text-foreground">{copy.total}</dt>
                  <dd className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold tabular-nums text-[var(--qaftr-gold)]">
                    {formatToolMoney(result.total, lang)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{copy.emptyHint}</p>
            )}
          </CardContent>
          <CardFooter className="relative flex-col gap-3 px-5 pb-5 pt-4">
            <Button asChild className="w-full" size="lg" disabled={!result}>
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
