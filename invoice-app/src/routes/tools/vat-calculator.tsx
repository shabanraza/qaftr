import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "#/components/marketing/MarketingLayout";
import { ToolBreadcrumb } from "#/components/tools/ToolBreadcrumb";
import { ToolFaqSection, buildFaqSchema } from "#/components/tools/ToolFaqSection";
import { VatCalculatorTool } from "#/components/tools/VatCalculatorTool";
import { langDir, marketingSearchSchema, resolveLang } from "#/lib/marketing/lang";
import { buildMarketingHead } from "#/lib/marketing/seo";
import { getToolsCopy } from "#/lib/tools/copy";

export const Route = createFileRoute("/tools/vat-calculator")({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search);
    const copy = getToolsCopy(lang);
    const seo =
      lang === "en"
        ? {
            title: "15% VAT calculator — Saudi Arabia | Qaftr",
            description:
              "Free VAT calculator for Saudi invoices. Compute 15% tax before or after total in SAR — ZATCA Phase 1 helper tool.",
          }
        : {
            title: "حاسبة ضريبة 15٪ — السعودية | قافتر",
            description:
              "حاسبة ضريبة القيمة المضافة مجانية للفواتير السعودية. احسب 15٪ قبل أو بعد الإجمالي بالريال — أداة مساعدة لزاتكا.",
          };

    return {
      ...buildMarketingHead({
        ...seo,
        path: "/tools/vat-calculator",
        lang,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildFaqSchema(copy.vatCalculator.faq)),
        },
      ],
    };
  },
  component: VatCalculatorPage,
});

function VatCalculatorPage() {
  const { lang: searchLang } = Route.useSearch();
  const lang = resolveLang({ lang: searchLang });
  const dir = langDir(lang);
  const copy = getToolsCopy(lang);
  const tool = copy.tools["vat-calculator"];

  return (
    <MarketingLayout lang={lang}>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-4 pt-10 md:px-8">
        <ToolBreadcrumb lang={lang} current={tool.title} />
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground md:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{tool.subtitle}</p>
      </div>

      <VatCalculatorTool lang={lang} />

      <ToolFaqSection title={copy.vatCalculator.faqTitle} items={copy.vatCalculator.faq} />
    </MarketingLayout>
  );
}
