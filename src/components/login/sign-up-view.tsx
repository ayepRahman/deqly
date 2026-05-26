import { useAppForm } from '~/components/forms/form'
import { Button } from '~/components/ui/button'
import { type SignUpValues, signUpSchema } from '~/lib/validations'
import { PageFooter } from './page-footer'

interface SignUpViewProps {
  loading: boolean
  error: string | null
  onSubmit: (values: SignUpValues) => void
  onSwitchMode: () => void
}

const usernameTransform = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_]/g, '')

export function SignUpView({
  loading,
  error,
  onSubmit,
  onSwitchMode,
}: SignUpViewProps) {
  const form = useAppForm({
    defaultValues: {
      name: '',
      username: '',
      occupation: '',
      email: '',
      mobileNumber: '',
      addMobileToCard: false,
      websiteLink: '',
      addWebsiteToCard: false,
    } as SignUpValues,
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <div className="relative isolate min-h-dvh bg-white flex flex-col">
      <div className="flex-1 px-8 pt-12 pb-8 max-w-lg mx-auto w-full">
        <img src="/logo.svg" alt="Deqly" className="h-8 mb-8" />

        <h1 className="text-[32px] font-bold text-black leading-tight mb-2">
          Sign Up
        </h1>
        <p className="text-gray-500 text-[15px] leading-relaxed mb-10">
          Add your details here. Everything you add
          <br />
          here comes to life on your card!
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-col"
        >
          <div className="flex flex-col gap-6">
            <form.AppField name="name">
              {(field) => <field.TextField placeholder="Your Name" required />}
            </form.AppField>

            <form.AppField name="username">
              {(field) => (
                <field.TextField
                  placeholder="Username"
                  required
                  description="Unique handle for your profile (e.g. john_doe)"
                  transform={usernameTransform}
                />
              )}
            </form.AppField>

            <form.AppField name="occupation">
              {(field) => <field.TextField placeholder="Subtitle" />}
            </form.AppField>

            <form.AppField name="email">
              {(field) => (
                <field.TextField type="email" placeholder="Email" required />
              )}
            </form.AppField>
          </div>

          {/* Personal Details */}
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold text-black">
                Personal Details
              </h2>
              <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">
                <span className="text-gray-400 text-xs font-serif">i</span>
              </div>
            </div>

            {/* Mobile Number */}
            <div className="mb-2">
              <form.AppField name="mobileNumber">
                {(field) => (
                  <field.TextField
                    type="tel"
                    placeholder="Mobile Number ( optional )"
                  />
                )}
              </form.AppField>
              <div className="flex justify-end mt-2">
                <form.AppField name="addMobileToCard">
                  {(field) => <field.CheckboxField label="Add to Card" />}
                </form.AppField>
              </div>
            </div>

            {/* External Link */}
            <div className="mb-2">
              <form.AppField name="websiteLink">
                {(field) => (
                  <field.TextField placeholder="External Link ( optional )" />
                )}
              </form.AppField>
              <div className="flex justify-end mt-2">
                <form.AppField name="addWebsiteToCard">
                  {(field) => <field.CheckboxField label="Add to Card" />}
                </form.AppField>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-10 flex justify-center">
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button
                  type="submit"
                  variant="violet"
                  disabled={loading || !canSubmit}
                  className="px-12 h-12 rounded-full text-sm font-semibold disabled:bg-gray-300 disabled:text-gray-400 disabled:opacity-100 disabled:shadow-none shadow-lg shadow-violet-200"
                >
                  {loading ? 'Sending...' : 'Create Cards'}
                </Button>
              )}
            </form.Subscribe>
          </div>

          {/* Switch to login */}
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="link"
              onClick={onSwitchMode}
              className="text-sm text-gray-400"
            >
              Already have an account?{' '}
              <span className="underline">Sign in</span>
            </Button>
          </div>
        </form>
      </div>

      <PageFooter />
    </div>
  )
}
