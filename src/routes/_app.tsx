import { useQuery } from 'convex/react'
import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { PageLoader } from '~/components/ui/page-loader'
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
    return <PageLoader />
  }

  // User exists but hasn't completed onboarding
  if (currentUser && !currentUser.username) {
    navigate({ to: '/onboarding' })
    return null
  }

  return <Outlet />
}
