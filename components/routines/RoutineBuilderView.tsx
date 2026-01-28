// components/routines/RoutineBuilderView.tsx
'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DraggableExerciseList } from './DraggableExerciseList'
import { SelectedExercise } from './SelectedExerciseCard'

interface RoutineBuilderViewProps {
  exercises: SelectedExercise[]
  onBack: () => void
  onSave: () => void
  onReorder: (exercises: SelectedExercise[]) => void
  onUpdate: (index: number, updates: Partial<SelectedExercise>) => void
  onRemove: (index: number) => void
  isSaving: boolean
  canSave: boolean
}

export function RoutineBuilderView({
  exercises,
  onBack,
  onSave,
  onReorder,
  onUpdate,
  onRemove,
  isSaving,
  canSave,
}: RoutineBuilderViewProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b-2 border-foreground/20">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <Button onClick={onSave} disabled={!canSave || isSaving}>
              {isSaving ? 'Saving...' : 'Save Routine'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Yellow accent line */}
        <div className="w-8 h-1 bg-primary mb-4" />

        <h2 className="font-display text-2xl uppercase tracking-wider mb-2">
          Your Routine
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
        </p>

        {exercises.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-foreground/10">
            <p className="mb-2">No exercises added yet.</p>
            <p className="text-sm">Go back and tap exercises to add them.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
              Drag to reorder • Tap to configure
            </p>
            <DraggableExerciseList
              exercises={exercises}
              onReorder={onReorder}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          </>
        )}
      </div>
    </div>
  )
}
