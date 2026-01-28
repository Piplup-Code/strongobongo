'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RoutineButton } from '@/components/routines/RoutineButton'
import { getRoutines } from '@/lib/supabase/queries'
import { getOrCreateSessionId } from '@/lib/storage'
import { Database } from '@/types/database'
import { toast } from '@/lib/utils/toast'

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
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-reveal">
            <h1 className="text-4xl md:text-5xl font-display text-center mb-8 tracking-tight leading-tight">
              What are you<br />training today?
            </h1>

            <Button asChild size="lg" className="mb-6">
              <Link href="/routines/new">+ Create Routine</Link>
            </Button>

            <Link
              href="/templates"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              or browse templates
            </Link>
          </div>
        ) : (
          <div className="flex flex-col min-h-[60vh] animate-reveal">
            <h1 className="text-4xl md:text-5xl font-display mb-8 tracking-tight leading-tight">
              What are you<br />training today?
            </h1>

            <div className="space-y-3 mb-8">
              {routines.map((routine, index) => (
                <div
                  key={routine.id}
                  className="animate-reveal"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <RoutineButton
                    routine={routine}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/routines/new"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                + Add routine
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
