import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Field, FieldDescription, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'

/**
 * Form and preview building blocks shared by the invoice and document
 * generators (UAE tax invoice, Saudi receipt voucher / quotation / credit note).
 */
const PREVIEW_WIDTH = 794

export function RadioCards<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  dir,
}: {
  name: string
  legend: string
  options: ReadonlyArray<readonly [T, string]>
  value: T
  onChange: (value: T) => void
  /** Page direction, so arrow keys move the way the cards are laid out. */
  dir?: 'ltr' | 'rtl'
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col">
      <span id={`${id}-legend`} className="mb-2 text-sm font-medium text-foreground">
        {legend}
      </span>
      <RadioGroup
        name={name}
        aria-labelledby={`${id}-legend`}
        dir={dir}
        value={value}
        onValueChange={(next) => onChange(next as T)}
        className="grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2"
      >
        {options.map(([optionValue, label]) => (
          <Label
            key={optionValue}
            htmlFor={`${id}-${optionValue}`}
            className="flex h-full min-w-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-3 py-2.5 text-center text-sm font-medium leading-normal transition-colors hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
          >
            <RadioGroupItem id={`${id}-${optionValue}`} value={optionValue} className="sr-only" />
            {label}
          </Label>
        ))}
      </RadioGroup>
    </div>
  )
}

export function Section({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-1 font-[family-name:var(--font-qaftr-display)] text-base font-semibold text-foreground">
        {legend}
      </legend>
      {hint ? <p className="-mt-2 text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </fieldset>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  ltr,
  type = 'text',
  multiline,
  inputMode,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  ltr?: boolean
  type?: string
  multiline?: boolean
  inputMode?: 'decimal' | 'numeric'
}) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <Field className="min-w-0 gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={2}
          maxLength={500}
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          dir={ltr ? 'ltr' : undefined}
          inputMode={inputMode}
          autoComplete="off"
          maxLength={type === 'date' ? undefined : 200}
          aria-describedby={hintId}
          className={cn(ltr && 'tabular-nums', ltr && 'rtl:text-end')}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? <FieldDescription id={hintId}>{hint}</FieldDescription> : null}
    </Field>
  )
}

/** Renders the invoice HTML at A4 width and scales it down to fit the column. */
export function InvoicePreview({ html, title, heading }: { html: string; title: string; heading: string }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(700)

  useEffect(() => {
    const box = boxRef.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / PREVIEW_WIDTH))
    })
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  const measure = () => {
    const doc = frameRef.current?.contentDocument
    // body height is the content height (documentElement grows with the frame)
    if (doc?.body) setHeight(Math.ceil(doc.body.getBoundingClientRect().height) + 2)
  }

  return (
    <section aria-label={heading} className="min-w-0">
      <h2 className="mb-3 font-[family-name:var(--font-qaftr-display)] text-lg font-semibold">{heading}</h2>
      <div
        ref={boxRef}
        className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm"
        style={{ height: Math.ceil(height * scale) }}
      >
        <iframe
          ref={frameRef}
          title={title}
          srcDoc={html}
          onLoad={measure}
          sandbox="allow-same-origin"
          tabIndex={-1}
          className="origin-top-left border-0 rtl:origin-top-right"
          style={{ width: PREVIEW_WIDTH, height, transform: `scale(${scale})` }}
        />
      </div>
    </section>
  )
}
