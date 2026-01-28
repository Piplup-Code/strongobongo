'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MuscleGroupAccordion } from '@/components/routines/MuscleGroupAccordion'
import { RoutineNowPlayingBar } from '@/components/routines/RoutineNowPlayingBar'
import { RoutineBuilderView } from '@/components/routines/RoutineBuilderView'
import { SelectedExercise } from '@/components/routines/SelectedExerciseCard'
import { getExercises, createRoutine } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'

type Exercise = Database['public']['Tables']['exercises']['Row']

// Default values for new exercises
const DEFAULT_SETS = 3
const DEFAULT_REPS = 10
const DEFAULT_REST = 60

export default function NewRoutinePage() {
  const router = useRouter()
  const [routineName, setRoutineName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [view, setView] = useState<'picker' | 'routine'>('picker')

  // Load exercises
  useEffect(() => {
    async function loadExercises() {
      try {
        const data = await getExercises()
        setExercises(data)
      } catch (error) {
        console.error('Error loading exercises:', error)
        toast.error('Failed to load exercises')
      } finally {
        setLoading(false)
      }
    }
    loadExercises()
  }, [])

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
      const sessionId = getOrCreateSessionId()
      const exercisesData = selectedExercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_weight_kg: ex.target_weight_kg,
        target_rest_seconds: ex.target_rest_seconds,
      }))

      await createRoutine(sessionId, routineName, exercisesData)
      toast.success('Routine created!')
      router.push('/')
    } catch (err) {
      console.error('Error creating routine:', err)
      toast.error('Failed to create routine')
    } finally {
      setIsSaving(false)
    }
  }

  // Routine view
  if (view === 'routine') {
    return (
      <RoutineBuilderView
        exercises={selectedExercises}
        onBack={() => setView('picker')}
        onSave={handleSave}
        onReorder={handleReorder}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        isSaving={isSaving}
        canSave={routineName.trim().length > 0 && selectedExercises.length > 0}
      />
    )
  }

  // Picker view
  return (
    <div className="min-h-screen bg-background pb-20">
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
              New Routine
            </h1>
            <Button
              onClick={handleSave}
              disabled={isSaving || selectedExercises.length === 0 || !routineName.trim()}
            >
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

        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 bg-primary" />
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
            Select exercises
          </h2>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          /* Muscle Group Accordions */
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
        )}

        {/* Template link */}
        <div className="text-center mt-8">
          <Link
            href="/templates"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            or start from a template
            <span className="text-primary">→</span>
          </Link>
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
