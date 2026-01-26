'use client'

import { cn } from '@/lib/utils'

const MUSCLE_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'arms', label: 'Arms' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'core', label: 'Core' },
]

interface MuscleFilterTabsProps {
  selected: string
  onChange: (group: string) => void
}

export function MuscleFilterTabs({ selected, onChange }: MuscleFilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {MUSCLE_GROUPS.map((group) => (
        <button
          key={group.id}
          onClick={() => onChange(group.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            selected === group.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {group.label}
        </button>
      ))}
    </div>
  )
}
