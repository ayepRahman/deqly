import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type ImageType = 'avatar' | 'banner'

interface UseImageUploadReturn {
  upload: (file: File) => Promise<void>
  isUploading: boolean
  error: string | null
}

export function useImageUpload(type: ImageType): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const updateAvatar = useMutation(api.users.updateAvatar)
  const updateBanner = useMutation(api.users.updateBanner)

  const upload = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const uploadUrl = await generateUploadUrl({})

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload to Convex storage failed')
      }

      const { storageId } = (await uploadRes.json()) as {
        storageId: Id<'_storage'>
      }

      if (type === 'avatar') {
        await updateAvatar({ storageId })
      } else {
        await updateBanner({ storageId })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading, error }
}
