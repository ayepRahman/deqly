import { Link, Pencil, Share2, Upload, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { generateVCard } from '~/lib/vcard'
import { Button } from '../ui/button'
import { CardQrBack } from './card-qr-back'
import { ImagePlaceholderIcon, LogoMask } from './card-icons'
import { ColorPicker } from './color-picker'
import { FlipCard } from './flip-card'
import {
  DEFAULT_CARD_COLOR,
  getProfileUrl,
  MAX_DESCRIPTION,
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
  onImageClick?: () => void
  onStartEdit?: () => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  onEditFormChange?: (form: ProfileEditForm) => void
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
  onImageClick,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditFormChange,
}: ProfileCardProps) {
  const accentColor = isEditing && editForm
    ? editForm.color
    : (user.cardColor ?? DEFAULT_CARD_COLOR.hex)

  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)

  if (isEditing && isFlipped) {
    setIsFlipped(false)
  }

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
        onChange={(e) =>
          onEditFormChange({ ...editForm, name: e.target.value })
        }
        placeholder="Name"
        className="bg-transparent text-white font-bold text-xl border-b border-white/40 focus:border-white outline-none pb-0.5 touch-pan-y"
      />
      <input
        value={editForm.occupation}
        onChange={(e) =>
          onEditFormChange({ ...editForm, occupation: e.target.value })
        }
        placeholder="Occupation"
        className="bg-transparent text-white text-base border-b border-white/40 focus:border-white outline-none pb-0.5 touch-pan-y"
      />
      <div className="relative">
        <textarea
          value={editForm.description}
          onChange={(e) => {
            if (e.target.value.length <= MAX_DESCRIPTION) {
              onEditFormChange({ ...editForm, description: e.target.value })
            }
          }}
          placeholder="Add a description about yourself. Make it memorable within 220 characters"
          rows={3}
          className="w-full bg-transparent text-white text-base outline outline-1 outline-white rounded-[10px] p-[5px] focus:outline-white/80 resize-none opacity-60 focus:opacity-100 touch-pan-y"
        />
        <span className="absolute bottom-2 right-2 text-xs text-white/50">
          {editForm.description.length}/{MAX_DESCRIPTION}
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
            'Add a description about yourself. Make it memorable within 220 characters'}
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
        {!readOnly && (
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
          className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-5 z-10 min-h-[180px]"
          style={{ backgroundColor: accentColor }}
        >
          {isEditing && editForm ? editFormContent : viewContent}
          <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none" />
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
            <Button
              onClick={onSaveEdit}
              className="bg-brand-teal flex-1"
              size="lg"
            >
              Save Changes
            </Button>
          ) : readOnly ? (
            <Button
              onClick={() => setIsFlipped(true)}
              className="flex-1 bg-violet-500 hover:bg-violet-600 gap-1.5"
              size="lg"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setIsFlipped(true)}
                className="flex-1 bg-violet-500 hover:bg-violet-600 gap-1.5"
                size="lg"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                onClick={onStartEdit}
                className="flex-1 bg-brand-teal hover:bg-teal-600 gap-1.5"
                size="lg"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
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
            className="w-full flex-1 rounded-2xl border-2 border-stone-300 flex flex-col items-center justify-center gap-3 hover:border-neutral-400"
          >
            <ImagePlaceholderIcon />
            <div className="flex flex-col items-center gap-3">
              <p className="text-neutral-400 text-xl font-bold text-center">
                {isUploading ? 'Uploading...' : 'Add your photo'}
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

      <div
        className="relative px-4 pt-3 pb-5 min-h-[180px]"
        style={{ backgroundColor: accentColor }}
      >
        {isEditing && editForm ? editFormContent : viewContent}
        <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none" />
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
          <Button
            onClick={onSaveEdit}
            className="bg-brand-teal flex-1"
            size="lg"
          >
            Save Changes
          </Button>
        ) : readOnly ? (
          <Button
            onClick={() => setIsFlipped(true)}
            className="flex-1 bg-violet-500 hover:bg-violet-600 gap-1.5"
            size="lg"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setIsFlipped(true)}
              className="flex-1 bg-violet-500 hover:bg-violet-600 gap-1.5"
              size="lg"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              onClick={onStartEdit}
              className="flex-1 bg-brand-teal hover:bg-teal-600 gap-1.5"
              size="lg"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
