'use client'

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/$username')({
  component: PublicProfile,
})

function PublicProfile() {
  const { username } = Route.useParams()
  const user = useQuery(api.users.getByUsername, { username })

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-gray-500">
            No user with the handle &ldquo;{username}&rdquo; exists.
          </p>
        </div>
      </div>
    )
  }

  const accountHash = import.meta.env.VITE_CLOUDFLARE_IMAGES_ACCOUNT_HASH as
    | string
    | undefined

  const avatarUrl =
    user.avatarImageId && accountHash
      ? `https://imagedelivery.net/${accountHash}/${user.avatarImageId}/avatar`
      : null

  const bannerUrl =
    user.bannerImageId && accountHash
      ? `https://imagedelivery.net/${accountHash}/${user.bannerImageId}/banner`
      : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden text-center">
          {/* Banner */}
          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700">
            {bannerUrl && (
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-8 pt-0">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto -mt-10 mb-4 border-4 border-white dark:border-gray-900 overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-500">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username?.charAt(0).toUpperCase()
              )}
            </div>

            {user.name && <h1 className="text-xl font-bold">{user.name}</h1>}
            <p className="text-sm text-gray-500">@{user.username}</p>

            {user.occupation && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {user.occupation}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 text-sm">
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>&#9993;</span>
                  <span>{user.email}</span>
                </a>
              )}

              {user.mobileNumber && (
                <a
                  href={`tel:${user.mobileNumber}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>&#9742;</span>
                  <span>{user.mobileNumber}</span>
                </a>
              )}

              {user.websiteLink && (
                <a
                  href={user.websiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>&#127760;</span>
                  <span>{user.websiteLink}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
