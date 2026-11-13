import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "#/components/marketing/MarketingLayout";
import { ToolsHubGrid } from "#/components/tools/ToolsHubGrid";
import { AeCrossLinkCard } from "#/components/ae/AeCrossLinkCard";
import { langDir, marketingSearchSchema, resolveLang } from "#/lib/marketing/lang";
import { buildMarketingHead } from "#/lib/marketing/seo";
import { getToolsCopy } from "#/lib/tools/copy";

export const Route = createFileRoute("/tools/")({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search);
    const seo = getToolsCopy(lang).seo.hub;

    return buildMarketingHead({
      ...seo,
      path: "/tools",
      lang,
    });
  },
  component: ToolsHubPage,
});

function ToolsHubPage() {
  const { lang: searchLang } = Route.useSearch();
  const lang = resolveLang({ lang: searchLang });
  const dir = langDir(lang);
  const copy = getToolsCopy(lang);

  return (
    <MarketingLayout lang={lang} deadline>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-6 pt-10 md:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--qaftr-gold)]">
          {copy.hub.breadcrumb}
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-balance text-foreground md:text-4xl">
          {copy.hub.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {copy.hub.subtitle}
        </p>
        <p className="mt-3 text-xs text-muted-foreground/80">{copy.disclaimer}</p>
      </div>

      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <ToolsHubGrid lang={lang} />
        <p className="mt-6 text-sm text-muted-foreground">
          {lang === "ar" ? "جديد: " : "New: "}
          <a href={`/guides/zatca-wave-25${lang === "en" ? "?lang=en" : ""}`} className="font-medium text-primary">
            {lang === "ar"
              ? "دليل الموجة ٢٥ — من يشملها وموعد ١ فبراير ٢٠٢٧"
              : "ZATCA Wave 25 guide — who is in scope and the 1 February 2027 deadline"}
          </a>
        </p>
        <AeCrossLinkCard lang={lang} />
      </div>
    </MarketingLayout>
  );
}
