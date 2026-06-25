import { cn } from '~/lib/utils'
import type { ConnectionTab } from './types'

interface ConnectionTabsProps {
  active: ConnectionTab
  onChange: (tab: ConnectionTab) => void
  recentlyViewedCount?: number
  collectionCount?: number
}

interface TabConfig {
  key: ConnectionTab
  label: string
  count?: number
}

// The "Recently Viewed | Collection" switcher with the active-tab underline.
export function ConnectionTabs({
  active,
  onChange,
  recentlyViewedCount,
  collectionCount,
}: ConnectionTabsProps) {
  const tabs: TabConfig[] = [
    { key: 'recentlyViewed', label: 'Recently Viewed', count: recentlyViewedCount },
    { key: 'collection', label: 'Collection', count: collectionCount },
  ]

  return (
    <div className="flex items-center gap-8">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className="relative pb-2"
          >
            <span
              className={cn(
                'text-lg transition-colors',
                isActive ? 'font-bold text-black' : 'font-normal text-black',
              )}
            >
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="ml-1 text-neutral-400">{tab.count}</span>
              )}
            </span>
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-violet-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}
