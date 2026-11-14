import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { buyerStandardReadiness } from '@zatca/shared'
import type { PartyIssue, PartyProfileInput } from '@zatca/shared'
import { Badge } from '#/components/ui/badge'
import type { MarketingLang } from '#/lib/marketing/lang'
import { getPartyCopy } from '#/lib/zatca/party-copy'
import { cn } from '#/lib/utils'
import { PartyFields } from './PartyFields'
import type { PartyFormKey, PartyValues } from './PartyFields'

export const CLIENT_B2B_KEYS: PartyFormKey[] = [
  'country',
  'idScheme',
  'idValue',
  'street',
  'buildingNumber',
  'additionalNumber',
  'district',
  'city',
  'postalCode',
]

const TEXT = {
  ar: {
    toggle: 'العنوان الوطني والهوية (لفواتير الشركات)',
    hint: 'مطلوبة لإصدار فاتورة ضريبية لشركة (B2B): رقم ضريبي أو هوية أخرى، والعنوان الوطني إذا كان العميل في السعودية.',
    ready: 'جاهز لفواتير الشركات',
    missing: 'تنقصه بيانات فواتير الشركات',
  },
  en: {
    toggle: 'Saudi address and ID (for B2B invoices)',
    hint: 'Needed for a standard (B2B) tax invoice: a VAT number or another ID, and the national address if the client is in Saudi Arabia.',
    ready: 'Ready for B2B invoices',
    missing: 'B2B details missing',
  },
}

export function ClientB2bDetails({
  lang,
  values,
  onChange,
  issues,
  defaultOpen = false,
}: {
  lang: MarketingLang
  values: PartyValues
  onChange: (key: PartyFormKey, value: string) => void
  issues: PartyIssue[]
  /** Start expanded, e.g. when editing a client that already has these details. */
  defaultOpen?: boolean
}) {
  const t = TEXT[lang]
  const [open, setOpen] = useState(defaultOpen)
  const hasError = issues.some((i) => CLIENT_B2B_KEYS.includes(i.field as PartyFormKey))
  const expanded = open || hasError
  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-start text-sm font-medium text-foreground hover:text-primary"
      >
        <ChevronDownIcon className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-180')} aria-hidden />
        {t.toggle}
      </button>
      {expanded ? (
        <div className="pt-3">
          <p className="mb-4 text-xs text-muted-foreground">{t.hint}</p>
          <PartyFields
            idPrefix="client"
            keys={CLIENT_B2B_KEYS}
            values={values}
            onChange={onChange}
            issues={issues}
            copy={getPartyCopy(lang)}
            className="xl:grid-cols-3"
          />
        </div>
      ) : null}
    </div>
  )
}

export function ClientB2bBadge({ lang, client }: { lang: MarketingLang; client: PartyProfileInput }) {
  const ready = buyerStandardReadiness(client).ready
  return <Badge variant={ready ? 'secondary' : 'outline'}>{ready ? TEXT[lang].ready : TEXT[lang].missing}</Badge>
}
