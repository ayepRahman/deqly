import { Pencil, X } from 'lucide-react'
import { useMemo } from 'react'
import { generateVCard } from '~/lib/vcard'
import { Button } from '../ui/button'
import { CardQrBack } from './card-qr-back'
import { ImagePlaceholderIcon, LogoMask } from './card-icons'
import { ColorPicker } from './color-picker'
import { FlipCard } from './flip-card'
import {
  DEFAULT_CARD_COLOR,
  MAX_SHOWCASE_DESCRIPTION,
  MAX_SUBTITLE,
  MAX_TITLE,
  type ProfileEditForm,
  type UserData,
} from './types'

interface ProfileCardProps {
  user: UserData
  index: number
  total: number
  isUploading?: boolean
  isEditing?: boolean
  editForm?: ProfileEditForm
  userData: UserData | null | undefined
  readOnly?: boolean
  isActive?: boolean
  isFlipped?: boolean
  onImageClick?: () => void
  onStartEdit?: () => void
  onCancelEdit?: () => void
  onEditFormChange?: (form: ProfileEditForm) => void
  onCloseFlip?: () => void
}

export function ProfileCard({
  user,
  index,
  total,
  isUploading = false,
  isEditing = false,
  editForm,
  userData,
  readOnly = false,
  isActive = true,
  isFlipped = false,
  onImageClick,
  onStartEdit,
  onCancelEdit,
  onEditFormChange,
  onCloseFlip,
}: ProfileCardProps) {
  const accentColor = isEditing && editForm
    ? editForm.color
    : (user.cardColor ?? DEFAULT_CARD_COLOR.hex)

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

  const editFormContent = editForm && onEditFormChange ? (
    <div className="flex flex-col gap-2.5">
      <input
        value={editForm.name}
        onChange={(e) => {
          if (e.target.value.length <= MAX_TITLE) {
            onEditFormChange({ ...editForm, name: e.target.value })
          }
        }}
        maxLength={MAX_TITLE}
        placeholder="Name"
        className="bg-transparent text-white font-bold text-xl border-b border-white/40 focus:border-white outline-none pb-0.5 touch-pan-y"
      />
      <input
        value={editForm.occupation}
        onChange={(e) => {
          if (e.target.value.length <= MAX_SUBTITLE) {
            onEditFormChange({ ...editForm, occupation: e.target.value })
          }
        }}
        maxLength={MAX_SUBTITLE}
        placeholder="Subtitle"
        className="bg-transparent text-white text-base border-b border-white/40 focus:border-white outline-none pb-0.5 touch-pan-y"
      />
      <div className="relative">
        <textarea
          value={editForm.description}
          onChange={(e) => {
            if (e.target.value.length <= MAX_SHOWCASE_DESCRIPTION) {
              onEditFormChange({ ...editForm, description: e.target.value })
            }
          }}
          maxLength={MAX_SHOWCASE_DESCRIPTION}
          placeholder="Add a description about yourself. Make it memorable within 155 characters"
          rows={3}
          className="w-full bg-transparent text-white text-base outline outline-1 outline-white rounded-[10px] p-[5px] focus:outline-white/80 resize-none opacity-60 focus:opacity-100 touch-pan-y"
        />
        <span className="absolute bottom-2 right-2 text-xs text-white/50">
          {editForm.description.length}/{MAX_SHOWCASE_DESCRIPTION}
        </span>
      </div>
      <ColorPicker
        value={editForm.color}
        onChange={(hex) => onEditFormChange({ ...editForm, color: hex })}
      />
    </div>
  ) : null

  const viewContent = (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-white text-2xl font-bold">{user.name || 'Name'}</p>
        {user.occupation && (
          <p className="text-white text-base font-normal mt-0.5">
            {user.occupation}
          </p>
        )}
      </div>
      <div className="rounded-[10px] p-[5px] opacity-60 h-20 overflow-hidden">
        <p className="text-white text-sm">
          {user.description ||
            'Add a description about yourself. Make it memorable within 155 characters'}
        </p>
      </div>
    </div>
  )

  const topBar = (hasImage: boolean) => {
    const textClass = hasImage
      ? 'text-white/80'
      : 'text-neutral-300'
    const editBtnClass = hasImage
      ? 'text-white/80 hover:text-white hover:bg-transparent'
      : 'text-neutral-400 hover:text-neutral-600 hover:bg-transparent'

    return (
      <div
        className={`${hasImage ? 'absolute top-0 left-0 right-0 z-10' : 'relative'} flex items-center justify-center h-${hasImage ? '12' : '8'} ${hasImage ? 'px-2' : ''} ${!hasImage ? 'mb-3' : ''}`}
      >
        {!readOnly && isActive && (
          <div className={hasImage ? 'absolute left-2' : 'absolute left-0'}>
            {isEditing ? (
              <Button
                onClick={onCancelEdit}
                variant="ghost"
                size="icon-sm"
                className={editBtnClass}
              >
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={onStartEdit}
                variant="ghost"
                size="icon-sm"
                className={editBtnClass}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        <span className={`${textClass} text-sm font-medium`}>
          {index + 1}/{total}
        </span>
      </div>
    )
  }

  if (user.avatarImageUrl) {
    const cardFront = (
      <div className="w-80 h-[576px] relative rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden">
        {topBar(true)}

        {readOnly ? (
          <img
            src={user.avatarImageUrl}
            alt="Profile"
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
              src={user.avatarImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
              {isUploading ? 'Uploading...' : 'Change photo'}
            </div>
          </Button>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-5 z-10 min-h-[180px] overflow-hidden"
          style={{ backgroundColor: accentColor }}
        >
          <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none z-0" />
          <div className="relative z-[1]">
            {isEditing && editForm ? editFormContent : viewContent}
          </div>
        </div>
      </div>
    )

    return (
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
    )
  }

  // No avatar image state
  const cardFront = (
    <div className="w-80 h-[576px] flex flex-col rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden">
      <div className="bg-white flex-1 pt-5 px-4 pb-4 flex flex-col">
        {topBar(false)}

        {readOnly ? (
          <div className="w-full flex-1 rounded-2xl border-2 border-stone-300 flex flex-col items-center justify-center gap-3">
            <ImagePlaceholderIcon />
          </div>
        ) : (
          <Button
            onClick={onImageClick}
            disabled={isUploading}
            variant="ghost"
            className="w-full flex-1 rounded-2xl border-2 border-stone-300 flex flex-col items-center justify-center gap-3 hover:border-neutral-400 whitespace-normal overflow-hidden"
          >
            <ImagePlaceholderIcon />
            <div className="flex flex-col items-center gap-3 w-full px-4">
              <p className="text-neutral-400 text-xl font-bold text-center w-full">
                {isUploading ? 'Uploading...' : 'Add your photo'}
              </p>
<span className="px-5 py-1 rounded-3xl outline outline-1 outline-neutral-400 text-neutral-400 text-sm">
                Open
              </span>
            </div>
          </Button>
        )}
      </div>

      <div
        className="relative overflow-hidden px-4 pt-3 pb-5 min-h-[180px]"
        style={{ backgroundColor: accentColor }}
      >
        <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none z-0" />
        <div className="relative z-[1]">
          {isEditing && editForm ? editFormContent : viewContent}
        </div>
      </div>
    </div>
  )

  return (
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
  )
}
