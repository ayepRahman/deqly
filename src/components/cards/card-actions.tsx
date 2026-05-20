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
      <div className="flex justify-center gap-7 w-80">
        <button
          type="button"
          onClick={onCopyLink}
          className="flex flex-col items-center gap-1 w-16"
        >
          <LinkIcon className="w-7 h-7 text-neutral-700" />
          <span className="text-sm text-black">
            {copied ? 'Copied!' : 'Copy link'}
          </span>
        </button>
        <button
          type="button"
          onClick={onNativeShare}
          className="flex flex-col items-center gap-1 w-16"
        >
          <Upload className="w-7 h-7 text-neutral-700" />
          <span className="text-sm text-black">Share</span>
        </button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="flex justify-center gap-7 w-80">
        <Button onClick={onSaveEdit} className="bg-brand-teal flex-1" size="lg">
          Save Changes
        </Button>
      </div>
    )
  }

  if (readOnly) {
    return (
      <div className="flex justify-center gap-7 w-80">
        <Button
          onClick={onToggleFlip}
          className="flex-1 bg-violet-500 hover:bg-violet-600 gap-1.5"
          size="lg"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-center gap-7 w-80">
      <Button
        onClick={onToggleFlip}
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
    </div>
  )
}
