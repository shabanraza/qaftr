import type { PartyIssue } from '@zatca/shared'
import { BUYER_OTHER_ID_SCHEMES } from '@zatca/shared'
import { Field, FieldDescription, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import type { PartyCopy } from '#/lib/zatca/party-copy'
import { cn } from '#/lib/utils'

export type PartyFormKey = keyof PartyCopy['fields']
export type PartyValues = Partial<Record<PartyFormKey, string>>

/** Fields typed as Latin digits/codes: always left-to-right. */
const LTR = new Set<PartyFormKey>(['vatNumber', 'crNumber', 'buildingNumber', 'additionalNumber', 'postalCode', 'country', 'idValue', 'nameEn'])
const NUMERIC = new Set<PartyFormKey>(['vatNumber', 'crNumber', 'buildingNumber', 'additionalNumber', 'postalCode'])

export function issueFor(issues: PartyIssue[], key: PartyFormKey): PartyIssue | undefined {
  return issues.find((i) => i.field === key || (key === 'nameAr' && i.field === 'name'))
}

/** A grid of labelled inputs for seller or buyer profile fields. */
export function PartyFields({
  idPrefix,
  keys,
  values,
  onChange,
  issues,
  copy,
  className,
}: {
  idPrefix: string
  keys: PartyFormKey[]
  values: PartyValues
  onChange: (key: PartyFormKey, value: string) => void
  issues: PartyIssue[]
  copy: PartyCopy
  className?: string
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {keys.map((key) => {
        const f = copy.fields[key]
        const id = `${idPrefix}-${key}`
        const issue = issueFor(issues, key)
        const hintId = `${id}-hint`
        if (key === 'idScheme') {
          return (
            <Field key={key} data-invalid={issue ? true : undefined}>
              <FieldLabel htmlFor={id}>{f.label}</FieldLabel>
              <select
                id={id}
                value={values[key] ?? ''}
                aria-invalid={issue ? true : undefined}
                aria-describedby={f.hint ? hintId : undefined}
                onChange={(e) => onChange(key, e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              >
                <option value="">—</option>
                {BUYER_OTHER_ID_SCHEMES.map((scheme) => (
                  <option key={scheme} value={scheme}>
                    {copy.idSchemes[scheme] ?? scheme}
                  </option>
                ))}
              </select>
              {issue ? <FieldError>{copy.issues[issue.code]}</FieldError> : f.hint ? <FieldDescription id={hintId}>{f.hint}</FieldDescription> : null}
            </Field>
          )
        }
        return (
          <Field key={key} data-invalid={issue ? true : undefined}>
            <FieldLabel htmlFor={id}>{f.label}</FieldLabel>
            <Input
              id={id}
              dir={LTR.has(key) ? 'ltr' : undefined}
              inputMode={NUMERIC.has(key) ? 'numeric' : undefined}
              autoComplete="off"
              value={values[key] ?? ''}
              placeholder={f.placeholder}
              aria-invalid={issue ? true : undefined}
              aria-describedby={f.hint ? hintId : undefined}
              onChange={(e) => onChange(key, e.target.value)}
            />
            {issue ? <FieldError>{copy.issues[issue.code]}</FieldError> : f.hint ? <FieldDescription id={hintId}>{f.hint}</FieldDescription> : null}
          </Field>
        )
      })}
    </div>
  )
}
