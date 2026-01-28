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
        isDragging && 'opacity-50 border-primary'
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
            {item.target_weight_kg ? ` @ ${item.target_weight_kg}kg` : ''}
          </span>
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => onRemove(index)}
          className="p-4 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Expanded config */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-foreground/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Sets</label>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="20"
                value={item.target_sets}
                onChange={(e) =>
                  onUpdate(index, { target_sets: parseInt(e.target.value) || 1 })
                }
                className="text-center text-lg font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Reps</label>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="100"
                value={item.target_reps}
                onChange={(e) =>
                  onUpdate(index, { target_reps: parseInt(e.target.value) || 1 })
                }
                className="text-center text-lg font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Weight (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                placeholder="—"
                value={item.target_weight_kg ?? ''}
                onChange={(e) =>
                  onUpdate(index, {
                    target_weight_kg: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="text-center text-lg font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Rest (s)</label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                step="5"
                value={item.target_rest_seconds}
                onChange={(e) =>
                  onUpdate(index, { target_rest_seconds: parseInt(e.target.value) || 0 })
                }
                className="text-center text-lg font-mono"
              />
            </div>
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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
