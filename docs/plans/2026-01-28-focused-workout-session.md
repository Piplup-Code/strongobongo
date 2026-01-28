# Focused Workout Session Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the workout session screen to show one exercise at a time with minimal UI, improving focus and mobile usability.

**Architecture:** Replace the scrolling list of exercise cards with a single-exercise view. Navigation between exercises via bottom switcher bar with swipe/tap. Rest timer integrates into the same view rather than appearing as a separate component. Completion triggers visual feedback and auto-advances.

**Tech Stack:** React, Next.js, Tailwind CSS, existing Supabase queries (no backend changes)

---

## Task 1: Create SetProgressDots Component

**Files:**
- Create: `components/workout/SetProgressDots.tsx`

**Step 1: Create the component**

```tsx
// components/workout/SetProgressDots.tsx
interface SetProgressDotsProps {
  total: number
  completed: number
  isResting?: boolean
}

export function SetProgressDots({ total, completed, isResting = false }: SetProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < completed
        const isInProgress = i === completed && isResting

        return (
          <div
            key={i}
            className={`
              w-4 h-4 rounded-full border-2 border-foreground transition-all duration-300
              ${isFilled ? 'bg-foreground' : ''}
              ${isInProgress ? 'bg-foreground/50 animate-pulse' : ''}
            `}
          />
        )
      })}
    </div>
  )
}
```

**Step 2: Verify it renders correctly**

Temporarily import into workout page and test with different values:
- `<SetProgressDots total={3} completed={0} />` → 3 empty dots
- `<SetProgressDots total={3} completed={2} />` → 2 filled, 1 empty
- `<SetProgressDots total={3} completed={2} isResting />` → 2 filled, 1 pulsing

**Step 3: Commit**

```bash
git add components/workout/SetProgressDots.tsx
git commit -m "feat: add SetProgressDots component for visual set progress"
```

---

## Task 2: Create ExerciseSwitcher Component

**Files:**
- Create: `components/workout/ExerciseSwitcher.tsx`

**Step 1: Create the component**

```tsx
// components/workout/ExerciseSwitcher.tsx
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SetProgressDots } from './SetProgressDots'

interface ExerciseInfo {
  id: string
  name: string
  targetSets: number
  completedSets: number
}

interface ExerciseSwitcherProps {
  exercises: ExerciseInfo[]
  currentIndex: number
  onNavigate: (index: number) => void
}

export function ExerciseSwitcher({ exercises, currentIndex, onNavigate }: ExerciseSwitcherProps) {
  const prev = exercises[currentIndex - 1]
  const next = exercises[currentIndex + 1]

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t-2 border-foreground/20 bg-background">
      {/* Previous exercise */}
      <button
        onClick={() => prev && onNavigate(currentIndex - 1)}
        disabled={!prev}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-0 flex-1"
      >
        <ChevronLeft className="h-5 w-5 flex-shrink-0" />
        {prev && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{prev.name}</span>
            <SetProgressDots total={prev.targetSets} completed={prev.completedSets} />
          </div>
        )}
      </button>

      {/* Current indicator */}
      <div className="flex-shrink-0 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {currentIndex + 1}/{exercises.length}
      </div>

      {/* Next exercise */}
      <button
        onClick={() => next && onNavigate(currentIndex + 1)}
        disabled={!next}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-0 flex-1 justify-end"
      >
        {next && (
          <div className="flex items-center gap-2 min-w-0">
            <SetProgressDots total={next.targetSets} completed={next.completedSets} />
            <span className="truncate">{next.name}</span>
          </div>
        )}
        <ChevronRight className="h-5 w-5 flex-shrink-0" />
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/workout/ExerciseSwitcher.tsx
git commit -m "feat: add ExerciseSwitcher component for exercise navigation"
```

---

## Task 3: Create FocusedExerciseInput Component

**Files:**
- Create: `components/workout/FocusedExerciseInput.tsx`

This replaces the complex ExerciseSet card with a minimal, focused input view.

**Step 1: Create the component**

```tsx
// components/workout/FocusedExerciseInput.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SetProgressDots } from './SetProgressDots'
import { Database } from '@/types/database'
import { Check } from 'lucide-react'

type Exercise = Database['public']['Tables']['exercises']['Row']
type SessionSet = Database['public']['Tables']['session_sets']['Row']

interface FocusedExerciseInputProps {
  exercise: Exercise
  targetSets: number
  targetReps: number
  targetWeight: number | null
  completedSets: SessionSet[]
  onSetLogged: (reps: number, weightKg: number | null) => Promise<void>
  isResting: boolean
  restSecondsRemaining?: number
  onSkipRest?: () => void
}

export function FocusedExerciseInput({
  exercise,
  targetSets,
  targetReps,
  targetWeight,
  completedSets,
  onSetLogged,
  isResting,
  restSecondsRemaining = 0,
  onSkipRest,
}: FocusedExerciseInputProps) {
  const lastSet = completedSets[completedSets.length - 1]
  const repsPlaceholder = lastSet ? String(lastSet.reps) : String(targetReps)
  const weightPlaceholder = lastSet?.weight_kg != null
    ? String(lastSet.weight_kg)
    : (targetWeight != null ? String(targetWeight) : '')

  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  const completedCount = completedSets.length
  const isComplete = completedCount >= targetSets
  const currentSetNumber = completedCount + 1

  const handleLogSet = async () => {
    const repsValue = reps || repsPlaceholder
    const weightValue = weight || weightPlaceholder

    const repsNum = parseInt(repsValue)
    if (!repsValue || isNaN(repsNum) || repsNum <= 0) return

    const weightNum = weightValue ? parseFloat(weightValue) : null

    setIsLogging(true)
    try {
      await onSetLogged(repsNum, weightNum)
      setReps('')
      setWeight('')
    } finally {
      setIsLogging(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-8">
      {/* Exercise name */}
      <h1 className="text-4xl md:text-5xl font-display text-center mb-2 tracking-tight">
        {exercise.name}
      </h1>

      {/* Status text */}
      <p className="text-lg text-muted-foreground mb-6">
        {isComplete
          ? 'Complete!'
          : isResting
          ? `Rest before Set ${currentSetNumber}`
          : `Set ${currentSetNumber} of ${targetSets}`}
      </p>

      {/* Progress dots */}
      <div className="mb-10">
        <SetProgressDots
          total={targetSets}
          completed={completedCount}
          isResting={isResting}
        />
      </div>

      {/* Completion state */}
      {isComplete && (
        <div className="flex flex-col items-center gap-4 animate-reveal">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">All sets completed</p>
        </div>
      )}

      {/* Resting state */}
      {!isComplete && isResting && (
        <div className="flex flex-col items-center gap-6 animate-reveal">
          <div className="text-6xl font-mono font-bold">
            {formatTime(restSecondsRemaining)}
          </div>
          <p className="text-muted-foreground">remaining</p>
          <Button variant="outline" size="lg" onClick={onSkipRest}>
            Skip Rest
          </Button>
        </div>
      )}

      {/* Input state */}
      {!isComplete && !isResting && (
        <div className="w-full max-w-xs space-y-6 animate-reveal">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block text-center">
                Reps
              </label>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                placeholder={repsPlaceholder}
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                disabled={isLogging}
                className="text-3xl font-mono font-bold text-center h-16"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block text-center">
                kg
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                placeholder={weightPlaceholder || '—'}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={isLogging}
                className="text-3xl font-mono font-bold text-center h-16"
              />
            </div>
          </div>

          <Button
            onClick={handleLogSet}
            disabled={isLogging}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {isLogging ? 'Logging...' : 'Log Set'}
          </Button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/workout/FocusedExerciseInput.tsx
git commit -m "feat: add FocusedExerciseInput component for minimal set logging"
```

---

## Task 4: Refactor Workout Page to Single-Exercise View

**Files:**
- Modify: `app/workout/[routineId]/page.tsx`

**Step 1: Replace the workout page with the new focused design**

```tsx
// app/workout/[routineId]/page.tsx
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
      <main className="flex-1 flex flex-col">
        <FocusedExerciseInput
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
```

**Step 2: Commit**

```bash
git add app/workout/[routineId]/page.tsx
git commit -m "feat: refactor workout page to single-exercise focused view"
```

---

## Task 5: Add Swipe Gesture Support

**Files:**
- Modify: `app/workout/[routineId]/page.tsx`

**Step 1: Add touch event handling for swipe navigation**

Add this hook and apply it to the main content area:

```tsx
// Add this inside the WorkoutPage component, after the state declarations

// Swipe gesture handling
const touchStartX = useRef<number | null>(null)
const touchEndX = useRef<number | null>(null)
const minSwipeDistance = 50

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.targetTouches[0].clientX
  touchEndX.current = null
}

const handleTouchMove = (e: React.TouchEvent) => {
  touchEndX.current = e.targetTouches[0].clientX
}

const handleTouchEnd = () => {
  if (!touchStartX.current || !touchEndX.current) return

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
```

Then update the `<main>` element:

```tsx
<main
  className="flex-1 flex flex-col"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
```

**Step 2: Commit**

```bash
git add app/workout/[routineId]/page.tsx
git commit -m "feat: add swipe gesture navigation between exercises"
```

---

## Task 6: Add Slide Transition Animation

**Files:**
- Modify: `app/globals.css`
- Modify: `components/workout/FocusedExerciseInput.tsx`

**Step 1: Add slide animation keyframes to globals.css**

Add to the end of `app/globals.css`:

```css
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slide-in-right 0.2s ease-out;
}
```

**Step 2: Add key prop to trigger re-render animation**

In the workout page, update FocusedExerciseInput to include a key:

```tsx
<FocusedExerciseInput
  key={currentExercise.exercise_id}  // Add this line
  exercise={currentExercise.exercise}
  // ... rest of props
/>
```

And add the animation class to FocusedExerciseInput's root div:

```tsx
// In FocusedExerciseInput.tsx, update the root div:
<div className="flex flex-col items-center justify-center flex-1 px-6 py-8 animate-slide-in">
```

**Step 3: Commit**

```bash
git add app/globals.css components/workout/FocusedExerciseInput.tsx
git commit -m "feat: add slide transition animation when switching exercises"
```

---

## Task 7: Polish and Test

**Step 1: Manual testing checklist**

Run the dev server and test:

```bash
npm run dev
```

Test these scenarios:
- [ ] Start a workout with 3+ exercises
- [ ] Log a set → rest timer appears
- [ ] Skip rest → inputs return
- [ ] Complete all sets for an exercise → completion state shows
- [ ] Auto-advance to next exercise after 1.5s
- [ ] Swipe left/right to change exercises
- [ ] Tap arrows in bottom bar to navigate
- [ ] Exit workout → confirmation dialog
- [ ] Complete workout → success toast, redirect home
- [ ] Test on mobile viewport (Chrome DevTools)

**Step 2: Fix any issues found during testing**

Address any bugs or UX issues discovered.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: polish focused workout session UI"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | SetProgressDots component | `components/workout/SetProgressDots.tsx` |
| 2 | ExerciseSwitcher component | `components/workout/ExerciseSwitcher.tsx` |
| 3 | FocusedExerciseInput component | `components/workout/FocusedExerciseInput.tsx` |
| 4 | Refactor workout page | `app/workout/[routineId]/page.tsx` |
| 5 | Swipe gesture support | `app/workout/[routineId]/page.tsx` |
| 6 | Slide transition animation | `app/globals.css`, `FocusedExerciseInput.tsx` |
| 7 | Polish and test | All files |

**Old files that can be deleted after migration:**
- `components/workout/ExerciseSet.tsx` (replaced by FocusedExerciseInput)
- `components/workout/RestTimer.tsx` (integrated into FocusedExerciseInput)
