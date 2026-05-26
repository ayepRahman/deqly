import { useAppForm } from '~/components/forms/form'
import { Button } from '~/components/ui/button'
import { loginSchema } from '~/lib/validations'
import { PageFooter } from './page-footer'

interface LoginViewProps {
  loading: boolean
  error: string | null
  onSubmit: (values: { email: string }) => void
}

export function LoginView({ loading, error, onSubmit }: LoginViewProps) {
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <div className="relative isolate min-h-dvh bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center px-8 pt-16">
        <p className="text-base font-medium text-black mb-2">Welcome to</p>
        <img src="/logo.svg" alt="Deqly" className="h-12 mb-6" />

        <img
          src="/banner.png"
          alt="Deqly cards collage"
          className="w-72 mb-10 object-contain"
        />

        <h2 className="text-[28px] font-bold text-black mb-1.5 text-center leading-tight">
          Create a deck now!
        </h2>
        <p className="text-gray-400 text-sm mb-10 text-center">
          There is too much you in one card!
        </p>

        {error && (
          <div className="w-full max-w-sm mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="w-full max-w-xs flex flex-col items-center"
        >
          <div className="w-full">
            <form.AppField name="email">
              {(field) => (
                <field.TextField type="email" placeholder="Enter your email" />
              )}
            </form.AppField>
          </div>

          <Button
            type="submit"
            variant="violet"
            disabled={loading}
            className="mt-8 mb-8 px-8 h-12 rounded-full text-sm font-semibold disabled:opacity-50 shadow-lg shadow-violet-200"
          >
            {loading ? 'Sending...' : 'Send Me A Magic Link!'}
          </Button>
        </form>
      </div>

      <PageFooter />
    </div>
  )
}
