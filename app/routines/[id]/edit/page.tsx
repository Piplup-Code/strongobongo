'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExerciseGrid } from '@/components/routines/ExerciseGrid'
import {
  SelectedExerciseCard,
  SelectedExercise,
} from '@/components/routines/SelectedExerciseCard'
import { getRoutineWithExercises, updateRoutine } from '@/lib/supabase/queries'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'
import { ArrowLeft, Save } from 'lucide-react'

type Exercise = Database['public']['Tables']['exercises']['Row']

export default function EditRoutinePage() {
  const router = useRouter()
  const params = useParams()
  const routineId = params.id as string

  const [routineName, setRoutineName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoutine() {
      try {
        setIsLoading(true)
        const routine = await getRoutineWithExercises(routineId)
        if (!routine) {
          setError('Routine not found')
          return
        }

        setRoutineName(routine.name)
        setSelectedExercises(
          routine.exercises.map((re) => ({
            exercise: re.exercise,
            order_index: re.order_index,
            target_sets: re.target_sets,
            target_reps: re.target_reps,
            target_weight_kg: re.target_weight_kg,
            target_rest_seconds: re.target_rest_seconds,
          }))
        )
        setError(null)
      } catch (err) {
        console.error('Error loading routine:', err)
        const errorMessage = 'Failed to load routine'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (routineId) {
      loadRoutine()
    }
  }, [routineId])

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      exercise,
      order_index: selectedExercises.length,
      target_sets: 3,
      target_reps: 10,
      target_weight_kg: null,
      target_rest_seconds: 30,
    }
    setSelectedExercises([...selectedExercises, newExercise])
    setError(null)
  }

  const handleRemoveExercise = (index: number) => {
    const updated = selectedExercises
      .filter((_, i) => i !== index)
      .map((ex, i) => ({ ...ex, order_index: i }))
    setSelectedExercises(updated)
  }

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedExercises.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...selectedExercises]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    updated.forEach((ex, i) => {
      ex.order_index = i
    })
    setSelectedExercises(updated)
  }

  const handleUpdateExercise = (index: number, updates: Partial<SelectedExercise>) => {
    const updated = [...selectedExercises]
    updated[index] = { ...updated[index], ...updates }
    setSelectedExercises(updated)
  }

  const handleSave = async () => {
    setError(null)

    if (!routineName.trim()) {
      setError('Routine name is required')
      return
    }

    if (selectedExercises.length === 0) {
      setError('At least one exercise is required')
      return
    }

    setIsSaving(true)
    try {
      const exercises = selectedExercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_weight_kg: ex.target_weight_kg,
        target_rest_seconds: ex.target_rest_seconds,
      }))

      await updateRoutine(routineId, routineName, exercises)
      toast.success('Routine updated successfully!')
      router.push('/')
    } catch (err) {
      console.error('Error updating routine:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update routine'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedIds = selectedExercises.map((ex) => ex.exercise.id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-5 bg-muted animate-pulse rounded" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded-full" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !routineName) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive">
            {error}
          </div>
          <Button asChild className="mt-4">
            <Link href="/">Back to Routines</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
            <h1 className="text-lg font-semibold">Edit Routine</h1>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || selectedExercises.length === 0}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-6">
        {/* Routine Name */}
        <div>
          <Input
            type="text"
            placeholder="Routine name (e.g., Push Day)"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            className="text-lg font-medium h-12"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Exercise Selection */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Tap to add exercises
          </h2>
          <ExerciseGrid selectedIds={selectedIds} onSelect={handleAddExercise} />
        </div>

        {/* Selected Exercises */}
        {selectedExercises.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Your routine ({selectedExercises.length} exercise
              {selectedExercises.length !== 1 ? 's' : ''})
            </h2>
            <div className="space-y-3">
              {selectedExercises.map((item, index) => (
                <SelectedExerciseCard
                  key={item.exercise.id}
                  item={item}
                  index={index}
                  total={selectedExercises.length}
                  onUpdate={handleUpdateExercise}
                  onMove={handleMoveExercise}
                  onRemove={handleRemoveExercise}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
