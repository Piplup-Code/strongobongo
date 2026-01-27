'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { getRoutines, copyTemplateToRoutine } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'
import { WORKOUT_TEMPLATES, WorkoutTemplate } from '@/lib/data/workout-templates'
import { ChevronDown, ChevronRight } from 'lucide-react'

type Routine = Database['public']['Tables']['routines']['Row']

export default function Home() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templatesExpanded, setTemplatesExpanded] = useState(false)

  useEffect(() => {
    async function loadRoutines() {
      try {
        setLoading(true)
        const sessionId = getOrCreateSessionId()
        const data = await getRoutines(sessionId)
        setRoutines(data)
        setError(null)
      } catch (err) {
        console.error('Error loading routines:', err)
        const errorMessage = 'Failed to load routines. Please refresh the page.'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadRoutines()
  }, [])

  const handleDelete = () => {
    const sessionId = getOrCreateSessionId()
    getRoutines(sessionId)
      .then((data) => {
        setRoutines(data)
      })
      .catch((err) => {
        console.error('Error reloading routines:', err)
        toast.error('Failed to reload routines')
      })
  }

  const handleCopyTemplate = async (template: WorkoutTemplate) => {
    try {
      const sessionId = getOrCreateSessionId()
      await copyTemplateToRoutine(sessionId, template)
      toast.success('Added to your routines')
      const data = await getRoutines(sessionId)
      setRoutines(data)
    } catch (err) {
      console.error('Error copying template:', err)
      toast.error('Failed to copy template. Please try again.')
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-muted animate-pulse border-2 border-foreground/20"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="border-2 border-destructive bg-destructive/10 p-6 text-destructive animate-reveal">
            <div className="font-display text-xl uppercase mb-2">Error</div>
            <div>{error}</div>
          </div>
        ) : routines.length === 0 ? (
          <div className="animate-reveal">
            <div className="text-center py-8 mb-8">
              <h1 className="text-5xl md:text-6xl font-display mb-4 tracking-tight leading-none">
                Ready to train?
              </h1>
              <p className="text-muted-foreground font-body mb-6">
                Start with a proven template or build your own
              </p>
              <Button asChild size="lg">
                <Link href="/routines/new">+ Create Your Own Routine</Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-foreground/20" />
              <span className="text-sm font-display uppercase tracking-widest text-muted-foreground">
                Or Start With a Template
              </span>
              <div className="h-px flex-1 bg-foreground/20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORKOUT_TEMPLATES.map((template, index) => (
                <div
                  key={template.id}
                  className="animate-reveal"
                  style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                >
                  <TemplateCard template={template} onCopy={handleCopyTemplate} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 animate-reveal">
              <h1 className="text-4xl md:text-5xl font-display mb-4 tracking-tight leading-none">
                What are you<br />training today?
              </h1>
            </div>

            <div className="space-y-4 mb-6">
              {routines.map((routine, index) => (
                <div
                  key={routine.id}
                  className="animate-reveal"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <RoutineCard
                    routine={routine}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center mb-8">
              <Button asChild variant="outline">
                <Link href="/routines/new">+ Create new routine</Link>
              </Button>
            </div>

            <button
              onClick={() => setTemplatesExpanded(!templatesExpanded)}
              className="w-full flex items-center gap-4 group"
            >
              <div className="h-px flex-1 bg-foreground/20" />
              <span className="flex items-center gap-2 text-sm font-display uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                {templatesExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Browse {WORKOUT_TEMPLATES.length} Templates
              </span>
              <div className="h-px flex-1 bg-foreground/20" />
            </button>

            {templatesExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {WORKOUT_TEMPLATES.map((template, index) => (
                  <div
                    key={template.id}
                    className="animate-reveal"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <TemplateCard template={template} onCopy={handleCopyTemplate} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
