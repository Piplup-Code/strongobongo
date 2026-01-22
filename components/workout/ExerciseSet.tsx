'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'

type Exercise = Database['public']['Tables']['exercises']['Row']
type SessionSet = Database['public']['Tables']['session_sets']['Row']

interface ExerciseSetProps {
  exercise: Exercise
  targetSets: number
  completedSets: SessionSet[]
  onSetLogged: (reps: number, weightKg: number | null) => Promise<void>
  isResting?: boolean
}

export function ExerciseSet({
  exercise,
  targetSets,
  completedSets,
  onSetLogged,
  isResting = false
}: ExerciseSetProps) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogSet = async () => {
    setError(null)

    // Validation
    const repsNum = parseInt(reps)
    if (!reps || isNaN(repsNum) || repsNum <= 0) {
      setError('Reps must be a number greater than 0')
      return
    }

    if (repsNum > 1000) {
      setError('Reps cannot exceed 1000')
      return
    }

    const weightNum = weight ? parseFloat(weight) : null
    if (weight) {
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
      // Clear inputs after successful log
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
    <Card className={isComplete ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{exercise.name}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{exercise.muscle_group}</Badge>
              <Badge variant="secondary">{exercise.equipment}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {completedCount}/{targetSets} sets
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completed Sets List */}
        {completedSets.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Completed Sets:</div>
            {completedSets.map((set, index) => (
              <div key={set.id} className="text-sm">
                Set {index + 1}: {set.reps} reps
                {set.weight_kg !== null && ` @ ${set.weight_kg}kg`}
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        {!isComplete && (
          <div className="space-y-3 pt-2 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Reps</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  disabled={isResting || isLogging}
                  className="text-lg h-12"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Weight (kg)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="50"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isResting || isLogging}
                  className="text-lg h-12"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <Button
              onClick={handleLogSet}
              disabled={isResting || isLogging || !reps}
              className="w-full h-12 text-base"
            >
              {isLogging ? 'Logging...' : 'Log Set'}
            </Button>
          </div>
        )}

        {isComplete && (
          <div className="text-center text-sm text-muted-foreground py-2">
            ✓ All sets completed
          </div>
        )}
      </CardContent>
    </Card>
  )
}
