import { Link } from "@tanstack/react-router";
import type { MarketingLang } from "#/lib/marketing/lang";
import { getToolsCopy } from "#/lib/tools/copy";

type ToolBreadcrumbProps = {
  lang: MarketingLang;
  current: string;
};

export function ToolBreadcrumb({ lang, current }: ToolBreadcrumbProps) {
  const copy = getToolsCopy(lang);
  const search = lang === "en" ? { lang: "en" as const } : {};

  return (
    <p className="mb-2 text-xs font-semibold text-muted-foreground">
      <Link to="/" search={search} className="text-primary no-underline hover:underline">
        {lang === "ar" ? "قافتر" : "Qaftr"}
      </Link>{" "}
      /{" "}
      <Link to="/tools" search={search} className="text-primary no-underline hover:underline">
        {copy.breadcrumbRoot}
      </Link>{" "}
      / {current}
    </p>
  );
}
