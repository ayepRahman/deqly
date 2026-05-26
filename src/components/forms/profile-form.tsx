import { Camera, ArrowLeft } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { useImageUpload } from '~/hooks/use-image-upload'
import { type ProfileValues, profileSchema } from '~/lib/validations'
import { useAppForm } from './form'

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

  const avatarUrl = currentUser.avatarImageUrl ?? null
  const bannerUrl = currentUser.bannerImageUrl ?? null

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
      {/* Banner */}
      <div className="relative h-28 bg-neutral-100 group">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-violet-500/20 to-violet-500/10" />
        )}
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          disabled={bannerUpload.isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Camera className="w-5 h-5 text-white" />
          <span className="text-white text-xs ml-1.5">
            {bannerUpload.isUploading ? 'Uploading...' : 'Change banner'}
          </span>
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) bannerUpload.upload(file)
            e.target.value = ''
          }}
        />

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Avatar */}
      <div className="px-8 -mt-10 mb-4">
        <div className="relative w-20 h-20 rounded-full border-4 border-white bg-neutral-200 overflow-hidden group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white text-2xl font-bold">
              {(currentUser.name ?? currentUser.username ?? '?')
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUpload.isUploading}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) avatarUpload.upload(file)
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
                  disabled={loading || !canSubmit}
                  className="px-12 h-12 rounded-full bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:bg-gray-300 disabled:text-gray-400 disabled:opacity-100 disabled:shadow-none shadow-lg shadow-violet-200"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  )
}
