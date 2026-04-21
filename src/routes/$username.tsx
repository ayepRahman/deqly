'use client'

import { convexQuery } from '@convex-dev/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import useEmblaCarousel from 'embla-carousel-react'
import { Pencil } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { LogoMask } from '~/components/cards/card-icons'
import { ProfileCard } from '~/components/cards/profile-card'
import { ShowcaseCard } from '~/components/cards/showcase-card'
import { StoryCard } from '~/components/cards/story-card'
import type { CardData, UserData } from '~/components/cards/types'
import { PageFooter } from '~/components/login/page-footer'
import { NotFoundView } from '~/components/not-found-view'
import { Button } from '~/components/ui/button'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/$username')({
  loader: async ({ context, params }) => {
    const user = await context.queryClient.ensureQueryData(
      convexQuery(api.users.getByUsername, { username: params.username }),
    )
    return { user }
  },
  head: ({ loaderData, params }) => {
    const user = loaderData?.user
    const displayName = user?.name || user?.username || params.username
    const title = `${displayName} | Deqly`

    const parts: string[] = []
    if (user?.occupation) parts.push(user.occupation)
    parts.push(`View ${displayName}'s digital business card on Deqly`)
    const description = parts.join(' — ')

    const ogImage = user?.avatarImageUrl ?? undefined

    const siteUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.SITE_URL ?? '')
    const canonicalUrl = `${siteUrl}/${user?.username ?? params.username}`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        // Open Graph
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'profile' },
        { property: 'og:site_name', content: 'Deqly' },
        ...(ogImage
          ? [{ property: 'og:image', content: ogImage }]
          : []),
        // Twitter Card
        { name: 'twitter:card', content: ogImage ? 'summary_large_image' : 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        ...(ogImage
          ? [{ name: 'twitter:image', content: ogImage }]
          : []),
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
    }
  },
  component: PublicProfile,
})

function PublicProfile() {
  const { username } = Route.useParams()
  const profileUser = useQuery(api.users.getByUsername, { username })
  const currentUser = useQuery(api.auth.getCurrentUser)

  const cards = useQuery(
    api.cards.listByUserId,
    profileUser?._id ? { userId: profileUser._id } : 'skip',
  ) ?? []

  const totalCards = 1 + cards.length
  const [activeIndex, setActiveIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    dragFree: false,
  })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setActiveIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  if (profileUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (profileUser === null) {
    return <NotFoundView />
  }

  const isOwner = currentUser?._id === profileUser._id

  const userData: UserData = {
    email: profileUser.email,
    name: profileUser.name,
    username: profileUser.username,
    occupation: profileUser.occupation,
    mobileNumber: profileUser.mobileNumber,
    websiteLink: profileUser.websiteLink,
    addMobileToCard: profileUser.addMobileToCard,
    addWebsiteToCard: profileUser.addWebsiteToCard,
    avatarImageUrl: profileUser.avatarImageUrl,
    bannerImageUrl: profileUser.bannerImageUrl,
    description: profileUser.description,
    cardColor: profileUser.cardColor,
  }

  function renderCard(card: CardData, index: number) {
    if (card.type === 'story') {
      return (
        <StoryCard
          key={card._id}
          card={card}
          index={index}
          total={totalCards}
          userData={userData}
          readOnly
        />
      )
    }
    return (
      <ShowcaseCard
        key={card._id}
        card={card}
        index={index}
        total={totalCards}
        userData={userData}
        readOnly
      />
    )
  }

  const profileCard = (
    <ProfileCard
      user={userData}
      index={0}
      total={totalCards}
      userData={userData}
      readOnly
    />
  )

  return (
    <div className="relative isolate min-h-screen bg-white flex flex-col overflow-x-hidden">
      <div className="flex-1 px-6 py-8 flex flex-col items-center">
        <div className="w-80">
          {/* Header */}
          <div className="relative flex flex-col items-center mb-8">
            {isOwner && (
              <Link to="/" className="absolute top-0 right-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Deck
                </Button>
              </Link>
            )}
            <LogoMask className="w-14 h-12 text-black" />
            <h1 className="text-3xl font-bold text-black text-center mt-2">
              {profileUser.name || profileUser.username}
            </h1>
            <p className="text-xs text-black text-center mt-1">
              Powered By Deqly
            </p>
          </div>

          {/* Cards */}
          {totalCards === 1 ? (
            profileCard
          ) : (
            <div className="-mx-1">
              <div ref={emblaRef}>
                <div className="flex gap-4">
                  <div className="flex-none w-80">{profileCard}</div>
                  {cards.map((card, i) => (
                    <div key={card._id} className="flex-none w-80">
                      {renderCard(card as CardData, i + 1)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dot navigation */}
          {totalCards > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                key="profile"
                onClick={() => emblaApi?.scrollTo(0)}
                variant="ghost"
                className={`w-2 h-2 p-0 min-w-0 rounded-full transition-colors hover:bg-transparent ${
                  0 === activeIndex ? 'bg-neutral-700' : 'bg-neutral-300'
                }`}
              />
              {cards.map((card, i) => (
                <Button
                  key={card._id}
                  onClick={() => emblaApi?.scrollTo(i + 1)}
                  variant="ghost"
                  className={`w-2 h-2 p-0 min-w-0 rounded-full transition-colors hover:bg-transparent ${
                    i + 1 === activeIndex ? 'bg-neutral-700' : 'bg-neutral-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
