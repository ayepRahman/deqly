import { Link, Pencil, Share2, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'
import { generateVCard } from '~/lib/vcard'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { CardQrBack } from './card-qr-back'
import { AddBlockIcon, LogoMask } from './card-icons'
import { ColorPicker } from './color-picker'
import { FlipCard } from './flip-card'
import {
  type CardData,
  DEFAULT_CARD_COLOR,
  getProfileUrl,
  MAX_STORY_BLOCKS,
  MAX_STORY_DESCRIPTION,
  MAX_SUBTITLE,
  MAX_TITLE,
  type StoryEditForm,
  type UserData,
} from './types'

interface StoryCardProps {
  card: CardData
  index: number
  total: number
  editingCardId?: Id<'cards'> | null
  storyEditForm?: StoryEditForm
  userData: UserData | null | undefined
  readOnly?: boolean
  isActive?: boolean
  onStartEdit?: (card: CardData) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  onDeleteCard?: (id: Id<'cards'>) => void
  onStoryFormChange?: (form: StoryEditForm) => void
  onAddBlock?: (card: CardData) => void
}

export function StoryCard({
  card,
  index,
  total,
  editingCardId = null,
  storyEditForm,
  userData,
  readOnly = false,
  isActive = true,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteCard,
  onStoryFormChange,
  onAddBlock,
}: StoryCardProps) {
  const isEditing = editingCardId === card._id
  const blocks = card.storyBlocks ?? []
  const canAddBlock = blocks.length < MAX_STORY_BLOCKS
  const accentColor = isEditing && storyEditForm
    ? storyEditForm.color
    : (card.color ?? DEFAULT_CARD_COLOR.hex)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)

  const profileUrl = getProfileUrl(userData?.username)

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

  if (isEditing && isFlipped) {
    setIsFlipped(false)
  }

  const vCardData = useMemo(() => {
    if (!userData) return ''
    return generateVCard({
      name: userData.name,
      email: userData.email,
      username: userData.username,
      occupation: userData.occupation,
      mobileNumber: userData.mobileNumber,
      websiteLink: userData.websiteLink,
      addMobileToCard: userData.addMobileToCard,
      addWebsiteToCard: userData.addWebsiteToCard,
    })
  }, [userData])

  const updateBlock = (
    i: number,
    field: keyof StoryEditForm['storyBlocks'][number],
    value: string,
  ) => {
    if (!storyEditForm || !onStoryFormChange) return
    const updated = storyEditForm.storyBlocks.map((b, idx) =>
      idx === i ? { ...b, [field]: value } : b,
    )
    onStoryFormChange({ ...storyEditForm, storyBlocks: updated })
  }

  const removeBlock = (i: number) => {
    if (!storyEditForm || !onStoryFormChange) return
    onStoryFormChange({
      ...storyEditForm,
      storyBlocks: storyEditForm.storyBlocks.filter((_, idx) => idx !== i),
    })
  }

  const cardFront = (
    <div
      className="w-80 h-[576px] rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden relative"
      style={{ backgroundColor: accentColor }}
    >
      <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none z-0" />
      <div className="px-4 pt-5 pb-6 flex flex-col gap-4 h-full relative z-[1] overflow-y-auto touch-pan-y">
        {/* Top bar: edit left | counter center | trash right */}
        <div className="relative flex items-center justify-center h-8">
          {!readOnly && isActive && (
            <div className="absolute left-0">
              {isEditing ? (
                <Button
                  onClick={onCancelEdit}
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/60 hover:text-white hover:bg-transparent"
                >
                  <X className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => onStartEdit?.(card)}
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/80 hover:text-white hover:bg-transparent"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
          <span className="text-neutral-200 text-sm font-medium">
            {index + 1}/{total}
          </span>
          {!readOnly && !isEditing && isActive && (
            <div className="absolute right-0">
              <Button
                onClick={() => setConfirmDelete(true)}
                variant="ghost"
                size="icon-sm"
                className="text-white/40 hover:text-red-400 hover:bg-transparent"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Blocks */}
        {isEditing && storyEditForm && onStoryFormChange ? (
          <div className="flex flex-col gap-5">
            {storyEditForm.storyBlocks.map((block, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no stable id
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <input
                    value={block.title}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_TITLE) {
                        updateBlock(i, 'title', e.target.value)
                      }
                    }}
                    maxLength={MAX_TITLE}
                    placeholder="Title"
                    className="bg-transparent text-white text-xl font-bold border-b border-white/40 focus:border-white outline-none pb-0.5 flex-1 touch-pan-y"
                  />
                  {storyEditForm.storyBlocks.length > 1 && (
                    <Button
                      onClick={() => removeBlock(i)}
                      variant="ghost"
                      size="icon-sm"
                      className="ml-2 text-white/40 hover:text-red-400 hover:bg-transparent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <input
                  value={block.subheader}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_SUBTITLE) {
                      updateBlock(i, 'subheader', e.target.value)
                    }
                  }}
                  maxLength={MAX_SUBTITLE}
                  placeholder="Subheader"
                  className="bg-transparent text-white text-base border-b border-white/40 focus:border-white outline-none pb-0.5 touch-pan-y"
                />
                <div className="relative">
                  <textarea
                    value={block.description}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_STORY_DESCRIPTION) {
                        updateBlock(i, 'description', e.target.value)
                      }
                    }}
                    maxLength={MAX_STORY_DESCRIPTION}
                    placeholder="Add a description of your card here. Explain your project as best as you can within 220 characters thats leaves a good impact"
                    rows={3}
                    className="w-full bg-transparent text-white text-base outline outline-1 outline-white rounded-[10px] p-2.5 focus:outline-white/80 resize-none opacity-60 focus:opacity-100 touch-pan-y"
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-white/50">
                    {block.description.length}/{MAX_STORY_DESCRIPTION}
                  </span>
                </div>
              </div>
            ))}
            {storyEditForm.storyBlocks.length < MAX_STORY_BLOCKS && (
              <Button
                onClick={() =>
                  onStoryFormChange({
                    ...storyEditForm,
                    storyBlocks: [
                      ...storyEditForm.storyBlocks,
                      { title: '', subheader: '', description: '' },
                    ],
                  })
                }
                variant="ghost"
                className="flex flex-col items-center gap-1 py-2 h-auto opacity-60 hover:opacity-100 hover:bg-transparent"
              >
                <AddBlockIcon />
                <span className="text-neutral-400 text-sm">Add Text Box</span>
              </Button>
            )}
            <ColorPicker
              value={storyEditForm.color}
              onChange={(hex) =>
                onStoryFormChange({ ...storyEditForm, color: hex })
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {blocks.map((block, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no stable id
              <div key={i} className="flex flex-col gap-2">
                <p className="text-white text-xl font-bold">
                  {block.title || 'Title'}
                </p>
                <p className="text-white text-base">
                  {block.subheader || 'Subheader'}
                </p>
                <div className="rounded-[10px] p-2.5 opacity-60">
                  <p className="text-white text-sm">
                    {block.description ||
                      'Add a description of your card here. Explain your project as best as you can within 220 characters thats leaves a good impact'}
                  </p>
                </div>
              </div>
            ))}

            {canAddBlock && !readOnly && (
              <Button
                onClick={() => onAddBlock?.(card)}
                variant="ghost"
                className="flex flex-col items-center gap-1 py-2 h-auto opacity-60 hover:opacity-100 hover:bg-transparent"
              >
                <AddBlockIcon />
                <span className="text-neutral-400 text-sm">Add Text Box</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center">
      <FlipCard
        isFlipped={isFlipped}
        front={cardFront}
        back={
          <CardQrBack
            vCardData={vCardData}
            cardColor={accentColor}
            onClose={() => setIsFlipped(false)}
          />
        }
      />

      {(isActive || isFlipped || isEditing) && (
        <div className="flex justify-center gap-7 mt-4 w-80">
          {isFlipped ? (
            <>
              <button type="button" onClick={handleCopyLink} className="flex flex-col items-center gap-1 w-16">
                <Link className="w-7 h-7 text-neutral-700" />
                <span className="text-sm text-black">{copied ? 'Copied!' : 'Copy link'}</span>
              </button>
              <button type="button" onClick={handleNativeShare} className="flex flex-col items-center gap-1 w-16">
                <Upload className="w-7 h-7 text-neutral-700" />
                <span className="text-sm text-black">Share</span>
              </button>
            </>
          ) : isEditing ? (
            <Button onClick={onSaveEdit} className="bg-brand-teal flex-1" size="lg">
              Save Changes
            </Button>
          ) : readOnly ? (
            <Button onClick={() => setIsFlipped(true)} className="flex-1 bg-violet-500 hover:bg-violet-600 gap-1.5" size="lg">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsFlipped(true)} className="flex-1 bg-violet-500 hover:bg-violet-600 gap-1.5" size="lg">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button onClick={() => onStartEdit?.(card)} className="flex-1 bg-brand-teal hover:bg-teal-600 gap-1.5" size="lg">
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      )}

      <Dialog
        open={confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(false) }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete card?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500">This can't be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDeleteCard?.(card._id)
                setConfirmDelete(false)
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
