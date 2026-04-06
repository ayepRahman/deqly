import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { useState } from 'react'
import { useAppForm } from '~/components/forms/form'
import { PageFooter } from '~/components/login/page-footer'
import { Button } from '~/components/ui/button'
import { type OnboardingValues, onboardingSchema } from '~/lib/validations'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: OnboardingPage,
})

const usernameTransform = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_]/g, '')

function OnboardingPage() {
  const navigate = useNavigate()
  const currentUser = useQuery(api.auth.getCurrentUser)
  const updateProfile = useMutation(api.users.updateProfile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If user already has a username, redirect to home
  if (currentUser?.username) {
    navigate({ to: '/' })
    return null
  }

  const handleSubmit = async (values: OnboardingValues) => {
    setError(null)
    setLoading(true)
    try {
      await updateProfile({
        name: values.name,
        username: values.username,
        occupation: values.occupation || undefined,
        mobileNumber: values.mobileNumber || undefined,
        websiteLink: values.websiteLink || undefined,
        addMobileToCard: values.addMobileToCard,
        addWebsiteToCard: values.addWebsiteToCard,
      })
      navigate({ to: '/' })
    } catch (err) {
      if (err instanceof ConvexError) {
        setError(err.data as string)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
    }
  }

  if (currentUser === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-neutral-400">Loading...</p>
      </div>
    )
  }

  return <OnboardingForm loading={loading} error={error} onSubmit={handleSubmit} />
}

interface OnboardingFormProps {
  loading: boolean
  error: string | null
  onSubmit: (values: OnboardingValues) => void
}

function OnboardingForm({ loading, error, onSubmit }: OnboardingFormProps) {
  const form = useAppForm({
    defaultValues: {
      name: '',
      username: '',
      occupation: '',
      mobileNumber: '',
      addMobileToCard: false,
      websiteLink: '',
      addWebsiteToCard: false,
    } as OnboardingValues,
    validators: {
      onSubmit: onboardingSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="flex-1 px-8 pt-12 pb-8 max-w-lg mx-auto w-full">
        <img src="/logo.svg" alt="Deqly" className="h-8 mb-8" />

        <h1 className="text-[32px] font-bold text-black leading-tight mb-2">
          Complete Your Profile
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
              {(field) => <field.TextField placeholder="Occupation" />}
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
                  disabled={loading || !canSubmit}
                  className="px-12 h-12 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:bg-gray-300 disabled:text-gray-400 disabled:opacity-100 disabled:shadow-none shadow-lg shadow-violet-200"
                >
                  {loading ? 'Saving...' : 'Get Started'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>

      <PageFooter />
    </div>
  )
}
