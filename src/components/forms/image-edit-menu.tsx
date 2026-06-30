import { Crop, ImageUp, X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { CameraIcon } from '~/components/cards/card-icons'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface ImageEditMenuProps {
  /** The image (or any content) that acts as the tap target. */
  children: ReactNode
  onAdjustCrop: () => void
  onChangePhoto: () => void
  disabled?: boolean
  isUploading?: boolean
  /** Centered hover overlay label (desktop). */
  overlayLabel?: string
  /** Classes for the root container (positioning/sizing/rounding). */
  triggerClassName?: string
  /** Positioning classes for the camera button affordance. */
  badgeClassName?: string
  /** Render compact icon-only actions for small targets (e.g. avatar). */
  compact?: boolean
}

/**
 * Tap target over an existing image. Tapping the camera button reveals two
 * action buttons rendered directly on the image — "Adjust crop" and "Change
 * photo" — plus a close button to dismiss. Mobile-first: every affordance is an
 * explicit, tappable button (no hover or outside-click required). Outside click
 * and Escape are kept as desktop conveniences.
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
  compact = false,
}: ImageEditMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function runAction(action: () => void) {
    setOpen(false)
    action()
  }

  const actionButtonClass =
    'flex items-center justify-center rounded-full border border-[#b5b4b4] bg-white text-[#727272] shadow-sm transition-colors hover:bg-neutral-50'

  return (
    <div
      ref={rootRef}
      className={cn('group relative overflow-hidden', triggerClassName)}
    >
      {children}

      {/* Uploading state — persistent so it reads on touch too. */}
      {isUploading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
          Uploading...
        </div>
      )}

      {/* Closed state: camera button affordance + desktop hover hint. */}
      {!open && !isUploading && (
        <>
          {overlayLabel && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
              {overlayLabel}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size={compact ? 'icon-xs' : 'icon-sm'}
            disabled={disabled}
            onClick={() => setOpen(true)}
            aria-label={overlayLabel || 'Edit image'}
            className={cn(
              'absolute bg-black/55 text-white shadow-sm hover:bg-black/70 hover:text-white',
              badgeClassName ?? 'bottom-2 right-2',
            )}
          >
            <CameraIcon className={compact ? 'size-3.5' : 'size-4'} />
          </Button>
        </>
      )}

      {/* Open state: action buttons + close, rendered on the image itself. */}
      {open && !isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Button
            type="button"
            variant="ghost"
            size={compact ? 'icon-xs' : 'icon-sm'}
            onClick={() => setOpen(false)}
            aria-label="Close"
            className={cn(
              'absolute bg-black/45 text-white hover:bg-black/65 hover:text-white',
              compact ? 'top-0.5 right-0.5' : 'top-2 right-2',
            )}
          >
            <X className={compact ? 'size-3.5' : 'size-4'} />
          </Button>

          {compact ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runAction(onAdjustCrop)}
                aria-label="Adjust crop"
                className={cn(actionButtonClass, 'size-7')}
              >
                <Crop className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => runAction(onChangePhoto)}
                aria-label="Change photo"
                className={cn(actionButtonClass, 'size-7')}
              >
                <ImageUp className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => runAction(onAdjustCrop)}
                className={cn(
                  actionButtonClass,
                  'gap-2 whitespace-nowrap px-6 py-2 text-sm font-medium',
                )}
              >
                <Crop className="size-4" />
                Adjust crop
              </button>
              <button
                type="button"
                onClick={() => runAction(onChangePhoto)}
                className={cn(
                  actionButtonClass,
                  'gap-2 whitespace-nowrap px-6 py-2 text-sm font-medium',
                )}
              >
                <ImageUp className="size-4" />
                Change photo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
