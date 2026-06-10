import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "#/components/marketing/MarketingLayout";
import { ToolsHubGrid } from "#/components/tools/ToolsHubGrid";
import { langDir, marketingSearchSchema, resolveLang } from "#/lib/marketing/lang";
import { buildMarketingHead } from "#/lib/marketing/seo";
import { getToolsCopy } from "#/lib/tools/copy";

export const Route = createFileRoute("/tools/")({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search);
    const seo =
      lang === "en"
        ? {
            title: "Free Saudi invoicing tools — Qaftr",
            description:
              "VAT calculator, TRN checker, and ZATCA tax invoice generator for Saudi freelancers. Arabic and English, no signup.",
          }
        : {
            title: "أدوات مجانية — فواتير وضريبة زاتكا | قافتر",
            description:
              "حاسبة ضريبة 15٪، التحقق من TRN، وإنشاء فاتورة ضريبية مع QR — للمستقلين في السعودية. بدون تسجيل.",
          };

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
    <MarketingLayout lang={lang}>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-6 pt-10 md:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--qaftr-gold)]">
          {copy.hub.breadcrumb}
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground md:text-4xl">
          {copy.hub.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {copy.hub.subtitle}
        </p>
        <p className="mt-3 text-xs text-muted-foreground/80">{copy.disclaimer}</p>
      </div>

      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <ToolsHubGrid lang={lang} />
      </div>
    </MarketingLayout>
  );
}
