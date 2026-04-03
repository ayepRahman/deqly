import { Checkbox } from '~/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '~/components/ui/field'
import { useFieldContext } from './form'

export function CheckboxField({
  label,
  required = false,
}: {
  label: string
  required?: boolean
}) {
  const field = useFieldContext<boolean>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <Checkbox
        id={field.name}
        checked={field.state.value || false}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        aria-invalid={isInvalid}
      />
      <FieldContent>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </FieldLabel>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldContent>
    </Field>
  )
}
