import { useCallback, useEffect, useRef, useState } from 'react'

interface PreviewEntry {
  /** Local blob: URL shown optimistically. */
  url: string
  /** The imageUrl displayed before this crop — used to detect when the new one arrives. */
  baseUrl: string | null
}

type Previews = Record<string, PreviewEntry>

export interface UseImagePreviewsReturn {
  previews: Previews
  /** Begin showing a local cropped blob for `key` until the server image is ready. */
  start: (key: string, blob: Blob, baseUrl: string | null) => void
  /** Drop a preview immediately (e.g. when the upload fails). */
  clear: (key: string) => void
  /**
   * Given the current server image URLs, preload any whose value changed since the
   * preview started, then swap to it (flicker-free) by dropping the blob preview.
   * Call from a useEffect keyed on the current URLs.
   */
  reconcile: (currentUrls: Record<string, string | null | undefined>) => void
}

/**
 * Keyed optimistic-image-preview manager. Holds a local blob URL per key and swaps to
 * the real (remote) image only once it has finished loading, so applying a crop shows
 * the result instantly with no flash of the old image.
 */
export function useImagePreviews(): UseImagePreviewsReturn {
  const [previews, setPreviews] = useState<Previews>({})
  // Mirror of state for cleanup without re-subscribing effects.
  const previewsRef = useRef<Previews>({})
  previewsRef.current = previews
  // Keys currently being preloaded, to avoid spawning duplicate loaders.
  const loadingRef = useRef<Set<string>>(new Set())

  const start = useCallback(
    (key: string, blob: Blob, baseUrl: string | null) => {
      const url = URL.createObjectURL(blob)
      loadingRef.current.delete(key)
      setPreviews((prev) => {
        const existing = prev[key]
        if (existing) URL.revokeObjectURL(existing.url)
        return { ...prev, [key]: { url, baseUrl } }
      })
    },
    [],
  )

  const remove = useCallback((key: string) => {
    loadingRef.current.delete(key)
    setPreviews((prev) => {
      const existing = prev[key]
      if (!existing) return prev
      URL.revokeObjectURL(existing.url)
      const { [key]: _removed, ...rest } = prev
      return rest
    })
  }, [])

  const reconcile = useCallback(
    (currentUrls: Record<string, string | null | undefined>) => {
      for (const [key, entry] of Object.entries(previewsRef.current)) {
        const current = currentUrls[key]
        // Wait until the server URL is a new value before swapping.
        if (!current || current === entry.baseUrl) continue
        if (loadingRef.current.has(key)) continue
        loadingRef.current.add(key)
        const img = new Image()
        const done = () => remove(key)
        img.addEventListener('load', done)
        img.addEventListener('error', done)
        img.src = current
      }
    },
    [remove],
  )

  // Revoke any outstanding blob URLs on unmount.
  useEffect(() => {
    return () => {
      for (const entry of Object.values(previewsRef.current)) {
        URL.revokeObjectURL(entry.url)
      }
    }
  }, [])

  return { previews, start, clear: remove, reconcile }
}
