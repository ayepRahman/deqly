import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { ProfileForm } from '~/components/forms/profile-form'
import { PageLoader } from '~/components/ui/page-loader'
import type { ProfileValues } from '~/lib/validations'
import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const currentUser = useQuery(api.auth.getCurrentUser)
  const updateProfile = useMutation(api.users.updateProfile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: ProfileValues) => {
    setError(null)
    setLoading(true)
    try {
      await updateProfile({
        name: values.name || undefined,
        username: values.username,
        occupation: values.occupation || undefined,
        mobileNumber: values.mobileNumber || undefined,
        websiteLink: values.websiteLink || undefined,
        addMobileToCard: values.addMobileToCard,
        addWebsiteToCard: values.addWebsiteToCard,
      })
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (currentUser === undefined) {
    return <PageLoader />
  }

  if (!currentUser) {
    navigate({ to: '/login' })
    return null
  }

  return (
    <ProfileForm
      currentUser={currentUser}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      onBack={() => navigate({ to: '/' })}
    />
  )
}
