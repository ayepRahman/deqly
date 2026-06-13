import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { LoginView } from '~/components/login/login-view'
import { MagicLinkSent } from '~/components/login/magic-link-sent'
import { authClient } from '~/lib/auth-client'

const loginSearchSchema = z.object({
  error: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    // A reused/expired magic link redirects here with ?error=... even when a
    // session already exists from the link's first use. Let that message
    // render instead of bouncing the user into the app (and on to onboarding).
    if (context.isAuthenticated && !search.error) {
      throw redirect({ to: '/' })
    }
  },
})

function LoginPage() {
  const { error: verifyError } = Route.useSearch()
  const navigate = useNavigate()
  const [sentEmail, setSentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyErrorMessage = verifyError
    ? 'This sign-in link has expired or was already used. Please request a new one.'
    : null

  const handleLogin = async (values: { email: string }) => {
    setError(null)
    setLoading(true)
    if (verifyError) {
      navigate({ to: '/login', search: {}, replace: true })
    }

    try {
      await authClient.signIn.magicLink(
        { email: values.email },
        {
          onSuccess: () => {
            setSentEmail(values.email)
            setLoading(false)
          },
          onError: (errorCtx: { error: { message: string } }) => {
            setError(errorCtx.error.message)
            setLoading(false)
          },
        },
      )
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (sentEmail) {
    return (
      <MagicLinkSent
        email={sentEmail}
        onReset={() => {
          setSentEmail('')
          setLoading(false)
        }}
      />
    )
  }

  return (
    <LoginView
      loading={loading}
      error={error ?? verifyErrorMessage}
      onSubmit={handleLogin}
    />
  )
}
