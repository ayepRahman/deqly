import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { ConnectionList } from '~/components/overview/connection-list'
import { ConnectionTabs } from '~/components/overview/connection-tabs'
import { OwnProfilePreview } from '~/components/overview/own-profile-preview'
import { ScanDeqlyButton } from '~/components/overview/scan-deqly-button'
import { hasBuiltDeck, type ConnectionTab } from '~/components/overview/types'
import { PageFooter } from '~/components/login/page-footer'
import { PageLoader } from '~/components/ui/page-loader'
import { ProfileDropdown } from '~/components/ui/profile-dropdown'
import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/_app/')({
  component: AppHome,
})

function AppHome() {
  const navigate = useNavigate()
  const currentUser = useQuery(api.auth.getCurrentUser)
  const cards = useQuery(api.cards.listMyCards)
  const recentlyViewedCount = useQuery(api.connections.countRecentlyViewed)
  const collectionCount = useQuery(api.connections.countCollection)
  const [activeTab, setActiveTab] = useState<ConnectionTab>('recentlyViewed')

  // A user who hasn't built any cards yet belongs in the create flow.
  const cardsLoaded = cards !== undefined
  const needsDeck = cardsLoaded && !hasBuiltDeck(cards)
  useEffect(() => {
    if (needsDeck) {
      navigate({ to: '/edit' })
    }
  }, [needsDeck, navigate])

  if (currentUser === undefined || !cardsLoaded) {
    return <PageLoader />
  }
  // Redirecting (no deck yet) or unauthenticated (guarded by _app).
  if (!currentUser || needsDeck) {
    return null
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-white">
      <div className="flex flex-1 flex-col items-center px-6 py-8">
        <div className="w-80">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Welcome back!</h1>
              <p className="mt-0.5 text-xs text-black">
                Click to Edit &amp; Share your Deqly
              </p>
            </div>
            <ProfileDropdown />
          </div>

          {/* Own profile preview → editor */}
          <OwnProfilePreview
            name={currentUser.name}
            occupation={currentUser.occupation}
            bannerImageUrl={currentUser.bannerImageUrl}
            avatarImageUrl={currentUser.avatarImageUrl}
          />

          {/* Connection tabs */}
          <div className="mt-6">
            <ConnectionTabs
              active={activeTab}
              onChange={setActiveTab}
              recentlyViewedCount={recentlyViewedCount}
              collectionCount={collectionCount}
            />
          </div>

          {/* Active tab list */}
          <div className="mt-6">
            <ConnectionList tab={activeTab} />
          </div>

          {/* Scan */}
          <div className="mt-8 flex justify-center">
            <ScanDeqlyButton />
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
