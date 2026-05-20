import { Pencil, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { ImagePlaceholderIcon, LogoMask } from './card-icons'
import { ColorPicker } from './color-picker'
import { FlipCard } from './flip-card'
import {
  type CardData,
  DEFAULT_CARD_COLOR,
  MAX_SHOWCASE_DESCRIPTION,
  MAX_SUBTITLE,
  MAX_TITLE,
  type ShowcaseEditForm,
  type UserData,
} from './types'

interface ShowcaseCardProps {
  card: CardData
  index: number
  total: number
  isUploading?: boolean
  editingCardId?: Id<'cards'> | null
  showcaseEditForm?: ShowcaseEditForm
  userData: UserData | null | undefined
  readOnly?: boolean
  isActive?: boolean
  isFlipped?: boolean
  onImageClick?: () => void
  onStartEdit?: (card: CardData) => void
  onCancelEdit?: () => void
  onDeleteCard?: (id: Id<'cards'>) => void
  onShowcaseFormChange?: (form: ShowcaseEditForm) => void
  onCloseFlip?: () => void
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Delete card?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-500">This can't be undone.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ShowcaseCard({
  card,
  index,
  total,
  isUploading = false,
  editingCardId = null,
  showcaseEditForm,
  userData,
  readOnly = false,
  isActive = true,
  isFlipped = false,
  onImageClick,
  onStartEdit,
  onCancelEdit,
  onDeleteCard,
  onShowcaseFormChange,
  onCloseFlip,
}: ShowcaseCardProps) {
  const isEditing = editingCardId === card._id
  const accentColor = isEditing && showcaseEditForm
    ? showcaseEditForm.color
    : (card.color ?? DEFAULT_CARD_COLOR.hex)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const effectiveFlipped = isFlipped && !isEditing

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

  const editForm = showcaseEditForm && onShowcaseFormChange ? (
    <div className="flex flex-col gap-2.5">
      <input
        value={showcaseEditForm.name}
        onChange={(e) => {
          if (e.target.value.length <= MAX_TITLE) {
            onShowcaseFormChange({
              ...showcaseEditForm,
              name: e.target.value,
            })
          }
        }}
        maxLength={MAX_TITLE}
        placeholder="Name"
        className="bg-transparent text-white font-bold text-xl border-b border-white/40 focus:border-white outline-none pb-0.5 touch-pan-y"
      />
      <input
        value={showcaseEditForm.occupation}
        onChange={(e) => {
          if (e.target.value.length <= MAX_SUBTITLE) {
            onShowcaseFormChange({
              ...showcaseEditForm,
              occupation: e.target.value,
            })
          }
        }}
        maxLength={MAX_SUBTITLE}
        placeholder="Occupation"
        className="bg-transparent text-white text-base border-b border-white/40 focus:border-white outline-none pb-0.5 touch-pan-y"
      />
      <div className="relative">
        <textarea
          value={showcaseEditForm.description}
          onChange={(e) => {
            if (e.target.value.length <= MAX_SHOWCASE_DESCRIPTION) {
              onShowcaseFormChange({
                ...showcaseEditForm,
                description: e.target.value,
              })
            }
          }}
          maxLength={MAX_SHOWCASE_DESCRIPTION}
          placeholder="Add a description of your card here. Explain your project as best as you can within 155 characters thats leaves a good impact"
          rows={3}
          className="w-full bg-transparent text-white text-base outline outline-1 outline-white rounded-[10px] p-[5px] focus:outline-white/80 resize-none opacity-60 focus:opacity-100 touch-pan-y"
        />
        <span className="absolute bottom-2 right-2 text-xs text-white/50">
          {showcaseEditForm.description.length}/{MAX_SHOWCASE_DESCRIPTION}
        </span>
      </div>
      <ColorPicker
        value={showcaseEditForm.color}
        onChange={(hex) =>
          onShowcaseFormChange({ ...showcaseEditForm, color: hex })
        }
      />
    </div>
  ) : null

  const viewContent = (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-white text-2xl font-bold">{card.name || 'Name'}</p>
        {card.occupation && (
          <p className="text-white text-base font-normal mt-0.5">
            {card.occupation}
          </p>
        )}
      </div>
      <div className="rounded-[10px] p-[5px] opacity-60 h-20 overflow-hidden">
        <p className="text-white text-sm">
          {card.description ||
            'Add a description of your card here. Explain your project as best as you can within 155 characters thats leaves a good impact'}
        </p>
      </div>
    </div>
  )

  if (card.imageUrl) {
    const cardFront = (
      <div className="w-80 h-[576px] relative rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden">
        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center h-12 px-2">
          {!readOnly && isActive && (
            <div className="absolute left-2">
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
          <span className="text-white/80 text-sm font-medium">
            {index + 1}/{total}
          </span>
          {!readOnly && !isEditing && isActive && (
            <div className="absolute right-2">
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

        {/* Full-bleed image */}
        {readOnly ? (
          <img
            src={card.imageUrl}
            alt="Card showcase"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Button
            onClick={onImageClick}
            disabled={isUploading}
            variant="ghost"
            className="absolute inset-0 w-full h-full p-0 rounded-none group"
          >
            <img
              src={card.imageUrl}
              alt="Card showcase"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
              {isUploading ? 'Uploading...' : 'Change image'}
            </div>
          </Button>
        )}

        {/* Accent bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-5 z-10 min-h-[180px] overflow-hidden"
          style={{ backgroundColor: accentColor }}
        >
          <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none z-0" />
          <div className="relative z-[1]">
            {isEditing && showcaseEditForm ? editForm : viewContent}
          </div>
        </div>
      </div>
    )

    return (
      <>
        <FlipCard
          isFlipped={effectiveFlipped}
          front={cardFront}
          back={
            <CardQrBack
              vCardData={vCardData}
              cardColor={accentColor}
              onClose={onCloseFlip ?? (() => {})}
            />
          }
        />

        <DeleteConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            onDeleteCard?.(card._id)
            setConfirmDelete(false)
          }}
        />
      </>
    )
  }

  const cardFront = (
    <div className="w-80 h-[576px] flex flex-col rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden">
      {/* White top area */}
      <div className="bg-white flex-1 pt-5 px-4 pb-4 flex flex-col">
        {/* Top bar */}
        <div className="relative flex items-center justify-center h-8 mb-3">
          {!readOnly && isActive && (
            <div className="absolute left-0">
              {isEditing ? (
                <Button
                  onClick={onCancelEdit}
                  variant="ghost"
                  size="icon-sm"
                  className="text-neutral-400 hover:text-neutral-600 hover:bg-transparent"
                >
                  <X className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => onStartEdit?.(card)}
                  variant="ghost"
                  size="icon-sm"
                  className="text-neutral-400 hover:text-neutral-600 hover:bg-transparent"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
          <span className="text-neutral-300 text-sm font-medium">
            {index + 1}/{total}
          </span>
          {!readOnly && !isEditing && isActive && (
            <div className="absolute right-0">
              <Button
                onClick={() => setConfirmDelete(true)}
                variant="ghost"
                size="icon-sm"
                className="text-neutral-300 hover:text-red-400 hover:bg-transparent"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {readOnly ? (
          <div className="w-full flex-1 rounded-2xl border-2 border-stone-300 flex flex-col items-center justify-center gap-3">
            <ImagePlaceholderIcon />
          </div>
        ) : (
          <Button
            onClick={onImageClick}
            disabled={isUploading}
            variant="ghost"
            className="w-full flex-1 rounded-2xl border-2 border-stone-300 flex flex-col items-center justify-center gap-3 hover:border-neutral-400"
          >
            <ImagePlaceholderIcon />
            <div className="flex flex-col items-center gap-3">
              <p className="text-neutral-400 text-xl font-bold text-center">
                {isUploading ? 'Uploading...' : 'Add showcase Images'}
              </p>
              <p className="text-neutral-400 text-sm text-center leading-tight px-4 text-wrap">
                Drop an image or browse it from your computer
              </p>
              <span className="px-5 py-1 rounded-3xl outline outline-1 outline-neutral-400 text-neutral-400 text-sm">
                Open
              </span>
            </div>
          </Button>
        )}
      </div>

      {/* Accent bottom section */}
      <div
        className="relative overflow-hidden px-4 pt-3 pb-5 min-h-[180px]"
        style={{ backgroundColor: accentColor }}
      >
        <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none z-0" />
        <div className="relative z-[1]">
          {isEditing && showcaseEditForm ? editForm : viewContent}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <FlipCard
        isFlipped={effectiveFlipped}
        front={cardFront}
        back={
          <CardQrBack
            vCardData={vCardData}
            cardColor={accentColor}
            onClose={onCloseFlip ?? (() => {})}
          />
        }
      />

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          onDeleteCard?.(card._id)
          setConfirmDelete(false)
        }}
      />
    </>
  )
}
