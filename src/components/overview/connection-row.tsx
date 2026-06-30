import { Link } from '@tanstack/react-router'
import type { ConnectionProfile } from './types'

interface ConnectionRowProps {
  profile: ConnectionProfile
}

// A single connection in the Recently Viewed / Collection list: a banner card
// with the person's name and occupation, linking to their public profile.
export function ConnectionRow({ profile }: ConnectionRowProps) {
  const image = profile.bannerImageUrl ?? profile.avatarImageUrl ?? null
  const displayName = profile.name ?? profile.username ?? 'Deqly user'

  const inner = (
    <div className="relative h-44 w-full overflow-hidden rounded-[20px] bg-neutral-800">
      {image ? (
        <img
          src={image}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-neutral-800" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-xl font-bold text-white">{displayName}</p>
        {profile.occupation && (
          <p className="text-sm font-normal text-white/90">
            {profile.occupation}
          </p>
        )}
      </div>
    </div>
  )

  if (!profile.username) {
    return inner
  }

  return (
    <Link to="/$username" params={{ username: profile.username }}>
      {inner}
    </Link>
  )
}
