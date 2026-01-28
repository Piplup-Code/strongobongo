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
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 animate-slide-in">
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
