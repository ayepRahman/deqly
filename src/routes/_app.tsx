import { useQuery } from 'convex/react'
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const navigate = useNavigate()

  // Still loading user data
  if (currentUser === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-neutral-400">Loading...</p>
      </div>
    )
  }

  // User exists but hasn't completed onboarding
  if (currentUser && !currentUser.username) {
    navigate({ to: '/onboarding' })
    return null
  }

  return <Outlet />
}
