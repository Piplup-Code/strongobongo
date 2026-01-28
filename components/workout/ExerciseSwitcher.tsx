// components/workout/ExerciseSwitcher.tsx
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SetProgressDots } from './SetProgressDots'

interface ExerciseInfo {
  id: string
  name: string
  targetSets: number
  completedSets: number
}

interface ExerciseSwitcherProps {
  exercises: ExerciseInfo[]
  currentIndex: number
  onNavigate: (index: number) => void
}

export function ExerciseSwitcher({ exercises, currentIndex, onNavigate }: ExerciseSwitcherProps) {
  const prev = exercises[currentIndex - 1]
  const next = exercises[currentIndex + 1]

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t-2 border-foreground/20 bg-background">
      {/* Previous exercise */}
      <button
        onClick={() => prev && onNavigate(currentIndex - 1)}
        disabled={!prev}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-0 flex-1"
      >
        <ChevronLeft className="h-5 w-5 flex-shrink-0" />
        {prev && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{prev.name}</span>
            <SetProgressDots total={prev.targetSets} completed={prev.completedSets} />
          </div>
        )}
      </button>

      {/* Current indicator */}
      <div className="flex-shrink-0 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {currentIndex + 1}/{exercises.length}
      </div>

      {/* Next exercise */}
      <button
        onClick={() => next && onNavigate(currentIndex + 1)}
        disabled={!next}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-0 flex-1 justify-end"
      >
        {next && (
          <div className="flex items-center gap-2 min-w-0">
            <SetProgressDots total={next.targetSets} completed={next.completedSets} />
            <span className="truncate">{next.name}</span>
          </div>
        )}
        <ChevronRight className="h-5 w-5 flex-shrink-0" />
      </button>
    </div>
  )
}
