import type * as React from 'react'
import { cn } from '~/lib/utils'

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal'
}

function Field({ className, orientation = 'vertical', ...props }: FieldProps) {
  return (
    <div
      data-slot="field"
      className={cn(
        'group/field flex gap-2',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        className,
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: compound component, htmlFor set by consumer
    <label
      data-slot="field-label"
      className={cn('block text-sm font-medium', className)}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

function FieldError({
  errors,
  className,
}: {
  errors: ReadonlyArray<{ message?: string } | string | undefined>
  className?: string
}) {
  const messages = errors
    .map((e) => {
      if (typeof e === 'string') return e
      return e?.message
    })
    .filter(Boolean)

  if (messages.length === 0) return null

  return (
    <p
      data-slot="field-error"
      className={cn('text-xs text-destructive', className)}
    >
      {messages.join(', ')}
    </p>
  )
}

function FieldContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field-content"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  )
}

export { Field, FieldContent, FieldDescription, FieldError, FieldLabel }
