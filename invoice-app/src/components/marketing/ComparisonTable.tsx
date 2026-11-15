import { Check, Minus, X } from 'lucide-react'
import { getComparison } from '#/lib/marketing/comparison'
import type { ComparisonMark } from '#/lib/marketing/comparison'
import type { MarketingLang } from '#/lib/marketing/lang'
import { cn } from '#/lib/utils'

const markIcon: Record<ComparisonMark, typeof Check> = { yes: Check, no: X, partial: Minus }
const markClass: Record<ComparisonMark, string> = {
  yes: 'bg-primary/10 text-primary',
  partial: 'bg-[var(--qaftr-gold)]/15 text-[var(--qaftr-gold-ink)]',
  no: 'bg-muted text-muted-foreground',
}

/** Qaftr vs accounting suites vs free templates. Qaftr column is highlighted. */
export function ComparisonTable({ lang, showHeading = true }: { lang: MarketingLang; showHeading?: boolean }) {
  const c = getComparison(lang)
  return (
    <div>
      {showHeading ? (
        <div className="mb-8 max-w-2xl">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground md:text-3xl">
            {c.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{c.subtitle}</p>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">{c.title}</caption>
          <thead>
            <tr className="border-b border-border">
              <td className="w-[28%] px-4 py-4" />
              {c.columns.map((col, i) => (
                <th
                  key={col}
                  scope="col"
                  className={cn(
                    'px-4 py-4 text-start font-semibold',
                    i === 0 ? 'bg-primary text-primary-foreground' : 'text-foreground',
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <th scope="row" className="px-4 py-3 text-start font-medium text-foreground">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => {
                  const Icon = markIcon[cell.mark]
                  return (
                    <td key={i} className={cn('px-4 py-3 align-top', i === 0 && 'bg-primary/[0.04]')}>
                      <span className="flex items-start gap-2">
                        <span
                          className={cn('mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full', markClass[cell.mark])}
                        >
                          <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
                          <span className="sr-only">{c.legend[cell.mark]}</span>
                        </span>
                        <span className={i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{cell.text}</span>
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{c.footnote}</p>
    </div>
  )
}
