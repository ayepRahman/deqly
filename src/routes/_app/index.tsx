import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AddCardIcon } from '~/components/cards/card-icons'
import { ProfileCard } from '~/components/cards/profile-card'
import { ShowcaseCard } from '~/components/cards/showcase-card'
import { StoryCard } from '~/components/cards/story-card'
import {
  type CardData,
  DEFAULT_CARD_COLOR,
  MAX_CARDS,
  type ProfileEditForm,
  type ShowcaseEditForm,
  type StoryEditForm,
} from '~/components/cards/types'
import { ImageCropDialog } from '~/components/forms/image-crop-dialog'
import { SelectCardTypeDialog } from '~/components/forms/select-card-type-dialog'
import { PageFooter } from '~/components/login/page-footer'
import { Button } from '~/components/ui/button'
import { PageLoader } from '~/components/ui/page-loader'
import { ProfileDropdown } from '~/components/ui/profile-dropdown'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_app/')({
  component: AppHome,
})

type UploadTarget = { type: 'profile' } | { type: 'card'; cardId: Id<'cards'> }

function AppHome() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const cards = useQuery(api.cards.listMyCards) ?? []

  const createCard = useMutation(api.cards.createCard)
  const updateCard = useMutation(api.cards.updateCard)
  const deleteCard = useMutation(api.cards.deleteCard)
  const updateCardImage = useMutation(api.cards.updateCardImage)
  const updateProfileCardMutation = useMutation(api.users.updateProfileCard)
  const updateAvatar = useMutation(api.users.updateAvatar)
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)

  const totalCards = 1 + cards.length

  const [activeIndex, setActiveIndex] = useState(0)
  const [editingCardId, setEditingCardId] = useState<Id<'cards'> | null>(null)
  const [isEditingProfileCard, setIsEditingProfileCard] = useState(false)
  const [profileEditForm, setProfileEditForm] = useState<ProfileEditForm>({
    name: '',
    occupation: '',
    description: '',
    color: DEFAULT_CARD_COLOR.hex,
  })
  const [showcaseEditForm, setShowcaseEditForm] = useState<ShowcaseEditForm>({
    name: '',
    occupation: '',
    description: '',
    color: DEFAULT_CARD_COLOR.hex,
  })
  const [storyEditForm, setStoryEditForm] = useState<StoryEditForm>({
    storyBlocks: [{ title: '', subheader: '', description: '' }],
    color: DEFAULT_CARD_COLOR.hex,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false)
  const [cropDialog, setCropDialog] = useState<{
    open: boolean
    imageSrc: string
    target: UploadTarget | null
  }>({ open: false, imageSrc: '', target: null })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<UploadTarget | null>(null)

  const isAnyEditing = editingCardId !== null || isEditingProfileCard
  const isAnyEditingRef = useRef(isAnyEditing)
  useEffect(() => {
    isAnyEditingRef.current = isAnyEditing
  }, [isAnyEditing])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    dragFree: false,
    watchDrag: () => !isAnyEditingRef.current,
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

  // Profile card handlers
  const handleStartProfileEdit = () => {
    setIsEditingProfileCard(true)
    setEditingCardId(null)
    emblaApi?.scrollTo(0, true)
    setProfileEditForm({
      name: currentUser?.name ?? '',
      occupation: currentUser?.occupation ?? '',
      description: currentUser?.description ?? '',
      color: currentUser?.cardColor ?? DEFAULT_CARD_COLOR.hex,
    })
  }

  const handleSaveProfileEdit = async () => {
    try {
      await updateProfileCardMutation({
        name: profileEditForm.name || undefined,
        occupation: profileEditForm.occupation || undefined,
        description: profileEditForm.description || undefined,
        cardColor: profileEditForm.color,
      })
      setIsEditingProfileCard(false)
    } catch (_err) {
      // Update failed
    }
  }

  const handleCancelProfileEdit = () => setIsEditingProfileCard(false)

  // Card handlers
  const handleStartEdit = (card: CardData) => {
    setEditingCardId(card._id)
    setIsEditingProfileCard(false)
    const cardIndex = cards.findIndex((c) => c._id === card._id)
    if (cardIndex >= 0) {
      emblaApi?.scrollTo(cardIndex + 1, true)
    }
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
        occupation: card.occupation ?? '',
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
          occupation: showcaseEditForm.occupation || undefined,
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
      // Account for the profile card offset: total items = 1 + cards.length
      const totalAfterDelete = 1 + cards.length - 1
      if (activeIndex >= totalAfterDelete && activeIndex > 0) {
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

  const handleProfileImageClick = () => {
    uploadTarget.current = { type: 'profile' }
    fileInputRef.current?.click()
  }

  const handleCardImageClick = (cardId: Id<'cards'>) => {
    uploadTarget.current = { type: 'card', cardId }
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (file: File, target: UploadTarget) => {
    setIsUploading(true)
    try {
      const uploadUrl = await generateUploadUrl({})
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { storageId } = (await uploadRes.json()) as {
        storageId: Id<'_storage'>
      }
      if (target.type === 'profile') {
        await updateAvatar({ storageId })
      } else {
        await updateCardImage({ cardId: target.cardId, storageId })
      }
    } catch (_err) {
      // Upload failed
    } finally {
      setIsUploading(false)
    }
  }

  const handleCropConfirm = async (blob: Blob) => {
    const target = cropDialog.target
    URL.revokeObjectURL(cropDialog.imageSrc)
    setCropDialog({ open: false, imageSrc: '', target: null })
    if (!target) return
    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
    await handleImageUpload(file, target)
  }

  if (currentUser === undefined) {
    return <PageLoader />
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
          total={totalCards}
          storyEditForm={storyEditForm}
          userData={currentUser}
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
        total={totalCards}
        isUploading={isUploading}
        showcaseEditForm={showcaseEditForm}
        userData={currentUser}
        onImageClick={() => handleCardImageClick(card._id)}
        onShowcaseFormChange={setShowcaseEditForm}
        {...sharedCardProps}
      />
    )
  }

  const profileCard = (
    <ProfileCard
      user={currentUser ?? { email: '' }}
      index={0}
      total={totalCards}
      isUploading={isUploading}
      isEditing={isEditingProfileCard}
      editForm={profileEditForm}
      userData={currentUser}
      onImageClick={handleProfileImageClick}
      onStartEdit={handleStartProfileEdit}
      onSaveEdit={handleSaveProfileEdit}
      onCancelEdit={handleCancelProfileEdit}
      onEditFormChange={setProfileEditForm}
    />
  )

  return (
    <div className="relative isolate min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const target = uploadTarget.current
          if (file && target) {
            const src = URL.createObjectURL(file)
            setCropDialog({ open: true, imageSrc: src, target })
          }
          e.target.value = ''
        }}
      />

      <ImageCropDialog
        open={cropDialog.open}
        imageSrc={cropDialog.imageSrc}
        onConfirm={handleCropConfirm}
        onClose={() => {
          URL.revokeObjectURL(cropDialog.imageSrc)
          setCropDialog({ open: false, imageSrc: '', target: null })
        }}
      />

      <div className="flex-1 px-6 py-8 flex flex-col items-center">
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
          {totalCards === 1 ? (
            profileCard
          ) : (
            <div className="-mx-1">
              <div ref={emblaRef}>
                <div className="flex gap-4">
                  <div className="flex-none w-80">{profileCard}</div>
                  {cards.map((card, i) => (
                    <div key={card._id} className="flex-none w-80">
                      {renderCard(card, i + 1)}
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

      <PageFooter />
    </div>
  )
}
