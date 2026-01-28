# Focused Routine Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign routine creation with collapsible muscle groups, grid selection, smart defaults, and a sticky "Now Playing" bar for quick routine access.

**Architecture:** Replace the current tab-based exercise picker with collapsible muscle group sections. Selected exercises shown in a sticky bottom bar with tap-to-view. Exercise config collapsed by default with smart defaults. Drag-to-reorder for exercise list.

**Tech Stack:** React, Next.js, Tailwind CSS, @dnd-kit for drag-and-drop, existing Supabase queries

---

## Task 1: Create MuscleGroupAccordion Component

**Files:**
- Create: `components/routines/MuscleGroupAccordion.tsx`

Collapsible sections for each muscle group with exercise grid inside.

**Step 1: Create the component**

```tsx
// components/routines/MuscleGroupAccordion.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
import { Database } from '@/types/database'
import { cn } from '@/lib/utils'

type Exercise = Database['public']['Tables']['exercises']['Row']

interface MuscleGroupAccordionProps {
  muscleGroup: string
  exercises: Exercise[]
  selectedIds: string[]
  onSelect: (exercise: Exercise) => void
  defaultExpanded?: boolean
}

export function MuscleGroupAccordion({
  muscleGroup,
  exercises,
  selectedIds,
  onSelect,
  defaultExpanded = false,
}: MuscleGroupAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const selectedCount = exercises.filter((e) => selectedIds.includes(e.id)).length

  return (
    <div className="border-b-2 border-foreground/10">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="font-display text-lg uppercase tracking-wider">
            {muscleGroup}
          </span>
        </div>
        {selectedCount > 0 && (
          <span className="text-sm font-semibold text-muted-foreground">
            ({selectedCount})
          </span>
        )}
      </button>

      {/* Exercise Grid */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {exercises.map((exercise) => {
              const isSelected = selectedIds.includes(exercise.id)
              return (
                <button
                  key={exercise.id}
                  onClick={() => !isSelected && onSelect(exercise)}
                  disabled={isSelected}
                  className={cn(
                    'relative p-3 text-left transition-all border-2',
                    isSelected
                      ? 'bg-primary/10 border-primary/30 cursor-default'
                      : 'bg-card hover:bg-muted/50 border-foreground/10 hover:border-foreground/30 active:scale-95'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="font-medium text-sm leading-tight line-clamp-2">
                    {exercise.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/routines/MuscleGroupAccordion.tsx
git commit -m "feat: add MuscleGroupAccordion component for exercise selection"
```

---

## Task 2: Create RoutineNowPlayingBar Component

**Files:**
- Create: `components/routines/RoutineNowPlayingBar.tsx`

Sticky bottom bar showing exercise count with tap to view.

**Step 1: Create the component**

```tsx
// components/routines/RoutineNowPlayingBar.tsx
'use client'

import { ChevronRight } from 'lucide-react'

interface RoutineNowPlayingBarProps {
  count: number
  onView: () => void
}

export function RoutineNowPlayingBar({ count, onView }: RoutineNowPlayingBarProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onView}
      className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 flex items-center justify-between z-20"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">♫</span>
        <span className="font-semibold">
          {count} exercise{count !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span>View</span>
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add components/routines/RoutineNowPlayingBar.tsx
git commit -m "feat: add RoutineNowPlayingBar sticky component"
```

---

## Task 3: Create DraggableExerciseList Component

**Files:**
- Create: `components/routines/DraggableExerciseList.tsx`

Drag-to-reorder list with collapsed config that expands on tap.

**Step 1: Install dnd-kit if not present**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Create the component**

```tsx
// components/routines/DraggableExerciseList.tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SelectedExercise } from './SelectedExerciseCard'
import { cn } from '@/lib/utils'

interface DraggableExerciseListProps {
  exercises: SelectedExercise[]
  onReorder: (exercises: SelectedExercise[]) => void
  onUpdate: (index: number, updates: Partial<SelectedExercise>) => void
  onRemove: (index: number) => void
}

function SortableExerciseItem({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: SelectedExercise
  index: number
  onUpdate: (index: number, updates: Partial<SelectedExercise>) => void
  onRemove: (index: number) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border-2 border-foreground/10 mb-2',
        isDragging && 'opacity-50'
      )}
    >
      {/* Collapsed row */}
      <div className="flex items-center">
        <button
          {...attributes}
          {...listeners}
          className="p-4 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left py-4 pr-2"
        >
          <span className="font-semibold">{item.exercise.name}</span>
          <span className="text-sm text-muted-foreground ml-2">
            {item.target_sets}×{item.target_reps}
          </span>
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-muted-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => onRemove(index)}
          className="p-4 text-muted-foreground hover:text-destructive"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Expanded config */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-foreground/10">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sets</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={item.target_sets}
                onChange={(e) =>
                  onUpdate(index, { target_sets: parseInt(e.target.value) || 1 })
                }
                className="text-center"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={item.target_reps}
                onChange={(e) =>
                  onUpdate(index, { target_reps: parseInt(e.target.value) || 1 })
                }
                className="text-center"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rest (s)</label>
              <Input
                type="number"
                min="0"
                step="5"
                value={item.target_rest_seconds}
                onChange={(e) =>
                  onUpdate(index, { target_rest_seconds: parseInt(e.target.value) || 0 })
                }
                className="text-center"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="Optional"
              value={item.target_weight_kg ?? ''}
              onChange={(e) =>
                onUpdate(index, {
                  target_weight_kg: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function DraggableExerciseList({
  exercises,
  onReorder,
  onUpdate,
  onRemove,
}: DraggableExerciseListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex((e) => e.exercise.id === active.id)
      const newIndex = exercises.findIndex((e) => e.exercise.id === over.id)
      const reordered = arrayMove(exercises, oldIndex, newIndex).map((e, i) => ({
        ...e,
        order_index: i,
      }))
      onReorder(reordered)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={exercises.map((e) => e.exercise.id)}
        strategy={verticalListSortingStrategy}
      >
        {exercises.map((item, index) => (
          <SortableExerciseItem
            key={item.exercise.id}
            item={item}
            index={index}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

**Step 3: Commit**

```bash
git add components/routines/DraggableExerciseList.tsx package.json package-lock.json
git commit -m "feat: add DraggableExerciseList with expandable config"
```

---

## Task 4: Create RoutineBuilderView Component

**Files:**
- Create: `components/routines/RoutineBuilderView.tsx`

The "View" screen showing the full routine list.

**Step 1: Create the component**

```tsx
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
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h2 className="font-display text-2xl uppercase tracking-wider mb-4">
          Your Routine
        </h2>

        {exercises.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No exercises added yet.</p>
            <p className="text-sm mt-2">Go back and tap exercises to add them.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Drag to reorder. Tap to configure.
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
```

**Step 2: Commit**

```bash
git add components/routines/RoutineBuilderView.tsx
git commit -m "feat: add RoutineBuilderView for routine management"
```

---

## Task 5: Refactor New Routine Page

**Files:**
- Modify: `app/routines/new/page.tsx`

Integrate new components and two-view layout (picker vs. routine).

**Step 1: Rewrite the page**

```tsx
// app/routines/new/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MuscleGroupAccordion } from '@/components/routines/MuscleGroupAccordion'
import { RoutineNowPlayingBar } from '@/components/routines/RoutineNowPlayingBar'
import { RoutineBuilderView } from '@/components/routines/RoutineBuilderView'
import { SelectedExercise } from '@/components/routines/SelectedExerciseCard'
import { getExercises, createRoutine } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'

type Exercise = Database['public']['Tables']['exercises']['Row']

// Default values for new exercises
const DEFAULT_SETS = 3
const DEFAULT_REPS = 10
const DEFAULT_REST = 60

export default function NewRoutinePage() {
  const router = useRouter()
  const [routineName, setRoutineName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [view, setView] = useState<'picker' | 'routine'>('picker')

  // Load exercises
  useEffect(() => {
    async function loadExercises() {
      try {
        const data = await getExercises()
        setExercises(data)
      } catch (error) {
        console.error('Error loading exercises:', error)
        toast.error('Failed to load exercises')
      } finally {
        setLoading(false)
      }
    }
    loadExercises()
  }, [])

  // Group exercises by muscle group
  const exercisesByMuscle = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    exercises.forEach((e) => {
      if (!groups[e.muscle_group]) {
        groups[e.muscle_group] = []
      }
      groups[e.muscle_group].push(e)
    })
    return groups
  }, [exercises])

  const muscleGroups = Object.keys(exercisesByMuscle).sort()
  const selectedIds = selectedExercises.map((e) => e.exercise.id)

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      exercise,
      order_index: selectedExercises.length,
      target_sets: DEFAULT_SETS,
      target_reps: DEFAULT_REPS,
      target_weight_kg: null,
      target_rest_seconds: DEFAULT_REST,
    }
    setSelectedExercises([...selectedExercises, newExercise])
  }

  const handleReorder = (reordered: SelectedExercise[]) => {
    setSelectedExercises(reordered)
  }

  const handleUpdate = (index: number, updates: Partial<SelectedExercise>) => {
    const updated = [...selectedExercises]
    updated[index] = { ...updated[index], ...updates }
    setSelectedExercises(updated)
  }

  const handleRemove = (index: number) => {
    const updated = selectedExercises
      .filter((_, i) => i !== index)
      .map((e, i) => ({ ...e, order_index: i }))
    setSelectedExercises(updated)
  }

  const handleSave = async () => {
    if (!routineName.trim()) {
      toast.error('Please enter a routine name')
      return
    }
    if (selectedExercises.length === 0) {
      toast.error('Please add at least one exercise')
      return
    }

    setIsSaving(true)
    try {
      const sessionId = getOrCreateSessionId()
      const exercisesData = selectedExercises.map((ex) => ({
        exercise_id: ex.exercise.id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_weight_kg: ex.target_weight_kg,
        target_rest_seconds: ex.target_rest_seconds,
      }))

      await createRoutine(sessionId, routineName, exercisesData)
      toast.success('Routine created!')
      router.push('/')
    } catch (err) {
      console.error('Error creating routine:', err)
      toast.error('Failed to create routine')
    } finally {
      setIsSaving(false)
    }
  }

  // Routine view
  if (view === 'routine') {
    return (
      <RoutineBuilderView
        exercises={selectedExercises}
        onBack={() => setView('picker')}
        onSave={handleSave}
        onReorder={handleReorder}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        isSaving={isSaving}
        canSave={routineName.trim().length > 0 && selectedExercises.length > 0}
      />
    )
  }

  // Picker view
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b-2 border-foreground/20">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl uppercase tracking-wider">
              New Routine
            </h1>
            <Button
              onClick={handleSave}
              disabled={isSaving || selectedExercises.length === 0 || !routineName.trim()}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Routine Name */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Routine name (e.g. Push Day)"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            className="text-xl font-display"
          />
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          /* Muscle Group Accordions */
          <div>
            {muscleGroups.map((muscle, index) => (
              <MuscleGroupAccordion
                key={muscle}
                muscleGroup={muscle}
                exercises={exercisesByMuscle[muscle]}
                selectedIds={selectedIds}
                onSelect={handleAddExercise}
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        )}

        {/* Template link */}
        <div className="text-center mt-8">
          <Link
            href="/templates"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            or start from a template →
          </Link>
        </div>
      </div>

      {/* Now Playing Bar */}
      <RoutineNowPlayingBar
        count={selectedExercises.length}
        onView={() => setView('routine')}
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/routines/new/page.tsx
git commit -m "feat: refactor routine creation with collapsible groups and now playing bar"
```

---

## Task 6: Update Edit Routine Page

**Files:**
- Modify: `app/routines/[routineId]/edit/page.tsx`

Apply the same design to the edit flow.

**Step 1: Check if edit page exists and update it**

If the edit page exists, apply similar changes:
- Replace ExerciseGrid with MuscleGroupAccordion sections
- Replace SelectedExerciseCard with DraggableExerciseList
- Add RoutineNowPlayingBar
- Add two-view layout (picker vs. routine)

The structure should mirror the new routine page, but pre-populate with existing routine data.

**Step 2: Commit**

```bash
git add app/routines/[routineId]/edit/page.tsx
git commit -m "feat: update edit routine page with new focused design"
```

---

## Task 7: Clean Up Unused Components

**Files:**
- Delete: `components/routines/ExerciseGrid.tsx`
- Delete: `components/routines/MuscleFilterTabs.tsx`
- Keep: `components/routines/SelectedExerciseCard.tsx` (type export still used)

**Step 1: Verify components are no longer imported**

```bash
grep -r "ExerciseGrid" --include="*.tsx" app/ components/
grep -r "MuscleFilterTabs" --include="*.tsx" app/ components/
```

**Step 2: Delete unused files**

```bash
rm components/routines/ExerciseGrid.tsx
rm components/routines/MuscleFilterTabs.tsx
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused ExerciseGrid and MuscleFilterTabs"
```

---

## Task 8: Test and Polish

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Manual testing checklist**

- [ ] New routine page loads with collapsible muscle groups
- [ ] First muscle group expanded by default
- [ ] Tap muscle group header → expands/collapses
- [ ] Tap exercise → adds to routine, shows checkmark
- [ ] Now Playing bar appears when exercises added
- [ ] Tap "View" → shows routine list
- [ ] Drag exercises → reorders correctly
- [ ] Tap exercise in list → expands config
- [ ] Edit sets/reps/rest/weight → values update
- [ ] Remove exercise → removes from list
- [ ] Save with name + exercises → creates routine, redirects home
- [ ] Save without name → shows error
- [ ] Save without exercises → shows error
- [ ] Test on mobile viewport

**Step 3: Fix any issues**

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: polish focused routine creation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | MuscleGroupAccordion component | `components/routines/MuscleGroupAccordion.tsx` |
| 2 | RoutineNowPlayingBar component | `components/routines/RoutineNowPlayingBar.tsx` |
| 3 | DraggableExerciseList component | `components/routines/DraggableExerciseList.tsx` |
| 4 | RoutineBuilderView component | `components/routines/RoutineBuilderView.tsx` |
| 5 | Refactor new routine page | `app/routines/new/page.tsx` |
| 6 | Update edit routine page | `app/routines/[routineId]/edit/page.tsx` |
| 7 | Clean up unused components | Delete old files |
| 8 | Test and polish | All files |

**New dependencies:**
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`
