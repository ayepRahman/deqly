import { useMutation } from 'convex/react'
import { Camera } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getImageUrl } from '~/components/cards/types'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { useImageUpload } from '~/hooks/use-image-upload'
import { profileSchema } from '~/lib/validations'
import { api } from '../../../convex/_generated/api'

interface CurrentUser {
  name?: string | null
  username?: string | null
  occupation?: string | null
  mobileNumber?: string | null
  websiteLink?: string | null
  avatarImageId?: string | null
  bannerImageId?: string | null
}

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: CurrentUser | null | undefined
}

type FieldErrors = Partial<Record<string, string>>

export function EditProfileDialog({
  open,
  onOpenChange,
  currentUser,
}: EditProfileDialogProps) {
  const updateProfile = useMutation(api.users.updateProfile)
  const avatarUpload = useImageUpload('avatar')
  const bannerUpload = useImageUpload('banner')

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [occupation, setOccupation] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [websiteLink, setWebsiteLink] = useState('')

  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Pre-fill when dialog opens or user changes
  useEffect(() => {
    if (open && currentUser) {
      setName(currentUser.name ?? '')
      setUsername(currentUser.username ?? '')
      setOccupation(currentUser.occupation ?? '')
      setMobileNumber(currentUser.mobileNumber ?? '')
      setWebsiteLink(currentUser.websiteLink ?? '')
      setErrors({})
      setServerError(null)
    }
  }, [open, currentUser])

  const handleSave = async () => {
    setErrors({})
    setServerError(null)

    const result = profileSchema.safeParse({
      name: name || undefined,
      username,
      occupation: occupation || undefined,
      mobileNumber: mobileNumber || undefined,
      websiteLink: websiteLink || undefined,
    })

    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSaving(true)
    try {
      await updateProfile(result.data)
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      if (msg.toLowerCase().includes('username')) {
        setErrors({ username: msg })
      } else {
        setServerError(msg)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const avatarUrl = getImageUrl(currentUser?.avatarImageId ?? undefined)
  const bannerUrl = getImageUrl(currentUser?.bannerImageId ?? undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md p-0 rounded-2xl overflow-hidden">
        <div className="flex flex-col gap-0">
          {/* Banner */}
          <div className="relative h-24 bg-neutral-100 cursor-pointer group">
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
                {bannerUpload.isUploading ? 'Uploading…' : 'Change banner'}
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
          </div>

          {/* Avatar + title row */}
          <div className="px-6 pb-0">
            <div className="relative -mt-10 mb-4 w-fit">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-neutral-200 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white text-2xl font-bold">
                    {(currentUser?.name ?? currentUser?.username ?? '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUpload.isUploading}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
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
          <div className="px-6 pb-6 flex flex-col gap-4">
            <DialogTitle className="text-xl font-bold text-black -mt-2">
              Edit Profile
            </DialogTitle>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="ep-name">Name</FieldLabel>
                <Input
                  id="ep-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-invalid={!!errors.name}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="ep-username">Username *</FieldLabel>
                <Input
                  id="ep-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="your_handle"
                  aria-invalid={!!errors.username}
                />
                <FieldError errors={[errors.username]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="ep-occupation">Occupation</FieldLabel>
              <Input
                id="ep-occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Software Engineer"
                aria-invalid={!!errors.occupation}
              />
              <FieldError errors={[errors.occupation]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="ep-mobile">Mobile Number</FieldLabel>
              <Input
                id="ep-mobile"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+1 234 567 8900"
                aria-invalid={!!errors.mobileNumber}
              />
              <FieldError errors={[errors.mobileNumber]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="ep-website">Website</FieldLabel>
              <Input
                id="ep-website"
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
                placeholder="example.com"
                aria-invalid={!!errors.websiteLink}
              />
              <FieldError errors={[errors.websiteLink]} />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-neutral-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
