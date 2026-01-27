/**
 * Expert-backed workout templates for new users
 * Templates use exercise names that are matched against the database
 */

export interface TemplateExercise {
  name: string
  target_sets: number
  target_reps: number
  target_weight_kg: number | null
  target_rest_seconds: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  icon: string
  source: string
  sourceType: string
  daysPerWeek: number
  focus: string
  exercises: TemplateExercise[]
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'huberman-foundational',
    name: 'Huberman Foundational Fitness',
    icon: '🧪',
    source: 'Andrew Huberman',
    sourceType: 'Neuroscientist',
    daysPerWeek: 3,
    focus: 'Strength + Endurance',
    exercises: [
      { name: 'Barbell Squat', target_sets: 3, target_reps: 8, target_weight_kg: null, target_rest_seconds: 90 },
      { name: 'Barbell Bench Press', target_sets: 3, target_reps: 8, target_weight_kg: null, target_rest_seconds: 90 },
      { name: 'Barbell Row', target_sets: 3, target_reps: 8, target_weight_kg: null, target_rest_seconds: 90 },
      { name: 'Overhead Press', target_sets: 3, target_reps: 8, target_weight_kg: null, target_rest_seconds: 90 },
      { name: 'Deadlift', target_sets: 3, target_reps: 5, target_weight_kg: null, target_rest_seconds: 120 }
    ]
  },
  {
    id: 'stronglifts-5x5',
    name: 'StrongLifts 5x5',
    icon: '🏋️',
    source: 'Mehdi Hadim',
    sourceType: 'Strength Coach',
    daysPerWeek: 3,
    focus: 'Strength',
    exercises: [
      { name: 'Barbell Squat', target_sets: 5, target_reps: 5, target_weight_kg: null, target_rest_seconds: 180 },
      { name: 'Barbell Bench Press', target_sets: 5, target_reps: 5, target_weight_kg: null, target_rest_seconds: 180 },
      { name: 'Barbell Row', target_sets: 5, target_reps: 5, target_weight_kg: null, target_rest_seconds: 180 }
    ]
  },
  {
    id: 'ppl-classic',
    name: 'Push/Pull/Legs Classic',
    icon: '💪',
    source: 'Bodybuilding',
    sourceType: 'Classic Split',
    daysPerWeek: 6,
    focus: 'Hypertrophy',
    exercises: [
      { name: 'Barbell Bench Press', target_sets: 4, target_reps: 10, target_weight_kg: null, target_rest_seconds: 60 },
      { name: 'Overhead Press', target_sets: 3, target_reps: 10, target_weight_kg: null, target_rest_seconds: 60 },
      { name: 'Dumbbell Flyes', target_sets: 3, target_reps: 12, target_weight_kg: null, target_rest_seconds: 60 },
      { name: 'Tricep Dips', target_sets: 3, target_reps: 12, target_weight_kg: null, target_rest_seconds: 60 }
    ]
  },
  {
    id: 'starting-strength',
    name: 'Starting Strength',
    icon: '🎯',
    source: 'Mark Rippetoe',
    sourceType: 'Strength Coach',
    daysPerWeek: 3,
    focus: 'Beginner Strength',
    exercises: [
      { name: 'Barbell Squat', target_sets: 3, target_reps: 5, target_weight_kg: null, target_rest_seconds: 180 },
      { name: 'Barbell Bench Press', target_sets: 3, target_reps: 5, target_weight_kg: null, target_rest_seconds: 180 },
      { name: 'Deadlift', target_sets: 1, target_reps: 5, target_weight_kg: null, target_rest_seconds: 180 }
    ]
  }
]
