import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CardActions } from '~/components/cards/card-actions'
import { AddCardIcon } from '~/components/cards/card-icons'
import { ProfileCard } from '~/components/cards/profile-card'
import { ShowcaseCard } from '~/components/cards/showcase-card'
import { StoryCard } from '~/components/cards/story-card'
import {
  type CardData,
  DEFAULT_CARD_COLOR,
  getProfileUrl,
  MAX_CARDS,
  type ProfileEditForm,
  type ShowcaseEditForm,
  type StoryEditForm,
} from '~/components/cards/types'
import {
  type CropResult,
  ImageCropDialog,
} from '~/components/forms/image-crop-dialog'
import { SelectCardTypeDialog } from '~/components/forms/select-card-type-dialog'
import { PageFooter } from '~/components/login/page-footer'
import { Button } from '~/components/ui/button'
import { PageLoader } from '~/components/ui/page-loader'
import { ProfileDropdown } from '~/components/ui/profile-dropdown'
import { useImagePreviews } from '~/hooks/use-image-previews'
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
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
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
    mode: 'new' | 'recrop'
    initialCrop?: { x: number; y: number }
    initialZoom?: number
  }>({ open: false, imageSrc: '', target: null, mode: 'new' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<UploadTarget | null>(null)
  // Holds the uncropped file selected for a fresh upload, so it can be stored
  // alongside the cropped result for lossless re-cropping later.
  const originalFileRef = useRef<File | null>(null)
  // Optimistic previews: show the just-cropped blob until the stored image loads.
  const imagePreviews = useImagePreviews()
  const { reconcile: reconcilePreviews } = imagePreviews
  useEffect(() => {
    const currentUrls: Record<string, string | null | undefined> = {
      profile: currentUser?.avatarImageUrl,
    }
    for (const card of cards) currentUrls[card._id] = card.imageUrl
    reconcilePreviews(currentUrls)
  }, [cards, currentUser, reconcilePreviews])

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
    setIsFlipped(false)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  const profileUrl = getProfileUrl(currentUser?.username)

  const handleCopyLink = useCallback(async () => {
    if (!profileUrl) return
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [profileUrl])

  const handleNativeShare = useCallback(async () => {
    if (!profileUrl) return
    if (navigator.share) {
      await navigator.share({ url: profileUrl })
    } else {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [profileUrl])

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
    setIsFlipped(false)
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
    setIsFlipped(false)
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

  // "Change photo" — pick a brand-new file, then crop it.
  const handleChangePhoto = (target: UploadTarget) => {
    uploadTarget.current = target
    fileInputRef.current?.click()
  }

  // "Adjust crop" — re-open the cropper on the stored original (falls back to the
  // displayed image for pre-existing uploads that have no original).
  const handleAdjustCrop = (target: UploadTarget) => {
    let imageSrc: string | null | undefined
    let cropData: { crop: { x: number; y: number }; zoom: number } | null | undefined
    if (target.type === 'profile') {
      imageSrc = currentUser?.originalAvatarImageUrl ?? currentUser?.avatarImageUrl
      cropData = currentUser?.avatarCropData
    } else {
      const card = cards.find((c) => c._id === target.cardId)
      imageSrc = card?.originalImageUrl ?? card?.imageUrl
      cropData = card?.cropData
    }
    if (!imageSrc) return
    originalFileRef.current = null
    setCropDialog({
      open: true,
      imageSrc,
      target,
      mode: 'recrop',
      initialCrop: cropData?.crop,
      initialZoom: cropData?.zoom,
    })
  }

  const uploadBlob = async (file: File | Blob): Promise<Id<'_storage'>> => {
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
    return storageId
  }

  const closeCropDialog = () => {
    if (cropDialog.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropDialog.imageSrc)
    }
    setCropDialog({ open: false, imageSrc: '', target: null, mode: 'new' })
  }

  const handleCropConfirm = async (result: CropResult) => {
    const { target, mode } = cropDialog
    const originalFile = originalFileRef.current
    closeCropDialog()
    if (!target) return

    const croppedFile = new File([result.blob], 'image.jpg', {
      type: 'image/jpeg',
    })
    const cropData = { crop: result.crop, zoom: result.zoom }

    // Show the cropped result immediately, swapping to the stored image once ready.
    const previewKey = target.type === 'profile' ? 'profile' : target.cardId
    const baseUrl =
      target.type === 'profile'
        ? (currentUser?.avatarImageUrl ?? null)
        : (cards.find((c) => c._id === target.cardId)?.imageUrl ?? null)
    imagePreviews.start(previewKey, result.blob, baseUrl)

    setIsUploading(true)
    try {
      const storageId = await uploadBlob(croppedFile)
      // Only a fresh upload carries a new original; re-crops reuse the stored one.
      const originalStorageId =
        mode === 'new' && originalFile
          ? await uploadBlob(originalFile)
          : undefined

      if (target.type === 'profile') {
        await updateAvatar({ storageId, originalStorageId, cropData })
      } else {
        await updateCardImage({
          cardId: target.cardId,
          storageId,
          originalStorageId,
          cropData,
        })
      }
    } catch (_err) {
      // Upload failed — drop the optimistic preview so the prior image returns.
      imagePreviews.clear(previewKey)
    } finally {
      setIsUploading(false)
      originalFileRef.current = null
    }
  }

  if (currentUser === undefined) {
    return <PageLoader />
  }

  const activeCard: CardData | undefined =
    activeIndex > 0 ? cards[activeIndex - 1] : undefined
  const isProfileActive = activeIndex === 0
  const isActiveEditing = isProfileActive
    ? isEditingProfileCard
    : Boolean(activeCard && editingCardId === activeCard._id)

  const sharedCardProps = {
    editingCardId,
    onStartEdit: handleStartEdit,
    onCancelEdit: handleCancelEdit,
    onDeleteCard: handleDeleteCard,
    onCloseFlip: () => setIsFlipped(false),
  }

  function renderCard(card: CardData, index: number) {
    const cardIsActive = activeIndex === index
    if (card.type === 'story') {
      return (
        <StoryCard
          key={card._id}
          card={card}
          index={index}
          total={totalCards}
          isActive={cardIsActive}
          isFlipped={cardIsActive && isFlipped}
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
        isActive={cardIsActive}
        isFlipped={cardIsActive && isFlipped}
        isUploading={isUploading}
        previewUrl={imagePreviews.previews[card._id]?.url}
        showcaseEditForm={showcaseEditForm}
        userData={currentUser}
        onChangePhoto={() => handleChangePhoto({ type: 'card', cardId: card._id })}
        onAdjustCrop={() => handleAdjustCrop({ type: 'card', cardId: card._id })}
        onShowcaseFormChange={setShowcaseEditForm}
        {...sharedCardProps}
      />
    )
  }

  const profileCardIsActive = totalCards === 1 || activeIndex === 0
  const profileCard = (
    <ProfileCard
      user={currentUser ?? { email: '' }}
      index={0}
      total={totalCards}
      isActive={profileCardIsActive}
      isFlipped={profileCardIsActive && isFlipped}
      isUploading={isUploading}
      previewUrl={imagePreviews.previews.profile?.url}
      isEditing={isEditingProfileCard}
      editForm={profileEditForm}
      userData={currentUser}
      onChangePhoto={() => handleChangePhoto({ type: 'profile' })}
      onAdjustCrop={() => handleAdjustCrop({ type: 'profile' })}
      onStartEdit={handleStartProfileEdit}
      onCancelEdit={handleCancelProfileEdit}
      onEditFormChange={setProfileEditForm}
      onCloseFlip={() => setIsFlipped(false)}
    />
  )

  const handleStartActiveEdit = () => {
    if (isProfileActive) {
      handleStartProfileEdit()
    } else if (activeCard) {
      handleStartEdit(activeCard)
    }
  }

  const handleSaveActiveEdit = () => {
    if (isEditingProfileCard) {
      handleSaveProfileEdit()
    } else if (editingCardId) {
      handleSaveEdit()
    }
  }

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
            originalFileRef.current = file
            const src = URL.createObjectURL(file)
            setCropDialog({ open: true, imageSrc: src, target, mode: 'new' })
          }
          e.target.value = ''
        }}
      />

      <ImageCropDialog
        open={cropDialog.open}
        imageSrc={cropDialog.imageSrc}
        initialCrop={cropDialog.initialCrop}
        initialZoom={cropDialog.initialZoom}
        onConfirm={handleCropConfirm}
        onClose={closeCropDialog}
      />

      <div className="flex-1 px-6 py-8 flex flex-col items-center">
        <div className="w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-2xl font-bold text-black">Create A Deqly</h1>
              <p className="text-xs text-black mt-0.5">
                Showcase yourself in {MAX_CARDS + 1} cards
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

          {/* Anchored card actions */}
          <div className="flex justify-center mt-4">
            <CardActions
              isFlipped={isFlipped}
              isEditing={isActiveEditing}
              copied={copied}
              readOnly={false}
              onToggleFlip={() => setIsFlipped((v) => !v)}
              onCopyLink={handleCopyLink}
              onNativeShare={handleNativeShare}
              onStartEdit={handleStartActiveEdit}
              onSaveEdit={handleSaveActiveEdit}
            />
          </div>

          {/* Dot navigation */}
          {totalCards > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
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
