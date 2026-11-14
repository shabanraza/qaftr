import type { ComponentProps, ReactNode } from 'react'
import { cn } from '#/lib/utils'

/**
 * Flat form section: a heading, an optional hint and the fields, separated
 * from the next section by a divider instead of being boxed in a card.
 */
export function FormSection({
  title,
  description,
  children,
  className,
  ...rest
}: { title: ReactNode; description?: ReactNode; children: ReactNode } & Omit<ComponentProps<'section'>, 'title'>) {
  return (
    <section
      className={cn('flex flex-col gap-4 border-b border-border py-6 first:pt-0 last:border-b-0 last:pb-0', className)}
      {...rest}
    >
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
