import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AddCardIcon } from '~/components/cards/card-icons'
import { EmptyCardPlaceholder } from '~/components/cards/empty-card-placeholder'
import { ShowcaseCard } from '~/components/cards/showcase-card'
import { StoryCard } from '~/components/cards/story-card'
import {
  type CardData,
  DEFAULT_CARD_COLOR,
  MAX_CARDS,
  type ShowcaseEditForm,
  type StoryEditForm,
} from '~/components/cards/types'
import { SelectCardTypeDialog } from '~/components/forms/select-card-type-dialog'
import { Button } from '~/components/ui/button'
import { ProfileDropdown } from '~/components/ui/profile-dropdown'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_app/')({
  component: AppHome,
})

function AppHome() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const cards = useQuery(api.cards.listMyCards) ?? []

  const createCard = useMutation(api.cards.createCard)
  const updateCard = useMutation(api.cards.updateCard)
  const deleteCard = useMutation(api.cards.deleteCard)
  const updateCardImage = useMutation(api.cards.updateCardImage)

  const [activeIndex, setActiveIndex] = useState(0)
  const [editingCardId, setEditingCardId] = useState<Id<'cards'> | null>(null)
  const [showcaseEditForm, setShowcaseEditForm] = useState<ShowcaseEditForm>({
    name: '',
    description: '',
    color: DEFAULT_CARD_COLOR.hex,
  })
  const [storyEditForm, setStoryEditForm] = useState<StoryEditForm>({
    storyBlocks: [{ title: '', subheader: '', description: '' }],
    color: DEFAULT_CARD_COLOR.hex,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetCardId = useRef<Id<'cards'> | null>(null)

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

const handleAddCard = async (type: 'showcase' | 'story') => {
    if (cards.length >= MAX_CARDS) return
    try {
      await createCard({
        type,
        name: type === 'showcase' ? (currentUser?.name ?? '') : undefined,
      })
    } catch (_err) {
      // Card creation failed
    }
  }

  const handleStartEdit = (card: CardData) => {
    setEditingCardId(card._id)
    if (card.type === 'story') {
      setStoryEditForm({
        storyBlocks: (
          card.storyBlocks ?? [{ title: '', subheader: '', description: '' }]
        ).map((b) => ({
          title: b.title,
          subheader: b.subheader ?? '',
          description: b.description ?? '',
        })),
        color: card.color ?? DEFAULT_CARD_COLOR.hex,
      })
    } else {
      setShowcaseEditForm({
        name: card.name ?? '',
        description: card.description ?? '',
        color: card.color ?? DEFAULT_CARD_COLOR.hex,
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!editingCardId) return
    const card = cards.find((c) => c._id === editingCardId)
    try {
      if (card?.type === 'story') {
        await updateCard({
          cardId: editingCardId,
          storyBlocks: storyEditForm.storyBlocks.map((b) => ({
            title: b.title,
            subheader: b.subheader || undefined,
            description: b.description || undefined,
          })),
          color: storyEditForm.color,
        })
      } else {
        await updateCard({
          cardId: editingCardId,
          name: showcaseEditForm.name || undefined,
          description: showcaseEditForm.description || undefined,
          color: showcaseEditForm.color,
        })
      }
      setEditingCardId(null)
    } catch (_err) {
      // Update failed
    }
  }

  const handleCancelEdit = () => setEditingCardId(null)

  const handleDeleteCard = async (cardId: Id<'cards'>) => {
    try {
      await deleteCard({ cardId })
      if (activeIndex >= cards.length - 1 && activeIndex > 0) {
        setActiveIndex(activeIndex - 1)
      }
    } catch (_err) {
      // Delete failed
    }
  }

  const handleAddBlock = (card: CardData) => {
    handleStartEdit(card)
    setStoryEditForm({
      storyBlocks: [
        ...(
          card.storyBlocks ?? [{ title: '', subheader: '', description: '' }]
        ).map((b) => ({
          title: b.title,
          subheader: b.subheader ?? '',
          description: b.description ?? '',
        })),
        { title: '', subheader: '', description: '' },
      ],
      color: card.color ?? DEFAULT_CARD_COLOR.hex,
    })
  }

  const handleImageClick = (cardId: Id<'cards'>) => {
    uploadTargetCardId.current = cardId
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (file: File, cardId: Id<'cards'>) => {
    setIsUploading(true)
    try {
      const res = await fetch('/api/upload/image')
      if (!res.ok) throw new Error('Failed to get upload URL')
      const { uploadURL, id } = (await res.json()) as {
        uploadURL: string
        id: string
      }
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await fetch(uploadURL, { method: 'POST', body: form })
      if (!uploadRes.ok) throw new Error('Upload failed')
      await updateCardImage({ cardId, imageId: id })
    } catch (_err) {
      // Upload failed
    } finally {
      setIsUploading(false)
    }
  }

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-neutral-400">Loading...</p>
      </div>
    )
  }

  const sharedCardProps = {
    editingCardId,
    onStartEdit: handleStartEdit,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: handleCancelEdit,
    onDeleteCard: handleDeleteCard,
  }

  function renderCard(card: CardData, index: number) {
    if (card.type === 'story') {
      return (
        <StoryCard
          key={card._id}
          card={card}
          index={index}
          total={cards.length}
          storyEditForm={storyEditForm}
          onStoryFormChange={setStoryEditForm}
          onAddBlock={handleAddBlock}
          {...sharedCardProps}
        />
      )
    }
    return (
      <ShowcaseCard
        key={card._id}
        card={card}
        index={index}
        total={cards.length}
        isUploading={isUploading}
        showcaseEditForm={showcaseEditForm}
        onImageClick={() => handleImageClick(card._id)}
        onShowcaseFormChange={setShowcaseEditForm}
        {...sharedCardProps}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8 flex flex-col items-center">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          const targetId = uploadTargetCardId.current
          if (file && targetId) {
            await handleImageUpload(file, targetId)
          }
          e.target.value = ''
        }}
      />

      <div className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-black">Create A Deqly</h1>
            <p className="text-xs text-black mt-0.5">
              Showcase yourself in {MAX_CARDS} cards
            </p>
          </div>
          <ProfileDropdown />
        </div>

        {/* Cards */}
        {cards.length === 0 ? (
          <EmptyCardPlaceholder onGetStarted={() => setAddCardDialogOpen(true)} />
        ) : cards.length === 1 ? (
          renderCard(cards[0], 0)
        ) : (
          <div className="-mx-1">
            <div ref={emblaRef} className="">
              <div className="flex gap-4">
                {cards.map((card, i) => (
                  <div key={card._id} className="flex-none w-80">
                    {renderCard(card, i)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dot navigation */}
        {cards.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {cards.map((card, i) => (
              <Button
                key={card._id}
                onClick={() => emblaApi?.scrollTo(i)}
                variant="ghost"
                className={`w-2 h-2 p-0 min-w-0 rounded-full transition-colors hover:bg-transparent ${
                  i === activeIndex ? 'bg-neutral-700' : 'bg-neutral-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Add Card */}
        {cards.length < MAX_CARDS && (
          <>
            <Button
              onClick={() => setAddCardDialogOpen(true)}
              variant="ghost"
              className="flex flex-col items-center gap-2 w-full py-4 mt-2 h-auto hover:bg-transparent"
            >
              <AddCardIcon />
              <span className="text-neutral-400 text-sm">Add Card</span>
            </Button>
            <SelectCardTypeDialog
              open={addCardDialogOpen}
              onOpenChange={setAddCardDialogOpen}
              onCreate={handleAddCard}
            />
          </>
        )}
      </div>

    </div>
  )
}
