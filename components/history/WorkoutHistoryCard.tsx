'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { WorkoutHistoryItem } from '@/lib/supabase/queries'
import { formatRelativeTime } from '@/lib/utils/date'
import { calculateTotalVolume, formatVolume } from '@/lib/utils/workout'

interface WorkoutHistoryCardProps {
  workout: WorkoutHistoryItem
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--'
  const mins = Math.floor(seconds / 60)
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hrs}h ${remainingMins}m`
  }
  return `${mins}m`
}

export function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Group sets by exercise
  const setsByExercise = new Map<string, { exercise: { name: string; muscle_group: string }; sets: { reps: number; weight_kg: number | null }[] }>()

  for (const set of workout.sets) {
    const existing = setsByExercise.get(set.exercise.id)
    if (existing) {
      existing.sets.push({ reps: set.reps, weight_kg: set.weight_kg })
    } else {
      setsByExercise.set(set.exercise.id, {
        exercise: { name: set.exercise.name, muscle_group: set.exercise.muscle_group },
        sets: [{ reps: set.reps, weight_kg: set.weight_kg }]
      })
    }
  }

  const exerciseCount = setsByExercise.size
  const totalSets = workout.sets.length
  const totalVolume = calculateTotalVolume(workout.sets)

  return (
    <div className="group relative overflow-hidden bg-card border-2 border-foreground/20 hover:border-primary/50 transition-all duration-200">
      {/* Yellow accent bar on left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 group-hover:bg-primary transition-all duration-200" />

      {/* Diagonal cut decoration */}
      <div className="absolute right-0 top-0 w-16 h-full overflow-hidden pointer-events-none">
        <div className="absolute -right-8 top-0 w-16 h-full bg-foreground/5 transform skew-x-[-12deg] group-hover:bg-primary/10 transition-colors duration-200" />
      </div>

      {/* Main content - clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left pl-5 pr-4 py-4"
      >
        <div className="flex items-center gap-4">
          {/* Duration badge */}
          <div className="text-3xl md:text-4xl font-display text-foreground/20 group-hover:text-primary/40 transition-colors duration-200 leading-none select-none min-w-[4rem]">
            {formatDuration(workout.total_duration_seconds)}
          </div>

          {/* Routine info */}
          <div className="flex-1 min-w-0">
            <div className="text-xl md:text-2xl font-display tracking-tight truncate group-hover:text-primary transition-colors duration-200">
              {workout.routine.name}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {formatRelativeTime(workout.ended_at)}
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono">{exerciseCount} ex</span>
            <span className="text-foreground/20">|</span>
            <span className="font-mono">{totalSets} sets</span>
            {totalVolume > 0 && (
              <>
                <span className="text-foreground/20">|</span>
                <span className="font-mono text-primary">{formatVolume(totalVolume)}</span>
              </>
            )}
          </div>

          {/* Expand/collapse icon */}
          <div className="text-foreground/30 group-hover:text-primary transition-colors duration-200">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {/* Mobile stats row */}
        <div className="flex sm:hidden items-center gap-3 mt-2 text-xs text-muted-foreground pl-[4.5rem]">
          <span className="font-mono">{exerciseCount} exercises</span>
          <span className="text-foreground/20">|</span>
          <span className="font-mono">{totalSets} sets</span>
          {totalVolume > 0 && (
            <>
              <span className="text-foreground/20">|</span>
              <span className="font-mono text-primary">{formatVolume(totalVolume)}</span>
            </>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-5 pb-4 pt-2 border-t border-foreground/10">
          <div className="space-y-3">
            {Array.from(setsByExercise.values()).map(({ exercise, sets }, idx) => (
              <div key={idx} className="border-l-2 border-primary/30 pl-4 py-2">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-display text-lg uppercase tracking-wider">{exercise.name}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{exercise.muscle_group}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="bg-foreground/5 border border-foreground/10 px-3 py-1.5 text-sm font-mono"
                    >
                      {set.weight_kg !== null && set.weight_kg > 0
                        ? `${set.weight_kg}kg × ${set.reps}`
                        : `${set.reps} reps`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
