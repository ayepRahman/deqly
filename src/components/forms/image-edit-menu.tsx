import { Crop, ImageUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { CameraIcon } from '~/components/cards/card-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'

interface ImageEditMenuProps {
  /** The image (or any content) that acts as the tap target / menu trigger. */
  children: ReactNode
  onAdjustCrop: () => void
  onChangePhoto: () => void
  disabled?: boolean
  isUploading?: boolean
  /** Centered hover overlay label (desktop). */
  overlayLabel?: string
  /** Classes for the trigger button (positioning/sizing/rounding). */
  triggerClassName?: string
  /** Classes for the always-visible camera badge (mobile affordance). */
  badgeClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
}

/**
 * Tap target over an existing image that opens an action menu with
 * "Adjust crop" and "Change photo". Works on touch (no hover required) via the
 * always-visible camera badge, while keeping the hover overlay for desktop.
 */
export function ImageEditMenu({
  children,
  onAdjustCrop,
  onChangePhoto,
  disabled = false,
  isUploading = false,
  overlayLabel = 'Change image',
  triggerClassName,
  badgeClassName,
  contentAlign = 'center',
}: ImageEditMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'group relative block cursor-pointer overflow-hidden outline-none disabled:cursor-default',
          triggerClassName,
        )}
      >
        {children}
        {/* Hover overlay — desktop polish */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? 'Uploading...' : overlayLabel}
        </span>
        {/* Always-visible affordance — discoverable on touch devices */}
        <span
          className={cn(
            'pointer-events-none absolute flex items-center justify-center rounded-full bg-black/55 p-1.5 text-white shadow-sm',
            badgeClassName ?? 'bottom-2 right-2',
          )}
        >
          <CameraIcon className="size-4" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={contentAlign} className="w-44">
        <DropdownMenuItem onClick={onAdjustCrop} className="gap-2">
          <Crop className="size-4" />
          Adjust crop
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChangePhoto} className="gap-2">
          <ImageUp className="size-4" />
          Change photo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
