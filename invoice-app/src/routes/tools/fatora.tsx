import { createFileRoute } from '@tanstack/react-router'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { InstantInvoiceTool } from '#/components/instant-invoice/InstantInvoiceTool'
import { ToolBreadcrumb } from '#/components/tools/ToolBreadcrumb'
import { ToolFaqSection, buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { getToolsCopy } from '#/lib/tools/copy'

const faqAr = [
  {
    question: 'هل قافتر متوافق مع زاتكا؟',
    answer:
      'نعم — قافتر يدعم متطلبات المرحلة الأولى بما فيها QR الفاتورة الضريبية. قافتر ليس تطبيقاً رسمياً تابعاً لزاتكا.',
  },
  {
    question: 'هل أحتاج حساباً لإنشاء فاتورة؟',
    answer:
      'لا — يمكنك إنشاء فاتورة ضريبية وتحميل PDF مجاناً بدون تسجيل. الحساب مطلوب فقط لحفظ الفواتير وإدارتها.',
  },
  {
    question: 'ما هو برنامج فواتير مجاني للمستقلين؟',
    answer:
      'قافتر أداة مجانية بالعربية لإنشاء فاتورة ضريبية مبسطة مع QR زاتكا وPDF — للمستقلين والمنشآت الصغيرة في السعودية.',
  },
]

const faqEn = [
  {
    question: 'Is Qaftr ZATCA compliant?',
    answer:
      'Yes — Qaftr supports Phase 1 requirements including the tax invoice QR code. Qaftr is not an official ZATCA application.',
  },
  {
    question: 'Do I need an account to create an invoice?',
    answer:
      'No — you can create a tax invoice and download a PDF for free without signing up. An account is only required to save and manage invoices.',
  },
  {
    question: 'What is a free invoicing tool for freelancers?',
    answer:
      'Qaftr is a free tool to create simplified tax invoices with ZATCA QR and PDF export — for freelancers and small businesses in Saudi Arabia.',
  },
]

export const Route = createFileRoute('/tools/fatora')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const seo =
      lang === 'en'
        ? {
            title: 'Qaftr — Free ZATCA tax invoice tool',
            description:
              'Create a simplified tax invoice in Saudi Arabia with ZATCA Phase 1 QR, 15% VAT, and PDF export — no signup required.',
          }
        : {
            title: 'قافتر فاتورة ضريبية - برنامج فواتير زاتكا',
            description:
              'أنشئ فاتورة ضريبية مبسطة في السعودية مع رمز QR متوافق مع زاتكا، تصدير PDF، بدون تسجيل. برنامج فواتير مجاني للمستقلين.',
          }

    return {
      ...buildMarketingHead({
        ...seo,
        path: '/tools/fatora',
        lang,
      }),
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildFaqSchema(lang === 'en' ? [...faqEn] : [...faqAr])),
        },
      ],
    }
  },
  component: FatoraToolPage,
})

function FatoraToolPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const toolsCopy = getToolsCopy(lang)
  const tool = toolsCopy.tools.fatora
  const faqItems = lang === 'en' ? faqEn : faqAr

  return (
    <MarketingLayout lang={lang}>
      <div dir={dir} lang={lang} className="mx-auto max-w-6xl px-5 pb-4 pt-10 md:px-8">
        <ToolBreadcrumb lang={lang} current={tool.title} />
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground md:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{tool.subtitle}</p>
      </div>
      <InstantInvoiceTool lang={lang} />
      <ToolFaqSection
        title={lang === 'ar' ? 'أسئلة شائعة' : 'Frequently asked questions'}
        items={faqItems}
      />
    </MarketingLayout>
  )
}
