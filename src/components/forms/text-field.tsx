import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'
import { useFieldContext } from './form'

const underlineInputClass =
  'h-auto rounded-none border-0 border-b border-gray-300 px-0 py-3 text-base placeholder:text-gray-400 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-transparent aria-invalid:border-b aria-invalid:border-destructive aria-invalid:ring-0'

export function TextField({
  label,
  placeholder,
  description,
  required = false,
  type = 'text',
  className,
  transform,
}: {
  label?: string
  placeholder?: string
  description?: string
  required?: boolean
  type?: 'text' | 'email' | 'tel' | 'url'
  className?: string
  transform?: (value: string) => string
}) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      {label && (
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </FieldLabel>
      )}
      <Input
        id={field.name}
        name={field.name}
        type={type}
        placeholder={placeholder}
        value={field.state.value || ''}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const value = transform ? transform(e.target.value) : e.target.value
          field.handleChange(value)
        }}
        aria-invalid={isInvalid}
        className={cn(underlineInputClass, className)}
      />
      {description && !isInvalid && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
