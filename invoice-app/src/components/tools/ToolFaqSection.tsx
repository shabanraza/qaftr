import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

type ToolFaqSectionProps = {
  title: string;
  items: { question: string; answer: string }[];
};

export function ToolFaqSection({ title, items }: ToolFaqSectionProps) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <h2 className="mb-6 font-[family-name:var(--font-qaftr-display)] text-xl font-bold text-foreground">
        {title}
      </h2>
      <dl className="flex flex-col gap-4">
        {items.map((item) => (
          <Card key={item.question} className="gap-2 py-5 shadow-none">
            <CardHeader className="px-5 pb-0">
              <CardTitle className="text-base text-primary">{item.question}</CardTitle>
            </CardHeader>
            <CardContent className="px-5">
              <Separator className="mb-3" />
              <dd className="text-sm text-muted-foreground">{item.answer}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </section>
  );
}

export function buildFaqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
