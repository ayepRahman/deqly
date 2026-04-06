import Cropper from 'react-easy-crop'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

// Matches the card image area: 320px wide / 416px tall (576 total - 160 bottom section)
const ASPECT_RATIO = 320 / 416

interface CroppedAreaPixels {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropDialogProps {
  open: boolean
  imageSrc: string
  onConfirm: (blob: Blob) => void
  onClose: () => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = src
  })
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/jpeg',
      0.92,
    )
  })
}

export function ImageCropDialog({
  open,
  imageSrc,
  onConfirm,
  onClose,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null)

  // Reset crop/zoom each time a new image is loaded
  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
  }, [imageSrc])

  const onCropComplete = useCallback(
    (_: unknown, pixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(pixels)
    },
    [],
  )

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
    onConfirm(blob)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        {/* Cropper area */}
        <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT_RATIO}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-1">
          <span className="text-sm text-neutral-500 shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-black"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
