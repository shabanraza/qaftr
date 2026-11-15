import { Link } from '@tanstack/react-router'
import { Briefcase, Building2 } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { getSeatCopy } from '#/lib/accountant/copy'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { formatSaDate, toArabicIndic } from '#/lib/sa/format'

export type FirmClient = {
  membershipId: string
  businessId: string
  nameAr: string
  nameEn: string | null
  vatNumber: string | null
  since: Date | null
  invoiceCount: number
  lastIssued: string | Date | null
  phase2: 'none' | 'started' | 'active'
}

type Props = {
  lang: MarketingLang
  isLoading: boolean
  clients: FirmClient[]
  onLeave: (membershipId: string) => void
}

/** Accountant: every business that gave read-only access. */
export function FirmClientsList({ lang, isLoading, clients, onLeave }: Props) {
  const c = getSeatCopy(lang).firm
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const digits = (n: string | number) => (lang === 'ar' ? toArabicIndic(String(n)) : String(n))

  if (isLoading) {
    return (
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div dir={langDir(lang)} lang={lang} className="max-w-3xl p-5">
        <Card className="border-border/60 p-8 text-center shadow-none">
          <CardHeader className="flex flex-col items-center">
            <Briefcase className="mb-3 size-10 text-muted-foreground" aria-hidden />
            <CardTitle className="text-sm font-semibold">{c.emptyTitle}</CardTitle>
            <CardDescription>{c.emptyBody}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <ul dir={langDir(lang)} lang={lang} className="grid gap-4 p-5 sm:grid-cols-2">
      {clients.map((client) => {
        const name = (lang === 'ar' ? client.nameAr : client.nameEn || client.nameAr) || client.nameAr
        return (
          <li key={client.membershipId}>
            <Card className="h-full border-border/60 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <Link
                    to="/workspace/firm/$businessId"
                    params={{ businessId: client.businessId }}
                    search={search}
                    className="flex items-center gap-2 text-primary no-underline hover:underline"
                  >
                    <Building2 className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{name}</span>
                  </Link>
                </CardTitle>
                {client.vatNumber ? (
                  <CardDescription>
                    {c.vat}: <span dir="ltr" className="tabular-nums">{client.vatNumber}</span>
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <dl className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">{c.invoices}</dt>
                    <dd className="font-semibold tabular-nums">{digits(client.invoiceCount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{c.lastIssued}</dt>
                    <dd className="font-semibold">
                      {client.lastIssued
                        ? formatSaDate(
                            typeof client.lastIssued === 'string' ? client.lastIssued.slice(0, 10) : client.lastIssued.toISOString().slice(0, 10),
                            lang,
                          )
                        : c.never}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={client.phase2 === 'none' ? 'outline' : 'secondary'}>{c.phase2[client.phase2]}</Badge>
                  <Button type="button" size="xs" variant="ghost" onClick={() => onLeave(client.membershipId)}>
                    {c.stop}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
