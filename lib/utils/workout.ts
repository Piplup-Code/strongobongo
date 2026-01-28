/**
 * Workout utility functions for history and stats
 */

import { WorkoutHistorySet } from '@/lib/supabase/queries'

/**
 * Calculate total volume (weight × reps) for all sets
 * Returns volume in kg
 */
export function calculateTotalVolume(sets: WorkoutHistorySet[]): number {
  return sets.reduce((total, set) => {
    const weight = set.weight_kg ?? 0
    return total + (weight * set.reps)
  }, 0)
}

/**
 * Format volume for display
 */
export function formatVolume(volumeKg: number): string {
  if (volumeKg === 0) {
    return '—'
  }

  // Always show in kg with comma separators for readability
  return `${Math.round(volumeKg).toLocaleString()}kg`
}

/**
 * Count unique exercises in a set of workout sets
 */
export function countUniqueExercises(sets: WorkoutHistorySet[]): number {
  const exerciseIds = new Set(sets.map(s => s.exercise.id))
  return exerciseIds.size
}

/**
 * Group sets by exercise for display
 */
export interface GroupedExercise {
  exercise: WorkoutHistorySet['exercise']
  sets: Array<{
    reps: number
    weight_kg: number | null
  }>
}

export function groupSetsByExercise(sets: WorkoutHistorySet[]): GroupedExercise[] {
  const grouped = new Map<string, GroupedExercise>()

  for (const set of sets) {
    const existing = grouped.get(set.exercise.id)
    if (existing) {
      existing.sets.push({
        reps: set.reps,
        weight_kg: set.weight_kg
      })
    } else {
      grouped.set(set.exercise.id, {
        exercise: set.exercise,
        sets: [{
          reps: set.reps,
          weight_kg: set.weight_kg
        }]
      })
    }
  }

  return Array.from(grouped.values())
}
