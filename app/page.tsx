'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RoutineButton } from '@/components/routines/RoutineButton'
import { getRoutines } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'
import { Plus } from 'lucide-react'

type Routine = Database['public']['Tables']['routines']['Row']

export default function Home() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large diagonal stripe */}
        <div className="absolute -right-20 top-0 w-40 h-[200%] bg-primary/[0.03] transform -skew-x-12" />
        {/* Corner accent */}
        <div className="absolute top-0 left-0 w-32 h-32">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary/40 to-transparent" />
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-2xl relative">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-card/50 animate-pulse border-2 border-foreground/10"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="border-2 border-destructive bg-destructive/10 p-6 text-destructive animate-reveal">
            <div className="font-display text-xl uppercase mb-2">Error</div>
            <div>{error}</div>
          </div>
        ) : routines.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            {/* Decorative number */}
            <div className="text-[12rem] md:text-[16rem] font-display text-foreground/[0.03] leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              01
            </div>

            <div className="relative z-10 text-center animate-reveal">
              {/* Yellow accent line */}
              <div className="w-12 h-1 bg-primary mx-auto mb-8" />

              <h1 className="text-4xl md:text-6xl font-display tracking-tight leading-none mb-3">
                Ready to
              </h1>
              <h1 className="text-4xl md:text-6xl font-display tracking-tight leading-none text-primary mb-8">
                Train?
              </h1>

              <p className="text-muted-foreground mb-10 max-w-xs mx-auto">
                Create your first routine or start with an expert-backed template
              </p>

              <Button asChild size="lg" className="mb-4 text-lg px-8 h-14">
                <Link href="/routines/new">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Routine
                </Link>
              </Button>

              <div>
                <Link
                  href="/templates"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center gap-1"
                >
                  Browse templates
                  <span className="text-primary">→</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Routines List */
          <div className="min-h-[70vh]">
            {/* Header */}
            <div className="mb-10 animate-reveal">
              {/* Yellow accent line */}
              <div className="w-8 h-1 bg-primary mb-6" />

              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-none mb-2">
                What are you
              </h1>
              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-none text-primary">
                Training?
              </h1>
            </div>

            {/* Routine buttons */}
            <div className="space-y-3 mb-10">
              {routines.map((routine, index) => (
                <div
                  key={routine.id}
                  className="animate-reveal"
                  style={{ animationDelay: `${(index + 1) * 0.08}s` }}
                >
                  <RoutineButton
                    routine={routine}
                    index={index}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>

            {/* Add routine link */}
            <div
              className="animate-reveal flex items-center justify-center gap-6"
              style={{ animationDelay: `${(routines.length + 1) * 0.08}s` }}
            >
              <div className="h-px flex-1 bg-foreground/10" />
              <Link
                href="/routines/new"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add routine
              </Link>
              <div className="h-px flex-1 bg-foreground/10" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
