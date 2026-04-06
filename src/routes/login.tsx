import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { LoginView } from '~/components/login/login-view'
import { MagicLinkSent } from '~/components/login/magic-link-sent'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
})

function LoginPage() {
  const [sentEmail, setSentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (values: { email: string }) => {
    setError(null)
    setLoading(true)

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

  return <LoginView loading={loading} error={error} onSubmit={handleLogin} />
}
