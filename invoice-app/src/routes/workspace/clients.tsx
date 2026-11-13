import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '#/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { checkBuyerFormat, normalizePartyInput } from '@zatca/shared'
import type { PartyIssue } from '@zatca/shared'
import { ClientB2bBadge, ClientB2bDetails, CLIENT_B2B_KEYS } from '#/components/workspace/ClientB2bDetails'
import type { PartyValues } from '#/components/workspace/PartyFields'
import { parseProfileError } from '#/lib/zatca/party-input'

export const Route = createFileRoute('/workspace/clients')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    if (typeof window === 'undefined') return

    await context.queryClient.ensureQueryData(context.trpc.clients.list.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'العملاء — قافتر' : 'Clients — Qaftr',
      description:
        lang === 'ar'
          ? 'إدارة عملاء قافتر المحفوظين.'
          : 'Manage saved Qaftr clients.',
      path: '/workspace/clients',
      lang,
    })
  },
  component: WorkspaceClientsPage,
})

function WorkspaceClientsPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: clients, isLoading } = useQuery(trpc.clients.list.queryOptions())
  const createClientMutation = useMutation({
    ...trpc.clients.create.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.clients.list.queryFilter())
      setName('')
      setVatNumber('')
      setEmail('')
      setPhone('')
      setB2b({})
      setB2bIssues([])
      setFormError(null)
    },
  })
  const [name, setName] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [b2b, setB2b] = useState<PartyValues>({})
  const [b2bIssues, setB2bIssues] = useState<PartyIssue[]>([])

  const copy =
    lang === 'ar'
      ? {
          title: 'العملاء',
          subtitle: 'Mini CRM بسيط لحفظ بيانات العملاء وإعادة استخدامها في الفواتير.',
          name: 'الاسم',
          vat: 'الرقم الضريبي',
          email: 'البريد',
          phone: 'الجوال',
          status: 'فواتير الشركات',
          create: 'إضافة عميل',
          createTitle: 'إضافة عميل جديد',
          createHint: 'احفظ بيانات العميل لاستخدامها في الفواتير وعروض الأسعار.',
          namePlaceholder: 'اسم العميل أو الشركة',
          vatPlaceholder: '300000000000003',
          emailPlaceholder: 'client@example.com',
          phonePlaceholder: '+966 5x xxx xxxx',
          requiredName: 'أدخل اسم العميل.',
          invalidEmail: 'أدخل بريداً صحيحاً أو اتركه فارغاً.',
          saving: 'جاري الحفظ...',
          empty: 'لا يوجد عملاء محفوظون بعد.',
          emptyHint: 'أضف أول عميل لإعادة استخدام بياناته عند إنشاء الفواتير.',
        }
      : {
          title: 'Clients',
          subtitle: 'Simple mini CRM for saved client details and invoice reuse.',
          name: 'Name',
          vat: 'VAT number',
          email: 'Email',
          phone: 'Phone',
          status: 'B2B invoices',
          create: 'Add client',
          createTitle: 'Add a new client',
          createHint: 'Save client details for invoices and quotes.',
          namePlaceholder: 'Client or company name',
          vatPlaceholder: '300000000000003',
          emailPlaceholder: 'client@example.com',
          phonePlaceholder: '+966 5x xxx xxxx',
          requiredName: 'Enter a client name.',
          invalidEmail: 'Enter a valid email or leave it blank.',
          saving: 'Saving...',
          empty: 'No saved clients yet.',
          emptyHint: 'Add your first client to reuse their details when creating invoices.',
        }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError(copy.requiredName)
      return
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError(copy.invalidEmail)
      return
    }

    const profile = normalizePartyInput({ ...b2b, vatNumber })
    const issues = checkBuyerFormat(profile)
    setB2bIssues(issues)
    if (issues.length) {
      setFormError(lang === 'ar' ? 'راجع الحقول المحددة.' : 'Check the highlighted fields.')
      return
    }

    try {
      await createClientMutation.mutateAsync({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        ...Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== undefined)),
      })
    } catch (error) {
      const serverIssues = parseProfileError(error instanceof Error ? error.message : undefined)
      setB2bIssues(serverIssues)
      setFormError(
        serverIssues.length
          ? lang === 'ar' ? 'راجع الحقول المحددة.' : 'Check the highlighted fields.'
          : lang === 'ar' ? 'تعذر حفظ العميل.' : 'Could not save the client.',
      )
    }
  }

  return (
    <WorkspaceShell
      lang={lang}
      active="clients"
      title={copy.title}
      subtitle={copy.subtitle}
      actions={
        <Button
          type="submit"
          form="create-client-form"
          size="sm"
          className="qaftr-btn-primary"
          disabled={createClientMutation.isPending}
        >
          {createClientMutation.isPending ? copy.saving : copy.create}
        </Button>
      }
    >
      <div className="border-b border-border bg-background/50 p-5">
        <Card className="max-w-4xl py-0 shadow-none">
          <CardContent className="px-5 py-5">
            <form id="create-client-form" onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{copy.createTitle}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{copy.createHint}</p>
              </div>
              <FieldGroup className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel htmlFor="client-name">{copy.name}</FieldLabel>
                  <Input
                    id="client-name"
                    value={name}
                    placeholder={copy.namePlaceholder}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="client-vat">{copy.vat}</FieldLabel>
                  <Input
                    id="client-vat"
                    dir="ltr"
                    value={vatNumber}
                    placeholder={copy.vatPlaceholder}
                    aria-invalid={b2bIssues.some((i) => i.field === 'vatNumber') ? true : undefined}
                    onChange={(event) => {
                      setVatNumber(event.target.value)
                      setB2bIssues((list) => list.filter((i) => i.field !== 'vatNumber'))
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="client-email">{copy.email}</FieldLabel>
                  <Input
                    id="client-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    placeholder={copy.emailPlaceholder}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="client-phone">{copy.phone}</FieldLabel>
                  <Input
                    id="client-phone"
                    dir="ltr"
                    value={phone}
                    placeholder={copy.phonePlaceholder}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </Field>
              </FieldGroup>
              {b2bIssues.some((i) => i.field === 'vatNumber') ? (
                <p className="text-sm text-destructive">
                  {copy.vat}: {lang === 'ar' ? '١٥ رقماً تبدأ وتنتهي بـ ٣' : '15 digits, starting and ending with 3'}
                </p>
              ) : null}
              <ClientB2bDetails
                lang={lang}
                values={b2b}
                issues={b2bIssues.filter((i) => CLIENT_B2B_KEYS.includes(i.field as never))}
                onChange={(key, value) => {
                  setB2b((v) => ({ ...v, [key]: value }))
                  setB2bIssues((list) => list.filter((i) => i.field !== key))
                }}
              />
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            </form>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="mt-2 h-12 w-full rounded-md" />
          <Skeleton className="mt-2 h-12 w-full rounded-md" />
        </div>
      ) : !clients?.length ? (
        <Empty className="m-5 border-border bg-background/50">
          <EmptyHeader>
            <EmptyTitle>{copy.empty}</EmptyTitle>
            <EmptyDescription>{copy.emptyHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-background/50 text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-start">{copy.name}</th>
                <th className="px-5 py-3 text-start">{copy.vat}</th>
                <th className="px-5 py-3 text-start">{copy.email}</th>
                <th className="px-5 py-3 text-start">{copy.phone}</th>
                <th className="px-5 py-3 text-start">{copy.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-background/50">
                  <td className="px-5 py-4 font-medium text-foreground">{client.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{client.vatNumber || '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{client.email || '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{client.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <ClientB2bBadge lang={lang} client={client} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WorkspaceShell>
  )
}
