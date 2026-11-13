import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { BusinessProfileForm } from '#/components/workspace/BusinessProfileForm'
import { Skeleton } from '#/components/ui/skeleton'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/business')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    if (typeof window === 'undefined') return
    await context.queryClient.ensureQueryData(context.trpc.business.get.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'ملف المنشأة — قافتر' : 'Business profile — Qaftr',
      description:
        lang === 'ar'
          ? 'بيانات منشأتك وعنوانها الوطني كما تتطلبها الفوترة الإلكترونية.'
          : 'Your business details and national address for e-invoicing.',
      path: '/workspace/business',
      lang,
    })
  },
  component: WorkspaceBusinessPage,
})

function WorkspaceBusinessPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: business, isLoading } = useQuery(trpc.business.get.queryOptions())
  const upsert = useMutation({
    ...trpc.business.upsert.mutationOptions(),
    onSuccess: () => void queryClient.invalidateQueries(trpc.business.get.queryFilter()),
  })

  return (
    <WorkspaceShell
      lang={lang}
      active="business"
      title={lang === 'ar' ? 'ملف المنشأة' : 'Business profile'}
      subtitle={
        lang === 'ar'
          ? 'بيانات منشأتك كما تظهر في الفواتير، وما تحتاجه المرحلة الثانية من الفوترة الإلكترونية.'
          : 'Your business details as they appear on invoices, and what ZATCA Phase 2 needs.'
      }
    >
      <div className="p-5">
        {isLoading ? (
          <Skeleton className="h-96 w-full max-w-4xl rounded-xl" />
        ) : (
          <BusinessProfileForm
            key={business?.id ?? 'new'}
            lang={lang}
            initial={business ?? null}
            onSave={(values) =>
              upsert.mutateAsync({
                ...values,
                nameAr: values.nameAr ?? '',
                defaultLanguage: business?.defaultLanguage ?? lang,
              })
            }
          />
        )}
      </div>
    </WorkspaceShell>
  )
}
