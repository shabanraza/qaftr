import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { PencilIcon } from 'lucide-react'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { Button } from '#/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '#/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { checkBuyerFormat, normalizePartyInput } from '@zatca/shared'
import type { PartyIssue } from '@zatca/shared'
import { ClientB2bBadge, ClientB2bDetails, CLIENT_B2B_KEYS } from '#/components/workspace/ClientB2bDetails'
import { parseProfileError } from '#/lib/zatca/party-input'
import { buildClientPayload, clientToForm, emptyClientForm } from '#/lib/workspace/client-form'
import type { ClientForm } from '#/lib/workspace/client-form'

const clientsSearchSchema = marketingSearchSchema.extend({
  /** Open this client in the edit form. */
  edit: z.string().optional(),
  /** Where to go back to after saving, with the client picked. */
  from: z.enum(['new-invoice']).optional(),
})

export const Route = createFileRoute('/workspace/clients')({
  validateSearch: clientsSearchSchema,
  loader: async ({ context }) => {
    if (typeof window === 'undefined') return

    void context.queryClient.prefetchQuery(context.trpc.clients.list.queryOptions())
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

const COPY = {
  ar: {
    title: 'العملاء',
    subtitle: 'احفظ بيانات عملائك لاستخدامها في الفواتير وعروض الأسعار.',
    name: 'الاسم',
    vat: 'الرقم الضريبي',
    email: 'البريد',
    phone: 'الجوال',
    status: 'فواتير الشركات',
    create: 'إضافة عميل',
    createTitle: 'إضافة عميل جديد',
    createHint: 'احفظ بيانات العميل لاستخدامها في الفواتير وعروض الأسعار.',
    editTitle: 'تعديل العميل',
    editHint: 'التعديلات تظهر في الفواتير الجديدة فقط؛ الفواتير الصادرة لا تتغير.',
    saveChanges: 'حفظ التعديلات',
    cancel: 'إلغاء',
    edit: 'تعديل',
    saved: 'تم حفظ العميل.',
    namePlaceholder: 'اسم العميل أو الشركة',
    vatPlaceholder: '300000000000003',
    emailPlaceholder: 'client@example.com',
    phonePlaceholder: '+966 5x xxx xxxx',
    requiredName: 'أدخل اسم العميل.',
    invalidEmail: 'أدخل بريداً صحيحاً أو اتركه فارغاً.',
    vatRule: '١٥ رقماً تبدأ وتنتهي بـ ٣',
    checkFields: 'راجع الحقول المحددة.',
    saveFailed: 'تعذر حفظ العميل.',
    saving: 'جاري الحفظ...',
    empty: 'لا يوجد عملاء محفوظون بعد.',
    emptyHint: 'أضف أول عميل لإعادة استخدام بياناته عند إنشاء الفواتير.',
  },
  en: {
    title: 'Clients',
    subtitle: 'Save your clients once and reuse them on invoices and quotes.',
    name: 'Name',
    vat: 'VAT number',
    email: 'Email',
    phone: 'Phone',
    status: 'B2B invoices',
    create: 'Add client',
    createTitle: 'Add a new client',
    createHint: 'Save client details for invoices and quotes.',
    editTitle: 'Edit client',
    editHint: 'Changes apply to new invoices only; issued invoices stay as they are.',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    edit: 'Edit',
    saved: 'Client saved.',
    namePlaceholder: 'Client or company name',
    vatPlaceholder: '300000000000003',
    emailPlaceholder: 'client@example.com',
    phonePlaceholder: '+966 5x xxx xxxx',
    requiredName: 'Enter a client name.',
    invalidEmail: 'Enter a valid email or leave it blank.',
    vatRule: '15 digits, starting and ending with 3',
    checkFields: 'Check the highlighted fields.',
    saveFailed: 'Could not save the client.',
    saving: 'Saving...',
    empty: 'No saved clients yet.',
    emptyHint: 'Add your first client to reuse their details when creating invoices.',
  },
}

function WorkspaceClientsPage() {
  const search = Route.useSearch()
  const lang = resolveLang({ lang: search.lang })
  const langSearch = lang === 'en' ? { lang: 'en' as const } : {}
  const copy = COPY[lang]
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: clients, isLoading } = useQuery(trpc.clients.list.queryOptions())
  const createClientMutation = useMutation(trpc.clients.create.mutationOptions())
  const updateClientMutation = useMutation(trpc.clients.update.mutationOptions())

  const [form, setForm] = useState<ClientForm>(emptyClientForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [issues, setIssues] = useState<PartyIssue[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const appliedEditParam = useRef(false)

  const saving = createClientMutation.isPending || updateClientMutation.isPending
  const editing = editingId ? clients?.find((c) => c.id === editingId) : undefined

  function startEdit(id: string) {
    const client = clients?.find((c) => c.id === id)
    if (!client) return
    setEditingId(id)
    setForm(clientToForm(client))
    setIssues([])
    setFormError(null)
    setNotice(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector<HTMLInputElement>('#client-name')?.focus({ preventScroll: true })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyClientForm())
    setIssues([])
    setFormError(null)
  }

  // Deep link from the invoice editor: /workspace/clients?edit=<id>
  useEffect(() => {
    if (appliedEditParam.current || !search.edit || !clients) return
    appliedEditParam.current = true
    startEdit(search.edit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.edit, clients])

  function setField<K extends keyof ClientForm>(key: K, value: ClientForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setNotice(null)

    if (!form.name.trim()) {
      setFormError(copy.requiredName)
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError(copy.invalidEmail)
      return
    }

    const found = checkBuyerFormat(normalizePartyInput({ ...form.b2b, vatNumber: form.vatNumber }))
    setIssues(found)
    if (found.length) {
      setFormError(copy.checkFields)
      return
    }

    try {
      let savedId: string
      if (editingId) {
        const updated = await updateClientMutation.mutateAsync({ id: editingId, data: buildClientPayload(form, 'update') })
        savedId = updated.id
      } else {
        const created = await createClientMutation.mutateAsync(buildClientPayload(form, 'create') as { name: string })
        savedId = created.id
      }
      await queryClient.invalidateQueries(trpc.clients.list.queryFilter())
      if (search.from === 'new-invoice') {
        await navigate({ to: '/workspace/new-invoice', search: { ...langSearch, client: savedId } })
        return
      }
      resetForm()
      setNotice(copy.saved)
    } catch (error) {
      const serverIssues = parseProfileError(error instanceof Error ? error.message : undefined)
      setIssues(serverIssues)
      setFormError(serverIssues.length ? copy.checkFields : copy.saveFailed)
    }
  }

  const vatInvalid = issues.some((i) => i.field === 'vatNumber')

  return (
    <WorkspaceShell
      lang={lang}
      active="clients"
      title={copy.title}
      subtitle={copy.subtitle}
      actions={
        editingId ? null : (
          <Button type="submit" form="client-form" size="sm" className="qaftr-btn-primary" disabled={saving}>
            {saving ? copy.saving : copy.create}
          </Button>
        )
      }
    >
      <form
        id="client-form"
        ref={formRef}
        onSubmit={handleSubmit}
        className="scroll-mt-20 border-b border-border px-5 py-6"
      >
        <div className="flex max-w-4xl flex-col gap-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {editing ? `${copy.editTitle}: ${editing.name}` : copy.createTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{editing ? copy.editHint : copy.createHint}</p>
          </div>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="client-name">{copy.name}</FieldLabel>
              <Input
                id="client-name"
                value={form.name}
                placeholder={copy.namePlaceholder}
                onChange={(e) => setField('name', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-vat">{copy.vat}</FieldLabel>
              <Input
                id="client-vat"
                dir="ltr"
                value={form.vatNumber}
                placeholder={copy.vatPlaceholder}
                aria-invalid={vatInvalid ? true : undefined}
                onChange={(e) => {
                  setField('vatNumber', e.target.value)
                  setIssues((list) => list.filter((i) => i.field !== 'vatNumber'))
                }}
              />
              {vatInvalid ? <p className="text-sm text-destructive">{copy.vatRule}</p> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="client-email">{copy.email}</FieldLabel>
              <Input
                id="client-email"
                type="email"
                dir="ltr"
                value={form.email}
                placeholder={copy.emailPlaceholder}
                onChange={(e) => setField('email', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="client-phone">{copy.phone}</FieldLabel>
              <Input
                id="client-phone"
                dir="ltr"
                value={form.phone}
                placeholder={copy.phonePlaceholder}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </Field>
          </FieldGroup>
          <ClientB2bDetails
            key={editingId ?? 'new'}
            lang={lang}
            values={form.b2b}
            defaultOpen={Boolean(editingId)}
            issues={issues.filter((i) => CLIENT_B2B_KEYS.includes(i.field as never))}
            onChange={(key, value) => {
              setForm((f) => ({ ...f, b2b: { ...f.b2b, [key]: value } }))
              setIssues((list) => list.filter((i) => i.field !== key))
            }}
          />
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          {notice ? <p className="text-sm text-primary" role="status">{notice}</p> : null}
          {editingId ? (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" className="qaftr-btn-primary" disabled={saving}>
                {saving ? copy.saving : copy.saveChanges}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={resetForm} disabled={saving}>
                {copy.cancel}
              </Button>
            </div>
          ) : null}
        </div>
      </form>

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
            <thead className="border-b border-border text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-start">{copy.name}</th>
                <th className="px-5 py-3 text-start">{copy.vat}</th>
                <th className="px-5 py-3 text-start">{copy.email}</th>
                <th className="px-5 py-3 text-start">{copy.phone}</th>
                <th className="px-5 py-3 text-start">{copy.status}</th>
                <th className="px-5 py-3">
                  <span className="sr-only">{copy.edit}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className={client.id === editingId ? 'bg-primary/5' : 'hover:bg-background/50'}
                >
                  <td className="px-5 py-3 font-medium text-foreground">{client.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <span dir="ltr">{client.vatNumber || '—'}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{client.email || '—'}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <span dir="ltr">{client.phone || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <ClientB2bBadge lang={lang} client={client} />
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(client.id)}
                      aria-label={`${copy.edit} ${client.name}`}
                    >
                      <PencilIcon className="size-3.5" aria-hidden />
                      {copy.edit}
                    </Button>
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
