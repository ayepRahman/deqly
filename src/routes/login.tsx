'use client'

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { LoginView } from '~/components/login/login-view'
import { MagicLinkSent } from '~/components/login/magic-link-sent'
import { SignUpView } from '~/components/login/sign-up-view'
import { authClient } from '~/lib/auth-client'
import type { SignUpValues } from '~/lib/validations'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
})

type FormMode = 'login' | 'signup'

function LoginPage() {
  const [mode, setMode] = useState<FormMode>('login')
  const [sentEmail, setSentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMagicLink = async (email: string) => {
    setError(null)
    setLoading(true)

    try {
      await authClient.signIn.magicLink(
        { email },
        {
          onSuccess: () => {
            setSentEmail(email)
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

  const handleLogin = (values: { email: string }) => {
    sendMagicLink(values.email)
  }

  const handleSignUp = (values: SignUpValues) => {
    localStorage.setItem(
      'deqly_signup_profile',
      JSON.stringify({
        name: values.name,
        username: values.username,
        occupation: values.occupation,
        mobileNumber: values.mobileNumber,
        websiteLink: values.websiteLink,
        addMobileToCard: values.addMobileToCard,
        addWebsiteToCard: values.addWebsiteToCard,
      }),
    )
    sendMagicLink(values.email)
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

  if (mode === 'signup') {
    return (
      <SignUpView
        loading={loading}
        error={error}
        onSubmit={handleSignUp}
        onSwitchMode={() => {
          setMode('login')
          setError(null)
        }}
      />
    )
  }

  return (
    <LoginView
      loading={loading}
      error={error}
      onSubmit={handleLogin}
      onSwitchToSignUp={() => {
        setMode('signup')
        setError(null)
      }}
    />
  )
}
