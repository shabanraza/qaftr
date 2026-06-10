import { createFileRoute } from '@tanstack/react-router'
import { InstantInvoiceTool } from '#/components/instant-invoice/InstantInvoiceTool'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/new-invoice')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'فاتورة جديدة — قافتر' : 'New invoice — Qaftr',
      description:
        lang === 'ar'
          ? 'أنشئ فاتورة جديدة داخل مكتب قافتر.'
          : 'Create a new invoice inside the Qaftr workspace.',
      path: '/workspace/new-invoice',
      lang,
    })
  },
  component: WorkspaceNewInvoicePage,
})

function WorkspaceNewInvoicePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy =
    lang === 'ar'
      ? {
          title: 'فاتورة جديدة',
          subtitle: 'إنشاء وحفظ فاتورة من داخل مساحة العمل.',
        }
      : {
          title: 'New invoice',
          subtitle: 'Create and save an invoice inside the workspace.',
        }

  return (
    <WorkspaceShell lang={lang} active="invoices" title={copy.title} subtitle={copy.subtitle}>
      <InstantInvoiceTool lang={lang} variant="workspace" />
    </WorkspaceShell>
  )
}
