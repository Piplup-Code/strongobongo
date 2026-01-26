'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'
import { cn } from '@/lib/utils'

type Exercise = Database['public']['Tables']['exercises']['Row']
type SessionSet = Database['public']['Tables']['session_sets']['Row']

interface ExerciseSetProps {
  exercise: Exercise
  targetSets: number
  targetReps: number
  targetWeight: number | null
  completedSets: SessionSet[]
  onSetLogged: (reps: number, weightKg: number | null) => Promise<void>
  isResting?: boolean
  isCurrent?: boolean
}

export function ExerciseSet({
  exercise,
  targetSets,
  targetReps,
  targetWeight,
  completedSets,
  onSetLogged,
  isResting = false,
  isCurrent = false
}: ExerciseSetProps) {
  // Get the last completed set to pre-fill values
  const lastSet = completedSets.length > 0 ? completedSets[completedSets.length - 1] : null

  // Placeholder defaults: prioritize last set, then routine targets
  const repsPlaceholder = lastSet ? String(lastSet.reps) : String(targetReps)
  const weightPlaceholder = lastSet?.weight_kg != null
    ? String(lastSet.weight_kg)
    : (targetWeight != null ? String(targetWeight) : '')

  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogSet = async () => {
    setError(null)

    // Use entered value or fall back to placeholder
    const repsValue = reps || repsPlaceholder
    const weightValue = weight || weightPlaceholder

    // Validation
    const repsNum = parseInt(repsValue)
    if (!repsValue || isNaN(repsNum) || repsNum <= 0) {
      setError('Reps must be a number greater than 0')
      return
    }

    if (repsNum > 1000) {
      setError('Reps cannot exceed 1000')
      return
    }

    const weightNum = weightValue ? parseFloat(weightValue) : null
    if (weightValue) {
      if (isNaN(weightNum!) || weightNum! < 0) {
        setError('Weight must be a number greater than or equal to 0')
        return
      }
      if (weightNum! > 1000) {
        setError('Weight cannot exceed 1000kg')
        return
      }
    }

    setIsLogging(true)
    try {
      await onSetLogged(repsNum, weightNum)
      // Clear inputs - placeholders will update to show last logged values
      setReps('')
      setWeight('')
      setError(null)
    } catch (err) {
      console.error('Error logging set:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to log set'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLogging(false)
    }
  }

  const completedCount = completedSets.length
  const isComplete = completedCount >= targetSets

  return (
    <Card className={cn(
      isComplete ? 'opacity-50' : '',
      isCurrent && !isComplete ? 'border-primary/50 shadow-[8px_8px_0px_0px_rgba(var(--primary),0.3)]' : ''
    )}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-3xl md:text-4xl mb-3">{exercise.name}</CardTitle>
            <div className="flex gap-3 mt-3">
              <Badge variant="outline" className="font-semibold uppercase tracking-wider border-2 px-3 py-1">
                {exercise.muscle_group}
              </Badge>
              <Badge variant="secondary" className="font-semibold uppercase tracking-wider border-2 px-3 py-1">
                {exercise.equipment}
              </Badge>
            </div>
          </div>
          <div className="text-2xl font-display font-bold uppercase tracking-wider text-muted-foreground">
            {completedCount}/{targetSets}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completed Sets List */}
        {completedSets.length > 0 && (
          <div className="space-y-2 pb-4 border-b-2 border-foreground/20">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Completed Sets</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {completedSets.map((set, index) => (
                <div key={set.id} className="border-2 border-foreground/20 p-3 bg-secondary/30">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Set {index + 1}</div>
                  <div className="font-mono text-lg font-bold">
                    {set.reps} reps
                    {set.weight_kg !== null && ` @ ${set.weight_kg}kg`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        {!isComplete && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Reps</label>
                <Input
                  type="number"
                  min="1"
                  placeholder={repsPlaceholder}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  disabled={isResting || isLogging}
                  className="text-2xl font-mono font-bold text-center"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Weight (kg)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder={weightPlaceholder || '—'}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isResting || isLogging}
                  className="text-2xl font-mono font-bold text-center"
                />
              </div>
            </div>

            {error && (
              <div className="border-2 border-destructive bg-destructive/10 p-3 text-destructive font-semibold uppercase text-xs tracking-wider">
                {error}
              </div>
            )}

            <Button
              onClick={handleLogSet}
              disabled={isResting || isLogging}
              className="w-full"
              size="lg"
            >
              {isLogging ? 'Logging...' : 'Log Set'}
            </Button>
          </div>
        )}

        {isComplete && (
          <div className="text-center border-2 border-primary/50 bg-primary/10 p-4">
            <div className="font-display text-xl uppercase tracking-wider text-primary">✓ All Sets Completed</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
