'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExerciseGrid } from '@/components/routines/ExerciseGrid'
import {
  SelectedExerciseCard,
  SelectedExercise,
} from '@/components/routines/SelectedExerciseCard'
import { createRoutine } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'
import { ArrowLeft, Save } from 'lucide-react'

type Exercise = Database['public']['Tables']['exercises']['Row']

export default function NewRoutinePage() {
  const router = useRouter()
  const [routineName, setRoutineName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const sessionId = getOrCreateSessionId()
      const exercises = selectedExercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_weight_kg: ex.target_weight_kg,
        target_rest_seconds: ex.target_rest_seconds,
      }))

      await createRoutine(sessionId, routineName, exercises)
      toast.success('Routine created successfully!')
      router.push('/')
    } catch (err) {
      console.error('Error creating routine:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create routine'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedIds = selectedExercises.map((ex) => ex.exercise.id)

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/98 backdrop-blur border-b-2 border-foreground/20">
        <div className="container mx-auto px-6 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
            <h1 className="text-3xl font-display uppercase tracking-wider">New Routine</h1>
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving || selectedExercises.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
        {/* Routine Name */}
        <div className="animate-reveal">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Routine Name
          </label>
          <Input
            type="text"
            placeholder="Push Day"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            className="text-2xl font-display uppercase"
          />
          <div className="text-center mt-4">
            <Link
              href="/templates"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              or start from a template
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-2 border-destructive bg-destructive/10 p-4 text-destructive animate-reveal">
            <div className="font-display text-lg uppercase mb-1">Error</div>
            <div className="font-body">{error}</div>
          </div>
        )}

        {/* Exercise Selection */}
        <div className="animate-reveal-delay-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Tap to add exercises
          </h2>
          <ExerciseGrid selectedIds={selectedIds} onSelect={handleAddExercise} />
        </div>

        {/* Selected Exercises */}
        {selectedExercises.length > 0 && (
          <div className="animate-reveal-delay-2">
            <h2 className="text-2xl font-display uppercase tracking-wider mb-4">
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
