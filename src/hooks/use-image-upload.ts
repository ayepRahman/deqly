import { useAction, useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'

type ImageType = 'avatar' | 'banner'

interface UseImageUploadReturn {
  upload: (file: File) => Promise<void>
  isUploading: boolean
  error: string | null
}

export function useImageUpload(type: ImageType): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getUploadUrl = useAction(api.upload.getCardImageUploadUrl)
  const updateAvatar = useMutation(api.users.updateAvatar)
  const updateBanner = useMutation(api.users.updateBanner)

  const upload = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      // Step 1: Get a direct upload URL from Convex action
      const { uploadURL, id } = await getUploadUrl({})

      // Step 2: Upload the file directly to Cloudflare
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await fetch(uploadURL, { method: 'POST', body: form })
      if (!uploadRes.ok) {
        throw new Error('Upload to Cloudflare failed')
      }

      // Step 3: Persist the image ID in Convex
      if (type === 'avatar') {
        await updateAvatar({ imageId: id })
      } else {
        await updateBanner({ imageId: id })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading, error }
}
