import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '~/lib/utils'

interface NavItem {
  label: string
  to: string
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { location } = useRouterState()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-14 items-center border-b border-border px-5">
          <span className="text-base font-semibold tracking-tight text-foreground">
            Deqly
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === item.to
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-6">
          <h1 className="text-sm font-medium text-muted-foreground">
            {navItems.find((i) => i.to === location.pathname)?.label ?? 'Deqly'}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
