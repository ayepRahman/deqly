import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { PageFooter } from '~/components/login/page-footer'
import { Button } from '~/components/ui/button'

const verifySearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/auth/verify')({
  validateSearch: verifySearchSchema,
  component: VerifyPage,
})

function VerifyPage() {
  const { token } = Route.useSearch()
  const { isAuthenticated } = Route.useRouteContext()
  const [verifying, setVerifying] = useState(false)

  // A session already exists — this link was almost certainly used once
  // already. Don't auto-redirect (that silently lands un-onboarded users on
  // the onboarding page); tell them, and let them continue on their own.
  if (isAuthenticated) {
    return (
      <div className="relative isolate min-h-dvh bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <h2 className="text-2xl font-bold mb-3 text-center">
            This sign-in link was already used
          </h2>
          <p className="text-gray-400 text-sm text-center leading-relaxed max-w-xs">
            You're already signed in to Deqly. Magic links can only be used
            once.
          </p>
          <Button
            variant="violet"
            nativeButton={false}
            className="mt-8 px-8 h-12 rounded-full text-sm font-semibold shadow-lg shadow-violet-200"
            render={<Link to="/" />}
          >
            Continue to Deqly
          </Button>
        </div>
        <PageFooter />
      </div>
    )
  }

  const handleVerify = () => {
    if (!token || verifying) {
      return
    }
    setVerifying(true)
    const params = new URLSearchParams({
      token,
      callbackURL: '/',
      errorCallbackURL: '/login',
    })
    // Full-page navigation so the browser follows better-auth's redirect
    // chain and the session cookie is picked up by the SSR beforeLoad.
    window.location.href = `/api/auth/magic-link/verify?${params.toString()}`
  }

  if (!token) {
    return (
      <div className="relative isolate min-h-dvh bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <h2 className="text-2xl font-bold mb-3 text-center">
            This sign-in link is invalid
          </h2>
          <p className="text-gray-400 text-sm text-center leading-relaxed max-w-xs">
            The link is missing its sign-in code. Please request a new magic
            link.
          </p>
          <Button
            variant="link"
            className="mt-8 text-sm text-gray-400"
            nativeButton={false}
            render={<Link to="/login" />}
          >
            Back to login
          </Button>
        </div>
        <PageFooter />
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-dvh bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <h2 className="text-2xl font-bold mb-3 text-center">
          Confirm your sign-in
        </h2>
        <p className="text-gray-400 text-sm text-center leading-relaxed max-w-xs">
          Click the button below to finish signing in to Deqly.
        </p>
        <Button
          variant="violet"
          isLoading={verifying}
          onClick={handleVerify}
          className="mt-8 px-8 h-12 rounded-full text-sm font-semibold shadow-lg shadow-violet-200"
        >
          Continue to sign in
        </Button>
      </div>
      <PageFooter />
    </div>
  )
}
