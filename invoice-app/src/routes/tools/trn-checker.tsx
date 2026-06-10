import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "#/components/marketing/MarketingLayout";
import { ToolBreadcrumb } from "#/components/tools/ToolBreadcrumb";
import { ToolFaqSection, buildFaqSchema } from "#/components/tools/ToolFaqSection";
import { TrnCheckerTool } from "#/components/tools/TrnCheckerTool";
import { langDir, marketingSearchSchema, resolveLang } from "#/lib/marketing/lang";
import { buildMarketingHead } from "#/lib/marketing/seo";
import { getToolsCopy } from "#/lib/tools/copy";

export const Route = createFileRoute("/tools/trn-checker")({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search);
    const copy = getToolsCopy(lang);
    const seo =
      lang === "en"
        ? {
            title: "Saudi TRN format checker | Qaftr",
            description:
              "Validate a Saudi VAT registration number (TRN): 15 digits, starts and ends with 3. Free format checker for ZATCA invoices.",
          }
        : {
            title: "التحقق من الرقم الضريبي TRN | قافتر",
            description:
              "تحقق من صيغة الرقم الضريبي السعودي: 15 رقمًا يبدأ وينتهي بـ 3. أداة مجانية قبل إنشاء فاتورة زاتكا.",
          };

    return {
      ...buildMarketingHead({
        ...seo,
        path: "/tools/trn-checker",
        lang,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildFaqSchema(copy.trnChecker.faq)),
        },
      ],
    };
  },
  component: TrnCheckerPage,
});

function TrnCheckerPage() {
  const { lang: searchLang } = Route.useSearch();
  const lang = resolveLang({ lang: searchLang });
  const dir = langDir(lang);
  const copy = getToolsCopy(lang);
  const tool = copy.tools["trn-checker"];

  return (
    <MarketingLayout lang={lang}>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-4 pt-10 md:px-8">
        <ToolBreadcrumb lang={lang} current={tool.title} />
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground md:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{tool.subtitle}</p>
      </div>

      <TrnCheckerTool lang={lang} />

      <ToolFaqSection title={copy.trnChecker.faqTitle} items={copy.trnChecker.faq} />
    </MarketingLayout>
  );
}
