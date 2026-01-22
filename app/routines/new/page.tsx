'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExerciseSelector } from '@/components/ExerciseSelector'
import { Separator } from '@/components/ui/separator'
import { createRoutine } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'
import { ArrowUpIcon, ArrowDownIcon, XIcon } from 'lucide-react'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface SelectedExercise {
  exercise: Exercise
  order_index: number
  target_sets: number
  target_rest_seconds: number
}

export default function NewRoutinePage() {
  const router = useRouter()
  const [routineName, setRoutineName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddExercise = (exercise: Exercise) => {
    // Check if already added
    if (selectedExercises.some((e) => e.exercise.id === exercise.id)) {
      setError('Exercise already added to routine')
      return
    }

    const newExercise: SelectedExercise = {
      exercise,
      order_index: selectedExercises.length,
      target_sets: 3,
      target_rest_seconds: 90
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

  const handleSave = async () => {
    setError(null)

    // Validation
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
        target_rest_seconds: ex.target_rest_seconds
      }))

      const routineId = await createRoutine(sessionId, routineName, exercises)
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

  const excludeIds = selectedExercises.map((ex) => ex.exercise.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Back to routines
        </Link>
        <h1 className="text-3xl font-bold mt-4">Create New Routine</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Routine Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="e.g., Push Day, Full Body, etc."
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExerciseSelector
              onSelect={handleAddExercise}
              excludeIds={excludeIds}
              muscleGroupFilter={muscleGroupFilter || undefined}
              onMuscleGroupChange={setMuscleGroupFilter}
            />

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {selectedExercises.length === 0 && !error && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No exercises added yet.</p>
                <p className="text-xs mt-1">Select an exercise above to add it to your routine.</p>
              </div>
            )}

            {selectedExercises.length > 0 && (
              <div className="space-y-3 mt-4">
                <Separator />
                <h3 className="font-semibold">Selected Exercises ({selectedExercises.length})</h3>
                {selectedExercises.map((item, index) => (
                  <Card key={item.exercise.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{item.exercise.name}</span>
                            <Badge variant="outline">{item.exercise.muscle_group}</Badge>
                            <Badge variant="secondary">{item.exercise.equipment}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="text-sm text-muted-foreground">Target Sets</label>
                              <Input
                                type="number"
                                min="1"
                                value={item.target_sets}
                                onChange={(e) => {
                                  const updated = [...selectedExercises]
                                  updated[index].target_sets = parseInt(e.target.value) || 1
                                  setSelectedExercises(updated)
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Rest (seconds)</label>
                              <Input
                                type="number"
                                min="0"
                                value={item.target_rest_seconds}
                                onChange={(e) => {
                                  const updated = [...selectedExercises]
                                  updated[index].target_rest_seconds = parseInt(e.target.value) || 0
                                  setSelectedExercises(updated)
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveExercise(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveExercise(index, 'down')}
                            disabled={index === selectedExercises.length - 1}
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveExercise(index)}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Routine'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
