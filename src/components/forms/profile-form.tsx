import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CameraIcon } from '~/components/cards/card-icons'
import type { CropData } from '~/components/cards/types'
import { Button } from '~/components/ui/button'
import { useImagePreviews } from '~/hooks/use-image-previews'
import { useImageUpload } from '~/hooks/use-image-upload'
import { type ProfileValues, profileSchema } from '~/lib/validations'
import {
  BANNER_ASPECT,
  CARD_ASPECT,
  type CropResult,
  ImageCropDialog,
} from './image-crop-dialog'
import { ImageEditMenu } from './image-edit-menu'
import { useAppForm } from './form'

type ImageType = 'avatar' | 'banner'

interface CurrentUser {
  name?: string | null
  username?: string | null
  occupation?: string | null
  mobileNumber?: string | null
  websiteLink?: string | null
  addMobileToCard?: boolean | null
  addWebsiteToCard?: boolean | null
  avatarImageUrl?: string | null
  bannerImageUrl?: string | null
  originalAvatarImageUrl?: string | null
  originalBannerImageUrl?: string | null
  avatarCropData?: CropData | null
  bannerCropData?: CropData | null
}

interface ProfileFormProps {
  currentUser: CurrentUser
  loading: boolean
  error: string | null
  onSubmit: (values: ProfileValues) => void
  onBack: () => void
}

const usernameTransform = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_]/g, '')

export function ProfileForm({
  currentUser,
  loading,
  error,
  onSubmit,
  onBack,
}: ProfileFormProps) {
  const avatarUpload = useImageUpload('avatar')
  const bannerUpload = useImageUpload('banner')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const originalFileRef = useRef<File | null>(null)

  const avatarUrl = currentUser.avatarImageUrl ?? null
  const bannerUrl = currentUser.bannerImageUrl ?? null

  // Optimistic previews: show the just-cropped blob until the stored image loads.
  const imagePreviews = useImagePreviews()
  const { reconcile: reconcilePreviews } = imagePreviews
  useEffect(() => {
    reconcilePreviews({ avatar: avatarUrl, banner: bannerUrl })
  }, [avatarUrl, bannerUrl, reconcilePreviews])

  const displayAvatarUrl = imagePreviews.previews.avatar?.url ?? avatarUrl
  const displayBannerUrl = imagePreviews.previews.banner?.url ?? bannerUrl

  const [cropDialog, setCropDialog] = useState<{
    open: boolean
    imageSrc: string
    type: ImageType
    mode: 'new' | 'recrop'
    initialCrop?: { x: number; y: number }
    initialZoom?: number
  }>({ open: false, imageSrc: '', type: 'avatar', mode: 'new' })

  const handleChangePhoto = (type: ImageType) => {
    const input = type === 'avatar' ? avatarInputRef : bannerInputRef
    input.current?.click()
  }

  const handleAdjustCrop = (type: ImageType) => {
    const imageSrc =
      type === 'avatar'
        ? (currentUser.originalAvatarImageUrl ?? avatarUrl)
        : (currentUser.originalBannerImageUrl ?? bannerUrl)
    if (!imageSrc) return
    const cropData =
      type === 'avatar' ? currentUser.avatarCropData : currentUser.bannerCropData
    originalFileRef.current = null
    setCropDialog({
      open: true,
      imageSrc,
      type,
      mode: 'recrop',
      initialCrop: cropData?.crop,
      initialZoom: cropData?.zoom,
    })
  }

  const handleFileSelected = (type: ImageType, file: File) => {
    originalFileRef.current = file
    setCropDialog({
      open: true,
      imageSrc: URL.createObjectURL(file),
      type,
      mode: 'new',
    })
  }

  const closeCropDialog = () => {
    if (cropDialog.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropDialog.imageSrc)
    }
    setCropDialog({ open: false, imageSrc: '', type: 'avatar', mode: 'new' })
  }

  const handleCropConfirm = async (result: CropResult) => {
    const { type, mode } = cropDialog
    const originalFile = originalFileRef.current
    closeCropDialog()
    const uploader = type === 'avatar' ? avatarUpload : bannerUpload
    const baseUrl = type === 'avatar' ? avatarUrl : bannerUrl
    imagePreviews.start(type, result.blob, baseUrl)
    const ok = await uploader.upload({
      croppedBlob: result.blob,
      originalFile: mode === 'new' ? (originalFile ?? undefined) : undefined,
      cropData: { crop: result.crop, zoom: result.zoom },
    })
    if (!ok) imagePreviews.clear(type)
    originalFileRef.current = null
  }

  const form = useAppForm({
    defaultValues: {
      name: currentUser.name ?? '',
      username: currentUser.username ?? '',
      occupation: currentUser.occupation ?? '',
      mobileNumber: currentUser.mobileNumber ?? '',
      addMobileToCard:
        currentUser.addMobileToCard ?? !!currentUser.mobileNumber,
      websiteLink: currentUser.websiteLink ?? '',
      addWebsiteToCard:
        currentUser.addWebsiteToCard ?? !!currentUser.websiteLink,
    } as ProfileValues,
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <ImageCropDialog
        open={cropDialog.open}
        imageSrc={cropDialog.imageSrc}
        aspect={cropDialog.type === 'banner' ? BANNER_ASPECT : CARD_ASPECT}
        initialCrop={cropDialog.initialCrop}
        initialZoom={cropDialog.initialZoom}
        onConfirm={handleCropConfirm}
        onClose={closeCropDialog}
      />

      {/* Banner */}
      <div className="relative h-28 bg-neutral-100 group">
        {displayBannerUrl ? (
          <ImageEditMenu
            onAdjustCrop={() => handleAdjustCrop('banner')}
            onChangePhoto={() => handleChangePhoto('banner')}
            disabled={bannerUpload.isUploading}
            isUploading={bannerUpload.isUploading}
            overlayLabel="Change banner"
            triggerClassName="h-full w-full rounded-none"
            badgeClassName="bottom-2 right-2"
            contentAlign="end"
          >
            <img
              src={displayBannerUrl}
              alt="Banner"
              className="h-full w-full object-cover"
            />
          </ImageEditMenu>
        ) : (
          <Button
            type="button"
            variant="ghost"
            isLoading={bannerUpload.isUploading}
            onClick={() => handleChangePhoto('banner')}
            className="absolute inset-0 size-auto rounded-none bg-gradient-to-r from-violet-500/20 to-violet-500/10 text-violet-700 hover:bg-black/5"
          >
            <CameraIcon className="size-5" />
            <span className="ml-1.5 text-xs">Add banner</span>
          </Button>
        )}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelected('banner', file)
            e.target.value = ''
          }}
        />

        {/* Back button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="absolute top-4 left-4 bg-black/40 text-white hover:bg-black/60"
        >
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      {/* Avatar */}
      <div className="px-8 -mt-10 mb-4">
        <div className="relative w-20 h-20 rounded-full border-4 border-white bg-neutral-200 overflow-hidden group">
          {displayAvatarUrl ? (
            <ImageEditMenu
              onAdjustCrop={() => handleAdjustCrop('avatar')}
              onChangePhoto={() => handleChangePhoto('avatar')}
              disabled={avatarUpload.isUploading}
              isUploading={avatarUpload.isUploading}
              overlayLabel=""
              triggerClassName="absolute inset-0 h-full w-full rounded-full"
              badgeClassName="bottom-0.5 right-0.5 p-1"
            >
              <img
                src={displayAvatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </ImageEditMenu>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              isLoading={avatarUpload.isUploading}
              onClick={() => handleChangePhoto('avatar')}
              className="absolute inset-0 size-auto rounded-full bg-violet-500 text-white hover:bg-violet-500/90"
            >
              <CameraIcon className="size-4" />
            </Button>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelected('avatar', file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-8 pb-8 max-w-lg mx-auto w-full">
        <h1 className="text-[32px] font-bold text-black leading-tight mb-2">
          Edit Profile
        </h1>
        <p className="text-gray-500 text-[15px] leading-relaxed mb-10">
          Update your details here. Everything you add
          <br />
          here comes to life on your card!
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-col"
        >
          <div className="flex flex-col gap-6">
            <form.AppField name="name">
              {(field) => <field.TextField placeholder="Your Name" />}
            </form.AppField>

            <form.AppField name="username">
              {(field) => (
                <field.TextField
                  placeholder="Username"
                  required
                  description="Unique handle for your profile (e.g. john_doe)"
                  transform={usernameTransform}
                />
              )}
            </form.AppField>

            <form.AppField name="occupation">
              {(field) => <field.TextField placeholder="Subtitle" />}
            </form.AppField>
          </div>

          {/* Personal Details */}
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-semibold text-black">
                Personal Details
              </h2>
              <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">
                <span className="text-gray-400 text-xs font-serif">i</span>
              </div>
            </div>

            {/* Mobile Number */}
            <div className="mb-2">
              <form.AppField name="mobileNumber">
                {(field) => (
                  <field.TextField
                    type="tel"
                    placeholder="Mobile Number ( optional )"
                  />
                )}
              </form.AppField>
              <div className="flex justify-end mt-2">
                <form.AppField name="addMobileToCard">
                  {(field) => <field.CheckboxField label="Add to Card" />}
                </form.AppField>
              </div>
            </div>

            {/* External Link */}
            <div className="mb-2">
              <form.AppField name="websiteLink">
                {(field) => (
                  <field.TextField placeholder="External Link ( optional )" />
                )}
              </form.AppField>
              <div className="flex justify-end mt-2">
                <form.AppField name="addWebsiteToCard">
                  {(field) => <field.CheckboxField label="Add to Card" />}
                </form.AppField>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-10 flex justify-center">
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button
                  type="submit"
                  variant="violet"
                  isLoading={loading}
                  disabled={!canSubmit}
                  className="px-12 h-12 rounded-full text-sm font-semibold disabled:bg-gray-300 disabled:text-gray-400 disabled:opacity-100 disabled:shadow-none shadow-lg shadow-violet-200"
                >
                  Save Changes
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  )
}
