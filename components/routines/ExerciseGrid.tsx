'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check } from 'lucide-react'
import { Database } from '@/types/database'
import { getExercises } from '@/lib/supabase/queries'
import { MuscleFilterTabs } from './MuscleFilterTabs'
import { cn } from '@/lib/utils'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface ExerciseGridProps {
  selectedIds: string[]
  onSelect: (exercise: Exercise) => void
}

export function ExerciseGrid({ selectedIds, onSelect }: ExerciseGridProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [muscleFilter, setMuscleFilter] = useState('all')

  useEffect(() => {
    async function loadExercises() {
      try {
        const data = await getExercises()
        setExercises(data)
      } catch (error) {
        console.error('Error loading exercises:', error)
      } finally {
        setLoading(false)
      }
    }
    loadExercises()
  }, [])

  const filteredExercises = useMemo(() => {
    if (muscleFilter === 'all') return exercises
    return exercises.filter((e) => e.muscle_group === muscleFilter)
  }, [exercises, muscleFilter])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded-full w-full" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MuscleFilterTabs selected={muscleFilter} onChange={setMuscleFilter} />

      {filteredExercises.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No exercises found for this muscle group
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredExercises.map((exercise) => {
            const isSelected = selectedIds.includes(exercise.id)
            return (
              <button
                key={exercise.id}
                onClick={() => !isSelected && onSelect(exercise)}
                disabled={isSelected}
                className={cn(
                  'relative p-3 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'bg-primary/10 border-primary/30 cursor-default'
                    : 'bg-card hover:bg-muted/50 border-border hover:border-primary/50 active:scale-95'
                )}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="font-medium text-sm leading-tight line-clamp-2">
                  {exercise.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">
                  {exercise.muscle_group}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
