import { supabase } from './client'
import { Database } from '@/types/database'

type Routine = Database['public']['Tables']['routines']['Row']
type Exercise = Database['public']['Tables']['exercises']['Row']
type RoutineExercise = Database['public']['Tables']['routine_exercises']['Row']

export interface RoutineWithExercises extends Routine {
  exercises: (RoutineExercise & { exercise: Exercise })[]
}

export interface ExerciseWithConfig {
  exercise_id: string
  order_index: number
  target_sets: number
  target_reps: number
  target_weight_kg: number | null
  target_rest_seconds: number
}

/**
 * Fetch all routines for a session
 */
export async function getRoutines(sessionId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching routines:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch a routine with its exercises
 */
export async function getRoutineWithExercises(
  routineId: string
): Promise<RoutineWithExercises | null> {
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('*')
    .eq('id', routineId)
    .single()

  if (routineError) {
    console.error('Error fetching routine:', routineError)
    throw routineError
  }

  if (!routine) return null

  const { data: routineExercises, error: exercisesError } = await supabase
    .from('routine_exercises')
    .select(
      `
      *,
      exercise:exercises(*)
    `
    )
    .eq('routine_id', routineId)
    .order('order_index', { ascending: true })

  if (exercisesError) {
    console.error('Error fetching routine exercises:', exercisesError)
    throw exercisesError
  }

  return {
    ...routine,
    exercises: (routineExercises || []) as (RoutineExercise & { exercise: Exercise })[]
  }
}

/**
 * Create a new routine with exercises
 */
export async function createRoutine(
  sessionId: string,
  name: string,
  exercises: ExerciseWithConfig[]
): Promise<string> {
  // Validate inputs
  if (!name.trim()) {
    throw new Error('Routine name is required')
  }

  if (exercises.length === 0) {
    throw new Error('At least one exercise is required')
  }

  // Check for duplicate exercises
  const exerciseIds = exercises.map((e) => e.exercise_id)
  if (new Set(exerciseIds).size !== exerciseIds.length) {
    throw new Error('Duplicate exercises are not allowed')
  }

  // Insert routine
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({
      name: name.trim(),
      session_id: sessionId
    })
    .select()
    .single()

  if (routineError) {
    console.error('Error creating routine:', routineError)
    throw routineError
  }

  if (!routine) {
    throw new Error('Failed to create routine')
  }

  // Insert routine exercises
  const routineExercises = exercises.map((ex) => ({
    routine_id: routine.id,
    exercise_id: ex.exercise_id,
    order_index: ex.order_index,
    target_sets: ex.target_sets,
    target_reps: ex.target_reps,
    target_weight_kg: ex.target_weight_kg,
    target_rest_seconds: ex.target_rest_seconds
  }))

  const { error: exercisesError } = await supabase
    .from('routine_exercises')
    .insert(routineExercises)

  if (exercisesError) {
    console.error('Error creating routine exercises:', exercisesError)
    // Clean up routine if exercises fail
    await supabase.from('routines').delete().eq('id', routine.id)
    throw exercisesError
  }

  return routine.id
}

/**
 * Update a routine and its exercises
 */
export async function updateRoutine(
  routineId: string,
  name: string,
  exercises: ExerciseWithConfig[]
): Promise<void> {
  // Validate inputs
  if (!name.trim()) {
    throw new Error('Routine name is required')
  }

  if (exercises.length === 0) {
    throw new Error('At least one exercise is required')
  }

  // Check for duplicate exercises
  const exerciseIds = exercises.map((e) => e.exercise_id)
  if (new Set(exerciseIds).size !== exerciseIds.length) {
    throw new Error('Duplicate exercises are not allowed')
  }

  // Update routine name
  const { error: routineError } = await supabase
    .from('routines')
    .update({ name: name.trim() })
    .eq('id', routineId)

  if (routineError) {
    console.error('Error updating routine:', routineError)
    throw routineError
  }

  // Delete existing routine exercises
  const { error: deleteError } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('routine_id', routineId)

  if (deleteError) {
    console.error('Error deleting routine exercises:', deleteError)
    throw deleteError
  }

  // Insert new routine exercises
  const routineExercises = exercises.map((ex) => ({
    routine_id: routineId,
    exercise_id: ex.exercise_id,
    order_index: ex.order_index,
    target_sets: ex.target_sets,
    target_reps: ex.target_reps,
    target_weight_kg: ex.target_weight_kg,
    target_rest_seconds: ex.target_rest_seconds
  }))

  const { error: insertError } = await supabase
    .from('routine_exercises')
    .insert(routineExercises)

  if (insertError) {
    console.error('Error inserting routine exercises:', insertError)
    throw insertError
  }
}

/**
 * Delete a routine (cascade deletes exercises)
 */
export async function deleteRoutine(routineId: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', routineId)

  if (error) {
    console.error('Error deleting routine:', error)
    throw error
  }
}

/**
 * Fetch all exercises
 */
export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching exercises:', error)
    throw error
  }

  return data || []
}

// ==================== WORKOUT SESSION FUNCTIONS ====================

type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
type SessionSet = Database['public']['Tables']['session_sets']['Row']

/**
 * Create a new workout session
 */
export async function createWorkoutSession(
  sessionId: string,
  routineId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      routine_id: routineId,
      session_id: sessionId,
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating workout session:', error)
    throw error
  }

  if (!data) {
    throw new Error('Failed to create workout session')
  }

  return data.id
}

/**
 * Log a set for a workout session
 */
export async function logSet(
  workoutSessionId: string,
  exerciseId: string,
  reps: number,
  weightKg: number | null
): Promise<SessionSet> {
  // Validation
  if (reps <= 0) {
    throw new Error('Reps must be greater than 0')
  }

  if (weightKg !== null && weightKg < 0) {
    throw new Error('Weight cannot be negative')
  }

  const { data, error } = await supabase
    .from('session_sets')
    .insert({
      session_id: workoutSessionId,
      exercise_id: exerciseId,
      reps,
      weight_kg: weightKg,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error logging set:', error)
    throw error
  }

  if (!data) {
    throw new Error('Failed to log set')
  }

  return data
}

/**
 * Get all sets for a workout session
 */
export async function getSessionSets(workoutSessionId: string): Promise<SessionSet[]> {
  const { data, error } = await supabase
    .from('session_sets')
    .select('*')
    .eq('session_id', workoutSessionId)
    .order('completed_at', { ascending: true })

  if (error) {
    console.error('Error fetching session sets:', error)
    throw error
  }

  return data || []
}

/**
 * Complete a workout session
 */
export async function completeWorkout(
  workoutSessionId: string,
  totalSeconds: number
): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .update({
      ended_at: new Date().toISOString(),
      total_duration_seconds: totalSeconds
    })
    .eq('id', workoutSessionId)

  if (error) {
    console.error('Error completing workout:', error)
    throw error
  }
}

// ==================== WORKOUT HISTORY FUNCTIONS ====================

export interface WorkoutHistorySet {
  id: string
  reps: number
  weight_kg: number | null
  completed_at: string
  exercise: Exercise
}

export interface WorkoutHistoryItem {
  id: string
  started_at: string
  ended_at: string
  total_duration_seconds: number | null
  routine: Routine
  sets: WorkoutHistorySet[]
}

/**
 * Get completed workout history for a user session
 */
export async function getWorkoutHistory(sessionId: string): Promise<WorkoutHistoryItem[]> {
  // Get completed workout sessions with routine info
  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      started_at,
      ended_at,
      total_duration_seconds,
      routine:routines(*)
    `)
    .eq('session_id', sessionId)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })

  if (sessionsError) {
    console.error('Error fetching workout history:', sessionsError)
    throw sessionsError
  }

  if (!sessions || sessions.length === 0) {
    return []
  }

  // Get all sets for these sessions with exercise info
  const sessionIds = sessions.map(s => s.id)
  const { data: allSets, error: setsError } = await supabase
    .from('session_sets')
    .select(`
      id,
      session_id,
      reps,
      weight_kg,
      completed_at,
      exercise:exercises(*)
    `)
    .in('session_id', sessionIds)
    .order('completed_at', { ascending: true })

  if (setsError) {
    console.error('Error fetching session sets:', setsError)
    throw setsError
  }

  // Group sets by session
  const setsBySession = new Map<string, WorkoutHistorySet[]>()
  for (const set of allSets || []) {
    // Supabase returns nested relations as arrays, access first element
    const exercise = Array.isArray(set.exercise) ? set.exercise[0] : set.exercise
    // Skip sets with missing exercises
    if (!exercise) continue

    const sessionSets = setsBySession.get(set.session_id) || []
    sessionSets.push({
      id: set.id,
      reps: set.reps,
      weight_kg: set.weight_kg,
      completed_at: set.completed_at,
      exercise: exercise as Exercise
    })
    setsBySession.set(set.session_id, sessionSets)
  }

  // Combine into workout history items, filtering out sessions with missing routines
  return sessions
    .map(session => {
      // Supabase returns nested relations as arrays, access first element
      const routine = Array.isArray(session.routine) ? session.routine[0] : session.routine
      if (!routine) return null

      return {
        id: session.id,
        started_at: session.started_at,
        ended_at: session.ended_at!,
        total_duration_seconds: session.total_duration_seconds,
        routine: routine as Routine,
        sets: setsBySession.get(session.id) || []
      }
    })
    .filter((item): item is WorkoutHistoryItem => item !== null)
}

// ==================== TEMPLATE FUNCTIONS ====================

import { WorkoutTemplate } from '@/lib/data/workout-templates'

/**
 * Copy a workout template to create a new user routine
 * Matches template exercise names to database exercises
 */
export async function copyTemplateToRoutine(
  sessionId: string,
  template: WorkoutTemplate
): Promise<string> {
  // Get all exercises to match by name
  const allExercises = await getExercises()

  // Match template exercises to database exercises
  const matchedExercises: ExerciseWithConfig[] = []

  for (let i = 0; i < template.exercises.length; i++) {
    const templateEx = template.exercises[i]
    // Find matching exercise by name (case-insensitive)
    const dbExercise = allExercises.find(
      ex => ex.name.toLowerCase() === templateEx.name.toLowerCase()
    )

    if (dbExercise) {
      matchedExercises.push({
        exercise_id: dbExercise.id,
        order_index: i,
        target_sets: templateEx.target_sets,
        target_reps: templateEx.target_reps,
        target_weight_kg: templateEx.target_weight_kg,
        target_rest_seconds: templateEx.target_rest_seconds
      })
    }
  }

  // If no exercises matched, throw error
  if (matchedExercises.length === 0) {
    throw new Error('No matching exercises found for this template')
  }

  // Create routine with matched exercises
  const routineName = `My ${template.name}`
  return createRoutine(sessionId, routineName, matchedExercises)
}
