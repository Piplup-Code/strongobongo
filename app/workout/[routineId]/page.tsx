'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ExerciseSet } from '@/components/workout/ExerciseSet'
import { RestTimer } from '@/components/workout/RestTimer'
import {
  getRoutineWithExercises,
  createWorkoutSession,
  logSet,
  getSessionSets,
  completeWorkout
} from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'

type SessionSet = Database['public']['Tables']['session_sets']['Row']

interface ActiveRestTimer {
  exerciseId: string
  durationSeconds: number
}

export default function WorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const routineId = params.routineId as string

  const [routine, setRoutine] = useState<Awaited<ReturnType<typeof getRoutineWithExercises>>>(null)
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null)
  const [completedSets, setCompletedSets] = useState<SessionSet[]>([])
  const [activeRestTimer, setActiveRestTimer] = useState<ActiveRestTimer | null>(null)
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load routine and create workout session
  useEffect(() => {
    async function initializeWorkout() {
      try {
        setIsLoading(true)
        setError(null)

        // Load routine
        const routineData = await getRoutineWithExercises(routineId)
        if (!routineData) {
          setError('Routine not found')
          return
        }
        setRoutine(routineData)

        // Create workout session
        const sessionId = getOrCreateSessionId()
        const workoutId = await createWorkoutSession(sessionId, routineId)
        setWorkoutSessionId(workoutId)
        setWorkoutStartTime(new Date())

        // Load existing sets (in case of page refresh)
        const sets = await getSessionSets(workoutId)
        setCompletedSets(sets)

        toast.success('Workout started!')
      } catch (err) {
        console.error('Error initializing workout:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to start workout'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (routineId) {
      initializeWorkout()
    }
  }, [routineId])

  // Track elapsed time
  useEffect(() => {
    if (!workoutStartTime) return

    intervalRef.current = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [workoutStartTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSetLogged = async (exerciseId: string, reps: number, weightKg: number | null) => {
    if (!workoutSessionId || !routine) return

    try {
      // Log set to database
      const newSet = await logSet(workoutSessionId, exerciseId, reps, weightKg)
      
      // Update state
      setCompletedSets((prev) => {
        const updated = [...prev, newSet]
        
        // Find exercise config for rest timer
        const exerciseConfig = routine.exercises.find((e) => e.exercise_id === exerciseId)
        const completedCount = updated.filter((s) => s.exercise_id === exerciseId).length
        
        // Only start rest timer if not all sets are complete
        if (
          exerciseConfig &&
          exerciseConfig.target_rest_seconds > 0 &&
          completedCount < exerciseConfig.target_sets
        ) {
          setActiveRestTimer({
            exerciseId,
            durationSeconds: exerciseConfig.target_rest_seconds
          })
        } else {
          // All sets complete for this exercise, clear any active timer
          setActiveRestTimer(null)
        }
        
        return updated
      })

      toast.success('Set logged!')
    } catch (err) {
      console.error('Error logging set:', err)
      toast.error('Failed to log set. Please try again.')
      throw err
    }
  }

  const handleRestComplete = () => {
    setActiveRestTimer(null)
  }

  const handleRestSkip = () => {
    setActiveRestTimer(null)
  }

  const handleCompleteWorkout = async () => {
    if (!workoutSessionId || !workoutStartTime) return

    setIsCompleting(true)
    try {
      const totalSeconds = Math.floor(
        (new Date().getTime() - workoutStartTime.getTime()) / 1000
      )
      await completeWorkout(workoutSessionId, totalSeconds)
      toast.success(`Workout completed! Total time: ${formatTime(totalSeconds)}`)
      router.push('/')
    } catch (err) {
      console.error('Error completing workout:', err)
      toast.error('Failed to complete workout. Please try again.')
    } finally {
      setIsCompleting(false)
      setShowCompleteDialog(false)
    }
  }

  const getCompletedSetsForExercise = (exerciseId: string) => {
    return completedSets.filter((set) => set.exercise_id === exerciseId)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <div className="h-16 bg-muted animate-pulse rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !routine) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mb-4">
          {error || 'Routine not found'}
        </div>
        <Button asChild>
          <Link href="/">Back to Routines</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{routine.name}</h1>
            <p className="text-sm text-muted-foreground">Elapsed: {formatTime(elapsedSeconds)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Exit workout? Your progress will be saved, but the workout won\'t be marked as complete.')) {
                router.push('/')
              }
            }}
          >
            Exit
          </Button>
        </div>
        {/* Progress indicator */}
        {(() => {
          const completedExercises = routine.exercises.filter((e) => {
            const sets = completedSets.filter((s) => s.exercise_id === e.exercise_id)
            return sets.length >= e.target_sets
          }).length
          const totalExercises = routine.exercises.length
          const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0
          return (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{completedExercises}/{totalExercises} exercises</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })()}
      </div>

      {/* Exercises */}
      <div className="space-y-6">
        {routine.exercises.map((routineExercise, index) => {
          const exerciseSets = getCompletedSetsForExercise(routineExercise.exercise_id)
          const isComplete = exerciseSets.length >= routineExercise.target_sets
          
          // Current exercise is the first incomplete one
          const isCurrentExercise = !isComplete && routine.exercises
            .slice(0, index)
            .every((e) => {
              const sets = getCompletedSetsForExercise(e.exercise_id)
              return sets.length >= e.target_sets
            })

          const isResting = activeRestTimer?.exerciseId === routineExercise.exercise_id

          return (
            <div key={routineExercise.id} className="space-y-4">
              <ExerciseSet
                exercise={routineExercise.exercise}
                targetSets={routineExercise.target_sets}
                completedSets={exerciseSets}
                onSetLogged={async (reps, weightKg) => {
                  await handleSetLogged(routineExercise.exercise_id, reps, weightKg)
                }}
                isResting={isResting}
              />

              {/* Rest Timer - only show for current exercise */}
              {isResting && isCurrentExercise && (
                <RestTimer
                  durationSeconds={activeRestTimer.durationSeconds}
                  onComplete={handleRestComplete}
                  onSkip={handleRestSkip}
                  autoStart={true}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Complete Workout Button */}
      <div className="mt-8 pt-6 border-t">
        <Button
          onClick={() => setShowCompleteDialog(true)}
          size="lg"
          className="w-full h-12 text-base"
        >
          Complete Workout
        </Button>
      </div>

      {/* Complete Workout Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Workout?</DialogTitle>
            <DialogDescription>
              Are you sure you want to complete this workout? The session will be saved with a
              total duration of {formatTime(elapsedSeconds)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button onClick={handleCompleteWorkout} disabled={isCompleting}>
              {isCompleting ? 'Completing...' : 'Complete Workout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
