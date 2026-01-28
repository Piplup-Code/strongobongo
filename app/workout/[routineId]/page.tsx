'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { FocusedExerciseInput } from '@/components/workout/FocusedExerciseInput'
import { ExerciseSwitcher } from '@/components/workout/ExerciseSwitcher'
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
import { ArrowLeft } from 'lucide-react'

type SessionSet = Database['public']['Tables']['session_sets']['Row']

export default function WorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const routineId = params.routineId as string

  const [routine, setRoutine] = useState<Awaited<ReturnType<typeof getRoutineWithExercises>>>(null)
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null)
  const [completedSets, setCompletedSets] = useState<SessionSet[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rest timer state
  const [isResting, setIsResting] = useState(false)
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0)

  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Swipe gesture handling
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const minSwipeDistance = 50

  // Load routine and create workout session
  useEffect(() => {
    async function initializeWorkout() {
      try {
        setIsLoading(true)
        setError(null)

        const routineData = await getRoutineWithExercises(routineId)
        if (!routineData) {
          setError('Routine not found')
          return
        }
        setRoutine(routineData)

        const sessionId = getOrCreateSessionId()
        const workoutId = await createWorkoutSession(sessionId, routineId)
        setWorkoutSessionId(workoutId)
        setWorkoutStartTime(new Date())

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

    elapsedIntervalRef.current = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current)
      }
    }
  }, [workoutStartTime])

  // Rest timer countdown
  useEffect(() => {
    if (!isResting || restSecondsRemaining <= 0) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
      if (isResting && restSecondsRemaining <= 0) {
        setIsResting(false)
      }
      return
    }

    restIntervalRef.current = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsResting(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
    }
  }, [isResting, restSecondsRemaining])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCompletedSetsForExercise = useCallback((exerciseId: string) => {
    return completedSets.filter((set) => set.exercise_id === exerciseId)
  }, [completedSets])

  const handleSetLogged = async (exerciseId: string, reps: number, weightKg: number | null) => {
    if (!workoutSessionId || !routine) return

    try {
      const newSet = await logSet(workoutSessionId, exerciseId, reps, weightKg)

      setCompletedSets((prev) => {
        const updated = [...prev, newSet]

        const exerciseConfig = routine.exercises.find((e) => e.exercise_id === exerciseId)
        const completedCount = updated.filter((s) => s.exercise_id === exerciseId).length

        // Start rest timer if not all sets complete
        if (
          exerciseConfig &&
          exerciseConfig.target_rest_seconds > 0 &&
          completedCount < exerciseConfig.target_sets
        ) {
          setIsResting(true)
          setRestSecondsRemaining(exerciseConfig.target_rest_seconds)
        } else if (completedCount >= (exerciseConfig?.target_sets || 0)) {
          // Exercise complete - auto advance after delay
          setTimeout(() => {
            if (currentExerciseIndex < routine.exercises.length - 1) {
              setCurrentExerciseIndex((prev) => prev + 1)
            }
          }, 1500)
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

  const handleSkipRest = () => {
    setIsResting(false)
    setRestSecondsRemaining(0)
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !routine) return

    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentExerciseIndex < routine.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
    } else if (isRightSwipe && currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1)
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workout...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !routine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="border-2 border-destructive bg-destructive/10 p-6 text-destructive mb-6 max-w-md">
          <div className="font-display text-xl uppercase mb-2">Error</div>
          <div>{error || 'Routine not found'}</div>
        </div>
        <Button asChild size="lg">
          <Link href="/">Back to Routines</Link>
        </Button>
      </div>
    )
  }

  const currentExercise = routine.exercises[currentExerciseIndex]
  const currentExerciseSets = getCompletedSetsForExercise(currentExercise.exercise_id)
  const isCurrentExerciseComplete = currentExerciseSets.length >= currentExercise.target_sets

  // Check if entire workout is complete
  const allExercisesComplete = routine.exercises.every((e) => {
    const sets = getCompletedSetsForExercise(e.exercise_id)
    return sets.length >= e.target_sets
  })

  // Build exercise info for switcher
  const exerciseInfos = routine.exercises.map((e) => ({
    id: e.exercise_id,
    name: e.exercise.name,
    targetSets: e.target_sets,
    completedSets: getCompletedSetsForExercise(e.exercise_id).length,
  }))

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground/20">
        <button
          onClick={() => setShowExitDialog(true)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Exit</span>
        </button>

        <div className="font-mono text-lg">{formatTime(elapsedSeconds)}</div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <FocusedExerciseInput
          key={currentExercise.exercise_id}
          exercise={currentExercise.exercise}
          targetSets={currentExercise.target_sets}
          targetReps={currentExercise.target_reps}
          targetWeight={currentExercise.target_weight_kg}
          completedSets={currentExerciseSets}
          onSetLogged={async (reps, weightKg) => {
            await handleSetLogged(currentExercise.exercise_id, reps, weightKg)
          }}
          isResting={isResting && !isCurrentExerciseComplete}
          restSecondsRemaining={restSecondsRemaining}
          onSkipRest={handleSkipRest}
        />

        {/* Complete Workout Button - shows when current exercise is done */}
        {isCurrentExerciseComplete && (
          <div className="px-6 pb-4">
            <Button
              onClick={() => setShowCompleteDialog(true)}
              variant={allExercisesComplete ? 'default' : 'outline'}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {allExercisesComplete ? '✓ Complete Workout' : 'Finish Early'}
            </Button>
          </div>
        )}
      </main>

      {/* Exercise Switcher */}
      <ExerciseSwitcher
        exercises={exerciseInfos}
        currentIndex={currentExerciseIndex}
        onNavigate={setCurrentExerciseIndex}
      />

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Workout?</DialogTitle>
            <DialogDescription>
              Your progress will be saved, but the workout won&apos;t be marked as complete.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => router.push('/')}>
              Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Workout Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Workout?</DialogTitle>
            <DialogDescription>
              {allExercisesComplete
                ? `Great work! Total time: ${formatTime(elapsedSeconds)}`
                : `Some exercises aren't finished. Complete anyway? Total time: ${formatTime(elapsedSeconds)}`}
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
