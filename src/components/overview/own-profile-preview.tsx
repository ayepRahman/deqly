import { Link } from '@tanstack/react-router'

interface OwnProfilePreviewProps {
  name?: string
  occupation?: string
  bannerImageUrl?: string | null
  avatarImageUrl?: string | null
}

// The "Welcome back" hero: the user's own profile shown as a banner card that
// links into the editor. Falls back to the avatar, then a neutral gradient,
// when no banner image is set.
export function OwnProfilePreview({
  name,
  occupation,
  bannerImageUrl,
  avatarImageUrl,
}: OwnProfilePreviewProps) {
  const image = bannerImageUrl ?? avatarImageUrl ?? null

  return (
    <Link
      to="/edit"
      className="relative block h-44 w-full overflow-hidden rounded-[20px] bg-neutral-800"
    >
      {image ? (
        <img
          src={image}
          alt={name ?? 'Your profile'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-neutral-800" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-xl font-bold text-white">{name}</p>
        {occupation && (
          <p className="text-sm font-normal text-white/90">{occupation}</p>
        )}
      </div>
    </Link>
  )
}
