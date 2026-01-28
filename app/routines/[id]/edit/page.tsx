'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MuscleGroupAccordion } from '@/components/routines/MuscleGroupAccordion'
import { RoutineNowPlayingBar } from '@/components/routines/RoutineNowPlayingBar'
import { DraggableExerciseList } from '@/components/routines/DraggableExerciseList'
import { SelectedExercise } from '@/components/routines/SelectedExerciseCard'
import { getRoutineWithExercises, getExercises, updateRoutine } from '@/lib/supabase/queries'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'

type Exercise = Database['public']['Tables']['exercises']['Row']

// Default values for new exercises
const DEFAULT_SETS = 3
const DEFAULT_REPS = 10
const DEFAULT_REST = 60

export default function EditRoutinePage() {
  const router = useRouter()
  const params = useParams()
  const routineId = params.id as string

  const [routineName, setRoutineName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'picker' | 'routine'>('routine') // Start on routine view for edit

  // Load routine and exercises
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)

        // Load routine data
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

        // Load all exercises for the picker
        const allExercises = await getExercises()
        setExercises(allExercises)

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
      loadData()
    }
  }, [routineId])

  // Group exercises by muscle group
  const exercisesByMuscle = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    exercises.forEach((e) => {
      const group = e.muscle_group || 'Other'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(e)
    })
    return groups
  }, [exercises])

  const muscleGroups = Object.keys(exercisesByMuscle).sort()
  const selectedIds = selectedExercises.map((e) => e.exercise.id)

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      exercise,
      order_index: selectedExercises.length,
      target_sets: DEFAULT_SETS,
      target_reps: DEFAULT_REPS,
      target_weight_kg: null,
      target_rest_seconds: DEFAULT_REST,
    }
    setSelectedExercises([...selectedExercises, newExercise])
    toast.success(`Added ${exercise.name}`)
  }

  const handleReorder = (reordered: SelectedExercise[]) => {
    setSelectedExercises(reordered)
  }

  const handleUpdate = (index: number, updates: Partial<SelectedExercise>) => {
    const updated = [...selectedExercises]
    updated[index] = { ...updated[index], ...updates }
    setSelectedExercises(updated)
  }

  const handleRemove = (index: number) => {
    const updated = selectedExercises
      .filter((_, i) => i !== index)
      .map((e, i) => ({ ...e, order_index: i }))
    setSelectedExercises(updated)
  }

  const handleSave = async () => {
    if (!routineName.trim()) {
      toast.error('Please enter a routine name')
      return
    }
    if (selectedExercises.length === 0) {
      toast.error('Please add at least one exercise')
      return
    }

    setIsSaving(true)
    try {
      const exercisesData = selectedExercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_weight_kg: ex.target_weight_kg,
        target_rest_seconds: ex.target_rest_seconds,
      }))

      await updateRoutine(routineId, routineName, exercisesData)
      toast.success('Routine updated!')
      router.push('/')
    } catch (err) {
      console.error('Error updating routine:', err)
      toast.error('Failed to update routine')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b-2 border-foreground/20">
          <div className="container mx-auto px-4 py-4 max-w-lg">
            <div className="flex items-center justify-between">
              <div className="h-5 w-5 bg-muted animate-pulse" />
              <div className="h-6 w-24 bg-muted animate-pulse" />
              <div className="h-8 w-16 bg-muted animate-pulse" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-lg space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error && !routineName) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <div className="border-2 border-destructive bg-destructive/10 p-4 text-destructive mb-4">
            <div className="font-display text-lg uppercase mb-1">Error</div>
            <div>{error}</div>
          </div>
          <Button asChild>
            <Link href="/">Back to Routines</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Routine view (default for edit)
  if (view === 'routine') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b-2 border-foreground/20">
          <div className="container mx-auto px-4 py-4 max-w-lg">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-display text-xl uppercase tracking-wider">
                Edit Routine
              </h1>
              <Button onClick={handleSave} disabled={isSaving || !routineName.trim()}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6 max-w-lg">
          {/* Routine Name */}
          <div className="mb-6">
            <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">
              Routine Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Push Day, Upper Body, Leg Day"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="text-xl font-display"
            />
          </div>

          {/* Yellow accent line */}
          <div className="w-8 h-1 bg-primary mb-4" />

          <h2 className="font-display text-lg uppercase tracking-wider mb-2">
            Exercises
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''}
          </p>

          {selectedExercises.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-foreground/10 mb-6">
              <p className="mb-2">No exercises in this routine.</p>
              <p className="text-sm">Add exercises below.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                Drag to reorder • Tap to configure
              </p>
              <div className="mb-6">
                <DraggableExerciseList
                  exercises={selectedExercises}
                  onReorder={handleReorder}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              </div>
            </>
          )}

          {/* Add more exercises button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setView('picker')}
          >
            + Add more exercises
          </Button>
        </div>
      </div>
    )
  }

  // Picker view
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b-2 border-foreground/20">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('routine')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <h1 className="font-display text-xl uppercase tracking-wider">
              Add Exercises
            </h1>
            <div className="w-16" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 bg-primary" />
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
            Select exercises
          </h2>
        </div>

        {/* Muscle Group Accordions */}
        <div className="border-t-2 border-foreground/10">
          {muscleGroups.map((muscle, index) => (
            <MuscleGroupAccordion
              key={muscle}
              muscleGroup={muscle}
              exercises={exercisesByMuscle[muscle]}
              selectedIds={selectedIds}
              onSelect={handleAddExercise}
              defaultExpanded={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Now Playing Bar */}
      <RoutineNowPlayingBar
        count={selectedExercises.length}
        onView={() => setView('routine')}
      />
    </div>
  )
}
