'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { WorkoutTemplate } from '@/lib/data/workout-templates'

interface TemplateCardProps {
  template: WorkoutTemplate
  onCopy: (template: WorkoutTemplate) => Promise<void>
}

export function TemplateCard({ template, onCopy }: TemplateCardProps) {
  const [isCopying, setIsCopying] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    setIsCopying(true)
    try {
      await onCopy(template)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <Card className="relative group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] transition-all duration-200 h-full">
      <CardContent className="p-4 md:p-6 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{template.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl md:text-2xl uppercase tracking-tight leading-tight line-clamp-2">
              {template.name}
            </div>
            <div className="text-sm text-muted-foreground font-body">
              {template.source} · {template.sourceType}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {template.daysPerWeek}d/week
          </Badge>
          <Badge variant="outline" className="text-xs">
            {template.focus}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {template.exercises.length} exercises
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {expanded ? 'Hide' : 'Show'} exercises
          </button>
          <div className="flex-1" />
          <Button
            onClick={handleCopy}
            disabled={isCopying}
            size="sm"
          >
            {isCopying ? 'Copying...' : 'Copy'}
          </Button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-foreground/10">
            <ul className="space-y-1">
              {template.exercises.map((exercise, index) => (
                <li key={index} className="text-sm font-body flex justify-between">
                  <span>{exercise.name}</span>
                  <span className="text-muted-foreground">
                    {exercise.target_sets}×{exercise.target_reps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
