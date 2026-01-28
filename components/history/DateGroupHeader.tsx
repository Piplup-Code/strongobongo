'use client'

import { DateGroup, getDateGroupLabel } from '@/lib/utils/date'

interface DateGroupHeaderProps {
  group: DateGroup
}

export function DateGroupHeader({ group }: DateGroupHeaderProps) {
  const label = getDateGroupLabel(group)

  return (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <div className="w-6 h-1 bg-primary" />
      <h2 className="font-display text-lg uppercase tracking-wider text-foreground">
        {label}
      </h2>
      <div className="flex-1 h-px bg-foreground/10" />
    </div>
  )
}
