import { useMutation } from 'convex/react'
import { useState } from 'react'
import type { CropData } from '~/components/cards/types'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type ImageType = 'avatar' | 'banner'

interface UploadArgs {
  /** The cropped image shown to viewers. */
  croppedBlob: Blob
  /** The uncropped source — pass only on a fresh upload (omit when re-cropping). */
  originalFile?: File
  cropData: CropData
}

interface UseImageUploadReturn {
  /** Resolves to true on success, false if the upload failed. */
  upload: (args: UploadArgs) => Promise<boolean>
  isUploading: boolean
  error: string | null
}

export function useImageUpload(type: ImageType): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const updateAvatar = useMutation(api.users.updateAvatar)
  const updateBanner = useMutation(api.users.updateBanner)

  const uploadBlob = async (file: File | Blob): Promise<Id<'_storage'>> => {
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
    return storageId
  }

  const upload = async ({
    croppedBlob,
    originalFile,
    cropData,
  }: UploadArgs): Promise<boolean> => {
    setIsUploading(true)
    setError(null)

    try {
      const croppedFile = new File([croppedBlob], 'image.jpg', {
        type: 'image/jpeg',
      })
      const storageId = await uploadBlob(croppedFile)
      const originalStorageId = originalFile
        ? await uploadBlob(originalFile)
        : undefined

      if (type === 'avatar') {
        await updateAvatar({ storageId, originalStorageId, cropData })
      } else {
        await updateBanner({ storageId, originalStorageId, cropData })
      }
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return false
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading, error }
}
