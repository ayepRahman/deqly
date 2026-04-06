import { useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { LogOut, User } from 'lucide-react'
import { authClient } from '~/lib/auth-client'
import { api } from '../../../convex/_generated/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'

export function ProfileDropdown() {
  const router = useRouter()
  const navigate = useNavigate()
  const currentUser = useQuery(api.auth.getCurrentUser)

  const initial =
    currentUser?.email?.charAt(0).toUpperCase() ??
    currentUser?.name?.charAt(0).toUpperCase() ??
    '?'

  const handleSignOut = async () => {
    await authClient.signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden cursor-pointer">
        {initial}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              {currentUser?.name && (
                <p className="text-sm font-semibold leading-none">
                  {currentUser.name}
                </p>
              )}
              {currentUser?.email && (
                <p className="text-xs text-muted-foreground leading-none mt-1">
                  {currentUser.email}
                </p>
              )}
              {currentUser?.username && (
                <p className="text-xs text-muted-foreground leading-none mt-0.5">
                  @{currentUser.username}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate({ to: '/profile' })}
          className="gap-2"
        >
          <User className="w-4 h-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="gap-2 text-red-500 focus:text-red-500"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
