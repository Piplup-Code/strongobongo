// components/routines/RoutineNowPlayingBar.tsx
'use client'

import { ChevronUp } from 'lucide-react'

interface RoutineNowPlayingBarProps {
  count: number
  onView: () => void
}

export function RoutineNowPlayingBar({ count, onView }: RoutineNowPlayingBarProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onView}
      className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 flex items-center justify-between z-20 hover:bg-primary/90 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-foreground/20 flex items-center justify-center font-display text-lg">
          {count}
        </div>
        <span className="font-semibold">
          exercise{count !== 1 ? 's' : ''} added
        </span>
      </div>
      <div className="flex items-center gap-1 font-semibold">
        <span>View routine</span>
        <ChevronUp className="h-5 w-5" />
      </div>
    </button>
  )
}
