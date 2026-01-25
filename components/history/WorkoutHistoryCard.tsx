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
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{workout.routine.name}</CardTitle>
            <CardDescription>{formatRelativeTime(workout.ended_at)}</CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>{formatDate(workout.ended_at)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(workout.total_duration_seconds)}
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}, {totalSets} set{totalSets !== 1 ? 's' : ''}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide details' : 'Show details'}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {Array.from(setsByExercise.values()).map(({ exercise, sets }, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="font-medium">{exercise.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{exercise.muscle_group}</div>
                <div className="flex flex-wrap gap-2">
                  {sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="bg-muted px-2 py-1 rounded text-sm"
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
        )}
      </CardContent>
    </Card>
  )
}
