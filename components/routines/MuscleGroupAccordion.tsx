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
            <ChevronDown className="h-5 w-5 text-primary" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="font-display text-lg uppercase tracking-wider">
            {muscleGroup}
          </span>
        </div>
        {selectedCount > 0 && (
          <span className="text-sm font-semibold text-primary">
            {selectedCount} selected
          </span>
        )}
      </button>

      {/* Exercise Grid */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      ? 'bg-primary/10 border-primary/40 cursor-default'
                      : 'bg-card hover:bg-muted/50 border-foreground/10 hover:border-primary/50 active:scale-95'
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
