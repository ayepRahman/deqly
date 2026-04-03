import { useMutation } from 'convex/react'
import { useEffect } from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
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
  return (
    <>
      <ProfileSetup />
      <Outlet />
    </>
  )
}

function ProfileSetup() {
  const updateProfile = useMutation(api.users.updateProfile)

  useEffect(() => {
    const raw = localStorage.getItem('deqly_signup_profile')
    if (!raw) return

    let profile: {
      name?: string
      username?: string
      occupation?: string
      mobileNumber?: string
      websiteLink?: string
    }

    try {
      profile = JSON.parse(raw)
    } catch {
      localStorage.removeItem('deqly_signup_profile')
      return
    }

    if (!profile.username) {
      localStorage.removeItem('deqly_signup_profile')
      return
    }

    localStorage.removeItem('deqly_signup_profile')

    updateProfile({
      name: profile.name,
      username: profile.username,
      occupation: profile.occupation || undefined,
      mobileNumber: profile.mobileNumber || undefined,
      websiteLink: profile.websiteLink || undefined,
    }).catch(() => {
      // Silently ignore — user can update profile manually later
    })
  }, [updateProfile])

  return null
}
