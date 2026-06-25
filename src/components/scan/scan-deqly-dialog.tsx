'use client'

import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/components/ui/dialog'
import { parseDeqlyTarget } from '~/lib/scan'

interface ScanDeqlyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Minimal shape of the experimental BarcodeDetector API (not yet in TS lib).
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (opts?: {
  formats?: string[]
}) => BarcodeDetectorLike

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined') return null
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector
  return ctor ?? null
}

// Camera-based QR scanner. Uses the native BarcodeDetector when available
// (Android/desktop Chrome) and falls back to zxing-wasm (the iOS Safari path).
// On a successful Deqly QR it navigates to that public profile.
export function ScanDeqlyDialog({ open, onOpenChange }: ScanDeqlyDialogProps) {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [unresolved, setUnresolved] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setUnresolved(false)

    let stream: MediaStream | null = null
    let raf = 0
    let cancelled = false

    const stopCamera = () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (stream) for (const track of stream.getTracks()) track.stop()
    }

    const handleDecoded = (text: string) => {
      const target = parseDeqlyTarget(text, window.location.origin)
      if (!target) {
        setUnresolved(true)
        return false
      }
      stopCamera()
      onOpenChange(false)
      navigate({ to: target })
      return true
    }

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) {
          stopCamera()
          return
        }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const detectorCtor = getBarcodeDetectorCtor()
        if (detectorCtor) {
          const detector = new detectorCtor({ formats: ['qr_code'] })
          const tick = async () => {
            if (cancelled) return
            try {
              const codes = await detector.detect(video)
              const value = codes[0]?.rawValue
              if (value && handleDecoded(value)) return
            } catch {
              // Frame not ready yet — keep scanning.
            }
            raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
          return
        }

        // Fallback: decode frames with zxing-wasm.
        const { readBarcodes } = await import('zxing-wasm/reader')
        const canvas = document.createElement('canvas')
        const tick = async () => {
          if (cancelled) return
          const w = video.videoWidth
          const h = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (w && h && ctx) {
            canvas.width = w
            canvas.height = h
            ctx.drawImage(video, 0, 0, w, h)
            try {
              const results = await readBarcodes(
                ctx.getImageData(0, 0, w, h),
                { formats: ['QRCode'] },
              )
              const value = results[0]?.text
              if (value && handleDecoded(value)) return
            } catch {
              // Ignore a failed frame and try the next one.
            }
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch {
        setError(
          'Camera access is required to scan. Please allow camera permission and try again.',
        )
      }
    }

    start()
    return stopCamera
  }, [open, navigate, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Scan a Deqly</DialogTitle>
        <DialogDescription>
          Point your camera at a Deqly QR code.
        </DialogDescription>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
          </div>
        )}

        {unresolved && (
          <p className="text-sm text-red-500">
            Couldn't open this Deqly. Try scanning another code.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
