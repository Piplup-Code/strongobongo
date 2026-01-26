'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Clock, Dumbbell } from 'lucide-react'
import { WorkoutHistoryItem } from '@/lib/supabase/queries'
import { formatDate, formatRelativeTime } from '@/lib/utils/date'

interface WorkoutHistoryCardProps {
  workout: WorkoutHistoryItem
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hrs}h ${remainingMins}m`
  }
  return `${mins}m ${secs}s`
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-3xl md:text-4xl mb-2">{workout.routine.name}</CardTitle>
            <div className="text-sm text-muted-foreground font-body">{formatRelativeTime(workout.ended_at)}</div>
          </div>
          <div className="text-right text-sm text-muted-foreground font-mono">
            <div>{formatDate(workout.ended_at)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 text-sm mb-4">
          <div className="flex items-center gap-2 border-2 border-foreground/20 px-3 py-2 bg-secondary/30">
            <Clock className="h-4 w-4" />
            <span className="font-semibold uppercase tracking-wider">{formatDuration(workout.total_duration_seconds)}</span>
          </div>
          <div className="flex items-center gap-2 border-2 border-foreground/20 px-3 py-2 bg-secondary/30">
            <Dumbbell className="h-4 w-4" />
            <span className="font-semibold uppercase tracking-wider">
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}, {totalSets} set{totalSets !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="uppercase tracking-wider">{isExpanded ? 'Hide details' : 'Show details'}</span>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>

        {isExpanded && (
          <div className="mt-6 space-y-4 pt-4 border-t-2 border-foreground/20">
            {Array.from(setsByExercise.values()).map(({ exercise, sets }, idx) => (
              <div key={idx} className="border-2 border-foreground/20 p-4 bg-secondary/20">
                <div className="font-display text-xl uppercase tracking-wider mb-2">{exercise.name}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{exercise.muscle_group}</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="border-2 border-foreground/20 p-3 bg-card"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Set {setIdx + 1}</div>
                      <div className="font-mono text-lg font-bold">
                        {set.weight_kg !== null && set.weight_kg > 0
                          ? `${set.weight_kg}kg × ${set.reps}`
                          : `${set.reps} reps`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
