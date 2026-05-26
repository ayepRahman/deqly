import { Link as LinkIcon, Pencil, Share2, Upload } from 'lucide-react'
import { Button } from '../ui/button'

interface CardActionsProps {
  isFlipped: boolean
  isEditing: boolean
  copied: boolean
  readOnly: boolean
  onToggleFlip: () => void
  onCopyLink: () => void
  onNativeShare: () => void
  onStartEdit?: () => void
  onSaveEdit?: () => void
}

export function CardActions({
  isFlipped,
  isEditing,
  copied,
  readOnly,
  onToggleFlip,
  onCopyLink,
  onNativeShare,
  onStartEdit,
  onSaveEdit,
}: CardActionsProps) {
  if (isFlipped) {
    return (
      <div className="flex justify-center gap-7">
        <Button
          type="button"
          variant="ghost"
          onClick={onCopyLink}
          className="flex h-auto w-16 flex-col gap-1 rounded-none bg-transparent p-0 hover:bg-transparent"
        >
          <LinkIcon className="size-7 text-neutral-700" />
          <span className="text-sm text-black">
            {copied ? 'Copied!' : 'Copy link'}
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onNativeShare}
          className="flex h-auto w-16 flex-col gap-1 rounded-none bg-transparent p-0 hover:bg-transparent"
        >
          <Upload className="size-7 text-neutral-700" />
          <span className="text-sm text-black">Share</span>
        </Button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="flex justify-center gap-7">
        <Button onClick={onSaveEdit} variant="teal" size="2xl">
          Save Changes
        </Button>
      </div>
    )
  }

  if (readOnly) {
    return (
      <div className="flex justify-center gap-7">
        <Button onClick={onToggleFlip} variant="violet" size="2xl">
          <Share2 />
          Share
        </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-center gap-7">
      <Button onClick={onToggleFlip} variant="violet" size="2xl">
        <Share2 />
        Share
      </Button>
      <Button onClick={onStartEdit} variant="teal" size="2xl">
        <Pencil />
        Edit
      </Button>
    </div>
  )
}
