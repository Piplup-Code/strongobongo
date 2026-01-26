'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, X } from 'lucide-react'
import { Database } from '@/types/database'

type Exercise = Database['public']['Tables']['exercises']['Row']

export interface SelectedExercise {
  exercise: Exercise
  order_index: number
  target_sets: number
  target_reps: number
  target_weight_kg: number | null
  target_rest_seconds: number
}

interface SelectedExerciseCardProps {
  item: SelectedExercise
  index: number
  total: number
  onUpdate: (index: number, updates: Partial<SelectedExercise>) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  onRemove: (index: number) => void
}

export function SelectedExerciseCard({
  item,
  index,
  total,
  onUpdate,
  onMove,
  onRemove,
}: SelectedExerciseCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {index + 1}.
              </span>
              <span className="font-semibold truncate">{item.exercise.name}</span>
            </div>
            <div className="flex gap-1.5 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {item.exercise.muscle_group}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {item.exercise.equipment}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMove(index, 'up')}
              disabled={index === 0}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMove(index, 'down')}
              disabled={index === total - 1}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-4 gap-2">
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
              className="h-10 text-center"
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
              className="h-10 text-center"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">kg</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="—"
              value={item.target_weight_kg ?? ''}
              onChange={(e) =>
                onUpdate(index, {
                  target_weight_kg: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="h-10 text-center"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Rest</label>
            <Input
              type="number"
              min="0"
              step="5"
              value={item.target_rest_seconds}
              onChange={(e) =>
                onUpdate(index, { target_rest_seconds: parseInt(e.target.value) || 0 })
              }
              className="h-10 text-center"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
