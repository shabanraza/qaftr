import { Link } from "@tanstack/react-router";
import { CalculatorIcon, FileTextIcon, ShieldCheckIcon } from "lucide-react";
import type { MarketingLang } from "#/lib/marketing/lang";
import { getToolsCopy, TOOL_DEFINITIONS, type ToolId } from "#/lib/tools/copy";
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
import { cn } from "#/lib/utils";

const TOOL_ICONS: Record<ToolId, typeof FileTextIcon> = {
  fatora: FileTextIcon,
  "vat-calculator": CalculatorIcon,
  "trn-checker": ShieldCheckIcon,
};

const ACCENT_STYLES: Record<(typeof TOOL_DEFINITIONS)[number]["accent"], string> = {
  green: "bg-primary/5",
  gold: "bg-[var(--qaftr-gold)]/5",
  sage: "bg-[var(--qaftr-sage)]/10",
};

type ToolsHubGridProps = {
  lang: MarketingLang;
};

export function ToolsHubGrid({ lang }: ToolsHubGridProps) {
  const copy = getToolsCopy(lang);
  const search = lang === "en" ? { lang: "en" as const } : {};

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {TOOL_DEFINITIONS.map((tool, index) => {
        const meta = copy.tools[tool.id];
        const Icon = TOOL_ICONS[tool.id];
        return (
          <Card
            key={tool.id}
            className={cn(
              "group relative h-full gap-0 overflow-hidden py-0 shadow-sm transition-transform duration-300 hover:-translate-y-0.5",
              ACCENT_STYLES[tool.accent],
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <CardHeader className="gap-3 px-5 pt-5 pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-background/80 shadow-sm ring-1 ring-border/60">
                  <Icon className="size-5 text-primary" />
                </div>
                <Badge variant="secondary">{meta.badge}</Badge>
              </div>
              <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-lg leading-snug text-foreground">
                {meta.title}
              </CardTitle>
              <CardDescription className="min-h-12 text-sm leading-relaxed">
                {meta.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 px-5 pt-3">
              <p className="text-xs text-muted-foreground">{meta.keywords}</p>
            </CardContent>
            <CardFooter className="mt-auto w-full px-5 pt-4 pb-5">
              <Button asChild className="w-full">
                <Link
                  to={tool.href as any}
                  search={search as any}
                  className="no-underline text-primary-foreground hover:text-primary-foreground"
                >
                  {copy.hub.cta}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
